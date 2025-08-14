import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, Component, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/default/HeroSection";
import Newsletter from "@/components/default/Newsletter";
import Features from "@/components/default/Features";
import CategoryView from "@/components/default/CategoryView";
import { BlogList } from "@/components/default/BlogList";
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
  gioiTinh: string;
  hot: boolean;
  listHashTag: {
    id: number;
    name: string;
  }[];
  khuyenMaiMax: number;
}

// Định nghĩa interface cho dữ liệu từ API (Combos)
interface ApiComboSanPham {
  id: number;
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
  sanPhams: ApiComboSanPham[];
  moTa: string;
  gia: number;
  trangThai: boolean;
  soLuong: number;
  ngayTao: string;
  khuyenMaiMax: number;
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
  hashTags: {
    id: number;
    name: string;
  }[];
  discountPercent: number;
  thuongHieu: string;
  chatLieu: string;
  soLuongDaBan: number;
}

// Interface cho Combo
interface Combo {
  id: number;
  name: string;
  description: string;
  imageSrc: string;
  price: number;
  originalPrice: number;
  products: {
    id: string;
    name: string;
    brand: string;
    material: string;
    type: string;
    price: number;
    quantity: number;
    colors: string[];
  }[];
  isFavorite: boolean;
  likedId?: string;
  savings: number;
  savingsPercentage: number;
  savingsPercentageComparedToRetail: number;
  productCount: number;
  discountPercent: number;
  allImages: string[];
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

// Hàm transform dữ liệu sản phẩm
const transformProductApiData = (apiData: ApiProduct[], commentData: any[], yeuThichData: any[]): Product[] => {
  // Lọc chỉ lấy sản phẩm có trạng thái = 1 (đang hoạt động)
  const activeProducts = apiData.filter((item) => item.trangThai === 1);

  return activeProducts.map((item) => {
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
      hashTags: item.listHashTag || [],
      discountPercent: item.khuyenMaiMax || 0,
      thuongHieu: item.thuongHieu || "Không xác định",
      chatLieu: item.chatLieu || "Không xác định",
      soLuongDaBan: item.soLuongDaBan || 0,
    };
  });
};

