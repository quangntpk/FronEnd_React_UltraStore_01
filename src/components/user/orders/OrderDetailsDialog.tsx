
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBreakpoint } from "@/hooks/use-mobile";

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

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailsDialog = ({ order, open, onClose }: OrderDetailsDialogProps) => {
  const isMobile = useBreakpoint("mobile");
  
  if (!order) return null;
  
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={cn("sm:max-w-lg md:max-w-2xl", isMobile ? "p-4" : "")}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center justify-between", isMobile ? "text-lg" : "")}>
            <span>Order {order.id}</span>
            <Badge className={cn("ml-2", getStatusColor(order.status))}>
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Order Date</h4>
              <p className={cn("font-medium", isMobile ? "text-sm" : "")}>
                {formatDate(order.date)}
              </p>
            </div>
            {order.trackingNumber && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h4>
                <p className={cn("font-mono", isMobile ? "text-sm" : "")}>
                  {order.trackingNumber}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
            
            {isMobile ? (
              <div className="bg-gray-50 rounded-md p-3 space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-gray-500 text-xs">Qty: {item.quantity} × ${item.price.toFixed(2)}</div>
                    </div>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-medium border-t border-gray-200">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h4>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm">{order.shippingAddress}</p>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
