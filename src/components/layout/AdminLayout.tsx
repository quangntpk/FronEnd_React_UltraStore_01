import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { jwtDecode } from "jwt-decode";

interface AdminLayoutProps {
  role: "staff" | "admin";
}

interface MyToken {
  sub?: string;
  jti?: string;
  [key: string]: any; 
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  exp?: number;
  iss?: string;
  aud?: string;
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

  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token);
  let userRole = "";

  if (token) {
    try {
      const decoded = jwtDecode<MyToken>(token);
      console.log("Decoded Token:", decoded);
      userRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?.toLowerCase() || "";
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  console.log("User Role:", userRole, "Expected Role:", role.toLowerCase());
  if (!userRole || userRole !== role.toLowerCase()) {
    return <Navigate to="/notfound" replace />;
  }
  if (userRole === "staff" && (location.pathname.includes("/statistics") || location.pathname.includes("/users") || location.pathname.includes("/settings"))) {
    return <Navigate to="/notfound" replace />;
  }

  useEffect(() => {
    setPageTitle(getPageTitle(location.pathname));
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
