import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, Component, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/default/HeroSection";
import Newsletter from "@/components/default/Newsletter";
import Features from "@/components/default/Features";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CartItem } from "@/types/cart";
import Swal from "sweetalert2";

// Định nghĩa interface cho dữ liệu từ API (Products)
interface ApiProduct {
  id: string;
  name: string;
  thuongHieu: string;
  loaiSanPham: string;
  kichThuoc: string[];
  soLuong: number;
  donGia: number;
  moTa: string | null;
  chatLieu: string;
  mauSac: string[];
  hinh: string[];
  ngayTao: string;
  trangThai: number;
  soLuongDaBan: number;
  hot: boolean;
}

// Định nghĩa interface cho dữ liệu từ API (Combos)
interface ApiComboSanPham {
  idSanPham: string;
  name: string;
  thuongHieu: string;
  loaiSanPham: string;
  kichThuoc: string[];
  soLuong: number;
  donGia: number;
  moTa: string | null;
  chatLieu: string;
  mauSac: string[];
  hinh: string[];
  ngayTao: string;
  trangThai: number;
}

interface ApiCombo {
  maCombo: number;
  name: string;
  hinhAnh: string;
  ngayTao: string;
  trangThai: number;
  sanPhams: ApiComboSanPham[];
  moTa: string;
  gia: number;
  soLuong: number;
}

// Interface cho dữ liệu người dùng
interface UserData {
  maNguoiDung?: string;
  hoTen?: string;
}

// Interface cho Product
interface Product {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  price: number;
  sizes: string[];
  colors: string[];
  averageRating: number;
  commentCount: number;
  isFavorite: boolean;
  hot: boolean;
  likedId?: string;
}

// Interface cho Combo
interface Combo {
  id: number;
  name: string;
  description: string;
  imageSrc: string;
  price: number;
  products: string[];
  colors: string[];
  isFavorite: boolean;
  likedId?: string;
  savings: number;
  savingsPercentage: number;
  productCount: number;
}

