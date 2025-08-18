import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import AdminLayout from "@/components/layout/AdminLayout";
import UserLayout from "@/components/layout/UserLayout";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductList from "./pages/products/ProductList";
import ProductDetail from "@/pages/products/ProductDetail"
import CombosList from "./pages/combos/CombosList";
import ComboDetail from "./pages/combos/ComboDetail";
import BlogsList from "./pages/blogs/BlogsList";
import BlogDetail from "./pages/blogs/BlogDetail";
import FavoritesList from "./pages/favorites/FavoritesList";
import PersonalpromotionsList from "./pages/personalpromotions/PersonalpromotionsList"
import Contact from "./pages/contact/Contact";
import About from "./pages/about/About";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Profile from "./pages/user/Profile";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Orders from "./pages/user/Orders";
import OrderEmailPage from "./components/user/OrderEmailPage";
import ViewProfile from "./pages/user/ViewProfile";
import Messages from "./pages/user/Messages";
import StaffDashboard from "./pages/staff/StaffDashboard";
import AdminBuy from "./pages/admin/AdminBuy";
import HoaDon from "./pages/user/HoaDon"
import AdminOrders from "./pages/admin/AdminOrders";
import StaffOrders from "./pages/admin/AdminOrders";
import StaffInventory from "./pages/admin/AdminInventory";
import InventoryForm from "./pages/staff/InventoryForm";
import PurchaseOrdersForm from "./pages/staff/PurchaseOrdersForm";
import ProductsForm from "./pages/staff/ProductsForm";
import ShippingForm from "./pages/staff/ShippingForm";
import OrdersForm from "./pages/staff/OrdersForm";
import InvoiceForm from "./pages/staff/InvoiceForm";
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
import AdminHashTag from "./pages/admin/AdminHashTag";
import VoucherUser from "./components/layout/voucher/VoucherUser";
import PaymentSuccess from "./pages/user/PaymentSuccess";
import PaymentFail from "./pages/user/PaymentFail";
import HeroSection from "./components/default/HeroSection";
import Newsletter from "./components/default/Newsletter";
import Features from "./components/default/Features";
import Testing from "./components/default/Testing";
import DiaChi from "./components/default/DiaChi";
import DiaChiCart from "./components/default/DiaChiCart";
import CategoryView from "./components/default/CategoryView";
import SelectSize from "./components/default/SelectSize";
import SupportChat from "./components/default/SupportChat";
import { BlogDetailComponent } from "./components/blogs/BlogDetailComponent";
import { AuthProvider } from "@/components/auth/AuthContext";
import { useAuth } from "@/components/auth/AuthContext";
import { useRef } from "react";
import AdminProfile from "./pages/admin/AdminProfile";
import CheckOutInstant from "./pages/user/InstantCheckout";
import Security from "./components/default/Security";
import Guarantee from "./components/default/Guarantee";
import AdminMessages from "./pages/admin/AdminMessages";
import Search from "./components/default/Search";
import CmtForm from "@/pages/products/CmtForm"
import DiaChiTime from "./components/default/DiaChiTime";
import VnpayReturn from "./router/Vnpayreturn";


import KhuyenMaiList from "./components/user/KhuyenMai/KhuyenMaiList";
import ListKhuyenMai from "./pages/admin/AdminEvent";
import DetailEvent from "./components/user/KhuyenMai/KhuyenMaiDetail";
const GoogleCallbackHandler = () => {
  const { setAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (!token || !userId || processedRef.current) return;

    processedRef.current = true;

    const email = searchParams.get("email") || "";
    const fullName = searchParams.get("name") || "";
    const vaiTro = parseInt(searchParams.get("role") || "0", 10);
    const role = vaiTro === 1 ? "admin" : vaiTro === 2 ? "staff" : "Người Dùng";

    const processCallback = async () => {
      try {
        const userData = {
          maNguoiDung: userId,
          email,
          fullName,
          vaiTro,
          role,
        };

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));


        setAuth(token, userData);

        const redirectPath =
          vaiTro === 1 ? "/admin" : vaiTro === 2 ? "/staff" : "/";
        window.history.replaceState({}, "", redirectPath);


        window.dispatchEvent(new Event("storage"));


        setTimeout(() => {
          toast({
            title: "Đăng nhập Google thành công 🎉",
            description: "Chào mừng bạn quay trở lại!",
            duration: 3000,
            className:
              "bg-green-500 text-white border border-green-700 shadow-lg",
          });
          navigate(redirectPath);
        }, 200);
      } catch (error) {
        console.error("Lỗi Google callback:", error);
        toast({
          title: "Đăng nhập Google thất bại!",
          description:
            error.message || "Có lỗi xảy ra khi đăng nhập với Google.",
          variant: "destructive",
          duration: 3000,
        });
        processedRef.current = false;
      }
    };
    processCallback();
  }, [location.search, setAuth, navigate, toast]);

  return null;
};


