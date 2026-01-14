import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

async function createHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return new TextDecoder().decode(hexEncode(new Uint8Array(signature)));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();
    console.log('Razorpay action:', action, 'params:', params);

    if (action === 'create-order') {
      const { orderId, amount } = params;
      
      // Create Razorpay order
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay expects amount in paise
          currency: 'INR',
          receipt: orderId,
          notes: {
            order_id: orderId,
          },
        }),
      });

      const razorpayOrder = await razorpayResponse.json();
      console.log('Razorpay order response:', razorpayOrder);

      if (!razorpayResponse.ok) {
        console.error('Razorpay error:', razorpayOrder);
        return new Response(
          JSON.stringify({ error: 'Failed to create Razorpay order', details: razorpayOrder }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store payment record in pending status
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          order_id: orderId,
          user_id: user.id,
          razorpay_order_id: razorpayOrder.id,
          amount: amount,
          currency: 'INR',
          status: 'pending',
        });

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Failed to store payment record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          razorpay_order_id: razorpayOrder.id,
          razorpay_key_id: RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = params;
      
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = await createHmacSha256(RAZORPAY_KEY_SECRET, body);

      console.log('Signature verification:', { expected: expectedSignature, received: razorpay_signature });

      if (expectedSignature !== razorpay_signature) {
        console.error('Signature mismatch');
        
        // Update payment as failed
        await supabaseClient
          .from('payments')
          .update({ 
            status: 'failed',
            error_message: 'Signature verification failed',
          })
          .eq('razorpay_order_id', razorpay_order_id);

        return new Response(
          JSON.stringify({ error: 'Payment verification failed', valid: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update payment as successful
      const { error: updatePaymentError } = await supabaseClient
        .from('payments')
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: 'completed',
        })
        .eq('razorpay_order_id', razorpay_order_id);

      if (updatePaymentError) {
        console.error('Payment update error:', updatePaymentError);
      }

      // Update order status to confirmed
      const { error: updateOrderError } = await supabaseClient
        .from('orders')
        .update({ 
          status: 'confirmed',
          payment_method: 'razorpay',
        })
        .eq('id', orderId);

      if (updateOrderError) {
        console.error('Order update error:', updateOrderError);
      }

      return new Response(
        JSON.stringify({ valid: true, message: 'Payment verified successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in razorpay function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
