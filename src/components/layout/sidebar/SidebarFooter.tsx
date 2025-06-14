import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter as Footer } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";

interface SidebarFooterProps {
  role: "staff" | "admin";
  collapsed: boolean;
}

export const SidebarFooter = ({ role, collapsed }: SidebarFooterProps) => {
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");

  const showText = !collapsed || (collapsed && (isMobile || isTablet));

  return (
    <Footer className="mt-auto border-t border-gray-100 pt-2">
      <SidebarMenu>
        <div className={cn(
          "flex",
          collapsed && !showText ? "flex-col items-center gap-2" : "items-center justify-between px-3 py-2"
        )}>
          {collapsed && !showText ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={`/${role}/settings`} className="p-2 rounded-md hover:bg-purple-50 text-gray-500 hover:text-purple-600">
                    <Settings size={18} className="text-blue-600" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Cài đặt</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/auth/login" className="p-2 rounded-md hover:bg-purple-50 text-gray-500 hover:text-purple-600">
                    <LogOut size={18} className="text-red-600" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              {/* <Link to={`/${role}/settings`} className="flex items-center gap-2 text-gray-500 hover:text-purple-600">
                <Settings size={18} className="text-blue-600" />
                <span className="text-sm">Cài đặt</span>
              </Link> */}
              
              <Link to="/auth/login" className="flex items-center gap-2 text-gray-500 hover:text-purple-600">
                <LogOut size={18} className="text-red-600" />
                <span className="text-sm">Đăng xuất</span>
              </Link>
            </>
          )}
        </div>
      </SidebarMenu>
    </Footer>
  );
};