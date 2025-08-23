import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../auth/AuthContext";
import SupportChat from "@/components/default/SupportChat";
import Translate from "@/components/default/Translate";
import Search from "@/components/default/Search";
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
  RotateCcw,
  ShieldCheck,
  Newspaper,
  Phone,
  MessageCircle,
  Send,
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
  const [cartQuantity, setCartQuantity] = useState(0);
  const [favoritesQuantity, setFavoritesQuantity] = useState(0);
  const menuRef = useRef(null);
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoutInProgress = useRef(false);

  const navLinks = [
    { title: "TRANG CHỦ", path: "/", icon: <LayoutGrid className="h-5 w-5" /> },
    { title: "SẢN PHẨM", path: "/products", icon: <ShoppingBag className="h-5 w-5" /> },
    { title: "COMBO", path: "/combos", icon: <Package className="h-5 w-5" /> },
    { title: "GIẢM GIÁ", path: "/voucher", icon: <Ticket className="h-5 w-5" /> },
    { title: "TIN TỨC", path: "/blogs", icon: <Newspaper className="h-5 w-5" /> },
    { title: "LIÊN HỆ", path: "/contact", icon: <Mail className="h-5 w-5" /> },
  ];

  // Fetch cart data function
  const fetchCartData = useCallback(async () => {
    if (!isLoggedIn) {
      setCartQuantity(0);
      return;
    }

    const userID = localStorage.getItem("userId");
    if (!userID) {
      console.warn("No userID found in localStorage");
      setCartQuantity(0);
      return;
    }

    try {
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Cart/GioHangByKhachHang?id=${userID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const ctghSanPhamView = data.ctghSanPhamView;
      const ctghComboView = data.ctghComboView;

      const sanPhamQuantity = Array.isArray(ctghSanPhamView)
        ? ctghSanPhamView.reduce((sum, item) => sum + (item.soLuong || 0), 0)
        : 0;
      const comboQuantity = Array.isArray(ctghComboView)
        ? ctghComboView.reduce((sum, item) => sum + (item.soLuong || 0), 0)
        : 0;

      setCartQuantity(sanPhamQuantity + comboQuantity);
    } catch (error) {
      console.error("Error fetching cart data:", error);
      setCartQuantity(0);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu giỏ hàng.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [isLoggedIn, toast]);

  // Fetch favorites data function
  const fetchFavoritesData = useCallback(async () => {
    if (!isLoggedIn) {
      setFavoritesQuantity(0);
      return;
    }

    const userID = localStorage.getItem("userId");
    if (!userID) {
      console.warn("No userID found in localStorage");
      setFavoritesQuantity(0);
      return;
    }

    try {
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/YeuThich?maNguoiDung=${userID}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Filter favorites for the current user
      const userFavorites = Array.isArray(data)
        ? data.filter((item) => item.maNguoiDung === userID)
        : [];

      // Calculate total favorites (products + combos) for the current user
      const productFavorites = userFavorites.filter((item) => item.maSanPham).length;
      const comboFavorites = userFavorites.filter((item) => item.maCombo).length;

      setFavoritesQuantity(productFavorites + comboFavorites);
    } catch (error) {
      console.error("Error fetching favorites data:", error);
      setFavoritesQuantity(0);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu yêu thích.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [isLoggedIn, toast]);

  // Refresh favorites count when "favorites-updated" event is triggered
  useEffect(() => {
    const handleFavoritesUpdated = () => {
      fetchFavoritesData();
    };

    window.addEventListener("favorites-updated", handleFavoritesUpdated);
    return () => {
      window.removeEventListener("favorites-updated", handleFavoritesUpdated);
    };
  }, [fetchFavoritesData]);

  // Fetch cart and favorites data on login status change
  useEffect(() => {
    fetchCartData();
    fetchFavoritesData();
  }, [fetchCartData, fetchFavoritesData, isLoggedIn]);

  // Handle click outside user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;
    setIsUserMenuOpen(false);

    try {
      await logout();
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
      setCartQuantity(0);
      setFavoritesQuantity(0);
      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  }, [logout, navigate, toast]);

  return (
    <>
      {/* Top header bar */}
      <div className="bg-gray-800 text-white py-2">
        <div className="container mx-auto px-4 flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm hidden sm:inline">123 Hà Huy Tập, TP. Buôn Ma Thuột</span>
            </span>
            <span className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              <span className="text-sm hidden md:inline">0383 777 823</span>
            </span>
            <span className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              <span className="text-sm hidden lg:inline">hotronfashionhubvn@gmail.com</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <a href="https://zalo.me/0383777823" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5 hover:text-gray-300 transition-colors" />
            </a>
            <a href="https://t.me/miyaru2k5" target="_blank" rel="noopener noreferrer">
              <Send className="h-5 w-5 hover:text-gray-300 transition-colors" />
            </a>
            <a href="https://facebook.com/ultrastore" target="_blank" rel="noopener noreferrer">
              <Facebook className="h-5 w-5 hover:text-gray-300 transition-colors" />
            </a>
            <a href="https://instagram.com/ultrastore" target="_blank" rel="noopener noreferrer">
              <Instagram className="h-5 w-5 hover:text-gray-300 transition-colors" />
            </a>
            <a href="https://twitter.com/ultrastore" target="_blank" rel="noopener noreferrer">
              <Twitter className="h-5 w-5 hover:text-gray-300 transition-colors" />
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.gif" alt="FashionHub" className="h-32 w-auto max-w-[150px]" />
            </Link>
          </div>

          {/* Desktop Navigation */}
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
                <Search />
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Right side icons and menu */}
          <div className="flex items-center gap-4">
            {/* Mobile menu drawer */}
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
                              : "text-gray-600 hover:bg-gray-100"
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
                                : "text-gray-600 hover:bg-gray-100"
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
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <Package className="h-5 w-5" />
                            <span>Đơn hàng</span>
                          </Link>
                        </DrawerClose>
                        <DrawerClose asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-4 py-3 text-red-600 justify-start hover:bg-red-50"
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

            {/* Logged in user icons */}
            {isLoggedIn && (
              <>
                {/* Favorites */}
                <Link
                  to="/favorites"
                  className={cn(
                    "relative hover:text-crocus-600 transition-colors",
                    location.pathname === "/favorites" ? "text-crocus-600" : "text-gray-600"
                  )}
                >
                  <Heart className="h-5 w-5" />
                  {favoritesQuantity > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md">
                      {favoritesQuantity > 99 ? "99+" : favoritesQuantity}
                    </span>
                  )}
                </Link>

                {/* Shopping cart with quantity badge */}
                <Link
                  to="/user/cart"
                  className={cn(
                    "relative hover:text-crocus-600 transition-colors",
                    location.pathname === "/user/cart" ? "text-crocus-600" : "text-gray-600"
                  )}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartQuantity > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md">
                      {cartQuantity > 99 ? "99+" : cartQuantity}
                    </span>
                  )}
                </Link>

                {/* Messages */}
                <Link
                  to="/user/messages"
                  className={cn(
                    "relative hover:text-crocus-600 transition-colors",
                    location.pathname === "/user/messages" ? "text-crocus-600" : "text-gray-600"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                {/* User menu dropdown */}
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center hover-effect"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <User className="h-4 w-4" />
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Thông tin người dùng</h3>
                      <div className="space-y-2">
                        <Link
                          to="/user/profile"
                          className="flex items-center text-gray-700 hover:text-crocus-600 transition-colors p-2 rounded-md hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserCircle className="h-5 w-5 mr-2" />
                          <span>Hồ sơ</span>
                        </Link>
                        <Link
                          to="/user/orders"
                          className="flex items-center text-gray-700 hover:text-crocus-600 transition-colors p-2 rounded-md hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Package className="h-5 w-5 mr-2" />
                          <span>Đơn hàng</span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-600 flex items-center justify-start p-2 hover:bg-red-50"
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

            {/* Login button for non-logged in users */}
            {!isLoggedIn && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" /> ĐĂNG NHẬP
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative translate-y-5">
            {/* Logo and description */}
            <div>
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/logo.gif"
                  alt="FashionHub"
                  className="h-32 w-auto transform -translate-y-7"
                />
              </Link>
              <p className="text-gray-700 text-xl transform -translate-y-10">
                Mang đến cho bạn những xu hướng thời trang mới nhất 2025.
              </p>
              <Translate />
            </div>

            {/* Shopping links */}
            <div className="hidden md:block">
              <h3 className="font-bold text-2xl mb-4 text-crocus-700">Mua sắm</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <LayoutGrid className="h-5 w-5 inline mr-2" /> Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <ShoppingBag className="h-5 w-5 inline mr-2" /> Sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to="/combos" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <Package className="h-5 w-5 inline mr-2" /> Combo
                  </Link>
                </li>
                <li>
                  <Link to="/Guarantee" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <RotateCcw className="h-5 w-5 inline mr-2" /> Chính sách đổi trả
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account links */}
            <div className="hidden md:block">
              <h3 className="font-bold text-2xl mb-4 text-crocus-700">Tài khoản</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/user/profile" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <UserCircle className="h-5 w-5 inline mr-2" /> Hồ sơ
                  </Link>
                </li>
                <li>
                  <Link to="/user/orders" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <Package className="h-5 w-5 inline mr-2" /> Đơn hàng
                  </Link>
                </li>
                <li>
                  <Link to="/user/cart" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <ShoppingCart className="h-5 w-5 inline mr-2" /> Giỏ hàng
                  </Link>
                </li>
                <li>
                  <Link to="/Security" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <ShieldCheck className="h-5 w-5 inline mr-2" /> Chính sách bảo mật
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact and social links */}
            <div>
              <h3 className="font-bold text-2xl mb-4 text-crocus-700">Kết nối với chúng tôi</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/contact" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <Mail className="h-5 w-5 inline mr-2" /> Liên hệ
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <MapPin className="h-5 w-5 inline mr-2" /> Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link to="/blogs" className="text-gray-700 hover:text-crocus-500 text-xl transition-colors">
                    <Newspaper className="h-5 w-5 inline mr-2" /> Tin tức
                  </Link>
                </li>
              </ul>
              <div className="flex space-x-4 mt-6">
                <a
                  href="https://facebook.com/Ultrastore"
                  className="text-gray-700 hover:text-crocus-500 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-7 w-7" />
                </a>
                <a
                  href="https://instagram.com/ultrasstore"
                  className="text-gray-700 hover:text-crocus-500 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-7 w-7" />
                </a>
                <a
                  href="https://twitter.com/ultrastore"
                  className="text-gray-700 hover:text-crocus-500 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-7 w-7" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <SupportChat />
      </footer>
    </>
  );
};

export default UserLayout;