// Hàm transform dữ liệu combo
const transformComboApiData = (apiData: ApiCombo[], yeuThichData: any[]): Combo[] => {
  const activeCombos = apiData.filter((item) => item.trangThai === true);

  return activeCombos.map((item) => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = userData?.maNguoiDung;
    const userFavorite = yeuThichData.find(
      (yt) => yt?.maCombo === item.maCombo && yt?.maNguoiDung === currentUserId
    );

    // Tổng giá lẻ
    const totalRetailPrice = item.sanPhams.reduce(
      (sum, p) => sum + (p.donGia * (p.soLuong || 1)),
      0
    );

    // Lớp 1: giá combo (rẻ hơn giá lẻ)
    const comboPrice = item.gia;

    // Lớp 2: áp khuyến mãi max
    const finalPrice = Math.round(comboPrice * (1 - (item.khuyenMaiMax || 0) / 100));

    // Badge 1: Giảm so với giá lẻ
    const savingsPercentageComparedToRetail = Math.round(
      ((totalRetailPrice - comboPrice) / totalRetailPrice) * 100
    );

    // Tiết kiệm tổng (so với giá lẻ ban đầu)
    const savings = totalRetailPrice - finalPrice;

    const products = item.sanPhams.map((p) => ({
      id: p.idSanPham || p.id?.toString() || '',
      name: p.name || 'Không có tên',
      brand: p.thuongHieu || 'Không xác định',
      material: p.chatLieu || 'Không xác định',
      type: p.loaiSanPham || 'Không xác định',
      price: p.donGia || 0,
      quantity: p.soLuong || 1,
      colors: p.mauSac || [],
      hinh: p.hinh[0]
    }));

    const allImages: string[] = [];
    if (item.hinhAnh) allImages.push(item.hinhAnh);
    item.sanPhams.forEach((p) => {
      if (Array.isArray(p.hinh)) allImages.push(...p.hinh);
    });

    return {
      id: item.maCombo,
      name: item.name,
      description: item.moTa,
      imageSrc: allImages[0] || '',
      price: finalPrice,
      originalPrice: totalRetailPrice,
      products,
      isFavorite: !!userFavorite,
      likedId: userFavorite?.maYeuThich,
      savings,
      savingsPercentage: item.khuyenMaiMax || 0,
      savingsPercentageComparedToRetail,
      productCount: products.length,
      discountPercent: item.khuyenMaiMax || 0,
      allImages
    };
  });
};

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
      <Card className="overflow-hidden group relative">
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

          {/* Hot Badge */}
          {product.hot && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white z-10">
              Đang bán chạy
            </Badge>
          )}

          {/* Discount Badge - Ô vuông lớn góc phải */}
          {product.discountPercent > 0 && (
            <div className="absolute top-0 right-0 bg-gradient-to-br from-red-500 to-red-600 text-white p-3 min-w-[80px] min-h-[80px] flex flex-col items-center justify-center shadow-lg z-10">
              <div className="text-xs font-medium leading-tight text-center">
                Giảm tới
              </div>
              <div className="text-lg font-bold leading-none">
                {product.discountPercent}%
              </div>
            </div>
          )}

          {/* Favorite Button */}
         <Button
  variant="outline"
  size="icon"
  className="absolute top-2 left-2 w-10 h-10 rounded-full bg-white/80 hover:bg-white z-10"
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
            <h3 className="font-medium hover:text-crocus-600 transition-colors mb-2 line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Price and Rating */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
              {product.discountPercent > 0 ? (
                <>
                  {/* Giá sau giảm - màu đỏ nổi bật */}
                  <p className="font-bold text-xl text-red-600 mb-1">
                    {Math.round(product.price * (1 - product.discountPercent / 100)).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                  </p>
                  {/* Giá gốc bị gạch */}
                  <p className="text-sm text-gray-500 line-through font-medium">
                    {product.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                  </p>
                  {/* Số tiền tiết kiệm - màu xanh lá */}
                  <p className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-1 rounded-md inline-block mt-1">
                    Tiết kiệm {Math.round(product.price * product.discountPercent / 100).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                  </p>
                </>
              ) : (
                <p className="font-semibold text-lg text-red-600">
                  {product.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                </p>
              )}
              {/* Số lượng đã bán */}
              <p className="text-xs text-gray-600 mt-1 font-medium">
                📦 Đã bán: <span className="text-orange-600 font-bold">{product.soLuongDaBan.toLocaleString('vi-VN')}</span> sản phẩm
              </p>
            </div>
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

          {/* Colors */}
          <div className="mb-3 flex flex-wrap gap-1">
            <span className="text-xs text-gray-500 mr-2">Màu:</span>
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color}
                className="inline-block w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: `#${color}` }}
                title={`Màu #${color}`}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 4}</span>
            )}
          </div>

          {/* Brand and Material Badges */}
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 font-medium"
            >
              🏷️ {product.thuongHieu}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 bg-green-50 border-green-200 text-green-700 font-medium"
            >
              🧵 {product.chatLieu}
            </Badge>
          </div>

          {/* HashTags */}
          {product.hashTags && product.hashTags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {product.hashTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-crocus-100 text-crocus-700 hover:bg-crocus-200"
                >
                  #{tag.name}
                </Badge>
              ))}
              {product.hashTags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{product.hashTags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to={`/products/${product.id}`}>Chi tiết</Link>
            </Button>
            {/* <Button
              size="sm"
              className="flex-1 bg-crocus-500 hover:bg-crocus-600"
              onClick={handleBuyNow}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Mua ngay
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component ImageGallery
const ImageGallery = ({ images, comboName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full">
      {/* Main Image Display */}
      <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[currentImageIndex] ? `data:image/jpeg;base64,${images[currentImageIndex]}` : "/placeholder-image.jpg"}
          alt={`${comboName} - Hình ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Slider */}
      {images.length > 1 && (
        <div className="w-full">
          <Carousel className="w-full">
            <CarouselContent className="-ml-2">
              {images.map((image, index) => (
                <CarouselItem key={index} className="basis-1/3 pl-2">
                  <div
                    className={cn(
                      "aspect-square bg-gray-100 rounded cursor-pointer overflow-hidden border-2 transition-all",
                      currentImageIndex === index ? "border-crocus-500" : "border-transparent hover:border-gray-300"
                    )}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image ? `data:image/jpeg;base64,${image}` : "/placeholder-image.jpg"}
                      alt={`${comboName} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 3 && (
              <>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </>
            )}
          </Carousel>
        </div>
      )}
    </div>
  );
};

