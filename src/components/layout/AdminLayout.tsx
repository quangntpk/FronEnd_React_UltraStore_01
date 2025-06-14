import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AdminLayoutProps {
  role: "staff" | "admin";
}

const getPageTitle = (pathname: string): string => {
  const pathParts = pathname.split("/");
  const page = pathParts[2] || "Statistics";
  const titles = {
    dashboard: "Bảng điều khiển",
    orders: "Đơn hàng",
    products: "Sản phẩm",
    inventory: "Kho hàng",
    users: "Người dùng",
    staff: "Nhân viên",
    settings: "Cài đặt",
    invoices: "Hóa đơn",
    form: "Form",
  };
  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
};

const AdminLayout = ({ role }: AdminLayoutProps) => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState(getPageTitle(location.pathname));
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    setPageTitle(getPageTitle(location.pathname));
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // useEffect(() => {
  //   if (location.pathname === "/admin" && !sessionStorage.getItem("welcomed")) {
  //     setTimeout(() => {
  //       toast.success("Chào mừng đến với FashionHub Admin", {
  //         description: "Bảng điều khiển quản lý bán hàng mạnh mẽ của bạn",
  //         duration: 5000,
  //       });
  //       sessionStorage.setItem("welcomed", "true");
  //     }, 1000);
  //   }
  // }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar role={role} />
      <main className="flex-1 flex flex-col">
        <Header title={pageTitle} />
        <div className="flex-1 p-6">
          {isPageLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-t-crocus-500 border-crocus-200 animate-spin"></div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;