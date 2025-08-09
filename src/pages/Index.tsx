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
import CategoryView from "@/components/default/CategoryView";
import VoucherUser from "@/components/layout/voucher/VoucherUser";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CartItem } from "@/types/cart";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";
import ProductView from "@/components/default/ProductView";
import ComboDetailView from "@/components/default/ComboDetailView";
import { BlogList } from "@/components/default/BlogList";

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
  gioiTinh: string;
}

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

interface ApiBlog {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  createdDate: string;
  status: number;
}

interface UserData {
  maNguoiDung?: string;
  hoTen?: string;
}

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
  category?: string;
  chatLieu?: string;
  gioiTinh?: string;
  ngayTao: string;
  soLuongDaBan: number;
}

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

interface Blog {
  id: number;
  title: string;
  excerpt: string;
  imageSrc: string;
  createdDate: string;
  status: number;
}

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
          <p>Đã xảy ra lỗi khi hiển thị nội dung.</p>
          <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
            Thử lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleBuyNow = () => {
    setIsModalOpen(true);
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
    <>
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
              <p className="text-2xl text-purple-700 font-semibold">
                {product.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
              </p>
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
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                {product.category || "Không xác định"}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                {product.chatLieu || "Không xác định"}
              </Badge>
              <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                {product.gioiTinh || "Không xác định"}
              </Badge>
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
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ProductView productId={product.id} onClose={() => setIsModalOpen(false)} />
      </Dialog.Root>
    </>
  );
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleBuyNow = () => {
    setIsModalOpen(true);
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
    <>
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
                <p className="font-semibold text-purple-700 text-2xl">
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
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ComboDetailView comboId={String(combo.id)} onClose={() => setIsModalOpen(false)} />
      </Dialog.Root>
    </>
  );
};

const BlogCard = ({
  blog,
  index,
}: {
  blog: Blog;
  index: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          <Link to={`/blogs/${blog.id}`}>
            <img
              src={
                blog.imageSrc
                  ? `data:image/jpeg;base64,${blog.imageSrc}`
                  : "/placeholder-image.jpg"
              }
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>
        <CardContent className="p-4">
          <Link to={`/blogs/${blog.id}`}>
            <h3 className="font-medium hover:text-crocus-600 transition-colors">{blog.title}</h3>
          </Link>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{blog.excerpt}</p>
          <div className="mt-2 text-sm text-gray-500">
            {new Date(blog.createdDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to={`/blogs/${blog.id}`}>Đọc thêm</Link>
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
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorCombos, setErrorCombos] = useState<string | null>(null);
  const [errorBlogs, setErrorBlogs] = useState<string | null>(null);

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

  const defaultBlog: Blog = {
    id: 0,
    title: "Không có tiêu đề",
    excerpt: "Không có nội dung",
    imageSrc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3C/svg%3E",
    createdDate: new Date().toISOString(),
    status: 0,
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
        category: item.loaiSanPham || "Không xác định",
        chatLieu: item.chatLieu || "Không xác định",
        gioiTinh: item.gioiTinh || "Không xác định",
        ngayTao: item.ngayTao,
        soLuongDaBan: item.soLuongDaBan || 0,
      };
    }).sort((a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime());
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

  const transformBlogApiData = (apiData: ApiBlog[]): Blog[] => {
    return apiData.map((item) => ({
      id: item.id || 0,
      title: item.title || "Không có tiêu đề",
      excerpt: item.excerpt || "Không có nội dung",
      imageSrc: item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3C/svg%3E",
      createdDate: item.createdDate || new Date().toISOString(),
      status: item.status || 0,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProducts(true);
        setLoadingCombos(true);
        setLoadingBlogs(true);

        const commentResponse = await fetch("http://localhost:5261/api/Comment/list");
        if (!commentResponse.ok) throw new Error("Không thể tải bình luận");
        const commentData = await commentResponse.json();

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

        const productResponse = await fetch("http://localhost:5261/api/SanPham/ListSanPham");
        if (!productResponse.ok) {
          throw new Error("Không thể tải sản phẩm");
        }
        const productData: ApiProduct[] = await productResponse.json();
        const transformedProducts = transformProductApiData(productData, commentData, yeuThichData);
        setProducts(transformedProducts);
        setLoadingProducts(false);
        setErrorProducts(null);

        const comboResponse = await fetch("http://localhost:5261/api/Combo/ComboSanPhamView");
        if (!comboResponse.ok) {
          throw new Error("Không thể tải combo");
        }
        const comboData = await comboResponse.json();
        if (!Array.isArray(comboData)) {
          throw new Error("API response is not an array for combos");
        }
        const transformedCombos = transformComboApiData(comboData, yeuThichData);
        setCombos(transformedCombos);
        setLoadingCombos(false);
        setErrorCombos(null);

        const blogResponse = await fetch("http://localhost:5261/api/Blog");
        if (!blogResponse.ok) {
          throw new Error("Không thể tải blog");
        }
        const blogData = await blogResponse.json();
        if (!Array.isArray(blogData)) {
          throw new Error("API response is not an array for blogs");
        }
        const transformedBlogs = transformBlogApiData(blogData);
        setBlogs(transformedBlogs);
        setLoadingBlogs(false);
        setErrorBlogs(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        console.error("Lỗi khi lấy dữ liệu:", errorMessage);
        if (errorMessage.includes("products")) {
          setErrorProducts(errorMessage);
          setLoadingProducts(false);
        }
        if (errorMessage.includes("combos")) {
          setErrorCombos(errorMessage);
          setLoadingCombos(false);
        }
        if (errorMessage.includes("blog")) {
          setErrorBlogs(errorMessage);
          setLoadingBlogs(false);
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
    <div className="space-y-6 py-6">
      <HeroSection />
      <CategoryView />
      <Features />
      <VoucherUser />

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Sản phẩm bán chạy</h2>
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
              {products
                .sort((a, b) => b.soLuongDaBan - a.soLuongDaBan)
                .slice(0, 8)
                .map((product, index) => (
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

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Sản phẩm mới nhất</h2>
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
              {products.slice(0, 8).map((product, index) => (
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

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Combo mới nhất</h2>
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
          <Carousel className="w-full">
            <CarouselContent>
              {combos.slice(0, 8).map((combo, index) => (
                <CarouselItem key={combo.id} className="md:basis-1/2 lg:basis-1/4">
                  <ErrorBoundary>
                    <ComboCard combo={combo} index={index} toggleFavorite={toggleComboFavorite} />
                  </ErrorBoundary>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Tin tức</h2>
          <Button asChild variant="link" className="text-crocus-600">
            <Link to="/blogs">
              Xem tất cả <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>
        <BlogList />
      </section>
      <Newsletter />
    </div>
  );
};

export default Index;