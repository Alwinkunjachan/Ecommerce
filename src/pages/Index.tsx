import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Hero"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
        </div>
        
        <div className="container relative z-10 text-left max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Timeless Style,
            <span className="text-accent"> Modern Comfort</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-lg">
            Discover our curated collection of premium clothing designed for the contemporary lifestyle.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/products">Shop Now</Link>
          </Button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our hand-picked selection of the season's best pieces
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={Number(product.base_price)}
                imageUrl={product.image_url}
                category={product.category}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg">
            <Link to="/products">View All Products</Link>
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-secondary py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Shirts', path: '/products?category=shirts' },
              { name: 'Pants', path: '/products?category=pants' },
              { name: 'Outerwear', path: '/products?category=outerwear' },
            ].map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="group relative h-64 overflow-hidden rounded-lg"
              >
                <div className="absolute inset-0 bg-primary/80 group-hover:bg-primary/70 transition-colors" />
                <div className="relative h-full flex items-center justify-center">
                  <h3 className="text-3xl font-bold text-primary-foreground">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
