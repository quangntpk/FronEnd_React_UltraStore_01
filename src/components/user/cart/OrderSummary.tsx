
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CartItem } from "@/types/cart";
import { ShoppingBag } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

interface OrderSummaryProps {
  cartItems: CartItem[];
}

export const OrderSummary = ({ cartItems }: OrderSummaryProps) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 5.99;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;
  const isMobile = useBreakpoint("mobile");

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" /> Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">${shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (10%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium text-base sm:text-lg">
          <span>Total</span>
          <span className="text-crocus-600">${total.toFixed(2)}</span>
        </div>

        {cartItems.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">Order items:</p>
            <ul className="text-xs space-y-1 max-h-24 sm:max-h-32 overflow-auto pr-2">
              {cartItems.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="truncate flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {!isMobile && (
        <CardFooter>
          <Button asChild className="w-full bg-crocus-500 hover:bg-crocus-600">
            <Link to="/user/checkout">
              Proceed to Checkout
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
