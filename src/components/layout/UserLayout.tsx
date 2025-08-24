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
  ChevronUp,
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

// Enhanced Grid Loader FX Class với auto cleanup và kích thước chính xác
class UserLayoutGridLoaderFx {
  el: HTMLElement;
  items: NodeListOf<HTMLElement>;
  effects: any;

  constructor(el: HTMLElement) {
    this.el = el;
    this.items = this.el.querySelectorAll('.user-grid__item');
    this.effects = {
      'Shu': {
        lineDrawing: true,
        animeLineDrawingOpts: {
          duration: 1714,
          delay: function(t: any, i: number) {
            return i * 114;
          },
          easing: 'easeInOutSine',
          strokeDashoffset: [this.setDashoffset, 0],
          opacity: [
            { value: [0, 1] },
            { value: [1, 0], duration: 571, easing: 'linear', delay: 1143 }
          ]
        },
        animeOpts: {
          duration: 1714,
          easing: [0.2, 1, 0.3, 1],
          delay: function(t: any, i: number) {
            return i * 114 + 1714;
          },
          opacity: {
            value: [0, 1],
            easing: 'linear'
          },
          scale: [0.5, 1]
        }
      }
    };
  }

  setDashoffset(path: SVGPathElement) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length + ' ' + length;
    path.style.strokeDashoffset = String(length);
    return length;
  }

  _render(effect: string) {
    this._resetStyles();
    
    const effectSettings = this.effects[effect];

    if (effectSettings.lineDrawing) {
      Array.from(this.items).forEach((item, index) => {
        // Tạo SVG container với kích thước và positioning chính xác
        const svgContainer = document.createElement('div');
        svgContainer.className = 'shu-effect-container';
        svgContainer.setAttribute('data-shu-index', index.toString());
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const itemW = item.offsetWidth;
        const itemH = item.offsetHeight;
        const padding = 0; // Không cần padding vì SVG sẽ match chính xác item
        
        // Lấy position chính xác từ getBoundingClientRect
        const itemRect = item.getBoundingClientRect();
        const containerRect = this.el.getBoundingClientRect();
        
        // Tính toán position relative đến container
        const itemLeft = itemRect.left - containerRect.left + this.el.scrollLeft;
        const itemTop = itemRect.top - containerRect.top + this.el.scrollTop;
        
        // Position SVG container chính xác overlap item
        svgContainer.style.position = 'absolute';
        svgContainer.style.left = itemLeft + 'px';
        svgContainer.style.top = itemTop + 'px';
        svgContainer.style.width = itemW + 'px';
        svgContainer.style.height = itemH + 'px';
        svgContainer.style.pointerEvents = 'none';
        svgContainer.style.zIndex = '100'; // Cao hơn item content
        
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.setAttribute('class', 'user-grid__deco');

        // Tạo path viền với kích thước match item
        const borderRadius = 16;
        const pathData = `
          M ${borderRadius},0 
          L ${itemW - borderRadius},0 
          Q ${itemW},0 ${itemW},${borderRadius}
          L ${itemW},${itemH - borderRadius}
          Q ${itemW},${itemH} ${itemW - borderRadius},${itemH}
          L ${borderRadius},${itemH}
          Q 0,${itemH} 0,${itemH - borderRadius}
          L 0,${borderRadius}
          Q 0,0 ${borderRadius},0 Z
        `;
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke-dashoffset', String(this.setDashoffset(path)));
        
        svg.appendChild(path);
        svgContainer.appendChild(svg);
        
        // Thêm vào grid container
        this.el.appendChild(svgContainer);
      });

      // Animate SVG paths với auto cleanup
      setTimeout(() => {
        const paths = this.el.querySelectorAll('.user-grid__deco > path');
        
        paths.forEach((path, i) => {
          const pathElement = path as SVGPathElement;
          
          setTimeout(() => {
            pathElement.style.strokeDashoffset = '0';
            pathElement.style.transition = 'stroke-dashoffset 1.714s ease-in-out';
            
            setTimeout(() => {
              pathElement.style.opacity = '0';
              pathElement.style.transition = 'opacity 0.571s linear';
              
              // Auto cleanup - xóa SVG sau khi animation hoàn thành
              setTimeout(() => {
                const container = pathElement.closest('.shu-effect-container');
                if (container) {
                  container.remove();
                }
              }, 571); // Sau khi fade out hoàn thành
            }, 1143);
          }, i * 114);
        });
      }, 143);
    }

    // Animate items (chỉ animate content bên trong)
    Array.from(this.items).forEach((item, i) => {
      const contentDiv = item.querySelector('.item-content') as HTMLElement;
      if (contentDiv) {
        contentDiv.style.opacity = '0';
        contentDiv.style.transform = 'scale(0.5)';
        setTimeout(() => {
          contentDiv.style.opacity = '1';
          contentDiv.style.transform = 'scale(1)';
          contentDiv.style.transition = 'opacity 1.714s ease, transform 1.714s cubic-bezier(0.2,1,0.3,1)';
        }, i * 114 + 1714);
      }
    });
  }

  _resetStyles() {
    Array.from(this.items).forEach((item) => {
      const contentDiv = item.querySelector('.item-content') as HTMLElement;
      if (contentDiv) {
        contentDiv.style.opacity = '0';
        contentDiv.style.transform = 'none';
        contentDiv.style.transition = '';
      }
    });

    // Xóa tất cả SVG containers
    const containers = this.el.querySelectorAll('.shu-effect-container');
    containers.forEach(container => {
      container.remove();
    });
  }
}

