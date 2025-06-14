
import React from "react";
import { Link } from "react-router-dom";
import { Copyright, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FooterColumn = ({ title, children, className }: FooterColumnProps) => (
  <div className={cn("space-y-3", className)}>
    <h3 className="font-medium text-sm text-gray-700">{title}</h3>
    <div className="space-y-2 text-sm">{children}</div>
  </div>
);

interface AdminFooterProps {
  className?: string;
  role: "staff" | "admin";
}

export const AdminFooter = ({ className, role }: AdminFooterProps) => {
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");
  
  return (
    <footer className={cn(
      "border-t border-gray-100 bg-gray-50 py-4 px-4 md:px-6 print:hidden",
      className
    )}>

    </footer>
  );
};
