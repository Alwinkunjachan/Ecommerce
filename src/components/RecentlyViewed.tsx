import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedProps {
  currentProductId?: string;
}

export const RecentlyViewed = ({ currentProductId }: RecentlyViewedProps) => {
  const { recentlyViewed } = useRecentlyViewed();

  // Filter out current product and limit to 4 items
  const products = recentlyViewed
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="group"
          >
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};
