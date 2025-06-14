
import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrderItem } from "./orders/OrderItem";
import { OrderDetailsDialog } from "./orders/OrderDetailsDialog";
import { useBreakpoint } from "@/hooks/use-mobile";

// Type definitions
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
  items: OrderItem[];
  shippingAddress: string;
  trackingNumber: string | null;
}

// Mock data for orders
const orders: Order[] = [
  {
    id: "ORD-12345",
    date: "2025-02-15",
    status: "Delivered",
    total: 159.97,
    items: [
      { name: "Crocus Cotton Tee", quantity: 1, price: 29.99 },
      { name: "Linen Blend Shirt", quantity: 2, price: 49.99 },
    ],
    shippingAddress: "123 Main St, Apt 4B, New York, NY 10001",
    trackingNumber: "TRK39571684325",
  },
  {
    id: "ORD-12346",
    date: "2025-02-10",
    status: "Processing",
    total: 79.99,
    items: [
      { name: "Summer Dress", quantity: 1, price: 79.99 },
    ],
    shippingAddress: "123 Main St, Apt 4B, New York, NY 10001",
    trackingNumber: null,
  },
  {
    id: "ORD-12347",
    date: "2025-01-28",
    status: "Delivered",
    total: 149.97,
    items: [
      { name: "Winter Jacket", quantity: 1, price: 129.99 },
      { name: "Wool Scarf", quantity: 1, price: 19.98 },
    ],
    shippingAddress: "123 Main St, Apt 4B, New York, NY 10001",
    trackingNumber: "TRK49571238472",
  },
];

export const OrderHistory = () => {
  const [viewOrderDetails, setViewOrderDetails] = useState<Order | null>(null);
  const isMobile = useBreakpoint("mobile");

  return (
    <div className="space-y-4 sm:space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-8 sm:py-12 md:py-16">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl sm:text-2xl font-medium mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Once you make a purchase, your orders will appear here.</p>
          <Button asChild className="bg-crocus-500 hover:bg-crocus-600">
            <a href="/products">Start Shopping</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {orders.map((order) => (
            <OrderItem
              key={order.id}
              order={order}
              onViewDetails={() => setViewOrderDetails(order)}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
      
      <OrderDetailsDialog
        order={viewOrderDetails}
        open={!!viewOrderDetails}
        onClose={() => setViewOrderDetails(null)}
      />
    </div>
  );
};
