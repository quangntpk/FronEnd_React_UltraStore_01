import { cn } from "@/lib/utils";
import { SidebarHeader as Header } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarHeaderProps {
  role: "staff" | "admin";
  collapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

export const SidebarHeader = ({ role, collapsed, toggleCollapse, className }: SidebarHeaderProps) => {
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");

  const showText = !collapsed || (collapsed && (isMobile || isTablet));
  
  return (
    <Header className={cn("p-3 flex items-center", className)}>
      <div className={cn(
        "flex items-center w-full",
        collapsed && !showText ? "justify-center" : "justify-between"
      )}>
        <Link to={role === "admin" ? "/admin" : "/staff"} className="flex items-center gap-2">
          {showText && (
            <div className="flex flex-col h-10 items-center justify-center">
              <img 
                src="/logo.gif" 
                alt="FashionHub" 
                className="h-32 w-auto max-w-[300px]" 
              />
            </div>
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse}
          className="text-gray-500 hover:text-crocus-600 hover:bg-crocus-50"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
    </Header>
  );
};