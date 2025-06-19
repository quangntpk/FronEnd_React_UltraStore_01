import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBreakpoint } from "@/hooks/use-mobile";

interface SidebarItemProps {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  collapsed: boolean;
  color?: string;
}

export const SidebarItem = ({ title, icon: Icon, path, badge, collapsed, color }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");
  
  const showText = !collapsed || (collapsed && (isMobile || isTablet));

  const linkContent = (
    <Link
      to={path}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
        isActive
          ? "bg-crocus-100 text-crocus-600 font-medium"
          : "text-gray-600 hover:bg-crocus-50 hover:text-crocus-600"
      )}
    >
      <div className={cn(
        "relative flex items-center justify-center",
        collapsed && !showText ? "w-full" : "w-auto"
      )}>
        <Icon
          className={cn(
            "flex-shrink-0 h-5 w-5",
            isActive ? "text-crocus-600" : color || "text-gray-500"
          )}
        />
        
        {badge && collapsed && !showText && (
          <span className="absolute -top-2 -right-2 bg-crocus-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      
      {showText && (
        <>
          <span className="text-sm truncate">{title}</span>
          {badge && (
            <span className="ml-auto bg-crocus-100 text-crocus-600 text-xs rounded-full px-2 py-0.5 flex items-center justify-center">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed && !isMobile && !isTablet) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{linkContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="z-50 bg-white border border-gray-100 shadow-md">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};