// Hàm hiển thị thông báo SweetAlert2
const showNotification = (message: string, type: "success" | "error" | "warning") => {
  return Swal.fire({
    title: type === "error" ? "Lỗi!" : type === "warning" ? "Cảnh báo!" : "Thành công!",
    text: message,
    icon: type,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-500 p-4">
          <p>Đã xảy ra lỗi khi hiển thị combo.</p>
          <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
            Thử lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Component cho ProductCard
const ProductCard = ({
  product,
  index,
  toggleFavorite,
}: {
  product: Product;
  index: number;
  toggleFavorite: (productId: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleBuyNow = () => {
    const cartItem: CartItem = {
      id: parseInt(product.id),
      name: product.name,
      image: product.imageSrc,
      price: product.price,
      quantity: 1,
      type: "product",
    };
    console.log("Đã thêm vào giỏ hàng:", cartItem);
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} đã được thêm vào giỏ hàng của bạn.`,
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <Card className="overflow-hidden group">
        <div className="relative aspect-square">
          <Link to={`/products/${product.id}`}>
            <img
              src={
                product.imageSrc
                  ? `data:image/jpeg;base64,${product.imageSrc}`
                  : "/placeholder-image.jpg"
              }
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          {product.hot && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              Đang bán chạy
            </Badge>
          )}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/80 hover:bg-white"
            onClick={() => toggleFavorite(product.id)}
            aria-label={product.isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart
              className={`h-5 w-5 ${product.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </Button>
        </div>
        <CardContent className="p-4">
          <Link to={`/products/${product.id}`}>
            <h3 className="font-medium hover:text-crocus-600 transition-colors">{product.name}</h3>
          </Link>
          <div className="flex justify-between items-center mt-2">
            <p className="font-semibold">{product.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</p>
            <div className="flex items-center gap-1" aria-label={`Đánh giá ${product.averageRating} sao`}>
              {[...Array(5)].map((_, i) => {
                if (i < Math.floor(product.averageRating)) {
                  return <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
                } else if (i === Math.floor(product.averageRating) && product.averageRating % 1 >= 0.5) {
                  return (
                    <Star
                      key={i}
                      className="w-4 h-4"
                      style={{
                        background: "linear-gradient(90deg, #FBBF24 50%, #D1D5DB 50%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                        fill: "url(#half-star-gradient)",
                      }}
                    />
                  );
                } else {
                  return <Star key={i} className="w-4 h-4 text-gray-300" />;
                }
              })}
              <span className="text-sm text-gray-600">({product.commentCount})</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.colors.slice(0, 3).map((color) => (
              <span
                key={color}
                className="inline-block w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: `#${color}` }}
                title={`Màu #${color}`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.sizes.slice(0, 3).map((size) => (
              <span key={size} className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full">
                {size}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to={`/products/${product.id}`}>Chi tiết</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-crocus-500 hover:bg-crocus-600"
              onClick={handleBuyNow}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Mua ngay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component cho ComboCard
const ComboCard = ({
  combo,
  index,
  toggleFavorite,
}: {
  combo: Combo;
  index: number;
  toggleFavorite: (comboId: number) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleBuyNow = () => {
    const cartItem: CartItem = {
      id: combo.id,
      name: combo.name,
      image: combo.imageSrc,
      price: combo.price,
      quantity: 1,
      type: "combo",
    };
    console.log("Đã thêm vào giỏ hàng:", cartItem);
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${combo.name} đã được thêm vào giỏ hàng của bạn.`,
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <Card className="overflow-hidden group">
        <div className="relative aspect-video bg-gray-100">
          <Link to={`/combos/${combo.id}`}>
            <img
              src={
                combo.imageSrc
                  ? `data:image/jpeg;base64,${combo.imageSrc}`
                  : "/placeholder-image.jpg"
              }
              alt={combo.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/80 hover:bg-white"
            onClick={() => toggleFavorite(combo.id)}
            aria-label={combo.isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart
              className={`h-5 w-5 ${combo.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <span className="inline-block bg-crocus-500 text-white px-2 py-1 rounded text-xs font-medium">
              {combo.productCount} Sản phẩm
            </span>
          </div>
        </div>
        <CardContent className="p-4">
          <Link to={`/combos/${combo.id}`}>
            <h3 className="font-medium hover:text-crocus-600 transition-colors">{combo.name}</h3>
          </Link>
          <div className="flex justify-between items-center mt-1">
            <div>
              <p className="font-semibold">
                {combo.price != null ? combo.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) : '0'} VND
              </p>
              <p className="text-green-600 font-medium">
                Tiết Kiệm {combo.savings.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND ({combo.savingsPercentage}% off)
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {combo.colors.slice(0, 3).map((color) => (
              <span
                key={color}
                className="inline-block w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: `#${color}` }}
                title={`Màu #${color}`}
              />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to={`/combos/${combo.id}`}>Chi tiết</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-crocus-500 hover:bg-crocus-600"
              onClick={handleBuyNow}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Mua ngay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorCombos, setErrorCombos] = useState<string | null>(null);

  const defaultCombo: Combo = {
    id: 0,
    name: "Không có tên",
    description: "Không có mô tả",
    imageSrc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3C/svg%3E",
    price: 0,
    products: [],
    colors: [],
    isFavorite: false,
    savings: 0,
    savingsPercentage: 0,
    productCount: 0,
  };

  const transformProductApiData = (apiData: ApiProduct[], commentData: any[], yeuThichData: any[]): Product[] => {
    return apiData.map((item) => {
      const baseProductId = item.id.split("_")[0] || item.id;
      const productComments = commentData.filter(
        (comment) => comment?.maSanPham === baseProductId && comment?.trangThai === 1
      );
      const totalRating = productComments.reduce(
        (sum: number, comment: any) => sum + (comment?.danhGia || 0),
        0
      );
      const averageRating = productComments.length > 0 ? totalRating / productComments.length : 0;
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = userData?.maNguoiDung;
      const userFavorite = yeuThichData.find(
        (yeuThich) => yeuThich?.maSanPham === baseProductId && yeuThich?.maNguoiDung === currentUserId
      );

      return {
        id: item.id,
        name: item.name || "Không có tên",
        description: item.moTa || `Thương hiệu: ${item.thuongHieu || "Không xác định"} <br/> Chất liệu: ${item.chatLieu || "Không xác định"}`,
        imageSrc: item.hinh[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3C/svg%3E",
        price: item.donGia || 0,
        sizes: item.kichThuoc || [],
        colors: item.mauSac || [],
        averageRating,
        commentCount: productComments.length,
        isFavorite: !!userFavorite,
        hot: item.hot || false,
        likedId: userFavorite?.maYeuThich,
      };
    });
  };

  const transformComboApiData = (apiData: ApiCombo[], yeuThichData: any[]): Combo[] => {
    return apiData.map((item) => {
      if (!item || typeof item !== 'object') {
        console.warn('Invalid combo item:', item);
        return defaultCombo;
      }
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = userData?.maNguoiDung;
      const userFavorite = yeuThichData.find(
        (yeuThich) => yeuThich?.maCombo === item.maCombo && yeuThich?.maNguoiDung === currentUserId
      );
      const colors = Array.isArray(item.sanPhams)
        ? [...new Set(item.sanPhams.flatMap((p) => p.mauSac || []))]
        : [];
      const originalPrice = Array.isArray(item.sanPhams)
        ? item.sanPhams.reduce((sum, p) => sum + (p.donGia || 0), 0)
        : 0;
      const savings = originalPrice - (item.gia || 0);
      const savingsPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
      const productCount = Array.isArray(item.sanPhams) ? item.sanPhams.length : 0;

      return {
        id: item.maCombo || 0,
        name: item.name || "Không có tên",
        description: item.moTa || "Không có mô tả",
        imageSrc: item.hinhAnh || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3C/svg%3E",
        price: item.gia || 0,
        products: Array.isArray(item.sanPhams) ? item.sanPhams.map((p) => p.name || "Không có tên") : [],
        colors,
        isFavorite: !!userFavorite,
        likedId: userFavorite?.maYeuThich,
        savings,
        savingsPercentage,
        productCount,
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProducts(true);
        setLoadingCombos(true);

        // Lấy danh sách bình luận
        const commentResponse = await fetch("http://localhost:5261/api/Comment/list");
        if (!commentResponse.ok) throw new Error("Không thể tải bình luận");
        const commentData = await commentResponse.json();

        // Lấy danh sách yêu thích
        let userData: UserData = {};
        try {
          const user = localStorage.getItem("user");
          userData = user ? JSON.parse(user) : {};
        } catch (error) {
          console.error("Lỗi parse user data:", error);
        }
        const currentUserId = userData?.maNguoiDung;
        let yeuThichData: any[] = [];
        if (currentUserId) {
          const yeuThichResponse = await fetch("http://localhost:5261/api/YeuThich", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
          });
          if (yeuThichResponse.ok) {
            yeuThichData = await yeuThichResponse.json();
          }
        }

        // Lấy danh sách sản phẩm
        const productResponse = await fetch("http://localhost:5261/api/SanPham/ListSanPham");
        if (!productResponse.ok) {
          throw new Error("Không thể tải sản phẩm");
        }
        const productData: ApiProduct[] = await productResponse.json();
        const transformedProducts = transformProductApiData(productData, commentData, yeuThichData);
        setProducts(transformedProducts);
        setLoadingProducts(false);
        setErrorProducts(null);

        // Lấy danh sách combo
        const comboResponse = await fetch("http://localhost:5261/api/Combo/ComboSanPhamView");
        if (!comboResponse.ok) {
          throw new Error("Không thể tải combo");
        }
        const comboData = await comboResponse.json();
        if (!Array.isArray(comboData)) {
          throw new Error("API response is not an array");
        }
        const transformedCombos = transformComboApiData(comboData, yeuThichData);
        setCombos(transformedCombos);
        setLoadingCombos(false);
        setErrorCombos(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        console.error("Lỗi khi lấy dữ liệu:", errorMessage);
        if (err.message.includes("products")) {
          setErrorProducts(errorMessage);
          setLoadingProducts(false);
        }
        if (err.message.includes("combos")) {
          setErrorCombos(errorMessage);
          setLoadingCombos(false);
        }
      }
    };

    fetchData();
  }, []);

  const toggleProductFavorite = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId);
      let userData: UserData = {};
      try {
        const user = localStorage.getItem("user");
        userData = user ? JSON.parse(user) : {};
      } catch (error) {
        console.error("Lỗi parse user data:", error);
      }
      const userId = userData?.maNguoiDung;
      const hoTen = userData?.hoTen;

      if (!userId) {
        showNotification("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!", "warning").then(() => {
          navigate("/login");
        });
        return;
      }

      if (product?.isFavorite) {
        const response = await fetch(`http://localhost:5261/api/YeuThich/${product.likedId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Không thể xóa sản phẩm khỏi danh sách yêu thích");
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isFavorite: false, likedId: undefined } : p))
        );
        showNotification("Đã xóa sản phẩm khỏi danh sách yêu thích!", "success");
      } else {
        const yeuThichData = {
          maSanPham: productId.split("_")[0] || productId,
          tenSanPham: product?.name,
          maNguoiDung: userId,
          hoTen: hoTen,
          soLuongYeuThich: 1,
          ngayYeuThich: new Date().toISOString(),
        };
        const response = await fetch("http://localhost:5261/api/YeuThich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(yeuThichData),
        });
        if (!response.ok) throw new Error("Không thể thêm sản phẩm vào danh sách yêu thích");
        const addedFavorite = await response.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p))
        );
        showNotification("Đã thêm sản phẩm vào danh sách yêu thích!", "success");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích!", "error");
    }
  };

  const toggleComboFavorite = async (comboId: number) => {
    try {
      const combo = combos.find((c) => c.id === comboId);
      let userData: UserData = {};
      try {
        const user = localStorage.getItem("user");
        userData = user ? JSON.parse(user) : {};
      } catch (error) {
        console.error("Lỗi parse user data:", error);
      }
      const userId = userData?.maNguoiDung;
      const hoTen = userData?.hoTen;

      if (!userId) {
        showNotification("Vui lòng đăng nhập để thêm combo vào danh sách yêu thích!", "warning").then(() => {
          navigate("/login");
        });
        return;
      }

      if (combo?.isFavorite) {
        const response = await fetch(`http://localhost:5261/api/YeuThich/${combo.likedId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Không thể xóa combo khỏi danh sách yêu thích");
        setCombos((prev) =>
          prev.map((c) => (c.id === comboId ? { ...c, isFavorite: false, likedId: undefined } : c))
        );
        showNotification("Đã xóa combo khỏi danh sách yêu thích!", "success");
      } else {
        const yeuThichData = {
          maCombo: comboId,
          tenCombo: combo?.name,
          maNguoiDung: userId,
          hoTen: hoTen,
          soLuongYeuThich: 1,
          ngayYeuThich: new Date().toISOString(),
        };
        const response = await fetch("http://localhost:5261/api/YeuThich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(yeuThichData),
        });
        if (!response.ok) throw new Error("Không thể thêm combo vào danh sách yêu thích");
        const addedFavorite = await response.json();
        setCombos((prev) =>
          prev.map((c) => (c.id === comboId ? { ...c, isFavorite: true, likedId: addedFavorite.maYeuThich } : c))
        );
        showNotification("Đã thêm combo vào danh sách yêu thích!", "success");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích!", "error");
    }
  };

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <HeroSection />

      {/* Features */}
      <Features />

      {/* Featured Products */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Sản phẩm</h2>
          <Button asChild variant="link" className="text-crocus-600">
            <Link to="/products">
              Xem tất cả <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>

        {loadingProducts ? (
          <div className="text-center">Đang tải sản phẩm...</div>
        ) : errorProducts ? (
          <div className="text-center text-red-500">Lỗi: {errorProducts}</div>
        ) : (
          <Carousel className="w-full">
            <CarouselContent>
              {products.map((product, index) => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                  <ProductCard product={product} index={index} toggleFavorite={toggleProductFavorite} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
      </section>

      {/* Trending Combos */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Combo</h2>
          <Button asChild variant="link" className="text-crocus-600">
            <Link to="/combos">
              Xem tất cả <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>

        {loadingCombos ? (
          <div className="text-center">Đang tải combo...</div>
        ) : errorCombos ? (
          <div className="text-center text-red-500">Lỗi: {errorCombos}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {combos.map((combo, index) => (
              <ErrorBoundary key={combo.id}>
                <ComboCard combo={combo} index={index} toggleFavorite={toggleComboFavorite} />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </section>

      {/* Blog Section */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Bài viết</h2>
          <Button asChild variant="link" className="text-crocus-600">
            <Link to="/blogs">
              Xem tất cả <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Blog content placeholder */}
        </div>
      </section>

      <Newsletter />
    </div>
  );
};

export default Index;