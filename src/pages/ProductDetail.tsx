import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageZoom } from '@/components/ImageZoom';
import { ProductReviews } from '@/components/ProductReviews';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { addProduct } = useRecentlyViewed();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (error) throw error;
      return data;
    },
  });

  const { data: productImages, isLoading: imagesLoading } = useQuery({
    queryKey: ['product-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  // Combine product images with the legacy image_url
  const allImages = [
    ...(productImages || []).map(img => img.image_url),
    ...(product?.image_url && !productImages?.some(img => img.image_url === product.image_url) ? [product.image_url] : []),
  ].filter(Boolean);

  // Track recently viewed products
  useEffect(() => {
    if (product && id) {
      addProduct({
        id: product.id,
        name: product.name,
        imageUrl: allImages[0] || product.image_url,
        price: Number(product.base_price),
        category: product.category,
      });
    }
  }, [product?.id]); // Only run when product changes

  const sizes = [...new Set(variants?.map((v) => v.size) || [])];
  const colors = [...new Set(variants?.filter((v) => !selectedSize || v.size === selectedSize).map((v) => v.color) || [])];

  const selectedVariant = variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const price = selectedVariant
    ? Number(product?.base_price || 0) + Number(selectedVariant.price_adjustment || 0)
    : Number(product?.base_price || 0);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    if (!selectedVariant || selectedVariant.stock_quantity < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    addItem({
      productId: product!.id,
      variantId: selectedVariant.id,
      name: product!.name,
      size: selectedSize,
      color: selectedColor,
      price,
      quantity,
      imageUrl: allImages[0] || product!.image_url,
    });

    toast.success('Added to cart!');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (productLoading || variantsLoading || imagesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {allImages.length > 0 ? (
                <>
                  <ImageZoom
                    src={allImages[currentImageIndex]}
                    alt={product.name}
                    className="h-full w-full"
                  />
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-80 hover:opacity-100 z-10"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-80 hover:opacity-100 z-10"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              index === currentImageIndex ? 'bg-primary' : 'bg-primary/30'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{product.category}</Badge>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-accent">${price.toFixed(2)}</p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.description || 'No description available.'}
            </p>

            {/* Size Selection */}
            <div>
              <label className="text-sm font-medium block mb-2">Size</label>
              <Select value={selectedSize} onValueChange={(value) => {
                setSelectedSize(value);
                setSelectedColor('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            <div>
              <label className="text-sm font-medium block mb-2">Color</label>
              <Select value={selectedColor} onValueChange={setSelectedColor} disabled={!selectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVariant && (
              <p className="text-sm text-muted-foreground">
                Stock: {selectedVariant.stock_quantity} available
              </p>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium block mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!selectedVariant || quantity >= selectedVariant.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handleAddToCart}>
              {user ? 'Add to Cart' : 'Sign in to Add to Cart'}
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t pt-12">
          <ProductReviews productId={id!} />
        </div>

        {/* Recently Viewed Section */}
        <div className="mt-16 border-t pt-12">
          <RecentlyViewed currentProductId={id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;