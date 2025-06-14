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
import { FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  orderNumber: z.string().min(1, "Order number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email format"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string(),
  taxRate: z.string(),
  discount: z.string(),
  sendEmail: z.boolean().default(false)
});

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

const InvoiceForm = () => {
  const [invoiceItems, setInvoiceItems] = React.useState<InvoiceItem[]>([
    { id: "1", description: "Product Design", quantity: 1, price: 500 },
    { id: "2", description: "Website Development", quantity: 1, price: 2000 }
  ]);
  
  const [itemDescription, setItemDescription] = React.useState("");
  const [itemQuantity, setItemQuantity] = React.useState(1);
  const [itemPrice, setItemPrice] = React.useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      orderNumber: "",
      customerName: "",
      customerEmail: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "draft",
      notes: "",
      taxRate: "10",
      discount: "0",
      sendEmail: true
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ ...values, invoiceItems });
    // Handle form submission
  }
  
  const addInvoiceItem = () => {
    if (itemDescription && itemPrice) {
      setInvoiceItems([
        ...invoiceItems,
        {
          id: Date.now().toString(),
          description: itemDescription,
          quantity: itemQuantity,
          price: parseFloat(itemPrice)
        }
      ]);
      setItemDescription("");
      setItemQuantity(1);
      setItemPrice("");
    }
  };
  
  const removeInvoiceItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };
  
  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(form.watch("taxRate") || "0") / 100;
    const discount = parseFloat(form.watch("discount") || "0");
    
    const tax = subtotal * taxRate;
    return subtotal + tax - discount;
  };

  return (
    <FormLayout activeFormId="invoice">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-purple-500" />
            <div>
              <CardTitle className="text-2xl">Invoice Form</CardTitle>
              <CardDescription>
                Create a professional invoice for your customers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter order number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <p className="text-sm text-gray-500 mb-4">Add the items or services for this invoice</p>
                
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="itemDescription">Description</Label>
                    <Input 
                      id="itemDescription" 
                      value={itemDescription} 
                      onChange={(e) => setItemDescription(e.target.value)} 
                      placeholder="Item or service description" 
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
                      <Button type="button" onClick={addInvoiceItem}>Add</Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.length > 0 ? (
                        invoiceItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeInvoiceItem(item.id)} 
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
                            No items added to this invoice
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Tax Rate (%):</span>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.1" 
                                  className="h-8 text-right" 
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
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
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes to Customer</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Email Invoice to Customer</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Send this invoice automatically to the customer email
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button">Save as Draft</Button>
                <Button type="submit">Generate Invoice</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormLayout>
  );
};

export default InvoiceForm;