const ComboSlideCard = ({ combo, toggleFavorite }) => {
  return (
    <Card 
      className="overflow-hidden h-full"
      style={{
        backgroundColor: '#EBE7FD'
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[500px]">
        <div className="relative p-6 bg-gray-50/80 backdrop-blur-sm">
          {/* Badge 1 */}
          {combo.discountPercent > 0 && (
            <div className="absolute top-4 right-4 bg-gradient-to-br from-red-500 to-red-600 text-white p-3 min-w-[80px] min-h-[80px] flex flex-col items-center justify-center shadow-lg z-10 rounded">
              <div className="text-xs font-medium text-gray-50">Khuyến Mãi</div>
              <div className="text-lg font-bold"> -{combo.discountPercent}%</div>
            </div>
          )}
          {/* Badge 2 */}
          {combo.savingsPercentageComparedToRetail > 0 && (
            <div className="absolute top-4 right-28 bg-blue-500 text-white p-3 rounded shadow-lg z-10 flex flex-col items-center">
              <div className="text-xs font-medium">Đã Giảm</div>
              <div className="text-lg font-bold">{combo.savingsPercentageComparedToRetail}%</div>
            </div>
          )}
          <ImageGallery images={combo.allImages} comboName={combo.name} />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white z-10"
            onClick={() => toggleFavorite(combo.id)}
            aria-label={combo.isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart
              className={`h-5 w-5 ${combo.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </Button>
        </div>

        <div className="p-6 flex flex-col justify-between bg-white/80 backdrop-blur-sm">
          <div>
            <Link to={`/combos/${combo.id}`}>
              <h3 className="text-2xl font-bold hover:text-crocus-600 transition-colors mb-3">{combo.name}</h3>
            </Link>
            <div className="mb-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-red-600">
                  {combo.price.toLocaleString('vi-VN')} VND
                </span>
                <span className="text-lg text-gray-500 line-through">
                  {combo.originalPrice.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <p className="text-sm text-green-700 font-semibold bg-green-50 px-3 py-2 rounded-lg inline-block">
                💰 Tiết kiệm {combo.savings.toLocaleString('vi-VN')} VND
              </p>
            </div>

            <Badge className="mb-4 bg-crocus-500 text-white px-3 py-1">
              📦 {combo.productCount} sản phẩm trong combo
            </Badge>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-lg">Sản phẩm trong combo:</h4>
              <div className="space-y-3">
                {combo.products.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                  >
                    <div className="grid grid-cols-3 gap-4 items-start">
                      {/* Cột 1: Hình ảnh */}
                      <div className="flex flex-col items-center">
                        <img
                          src={`data:image/jpeg;base64,${product.hinh}`}
                          alt={product.name}
                          className="w-full max-w-[200px] object-contain rounded shadow"
                        />
                        <p className="font-semibold text-lg text-gray-800 mt-2 text-center">{product.name}</p>
                      </div>

                      {/* Cột 2: Số lượng + Thương hiệu */}
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          Số lượng:{" "}
                          <span className="font-medium text-gray-800">{product.quantity}</span>
                        </p>
                        <p className="text-gray-600">
                          Thương hiệu:{" "}
                          <span className="font-medium text-gray-800">{product.brand}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {product.colors.map((color) => (
                            <span
                              key={color}
                              className="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: `#${color}` }}
                              title={`Màu ${color}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Cột 3: Chất liệu + Giá gốc */}
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          Chất liệu:{" "}
                          <span className="font-medium text-gray-800">{product.material}</span>
                        </p>
                        <p className="text-gray-600">
                          Giá gốc:{" "}
                          <span className="font-bold text-lg text-red-600">
                            {product.price.toLocaleString("vi-VN")} VND
                          </span>
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button asChild variant="outline" className="flex-1">
                <Link to={`/combos/${combo.id}`}>Xem chi tiết</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
// Component ComboSlider
const ComboSlider = ({
  combos,
  toggleFavorite,
}: {
  combos: Combo[];
  toggleFavorite: (comboId: number) => void;
}) => {
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {combos.map((combo) => (
          <CarouselItem key={combo.id} className="basis-full">
            <ComboSlideCard combo={combo} toggleFavorite={toggleFavorite} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
        if (errorMessage.includes("sản phẩm")) {
          setErrorProducts(errorMessage);
          setLoadingProducts(false);
        }
        if (errorMessage.includes("combo")) {
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
          navigate("/auth/login");
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
            Authorization: `Bearer ${localStorage.getItem("token")}` },
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
            Authorization: `Bearer ${localStorage.getItem("token")}` },
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
    <div className={cn("space-y-6 py-6", theme === 'dark' ? 'dark' : '')}>
      {/* Theme Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 w-12 h-12 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 z-50"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
      >
        {theme === 'light' ? (
          <Moon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        )}
      </Button>

      {/* Hero Section */}
      <HeroSection />
      <CategoryView />
      {/* Features */}
      <Features />
   <VoucherUser />
      {/* Featured Products */}
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
        ) : combos.length > 0 ? (
          <ErrorBoundary>
            <ComboSlider combos={combos} toggleFavorite={toggleComboFavorite} />
          </ErrorBoundary>
        ) : (
          <div className="text-center text-gray-500">Không có combo nào để hiển thị</div>
        )}
      </section>

      {/* Blog Section */}
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