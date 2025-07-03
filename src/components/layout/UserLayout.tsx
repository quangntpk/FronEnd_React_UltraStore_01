import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import {
  Menu,
  ShoppingCart,
  User,
  LogIn,
  LogOut,
  Heart,
  MessageSquare,
  Package,
  LayoutGrid,
  Mail,
  ShoppingBag,
  UserCircle,
  MapPin,
  Instagram,
  Twitter,
  Facebook,
  ChevronDown,
  Ticket,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

const UserLayout = () => {
  const { isLoggedIn, userName, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoutInProgress = useRef(false);

  const navLinks = [
    { title: "Trang chủ", path: "/", icon: <LayoutGrid className="h-5 w-5" /> },
    { title: "Sản phẩm", path: "/products", icon: <ShoppingBag className="h-5 w-5" /> },
    { title: "Combo", path: "/combos", icon: <Package className="h-5 w-5" /> },
    { title: "Khuyến mãi", path: "/voucher", icon: <Ticket className="h-5 w-5" /> },
    { title: "Bài viết", path: "/blogs", icon: <MessageSquare className="h-5 w-5" /> },
    { title: "Liên hệ", path: "/contact", icon: <Mail className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    // Ngăn chặn multiple logout calls
    if (logoutInProgress.current) return;
    
    logoutInProgress.current = true;
    setIsUserMenuOpen(false);

    try {
      await logout();

      // Chỉ hiện toast một lần
      toast({
        title: "Đăng xuất thành công 🎉",
        description: "Bạn đã đăng xuất khỏi tài khoản.",
        duration: 3000,
        className: "bg-green-500 text-white border border-green-700 shadow-lg",
        action: (
          <Button variant="outline" className="bg-white text-green-500 hover:bg-green-100 border-green-500">
            Đóng
          </Button>
        ),
      });

      // Delay navigate để user nhìn thấy toast
      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 500);

    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
      // Reset flag sau khi hoàn thành
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  }, [logout, navigate, toast]);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.gif" alt="FashionHub" className="h-32 w-auto max-w-[150px]" />
            </Link>
          </div>
          <nav className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.path}>
                    <Link to={link.path}>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          location.pathname === link.path && "bg-accent text-accent-foreground",
                          "px-4 py-2"
                        )}
                      >
                        {link.icon}
                        <span className="ml-2">{link.title}</span>
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
          <div className="flex items-center gap-4">
            <Drawer>
              <DrawerTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="p-4 pt-0">
                  <div className="flex flex-col gap-2 py-4">
                    {navLinks.map((link) => (
                      <DrawerClose key={link.path} asChild>
                        <Link
                          to={link.path}
                          className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-md",
                            location.pathname === link.path
                              ? "bg-crocus-100 text-crocus-700 font-medium"
                              : "text-gray-600"
                          )}
                        >
                          {link.icon}
                          <span>{link.title}</span>
                        </Link>
                      </DrawerClose>
                    ))}
                    {isLoggedIn && (
                      <>
                        <DrawerClose asChild>
                          <Link
                            to="/user/profile"
                            className={cn(
                              "flex items-center gap-2 px-4 py-3 rounded-md",
                              location.pathname === "/user/profile"
                                ? "bg-crocus-100 text-crocus-700 font-medium"
                                : "text-gray-600"
                            )}
                          >
                            <UserCircle className="h-5 w-5" />
                            <span>Hồ sơ</span>
                          </Link>
                        </DrawerClose>
                        <DrawerClose asChild>
                          <Link
                            to="/user/orders"
                            className={cn(
                              "flex items-center gap-2 px-4 py-3 rounded-md",
                              location.pathname === "/user/orders"
                                ? "bg-crocus-100 text-crocus-700 font-medium"
                                : "text-gray-600"
                            )}
                          >
                            <Package className="h-5 w-5" />
                            <span>Đơn hàng</span>
                          </Link>
                        </DrawerClose>
                        <DrawerClose asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-4 py-3 text-red-600"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-5 w-5" />
                            <span>Đăng xuất</span>
                          </Button>
                        </DrawerClose>
                      </>
                    )}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
            {isLoggedIn && (
              <>
                <Link
                  to="/favorites"
                  className={cn(
                    "relative hover:text-crocus-600 transition-colors",
                    location.pathname === "/favorites" ? "text-crocus-600" : "text-gray-600"
                  )}
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link
                  to="/user/cart"
                  className={cn(
                    "relative hover:text-crocus-600 transition-colors",
                    location.pathname === "/user/cart" ? "text-crocus-600" : "text-gray-600"
                  )}
                >
                  <ShoppingCart className="h-5 w-5" />
                </Link>
                <Link
                  to="/user/messages"
                  className={cn(
                    "relative hover:text-crocus-600 transition-colors",
                    location.pathname === "/messages" ? "text-crocus-600" : "text-gray-600"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center hover-effect"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Xin chào {userName || "Khách"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4"
                    >
                      <h3 className="font-semibold text-gray-800 mb-2">Thông tin người dùng</h3>
                      <div className="space-y-2">
                        <Link
                          to="/user/profile"
                          className="flex items-center text-gray-700 hover:text-crocus-600"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserCircle className="h-5 w-5 mr-2" />
                          <span>Hồ sơ</span>
                        </Link>
                        <Link
                          to="/user/orders"
                          className="flex items-center text-gray-700 hover:text-crocus-600"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Package className="h-5 w-5 mr-2" />
                          <span>Đơn hàng</span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-600 flex items-center justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Đăng xuất
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {!isLoggedIn && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" /> Đăng nhập
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4">
          <Outlet />
        </div>
      </main>
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative translate-y-5">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/logo.gif"
                  alt="FashionHub"
                  className="h-32 w-auto transform -translate-y-7"
                />
              </Link>
              <p className="text-gray-600 transform -translate-y-10">
                Mang đến cho bạn những xu hướng thời trang mới nhất 2025.
              </p>
            </div>
            <div className="hidden md:block">
              <h3 className="font-bold text-lg mb-4 text-crocus-700">Mua sắm</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-crocus-500">
                    <LayoutGrid className="h-4 w-4 inline mr-2" /> Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-600 hover:text-crocus-500">
                    <ShoppingBag className="h-4 w-4 inline mr-2" /> Sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to="/combos" className="text-gray-600 hover:text-crocus-500">
                    <Package className="h-4 w-4 inline mr-2" /> Combo
                  </Link>
                </li>
              </ul>
            </div>
            <div className="hidden md:block">
              <h3 className="font-bold text-lg mb-4 text-crocus-700">Tài khoản</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/user/profile" className="text-gray-600 hover:text-crocus-500">
                    <UserCircle className="h-4 w-4 inline mr-2" /> Hồ sơ
                  </Link>
                </li>
                <li>
                  <Link to="/user/orders" className="text-gray-600 hover:text-crocus-500">
                    <Package className="h-4 w-4 inline mr-2" /> Đơn hàng
                  </Link>
                </li>
                <li>
                  <Link to="/user/cart" className="text-gray-600 hover:text-crocus-500">
                    <ShoppingCart className="h-4 w-4 inline mr-2" /> Giỏ hàng
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-crocus-700">Kết nối với chúng tôi</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-crocus-500">
                    <Mail className="h-4 w-4 inline mr-2" /> Liên hệ
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-crocus-500">
                    <MapPin className="h-4 w-4 inline mr-2" /> Về chúng tôi
                  </Link>
                </li>
              </ul>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-600 hover:text-crocus-500">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-600 hover:text-crocus-500">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-600 hover:text-crocus-500">
                  <Twitter className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default UserLayout;