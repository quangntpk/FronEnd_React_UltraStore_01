
import React from "react";
import { FormLayout } from "@/components/forms/FormLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useBreakpoint } from "@/hooks/use-mobile";
import { showSuccess, showError } from "@/utils/notifications";

const formSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string(),
  orderDate: z.string().min(1, "Order date is required"),
  status: z.string().min(1, "Status is required"),
  shippingMethod: z.string().min(1, "Shipping method is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string(),
  discount: z.string()
});

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const OrdersForm = () => {
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");
  
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([
    { id: "1", name: "T-Shirt", quantity: 2, price: 24.99 },
    { id: "2", name: "Jeans", quantity: 1, price: 49.99 }
  ]);
  
  const [itemName, setItemName] = React.useState("");
  const [itemQuantity, setItemQuantity] = React.useState(1);
  const [itemPrice, setItemPrice] = React.useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      orderDate: new Date().toISOString().split("T")[0],
      status: "pending",
      shippingMethod: "standard",
      paymentMethod: "credit_card",
      notes: "",
      discount: "0"
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ ...values, orderItems });
    // Handle form submission
    showSuccess("Order has been saved successfully");
  }
  
  const addOrderItem = () => {
    if (itemName && itemPrice) {
      setOrderItems([
        ...orderItems,
        {
          id: Date.now().toString(),
          name: itemName,
          quantity: itemQuantity,
          price: parseFloat(itemPrice)
        }
      ]);
      setItemName("");
      setItemQuantity(1);
      setItemPrice("");
    } else {
      showError("Please fill in all item fields");
    }
  };
  
  const removeOrderItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };
  
  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(form.watch("discount") || "0");
    return subtotal - discount;
  };

  return (
    <FormLayout activeFormId="orders">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-purple-500" />
            <div>
              <CardTitle className="text-2xl">Order Form</CardTitle>
              <CardDescription>
                Create or edit customer orders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">Order Details</h3>
                <p className="text-sm text-gray-500 mb-4">Add items to this order</p>
                
                <div className={`mb-6 grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-1 md:grid-cols-4 gap-4"} items-end`}>
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input 
                      id="itemName" 
                      value={itemName} 
                      onChange={(e) => setItemName(e.target.value)} 
                      placeholder="Product name" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemQuantity">Quantity</Label>
                    <Input 
                      id="itemQuantity" 
                      type="number" 
                      min="1" 
                      value={itemQuantity} 
                      onChange={(e) => setItemQuantity(parseInt(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemPrice">Price</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="itemPrice" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={itemPrice} 
                        onChange={(e) => setItemPrice(e.target.value)} 
                        placeholder="0.00" 
                      />
                      <Button type="button" onClick={addOrderItem}>Add</Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.length > 0 ? (
                        orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeOrderItem(item.id)} 
                                className="h-8 w-8 p-0"
                              >
                                ✕
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No items added to this order
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <div className={`${isMobile ? "w-full" : "w-full max-w-xs"} space-y-2`}>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Discount:</span>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  className="h-8 text-right" 
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t font-medium">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shipping method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard Shipping</SelectItem>
                          <SelectItem value="express">Express Shipping</SelectItem>
                          <SelectItem value="overnight">Overnight Shipping</SelectItem>
                          <SelectItem value="pickup">In-Store Pickup</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash on Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Order Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Add any notes about this order" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button variant="outline" type="button">Cancel</Button>
                <Button type="submit">Save Order</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormLayout>
  );
};

export default OrdersForm;
