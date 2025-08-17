import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Eye, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Định nghĩa interface mới cho dữ liệu từ API
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

// Interface cho ProductCard
interface Product {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  colorClass: string;
  price: number;
  chatlieu: string;
  thuonghieu: string;
  soLuong: number;
  soLuongDaBan: number;
  hot: boolean;
}

const formatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? "Đã bỏ yêu thích" : "Đã thêm vào yêu thích");
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

  const calculateRating = () => {
    // Tính rating dựa trên số lượng đã bán (tạm thời)
    const rating = Math.min(5, Math.max(3, Math.floor(product.soLuongDaBan / 10) + 3));
    return rating;
  };

  const getStockStatus = () => {
    if (product.soLuong === 0) return { text: "Hết hàng", color: "bg-red-500" };
    if (product.soLuong < 10) return { text: "Sắp hết", color: "bg-orange-500" };
    return { text: "Còn hàng", color: "bg-green-500" };
  };

  const stockStatus = getStockStatus();
  const rating = calculateRating();

  return (
    <div
      ref={ref}
      className={cn(
        "group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl h-full flex flex-col",
        "transition-all duration-700 ease-out transform hover:-translate-y-2",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/productS/${product.id}`}
        className="text-primary font-medium block h-full"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={
              product.imageSrc && product.imageSrc
                ? `data:image/jpeg;base64,${product.imageSrc}`
                : "/placeholder-image.jpg"
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.hot && (
              <Badge className="bg-red-500 text-white border-0 shadow-lg animate-pulse">
                <Flame className="w-3 h-3 mr-1" />
                Hot
              </Badge>
            )}
            <Badge className={`${stockStatus.color} text-white border-0 shadow-lg`}>
              {stockStatus.text}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "absolute top-4 right-4 flex flex-col gap-2 transition-all duration-500",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}>
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-0"
              onClick={toggleFavorite}
            >
              <Heart className={cn("w-4 h-4", isFavorited && "fill-red-500 text-red-500")} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Add to Cart */}
          <div className={cn(
            "absolute bottom-4 left-4 right-4 transition-all duration-500",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Button
              className="w-full bg-black/80 hover:bg-black text-white backdrop-blur-sm border-0 shadow-lg"
              onClick={addToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Thêm vào giỏ
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          {/* Brand */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {product.thuonghieu}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  )}
                />
              ))}
              <span className="text-sm text-gray-500 ml-1">({product.soLuongDaBan})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.description.replace(/<br\/>/g, ' ')}
          </p>

          {/* Product Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 w-20">Chất liệu:</span>
              <span className="text-gray-600">{product.chatlieu}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 w-20">Đã bán:</span>
              <span className="text-gray-600">{product.soLuongDaBan} sản phẩm</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 w-20">Còn lại:</span>
              <span className="text-gray-600">{product.soLuong} sản phẩm</span>
            </div>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-red-600">
                  {formatter.format(product.price)}
                </span>
                {product.hot && (
                  <span className="text-sm text-green-600 font-medium">
                    Giá tốt nhất
                  </span>
                )}
              </div>
              
              {/* Progress bar for stock */}
              <div className="text-right">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (product.soLuongDaBan / (product.soLuongDaBan + product.soLuong)) * 100)}%`
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1 block">
                  {Math.round((product.soLuongDaBan / (product.soLuongDaBan + product.soLuong)) * 100)}% đã bán
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Cập nhật để nhận productId từ props
interface ProductShowcaseProps {
  productId?: string;
}

const ProductShowcase = ({ productId }: ProductShowcaseProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const transformApiData = (apiData: ApiProduct[]): Product[] => {
    const colorClasses = [
      "from-purple-500 to-indigo-500",
      "from-pink-500 to-rose-500",
      "from-violet-500 to-purple-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-teal-500",
      "from-yellow-500 to-orange-500",
    ];

    return apiData.map((item, index) => ({
      id: item.id,
      name: item.name,
      description: item.moTa || `Sản phẩm chất lượng cao từ thương hiệu ${item.thuongHieu}`,
      chatlieu: item.chatLieu,
      thuonghieu: item.thuongHieu,
      imageSrc: item.hinh[0] || "",
      colorClass: colorClasses[index % colorClasses.length],
      price: item.donGia,
      soLuong: item.soLuong,
      soLuongDaBan: item.soLuongDaBan,
      hot: item.hot,
    }));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const apiUrl = productId
          ? `https://bicacuatho.azurewebsites.net/api/SanPham/ListSanPhamLQ?id=${productId}`
          : `https://bicacuatho.azurewebsites.net/api/SanPham/ListSanPhamLQ`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data: ApiProduct[] = await response.json();
        const transformedProducts = transformApiData(data);
        setProducts(transformedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productId]);

  // Tính toán số slide (mỗi slide 3 sản phẩm)
  const totalSlides = Math.ceil(products.length / 3);
  const canGoPrev = currentSlide > 0;
  const canGoNext = currentSlide < totalSlides - 1;

  const goToPrevSlide = () => {
    if (canGoPrev) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNextSlide = () => {
    if (canGoNext) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  if (loading) {
    return (
      <section className="py-24 px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-300 rounded-lg w-96 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-300 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8">
            <p className="text-red-600 text-lg font-medium">Lỗi: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-24 px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sản Phẩm Liên Quan
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Khám phá bộ sưu tập sản phẩm chất lượng cao được chọn lọc kỹ càng
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={goToPrevSlide}
                disabled={!canGoPrev}
                className="rounded-full w-12 h-12 border-2 hover:bg-blue-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={goToNextSlide}
                disabled={!canGoNext}
                className="rounded-full w-12 h-12 border-2 hover:bg-blue-50 disabled:opacity-50"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Slide Indicators */}
            <div className="flex gap-2">
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    currentSlide === index
                      ? "bg-blue-600 w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Slider */}
          <div className="overflow-hidden rounded-3xl">
            <div
              ref={sliderRef}
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {[...Array(totalSlides)].map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-8 px-2"
                >
                  {products
                    .slice(slideIndex * 3, (slideIndex + 1) * 3)
                    .map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <Link to="/user/cart">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Xem Giỏ Hàng
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;