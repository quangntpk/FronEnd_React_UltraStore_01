import { useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { SidebarItem } from "./sidebar/SidebarItem";
import { adminItems, staffItems, adminManagementItems, supportItems } from "./sidebar/sidebarItems";

interface SidebarProps {
  role: "staff" | "admin";
}

const Sidebar = ({ role }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = role === "staff" ? staffItems : adminItems;
  const managementItems = role === "admin" ? adminManagementItems : [];
  const supportMenuItems = role === "admin" ? supportItems : [];

  return (
    <aside 
      className={cn(
        "h-screen bg-white sticky top-0 left-0 z-30 flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <SidebarHeader 
        role={role} 
        collapsed={isCollapsed} 
        toggleCollapse={toggleCollapse}
        className="p-3 flex items-center border-b border-gray-200"
      />
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <SidebarGroup className={cn("mt-4", isCollapsed ? "px-1" : "px-2")}>
          {/* {!isCollapsed && <SidebarGroupLabel className="text-gray-500 font-medium px-3 py-2 text-xs uppercase">Menu Chính</SidebarGroupLabel>} */}
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path} className={cn(isCollapsed ? "px-0 w-full flex justify-center" : "")}>
                <SidebarMenuButton
                  asChild
                  tooltip={isCollapsed ? item.title : undefined}
                  className={cn("my-1 transition-all rounded-md", isCollapsed ? "w-full" : "")}
                >
                  <SidebarItem
                    title={item.title}
                    icon={item.icon}
                    path={item.path}
                    badge={item.badge}
                    collapsed={isCollapsed}
                    color={item.color}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {managementItems.length > 0 && (
          <SidebarGroup className={cn("mt-4", isCollapsed ? "px-1" : "px-2")}>
            {!isCollapsed && <SidebarGroupLabel className="text-gray-500 font-medium px-3 py-2 text-xs uppercase">Quản lý</SidebarGroupLabel>}
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.path} className={cn(isCollapsed ? "px-0 w-full flex justify-center" : "")}>
                  <SidebarMenuButton
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                    className={cn("my-1 transition-all rounded-md", isCollapsed ? "w-full" : "")}
                  >
                    <SidebarItem
                      title={item.title}
                      icon={item.icon}
                      path={item.path}
                      badge={item.badge}
                      collapsed={isCollapsed}
                      color={item.color}
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {supportMenuItems.length > 0 && (
          <SidebarGroup className={cn("mt-4", isCollapsed ? "px-1" : "px-2")}>
            {!isCollapsed && <SidebarGroupLabel className="text-gray-500 font-medium px-3 py-2 text-xs uppercase">Hỗ trợ</SidebarGroupLabel>}
            <SidebarMenu>
              {supportMenuItems.map((item) => (
                <SidebarMenuItem key={item.path} className={cn(isCollapsed ? "px-0 w-full flex justify-center" : "")}>
                  <SidebarMenuButton
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                    className={cn("my-1 transition-all rounded-md", isCollapsed ? "w-full" : "")}
                  >
                    <SidebarItem
                      title={item.title}
                      icon={item.icon}
                      path={item.path}
                      badge={item.badge}
                      collapsed={isCollapsed}
                      color={item.color}
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </nav>
      <SidebarFooter role={role} collapsed={isCollapsed} />
    </aside>
  );
};

export default Sidebar;