const UserLayout = () => {
  const { isLoggedIn, userName, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [favoritesQuantity, setFavoritesQuantity] = useState(0);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasShownIntro, setHasShownIntro] = useState(false);
  const menuRef = useRef(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<UserLayoutGridLoaderFx | null>(null);
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

  // Layout calculation - ĐIỀU CHỈNH KHOẢNG CÁCH
  const calculateColumnLayout = () => {
    const columnGap = 0; // Khoảng cách giữa các item theo chiều dọc
    const itemWidth = 290; // Chiều rộng của mỗi item
    const containerWidth = 1200; // GIẢM từ 1400 xuống 1200 để các cột gần nhau hơn
    const columnWidth = containerWidth / 4; // Mỗi cột sẽ rộng 300px thay vì 350px
    
    const itemHeights = [
      310, 600, 350, 290,
      400, 370, 400, 600,
      600, 410, 270, 450,
      370, 290, 600, 270
    ];
    
    const positions = [];
    const columnYPositions = [120, 120, 120, 120];
    
    for (let i = 0; i < 16; i++) {
      const columnIndex = i % 4;
      const leftPosition = (columnIndex * columnWidth) + ((columnWidth - itemWidth) / 2);
      const leftPercentage = (leftPosition / containerWidth) * 100;
      
      positions.push({
        left: `${leftPercentage}%`,
        top: `${columnYPositions[columnIndex]}px` ,
        height: itemHeights[i]
      });
      
      columnYPositions[columnIndex] += itemHeights[i] + columnGap;
    }
    
    return { positions, heights: itemHeights };
  };

  const [layoutData] = useState(calculateColumnLayout());

  const getUserLayoutPosition = (index: number) => {
    return layoutData.positions[index] || layoutData.positions[0];
  };

  const getUserLayoutHeights = () => {
    return layoutData.heights;
  };

  const [userGridHeights] = useState(getUserLayoutHeights());

  // Check if should show fullscreen mode based on URL
  useEffect(() => {
    const currentUrl = window.location.hostname;
    const currentPort = window.location.port;
    
    if ((currentUrl === "localhost" && currentPort === "8080") || currentUrl === "fashionhub.name.vn") {
      const hasSeenIntro = sessionStorage.getItem('fashionhub-intro-seen');
      if (!hasSeenIntro) {
        setIsFullscreenMode(true);
        sessionStorage.setItem('fashionhub-intro-seen', 'true');
      }
    }
  }, []);

  // Initialize Shu animation when in fullscreen mode
  useEffect(() => {
    if (isFullscreenMode && gridRef.current && !hasShownIntro) {
      setHasShownIntro(true);
      setTimeout(() => {
        if (gridRef.current) {
          loaderRef.current = new UserLayoutGridLoaderFx(gridRef.current);
          loaderRef.current._render('Shu');
        }
      }, 500);
    } else if (isFullscreenMode && gridRef.current && hasShownIntro) {
      setTimeout(() => {
        if (gridRef.current) {
          loaderRef.current = new UserLayoutGridLoaderFx(gridRef.current);
          loaderRef.current._render('Shu');
        }
      }, 300);
    }
  }, [isFullscreenMode, hasShownIntro]);

  // Enhanced CSS với structure mới
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Shu Effect Container */
      .shu-effect-container {
        position: absolute !important;
        pointer-events: none !important;
        z-index: 100 !important;
      }

      /* SVG Animation Styles */
      .user-grid__deco {
        position: absolute !important;
        pointer-events: none !important;
        z-index: 100 !important;
      }

      .user-grid__deco path {
        fill: none !important;
        stroke: #e6629a !important;
        stroke-width: 3px !important;
        stroke-linecap: round !important;
        stroke-linejoin: round !important;
        filter: drop-shadow(0 0 8px rgba(230, 98, 154, 0.6)) !important;
        opacity: 1 !important;
      }

      /* Grid Item Container - Trong suốt để không che hiệu ứng */
      .user-grid__item {
        position: absolute;
        overflow: visible;
        width: 290px;
        z-index: 10 !important;
        background: transparent !important; /* Trong suốt */
        border: none !important;
        box-shadow: none !important;
      }

      .user-grid__item.clickable {
        cursor: pointer;
      }

      .user-grid__item.clickable:hover .item-content {
        transform: scale(1.05) !important;
      }

      .user-grid__item.non-clickable:hover .item-content {
        transform: scale(1.02) !important;
      }

      /* Content bên trong với nền trắng */
      .item-content {
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
        border-radius: 12px;
        backdrop-filter: blur(12px);
        border: 2px solid rgba(255,255,255,0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #4a5568;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        padding: 14px;
        text-align: center;
        gap: 10px;
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.3s ease;
        z-index: 50;
      }

      .item-content.non-clickable {
        background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6));
        border: 2px solid rgba(255,255,255,0.3);
      }

      .fullscreen-grid {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 1000;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
      }

      .fullscreen-title {
        font-size: 4rem;
        font-weight: bold;
        color: white;
        text-align: center;
        margin-bottom: 60px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        opacity: 0;
        animation: titleFadeIn 1s ease forwards;
        animation-delay: 0.5s;
        z-index: 20;
      }

      @keyframes titleFadeIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Grid container - ĐIỀU CHỈNH WIDTH VÀ POSITIONING */
      .user-layout-grid {
        flex: 1;
        width: 100%;
        max-width: 1150px; /* GIẢM từ 1400px xuống 1200px */
        position: relative;
        height: 2000px;
        margin: 0 auto;
        padding: 0 50px; /* TĂNG padding để center tốt hơn */
        overflow: visible;
        z-index: 30;
      }

      .layout-transition {
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #667eea, #764ba2);
        z-index: 2000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s ease;
      }

      .transition-overlay.active {
        opacity: 1;
      }

      .toggle-button {
        position: fixed;
        top: 50%;
        right: 30px;
        transform: translateY(-50%);
        z-index: 1001;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border: 2px solid rgba(139, 92, 246, 0.3);
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
      }

      .toggle-button:hover {
        background: rgba(139, 92, 246, 0.9);
        color: white;
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 12px 30px rgba(139, 92, 246, 0.5);
      }

      .header-toggle-button {
        position: absolute;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        background: rgba(139, 92, 246, 0.9);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .header-toggle-button:hover {
        background: rgba(139, 92, 246, 1);
        transform: translateX(-50%) scale(1.1);
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.5);
      }

      @media (max-width: 1200px) {
        .user-layout-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          height: auto;
          padding: 20px;
        }
        
        .user-layout-grid .user-grid__item {
          position: static !important;
          width: 100% !important;
          max-width: 290px;
          justify-self: center;
        }

        .user-layout-grid .item-content {
          position: static !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          width: 100%;
          height: 250px;
        }
      }

      @media (max-width: 768px) {
        .fullscreen-title {
          font-size: 2.5rem;
          margin-bottom: 40px;
        }

        .user-layout-grid {
          grid-template-columns: 1fr;
          gap: 20px;
          padding: 16px;
        }
      }

      @media (max-width: 480px) {
        .fullscreen-title {
          font-size: 2rem;
          margin-bottom: 30px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch functions (giữ nguyên tất cả)
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

      const userFavorites = Array.isArray(data)
        ? data.filter((item) => item.maNguoiDung === userID)
        : [];

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

  useEffect(() => {
    const handleFavoritesUpdated = () => {
      fetchFavoritesData();
    };

    window.addEventListener("favorites-updated", handleFavoritesUpdated);
    return () => {
      window.removeEventListener("favorites-updated", handleFavoritesUpdated);
    };
  }, [fetchFavoritesData]);

  useEffect(() => {
    fetchCartData();
    fetchFavoritesData();
  }, [fetchCartData, fetchFavoritesData, isLoggedIn]);

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

  const toggleLayout = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setIsFullscreenMode(!isFullscreenMode);
      setIsTransitioning(false);
      
      if (!isFullscreenMode && gridRef.current) {
        setTimeout(() => {
          if (gridRef.current) {
            loaderRef.current = new UserLayoutGridLoaderFx(gridRef.current);
            loaderRef.current._render('Shu');
          }
        }, 300);
      }
    }, 500);
  };

  const gridItems = [
    { type: 'clickable', content: 'LOGO', link: '/', icon: <LayoutGrid className="h-5 w-5" /> },
    { type: 'clickable', content: 'TRANG CHỦ', link: '/', icon: <LayoutGrid className="h-5 w-5" /> },
    { type: 'clickable', content: 'SẢN PHẨM', link: '/products', icon: <ShoppingBag className="h-5 w-5" /> },
    { type: 'clickable', content: 'COMBO', link: '/combos', icon: <Package className="h-5 w-5" /> },
    { type: 'clickable', content: 'GIẢM GIÁ', link: '/voucher', icon: <Ticket className="h-5 w-5" /> },
    { type: 'clickable', content: 'TIN TỨC', link: '/blogs', icon: <Newspaper className="h-5 w-5" /> },
    { type: 'clickable', content: 'LIÊN HỆ', link: '/contact', icon: <Mail className="h-5 w-5" /> },
    { type: 'clickable', content: 'GIỎ HÀNG', link: '/user/cart', icon: <ShoppingCart className="h-5 w-5" /> },
    { type: 'clickable', content: 'YÊU THÍCH', link: '/favorites', icon: <Heart className="h-5 w-5" /> },
    { type: 'clickable', content: 'TÀI KHOẢN', link: '/user/profile', icon: <User className="h-5 w-5" /> },
    { type: 'non-clickable', content: 'THỜI TRANG', link: '', icon: null },
    { type: 'non-clickable', content: 'PHONG CÁCH', link: '', icon: null },
    { type: 'clickable', content: 'ĐĂNG NHẬP', link: '/auth/login', icon: <LogIn className="h-5 w-5" /> },
    { type: 'non-clickable', content: 'XU HƯỚNG', link: '', icon: null },
    { type: 'non-clickable', content: 'CHẤT LƯỢNG', link: '', icon: null },
    { type: 'clickable', content: 'VỀ CHÚNG TÔI', link: '/about', icon: <MapPin className="h-5 w-5" /> },
  ];

  if (isFullscreenMode) {
    return (
      <>
        {/* Transition overlay */}
        <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`} />
        
        {/* Fullscreen grid layout */}
        <div className="fullscreen-grid" ref={gridRef}>
          {/* Title */}
          <h1 className="fullscreen-title">
            Chào mừng bạn đến với cửa hàng FashionHub
          </h1>
          
          {/* Grid container */}
          <div className="user-layout-grid">
            {gridItems.map((item, index) => {
              const position = getUserLayoutPosition(index);
              return (
                <div
                  key={index}
                  className={`user-grid__item ${item.type}`}
                  style={{
                    left: position.left,
                    top: position.top,
                    height: `${position.height}px`,
                  }}
                  onClick={() => {
                    if (item.type === 'clickable' && item.link) {
                      navigate(item.link);
                    }
                  }}
                >
                  {/* Div thông tin bên trong với nền trắng */}
                  <div className={`item-content ${item.type}`}>
                    {item.icon && (
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-semibold">
                      {item.content}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Toggle button */}
          <div className="toggle-button" onClick={toggleLayout}>
            <ChevronUp className="h-6 w-6" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Transition overlay */}
      <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`} />
      
      {/* Normal layout - giữ nguyên tất cả */}
      <div className="layout-transition">
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 relative">
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
                  <Search />
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
                    {favoritesQuantity > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md">
                        {favoritesQuantity > 99 ? "99+" : favoritesQuantity}
                      </span>
                    )}
                  </Link>

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

                  <Link
                    to="/user/messages"
                    className={cn(
                      "relative hover:text-crocus-600 transition-colors",
                      location.pathname === "/user/messages" ? "text-crocus-600" : "text-gray-600"
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

              {!isLoggedIn && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth/login">
                    <LogIn className="h-4 w-4 mr-2" /> ĐĂNG NHẬP
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          <div className="header-toggle-button" onClick={toggleLayout}>
            <ChevronDown className="h-5 w-5" />
          </div>
        </header>

        <main className="flex-1" style={{ backgroundColor: '#F3E6F8' }}>
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
                <p className="text-gray-700 text-xl transform -translate-y-10">
                  Mang đến cho bạn những xu hướng thời trang mới nhất 2025.
                </p>
                <Translate />
              </div>

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
      </div>
    </>
  );
};

export default UserLayout;