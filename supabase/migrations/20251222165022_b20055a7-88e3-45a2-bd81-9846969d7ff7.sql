-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create a permissive policy that allows anyone to view active products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);