const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
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
                <Route path="blogs/:slug" element={<BlogDetailComponent />} />
                <Route path="voucher/*" element={<VoucherUser />} />
                <Route path="favorites" element={<FavoritesList />} />
                <Route path="personalpromotions" element={<PersonalpromotionsList />} />
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
                <Route path="user/diachi" element={<DiaChi />} />
                <Route path="user/diachicart" element={<DiaChiCart />} />
                <Route path="hero" element={<HeroSection />} />
                <Route path="newsletter" element={<Newsletter />} />
                <Route path="features" element={<Features />} />
                <Route path="testing" element={<Testing />} />
                <Route path="/user/hoadon/:orderId" element={<OrderEmailPage />} />
                <Route path="/user/hoadon" element={<HoaDon />} />
                <Route path="/user/CheckOutInstant" element={<CheckOutInstant />} />
                <Route path="security" element={<Security />} />
                <Route path="guarantee" element={<Guarantee />} />
                <Route path="search" element={<Search />} />
                <Route path="diachitime" element={<DiaChiTime />} />

                <Route path="KhuyenMais" element={<KhuyenMaiList/>}></Route>
                <Route path="KhuyenMais/:id" element={<DetailEvent />}></Route>
              </Route>

              <Route path="/staff" element={<AdminLayout role="staff" />}>
                <Route index element={<StaffOrders />} />
                 <Route path="events" element ={<ListKhuyenMai/>} />
                <Route path="orders" element={<StaffOrders />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="hashtag" element={<AdminHashTag />} />
                <Route path="inventory/form" element={<InventoryForm />} />
                <Route path="purchase-orders/form" element={<PurchaseOrdersForm />} />
                <Route path="products/form" element={<ProductsForm />} />
                <Route path="shipping/form" element={<ShippingForm />} />
                <Route path="orders/form" element={<OrdersForm />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="contact" element={<AdminContact />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="loaisanpham" element={<AdminLoaiSanPham />} />
                <Route path="products" element={<AdminProducs />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="buy" element={<AdminBuy />} />
                <Route path="combos" element={<AdminCombos />} />
                <Route path="thuonghieu" element={<AdminThuongHieu />} />
              </Route>

              <Route path="/admin" element={<AdminLayout role="admin" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="buy" element={<AdminBuy />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="events" element ={<ListKhuyenMai/>} />

                <Route path="orders" element={<StaffOrders />} />

                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="statistics" element={<AdminStatistics />} />
                <Route path="products" element={<AdminProducs />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="inventory" element={<StaffInventory />} />
                <Route path="combos" element={<AdminCombos />} />
                <Route path="thuonghieu" element={<AdminThuongHieu />} />
                <Route path="loaisanpham" element={<AdminLoaiSanPham />} />
                <Route path="hashtag" element={<AdminHashTag />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="purchase-orders/form" element={<PurchaseOrdersForm />} />
                <Route path="products/form" element={<ProductsForm />} />
                <Route path="shipping/form" element={<ShippingForm />} />
                <Route path="orders/form" element={<OrdersForm />} />
                <Route path="invoice/form" element={<InvoiceForm />} />
                <Route path="contact" element={<AdminContact />} />
                <Route path="messages" element={<AdminMessages />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </AppShell>

        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
