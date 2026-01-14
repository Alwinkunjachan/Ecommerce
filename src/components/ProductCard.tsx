import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
}

export const ProductCard = ({ id, name, price, imageUrl, category }: ProductCardProps) => {
  return (
    <Link to={`/product/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg group">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4">
          <div className="w-full">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
            <h3 className="font-semibold text-lg mt-1">{name}</h3>
          </div>
          <div className="flex w-full items-center justify-between">
            <span className="text-xl font-bold">${price.toFixed(2)}</span>
            <Button size="sm" variant="secondary">
              View Details
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
