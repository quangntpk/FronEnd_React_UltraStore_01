
import { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderItemProps {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
  items: OrderItemProps[];
  shippingAddress: string;
  trackingNumber: string | null;
}

interface Props {
  order: Order;
  onViewDetails: () => void;
  isMobile: boolean;
}

export const OrderItem = ({ order, onViewDetails, isMobile }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-orange-100 text-orange-800";
      case "Pending":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className={cn("pb-2", isMobile ? "px-4 py-3" : "")}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex justify-between items-center sm:block">
            <CardTitle className={cn("text-base sm:text-lg", isMobile ? "text-sm" : "")}>
              Order {order.id}
            </CardTitle>
            <Badge className={cn("font-medium sm:hidden", getStatusColor(order.status))}>
              {order.status}
            </Badge>
          </div>
          <div className="flex justify-between items-center w-full sm:w-auto">
            <div className="text-xs sm:text-sm text-gray-500">
              {formatDate(order.date)}
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("font-medium text-right", isMobile ? "text-sm" : "")}>
                ${order.total.toFixed(2)}
              </span>
              <Badge className={cn("font-medium hidden sm:inline-flex", getStatusColor(order.status))}>
                {order.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(isMobile ? "px-4 py-3" : "")}>
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setExpanded(!expanded)}
        >
          <span className={cn("text-sm", isMobile ? "text-xs" : "")}>
            {order.items.length} item{order.items.length > 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {expanded && (
          <div className="mt-3 space-y-2">
            <div className="bg-gray-50 rounded-md p-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between py-1.5 text-sm border-t first:border-0 border-gray-100">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">×{item.quantity}</span>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="w-full sm:w-auto mt-2"
              >
                <Eye className="h-3.5 w-3.5 mr-2" /> View Order Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
