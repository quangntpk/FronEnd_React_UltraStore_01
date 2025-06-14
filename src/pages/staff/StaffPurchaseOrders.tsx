
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  ClipboardList,
  Calendar,
  Building,
  ArrowUpDown
} from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplier: string;
  items: number;
  total: number;
  date: string;
  deliveryDate: string;
  status: "Pending" | "Approved" | "Ordered" | "Received" | "Cancelled";
};

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2025-001",
    supplier: "Fashion Suppliers Inc.",
    items: 3,
    total: 4500,
    date: "2025-04-25",
    deliveryDate: "2025-05-10",
    status: "Pending"
  },
  {
    id: "2",
    poNumber: "PO-2025-002",
    supplier: "Textile Excellence Corp",
    items: 5,
    total: 8750,
    date: "2025-04-24",
    deliveryDate: "2025-05-15",
    status: "Approved"
  },
  {
    id: "3",
    poNumber: "PO-2025-003",
    supplier: "Global Fabrics Ltd",
    items: 2,
    total: 3200,
    date: "2025-04-20",
    deliveryDate: "2025-05-05",
    status: "Ordered"
  },
  {
    id: "4",
    poNumber: "PO-2025-004",
    supplier: "Premium Materials Co",
    items: 8,
    total: 12400,
    date: "2025-04-10",
    deliveryDate: "2025-05-01",
    status: "Received"
  },
  {
    id: "5",
    poNumber: "PO-2025-005",
    supplier: "Budget Supplies LLC",
    items: 4,
    total: 2800,
    date: "2025-04-05",
    deliveryDate: "2025-04-20",
    status: "Cancelled"
  }
];

const StaffPurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [openPOForm, setOpenPOForm] = useState(false);
  
  const form = useForm({
    defaultValues: {
      supplier: "",
      items: "",
      total: "",
      deliveryDate: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    // In a real app, this would be an API call
    const today = new Date();
    const newPO: PurchaseOrder = {
      id: Math.random().toString(36).substring(7),
      poNumber: `PO-2025-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      supplier: data.supplier,
      items: parseInt(data.items),
      total: parseInt(data.total),
      date: format(today, 'yyyy-MM-dd'),
      deliveryDate: data.deliveryDate,
      status: "Pending"
    };
    
    setPurchaseOrders([...purchaseOrders, newPO]);
    setOpenPOForm(false);
    form.reset();
  });

  const filteredPOs = purchaseOrders.filter(po => 
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    po.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: PurchaseOrder["status"]) => {
    switch(status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Approved": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Ordered": return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "Received": return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Cancelled": return "bg-red-100 text-red-800 hover:bg-red-200";
    }
  };

  return (
    <div className="py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <p className="text-gray-500">Manage your purchase orders with suppliers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Total POs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{purchaseOrders.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{purchaseOrders.filter(po => po.status === "Pending").length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{formatCurrency(purchaseOrders.reduce((acc, po) => acc + po.total, 0))}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{purchaseOrders.filter(po => po.status === "Received").length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search purchase orders..." 
            className="pl-9 w-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={openPOForm} onOpenChange={setOpenPOForm}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fashion Suppliers Inc.">Fashion Suppliers Inc.</SelectItem>
                          <SelectItem value="Textile Excellence Corp">Textile Excellence Corp</SelectItem>
                          <SelectItem value="Global Fabrics Ltd">Global Fabrics Ltd</SelectItem>
                          <SelectItem value="Premium Materials Co">Premium Materials Co</SelectItem>
                          <SelectItem value="Budget Supplies LLC">Budget Supplies LLC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="items"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Items</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Value ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenPOForm(false)}>Cancel</Button>
                  <Button type="submit">Create Purchase Order</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  PO Number
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPOs.length > 0 ? (
              filteredPOs.map(po => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-purple-500" />
                      <span>{po.poNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>{po.supplier}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{po.items}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(po.total)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{format(new Date(po.date), 'MMM d, yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(po.deliveryDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  No purchase orders found matching your search criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="py-3 px-4 bg-gray-50 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredPOs.length}</span> of <span className="font-medium">{purchaseOrders.length}</span> purchase orders
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPurchaseOrders;
