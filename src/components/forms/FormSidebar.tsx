
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { 
  FileText, 
  ClipboardList, 
  Package, 
  TruckIcon, 
  TagIcon, 
  ShoppingCart, 
  ChevronLeft 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { successToast } from "@/utils/notifications";
import { useBreakpoint } from "@/hooks/use-mobile";

interface FormOption {
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
  description?: string;
}

const formOptions: FormOption[] = [
  { 
    id: "inventory", 
    name: "Inventory Form", 
    path: "/staff/inventory/form", 
    icon: Package,
    description: "Manage your stock and inventory items"
  },
  { 
    id: "purchase-orders", 
    name: "Purchase Orders", 
    path: "/staff/purchase-orders/form", 
    icon: ClipboardList,
    description: "Create and manage purchase orders"
  },
  { 
    id: "products", 
    name: "Products Form", 
    path: "/staff/products/form", 
    icon: TagIcon,
    description: "Add or update product information"
  },
  { 
    id: "shipping", 
    name: "Shipping Form", 
    path: "/staff/shipping/form", 
    icon: TruckIcon,
    description: "Create shipping labels and manage deliveries"
  },
  { 
    id: "orders", 
    name: "Orders Form", 
    path: "/staff/orders/form", 
    icon: ShoppingCart,
    description: "Process and manage customer orders"
  },
  { 
    id: "invoice", 
    name: "Invoice Form", 
    path: "/staff/invoice/form", 
    icon: FileText,
    description: "Generate customer invoices and receipts"
  },
];

interface FormSidebarProps {
  activeFormId?: string;
  onFormSelect?: (formId: string) => void;
  collapsed?: boolean;
}

export const FormSidebar = ({ activeFormId, onFormSelect, collapsed = false }: FormSidebarProps) => {
  const [selectedFormId, setSelectedFormId] = useState<string>(activeFormId || "");
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");
  
  useEffect(() => {
    if (activeFormId) {
      setSelectedFormId(activeFormId);
    }
  }, [activeFormId]);

  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    if (onFormSelect) {
      onFormSelect(formId);
    }
  };

  // Determine if we should show text in collapsed state (always true on mobile/tablet)
  const showText = !collapsed || isMobile || isTablet;
  
  // Adjust paths based on whether we're in admin or staff section
  const adjustedFormOptions = formOptions.map(form => ({
    ...form,
    path: isAdmin ? form.path.replace('/staff/', '/admin/') : form.path
  }));

};
