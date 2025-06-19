
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Minus, Plus, Trash } from "lucide-react";
import { CartItem } from "@/types/cart";

interface ProductCartItemProps {
  item: CartItem;
  onQuantityChange: (id: number, change: number) => void;
  onRemoveItem: (id: number) => void;
  isMobile?: boolean;
}

export const ProductCartItem = ({ item, onQuantityChange, onRemoveItem, isMobile = false }: ProductCartItemProps) => {
  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-3`}>
      <div className={`${isMobile ? 'w-full' : 'w-24 h-24'} overflow-hidden rounded-lg border border-gray-200`}>
        <AspectRatio ratio={1} className="bg-gray-50">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </AspectRatio>
      </div>
      <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-xs sm:text-sm text-gray-500">
          {item.size && <span>Size: {item.size} | </span>}
          {item.color && <span>Color: {item.color}</span>}
        </p>
        <p className="font-medium mt-1">${item.price.toFixed(2)}</p>

        {isMobile && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                onClick={() => onQuantityChange(item.id, -1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
                <span className="sr-only">Decrease</span>
              </Button>
              <span className="mx-3 w-5 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                onClick={() => onQuantityChange(item.id, 1)}
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        )}
      </div>
      
      {!isMobile && (
        <>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onQuantityChange(item.id, -1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
              <span className="sr-only">Decrease</span>
            </Button>
            <span className="mx-3 w-6 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onQuantityChange(item.id, 1)}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Increase</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-500"
            onClick={() => onRemoveItem(item.id)}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </>
      )}
    </div>
  );
};
