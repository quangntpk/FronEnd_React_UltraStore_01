
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCartItem } from "./cart/ProductCartItem";
import { ComboCartItem } from "./cart/ComboCartItem";
import { OrderSummary } from "./cart/OrderSummary";
import { EmptyCart } from "./cart/EmptyCart";
import { CartItem } from "@/types/cart";
import { useBreakpoint } from "@/hooks/use-mobile";

// Mock data for cart items with better images
const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: "Crocus Cotton Tee",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=300&h=300",
    price: 29.99,
    quantity: 1,
    size: "M",
    color: "Crocus Purple",
    type: "product" as const
  },
  {
    id: 2,
    name: "Linen Blend Shirt",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&h=300",
    price: 49.99,
    quantity: 2,
    size: "L",
    color: "White",
    type: "product" as const
  },
  {
    id: 3,
    name: "Summer Dress",
    image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=300&h=300",
    price: 79.99,
    quantity: 1,
    size: "S",
    color: "Floral",
    type: "product" as const
  },
  {
    id: 101,
    name: "Essential Capsule Combo",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&h=225",
    additionalImages: [
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=300&h=300",
      "https://images.unsplash.com/photo-1566174053879-31528523f8c6?auto=format&fit=crop&w=300&h=300",
      "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?auto=format&fit=crop&w=300&h=300"
    ],
    price: 149.99,
    quantity: 1,
    description: "Crocus Purple blouse, neutral trousers, versatile blazer",
    type: "combo" as const
  },
  {
    id: 102,
    name: "Weekend Wanderer Combo",
    image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=400&h=225",
    additionalImages: [
      "https://images.unsplash.com/photo-1612723670862-1b9d7ceaf0b4?auto=format&fit=crop&w=300&h=300",
      "https://images.unsplash.com/photo-1560859261-d69d1fb12c8c?auto=format&fit=crop&w=300&h=300"
    ],
    price: 129.99,
    quantity: 1,
    description: "Comfortable jeans, layerable tops, statement jacket",
    type: "combo" as const
  }
];

export const CartComponent = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const isMobile = useBreakpoint("mobile");

  const handleQuantityChange = (id: number, change: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Your Shopping Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Cart Items ({cartItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {cartItems.map((item) => (
                  <li key={item.id} className="p-3 sm:p-4">
                    {item.type === "product" ? (
                      <ProductCartItem
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        isMobile={isMobile}
                      />
                    ) : (
                      <ComboCartItem
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        isMobile={isMobile}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sm:pt-6">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/products">Continue Shopping</Link>
              </Button>
              <Button variant="outline" onClick={() => setCartItems([])} className="w-full sm:w-auto">
                Clear Cart
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className={isMobile ? "mt-4" : ""}>
          <OrderSummary cartItems={cartItems} />
          {isMobile && (
            <div className="mt-4">
              <Button asChild className="w-full bg-crocus-500 hover:bg-crocus-600">
                <Link to="/user/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
