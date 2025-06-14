
import React, { useState, useEffect } from "react";
import { FormSidebar } from "./FormSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormLayoutProps {
  children: React.ReactNode;
  activeFormId?: string;
}

export const FormLayout = ({ children, activeFormId }: FormLayoutProps) => {
  const [selectedFormId, setSelectedFormId] = useState<string>(activeFormId || "");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

};
