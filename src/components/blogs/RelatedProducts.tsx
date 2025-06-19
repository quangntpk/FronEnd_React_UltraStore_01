
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Mock product data
const products = [
  {
    id: 1,
    name: "Crocus Cotton Tee",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Essential summer staple with a modern twist"
  },
  {
    id: 2,
    name: "Linen Blend Shirt",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
    description: "Effortlessly elegant for both casual and semi-formal occasions"
  },
  {
    id: 3,
    name: "Summer Dress",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b",
    description: "Perfect for beach outings or city explorations"
  },
  {
    id: 4,
    name: "Recycled Denim Jacket",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    description: "Sustainable fashion that doesn't compromise on style"
  }
];

// Mock combo data
const combos = [
  {
    id: 1,
    name: "Essential Capsule",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    description: "Create over 10 different outfits with this versatile combo"
  },
  {
    id: 2,
    name: "Weekend Wanderer",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b",
    description: "Perfect for casual days with comfortable, layerable pieces"
  },
  {
    id: 3,
    name: "Work-to-Weekend",
    price: 179.99,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
    description: "Transition smoothly from office hours to evening outings"
  },
  {
    id: 4,
    name: "Summer Essentials",
    price: 119.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Stay cool and stylish with these summer must-haves"
  }
];

interface RelatedProductsProps {
  ids: number[];
  type: "product" | "combo";
}

export const RelatedProducts = ({ ids, type }: RelatedProductsProps) => {
  const items = type === "product" 
    ? products.filter(p => ids.includes(p.id))
    : combos.filter(c => ids.includes(c.id));

  // If we have 1-2 items, display grid. If 3+ items, use carousel
  const useCarousel = items.length > 2;

  if (useCarousel) {
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
              <ProductCard item={item} type={type} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-4">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} type={type} />
      ))}
    </div>
  );
};

interface ProductCardProps {
  item: {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
  };
  type: "product" | "combo";
}

const ProductCard = ({ item, type }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  return (
    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow h-full">
      <Link to={`/${type}s/${item.id}`} className="block">
        <div className="relative">
          <AspectRatio ratio={1} className="bg-muted">
            {imageError ? (
              <div className="flex items-center justify-center h-full bg-slate-100">
                <Heart className="h-16 w-16 text-slate-300" />
              </div>
            ) : (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
                  </div>
                )}
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className={`w-full h-full object-cover transition-all duration-300 ${imageLoaded ? 'opacity-100 hover:scale-105' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            )}
          </AspectRatio>
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="h-4 w-4 text-pink-500" />
          </div>
        </div>
      </Link>
      <CardContent className="pt-4">
        <Link to={`/${type}s/${item.id}`} className="hover:text-crocus-600 transition-colors">
          <h3 className="font-medium mb-1">{item.name}</h3>
        </Link>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
        <p className="font-medium text-lg">${item.price}</p>
      </CardContent>
      <CardFooter className="flex gap-2 border-t pt-4 mt-auto">
        <Button className="flex-1 bg-crocus-500 hover:bg-crocus-600">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button variant="outline" size="icon">
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
