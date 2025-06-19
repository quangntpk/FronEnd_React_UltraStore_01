import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import AdminLayout from "@/components/layout/AdminLayout";
import UserLayout from "@/components/layout/UserLayout";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductList from "./pages/products/ProductList";
import ProductDetail from "./pages/products/ProductDetail";
import CombosList from "./pages/combos/CombosList";
import ComboDetail from "./pages/combos/ComboDetail";
import BlogsList from "./pages/blogs/BlogsList";
import BlogDetail from "./pages/blogs/BlogDetail";
import FavoritesList from "./pages/favorites/FavoritesList";
import Contact from "./pages/contact/Contact";
import About from "./pages/about/About";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Profile from "./pages/user/Profile";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Orders from "./pages/user/Orders";
import ViewProfile from "./pages/user/ViewProfile";
import Messages from "./pages/user/Messages";
import AdminBuy from "./pages/admin/AdminBuy";
import StaffOrders from "./pages/admin/AdminOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminContact from "./pages/admin/AdminContact";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminProducs from "./pages/admin/AdminProducts";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminCombos from "./pages/admin/AdminCombos";
import AdminThuongHieu from "./pages/admin/AdminThuongHieu";
import AdminLoaiSanPham from "./pages/admin/AdminLoaiSanPham";
import VoucherUser from "./components/layout/voucher/VoucherUser";
import PaymentSuccess from "./pages/user/PaymentSuccess";
import PaymentFail from "./pages/user/PaymentFail";
import HeroSection from "./components/default/HeroSection";
import Newsletter from "./components/default/Newsletter";
import Features from "./components/default/Features";
import Testing from "./components/default/Testing";
import DiaChi from "./components/default/DiaChi";
import CategoryView from "./components/default/CategoryView";
import SelectSize from "./components/default/SelectSize";
import SupportChat from "./components/default/SupportChat";
import { BlogDetailComponent } from "./components/blogs/BlogDetailComponent";

const GoogleCallbackHandler = () => {
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const role = parseInt(searchParams.get("role"), 10);

    if (token && userId) {
      // Lưu vào localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("user", JSON.stringify({
        maNguoiDung: userId,
        email,
        hoTen: name,
        vaiTro: role,
      }));

      console.log("✅ Đăng nhập Google:");
      console.log("🔐 Token:", token);
      console.log("👤 UserID:", userId);
      console.log("📧 Email:", email);
      console.log("🧑‍💼 Họ tên:", name);
      console.log("🎭 Vai trò:", role);

      window.dispatchEvent(new Event("storageChange"));

      toast({
        title: "Đăng nhập Google thành công 🎉",
        description: "Chào mừng bạn quay trở lại!",
        duration: 3000,
        className: "bg-green-500 text-white border border-green-700 shadow-lg",
      });

      // ✅ Xoá query khỏi URL để tránh reload vòng lặp
      window.history.replaceState(null, "", location.pathname);

      // ✅ F5 đúng 1 lần duy nhất
      window.location.reload();
    }
  }, [location.search, toast]);

  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell>
          <GoogleCallbackHandler />
          <Routes>
            <Route path="/" element={<UserLayout />}>
              <Route index element={<Index />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="combos" element={<CombosList />} />
              <Route path="combos/:id" element={<ComboDetail />} />
              <Route path="blogs" element={<BlogsList />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              <Route path="voucher/*" element={<VoucherUser />} />
              <Route path="favorites" element={<FavoritesList />} />
              <Route path="contact" element={<Contact />} />
              <Route path="about" element={<About />} />
              <Route path="auth/login" element={<Login />} />
              <Route path="auth/register" element={<Register />} />
              <Route path="auth/forgot-password" element={<ForgotPassword />} />
              <Route path="user/profile" element={<Profile />} />
              <Route path="user/cart" element={<Cart />} />
              <Route path="user/checkout" element={<Checkout />} />
              <Route path="user/orders" element={<Orders />} />
              <Route path="user/messages" element={<Messages />} />
              <Route path="user/profile/:userId" element={<ViewProfile />} />
              <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
              <Route path="/PaymentFail" element={<PaymentFail />} />
              <Route path="/diachi" element={<DiaChi />} />
              <Route path="hero" element={<HeroSection />} />
              <Route path="newsletter" element={<Newsletter />} />
              <Route path="features" element={<Features />} />
              <Route path="testing" element={<Testing />} />
              <Route path="categoryview" element={<CategoryView />} />
              <Route path="selectsize" element={<SelectSize />} />
              <Route path="supportchat" element={<SupportChat />} />
              <Route path="blog" element={<BlogDetailComponent />} />
            </Route>

            <Route path="/admin" element={<AdminLayout role="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="buy" element={<AdminBuy />} />
              <Route path="orders" element={<StaffOrders />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="statistics" element={<AdminStatistics />} />
              <Route path="products" element={<AdminProducs />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="combos" element={<AdminCombos />} />
              <Route path="thuonghieu" element={<AdminThuongHieu />} />
              <Route path="loaisanpham" element={<AdminLoaiSanPham />} />
              <Route path="contact" element={<AdminContact />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </AppShell>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
