
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const EmptyCart = () => {
  return (
    <div className="text-center py-10 sm:py-12 md:py-16 px-4">
      <div className="bg-gray-100 mx-auto rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center mb-4 sm:mb-6">
        <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
      </div>
      <h2 className="text-xl sm:text-2xl font-medium mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
        Looks like you haven't added any items to your cart yet.
        Browse our products and find something you'll love!
      </p>
      <Button asChild className="bg-crocus-500 hover:bg-crocus-600 rounded-full px-4 sm:px-6">
        <Link to="/products" className="flex items-center gap-2">
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};
