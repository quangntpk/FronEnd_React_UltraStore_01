import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, SlidersHorizontal, Star, Sparkles, TrendingUp, Package, Filter, Grid3X3, List, ArrowUpDown, X, Zap, Award, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

// Interface cho dữ liệu người dùng
interface UserData {
  maNguoiDung?: string;
  hoTen?: string;
}

// Interface cho hashtag
interface HashTag {
  id: number;
  name: string;
}

// Interface cho sản phẩm
interface Product {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  price: number;
  category: string;
  thuongHieu: string;
  chatLieu: string;
  kichThuoc: string[];
  mauSac: string[];
  averageRating: number;
  commentCount: number;
  isFavorite: boolean;
  hot: boolean;
  likedId?: string;
  hashtags: HashTag[];
  gioiTinh: string;
  trangThai: number;
}

interface ColorRange {
  name: string;
  displayName: string;
  ranges: Array<{
    minHex: string;
    maxHex: string;
  }>;
  previewColor: string;
  gradientColors: string[]; // Thêm thuộc tính cho 3 màu gradient
}

const COLOR_RANGES: ColorRange[] = [
  {
    name: "red",
    displayName: "Đỏ",
    ranges: [
      { minHex: "CC0000", maxHex: "FF3333" },
      { minHex: "FF0000", maxHex: "FF6666" },
      { minHex: "B22222", maxHex: "DC143C" }
    ],
    previewColor: "#FF0000",
    gradientColors: ["#8B0000", "#FF0000", "#FF6B6B"] // Đỏ đậm, đỏ, đỏ nhạt
  },
  {
    name: "blue",
    displayName: "Xanh dương",
    ranges: [
      { minHex: "0000CC", maxHex: "3333FF" },
      { minHex: "0066CC", maxHex: "3399FF" },
      { minHex: "000080", maxHex: "4169E1" }
    ],
    previewColor: "#0066FF",
    gradientColors: ["#000080", "#0066FF", "#87CEEB"] // Xanh navy, xanh dương, xanh nhạt
  },
  {
    name: "green",
    displayName: "Xanh lá",
    ranges: [
      { minHex: "00CC00", maxHex: "33FF33" },
      { minHex: "228B22", maxHex: "32CD32" },
      { minHex: "006400", maxHex: "90EE90" }
    ],
    previewColor: "#00CC00",
    gradientColors: ["#006400", "#00CC00", "#90EE90"] // Xanh đậm, xanh lá, xanh nhạt
  },
  {
    name: "yellow",
    displayName: "Vàng",
    ranges: [
      { minHex: "CCCC00", maxHex: "FFFF33" },
      { minHex: "FFD700", maxHex: "FFFF99" },
      { minHex: "FFA500", maxHex: "FFFF00" }
    ],
    previewColor: "#FFFF00",
    gradientColors: ["#B8860B", "#FFD700", "#FFFFE0"] // Vàng đậm, vàng, vàng nhạt
  },
  {
    name: "purple",
    displayName: "Tím",
    ranges: [
      { minHex: "6600CC", maxHex: "9933FF" },
      { minHex: "800080", maxHex: "DA70D6" },
      { minHex: "4B0082", maxHex: "9370DB" }
    ],
    previewColor: "#8000FF",
    gradientColors: ["#4B0082", "#8000FF", "#DDA0DD"] // Tím đậm, tím, tím nhạt
  },
  {
    name: "orange",
    displayName: "Cam",
    ranges: [
      { minHex: "FF6600", maxHex: "FF9933" },
      { minHex: "FF4500", maxHex: "FFA500" },
      { minHex: "CC3300", maxHex: "FF7F50" }
    ],
    previewColor: "#FF6600",
    gradientColors: ["#CC3300", "#FF6600", "#FFB07A"] // Cam đậm, cam, cam nhạt
  },
  {
    name: "pink",
    displayName: "Hồng",
    ranges: [
      { minHex: "FF66CC", maxHex: "FF99DD" },
      { minHex: "FF1493", maxHex: "FFB6C1" },
      { minHex: "FF69B4", maxHex: "FFC0CB" }
    ],
    previewColor: "#FF69B4",
    gradientColors: ["#C91E6A", "#FF69B4", "#FFB6C1"] // Hồng đậm, hồng, hồng nhạt
  },
  {
    name: "brown",
    displayName: "Nâu",
    ranges: [
      { minHex: "8B4513", maxHex: "D2691E" },
      { minHex: "A0522D", maxHex: "CD853F" },
      { minHex: "654321", maxHex: "DEB887" }
    ],
    previewColor: "#8B4513",
    gradientColors: ["#654321", "#8B4513", "#D2B48C"] // Nâu đậm, nâu, nâu nhạt
  },
  {
    name: "gray",
    displayName: "Xám",
    ranges: [
      { minHex: "666666", maxHex: "CCCCCC" },
      { minHex: "808080", maxHex: "D3D3D3" },
      { minHex: "2F2F2F", maxHex: "A9A9A9" }
    ],
    previewColor: "#808080",
    gradientColors: ["#2F2F2F", "#808080", "#D3D3D3"] // Xám đậm, xám, xám nhạt
  },
  {
    name: "black",
    displayName: "Đen",
    ranges: [
      { minHex: "000000", maxHex: "333333" },
      { minHex: "000000", maxHex: "2F2F2F" }
    ],
    previewColor: "#000000",
    gradientColors: ["#000000", "#2F2F2F", "#696969"] // Đen, đen nhạt, xám đen
  },
  {
    name: "white",
    displayName: "Trắng",
    ranges: [
      { minHex: "CCCCCC", maxHex: "FFFFFF" },
      { minHex: "F0F0F0", maxHex: "FFFFFF" }
    ],
    previewColor: "#FFFFFF",
    gradientColors: ["#E5E5E5", "#F8F8F8", "#FFFFFF"] // Trắng xám, trắng kem, trắng
  }
];

// Hàm chuyển đổi hex sang RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleanHex = hex.replace('#', '').toUpperCase();
  if (cleanHex.length !== 6) return null;
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return { r, g, b };
};

// Hàm kiểm tra màu có nằm trong khoảng không
const isColorInRange = (color: string, minHex: string, maxHex: string): boolean => {
  const colorRgb = hexToRgb(color);
  const minRgb = hexToRgb(minHex);
  const maxRgb = hexToRgb(maxHex);
  
  if (!colorRgb || !minRgb || !maxRgb) return false;
  
  return (
    colorRgb.r >= minRgb.r && colorRgb.r <= maxRgb.r &&
    colorRgb.g >= minRgb.g && colorRgb.g <= maxRgb.g &&
    colorRgb.b >= minRgb.b && colorRgb.b <= maxRgb.b
  );
};

// Hàm kiểm tra màu có thuộc phổ màu nào không
const getColorCategory = (color: string): string | null => {
  const cleanColor = color.replace('#', '').toUpperCase();
  
  for (const colorRange of COLOR_RANGES) {
    for (const range of colorRange.ranges) {
      if (isColorInRange(cleanColor, range.minHex, range.maxHex)) {
        return colorRange.name;
      }
    }
  }
  
  return null;
};

// Component filter màu sắc
const ColorRangeFilter = ({ 
  selectedColorRanges, 
  onColorRangeChange 
}: { 
  selectedColorRanges: string[];
  onColorRangeChange: (colorRange: string) => void;
}) => {
  return (
   <div>
      <Label className="text-lg font-medium mb-4 block">Phổ Màu</Label>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {COLOR_RANGES.map((colorRange) => (
          <div key={colorRange.name} className="flex items-center space-x-2">
            <Checkbox
              id={`color-range-${colorRange.name}`}
              checked={selectedColorRanges.includes(colorRange.name)}
              onCheckedChange={() => onColorRangeChange(colorRange.name)}
              aria-label={`Chọn phổ màu ${colorRange.displayName}`}
              className="flex-shrink-0"
            />
            
            {/* Hình chữ nhật gradient với 3 màu */}
            <div 
              className="w-12 h-5 rounded-md border border-gray-300 shadow-sm flex-shrink-0"
              style={{
                background: `linear-gradient(to right, ${colorRange.gradientColors[0]} 0%, ${colorRange.gradientColors[1]} 50%, ${colorRange.gradientColors[2]} 100%)`,
                ...(colorRange.name === 'white' && {
                  border: '2px solid #d1d5db'
                })
              }}
              title={`Phổ màu ${colorRange.displayName}`}
            />
            
            {/* Tên màu */}
            <label
              htmlFor={`color-range-${colorRange.name}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
            >
              {colorRange.displayName}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

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

const ProductListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColorRanges, setSelectedColorRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Lấy danh sách sản phẩm và bình luận từ API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productResponse = await fetch("http://localhost:5261/api/SanPham/ListSanPham", {
          headers: { Accept: "application/json" },
        });

        if (!productResponse.ok) {
          throw new Error(`Lỗi ${productResponse.status}: Không thể tải danh sách sản phẩm`);
        }

        const productData = await productResponse.json();
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

        const mappedProducts: Product[] = productData.map((product: {
          id: string;
          name: string;
          moTa?: string;
          hinh: string[];
          donGia: number;
          loaiSanPham?: string;
          thuongHieu?: string;
          chatLieu?: string;
          kichThuoc: string[];
          mauSac: string[];
          hot?: boolean;
          listHashTag: HashTag[];
          gioiTinh?: string;
          trangThai?: number;
        }) => {
          const baseProductId = product.id.split("_")[0] || product.id;
          const productComments = commentData.filter(
            (comment: any) => comment.maSanPham === baseProductId && comment.trangThai === 1
          );
          const totalRating = productComments.reduce(
            (sum: number, comment: any) => sum + (comment.danhGia || 0),
            0
          );
          const averageRating = productComments.length > 0 ? totalRating / productComments.length : 0;
          const userFavorite = yeuThichData.find(
            (yeuThich: any) => yeuThich.maSanPham === baseProductId && yeuThich.maNguoiDung === currentUserId
          );

          return {
            id: product.id,
            name: product.name,
            description: product.moTa || `Thương hiệu: ${product.thuongHieu || "Không xác định"} <br/> Chất liệu: ${product.chatLieu || "Không xác định"}`,
            imageSrc: product.hinh[0] ? `data:image/jpeg;base64,${product.hinh[0]}` : "https://via.placeholder.com/300",
            price: product.donGia,
            category: product.loaiSanPham || "Không xác định",
            thuongHieu: product.thuongHieu || "Không xác định",
            chatLieu: product.chatLieu || "Không xác định",
            kichThuoc: product.kichThuoc || [],
            mauSac: product.mauSac || [],
            averageRating,
            commentCount: productComments.length,
            isFavorite: !!userFavorite,
            hot: product.hot || false,
            likedId: userFavorite?.maYeuThich,
            hashtags: product.listHashTag || [],
            gioiTinh: product.gioiTinh || "Không xác định",
            trangThai: product.trangThai || 0,
          };
        });

        setOriginalProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
        setPriceRange([
          Math.floor(Math.min(...mappedProducts.map((p) => p.price))),
          Math.ceil(Math.max(...mappedProducts.map((p) => p.price))),
        ]);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
        console.error("Lỗi khi lấy sản phẩm:", errorMessage);
        setError("Không thể tải sản phẩm. Vui lòng kiểm tra kết nối và thử lại.");
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Xử lý tham số danh mục từ URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    if (categoryParam && !selectedCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    } else if (!categoryParam && selectedCategories.length > 0) {
      setSelectedCategories([]);
    }
  }, [location.search]);

  // Lấy danh sách thương hiệu, danh mục, giới tính duy nhất
  const uniqueBrands = useMemo(
    () => [...new Set(originalProducts.map((product) => product.thuongHieu))].sort(),
    [originalProducts]
  );

  const uniqueCategories = useMemo(
    () => [...new Set(originalProducts.map((product) => product.category))].sort(),
    [originalProducts]
  );

  const uniqueGenders = useMemo(
    () => [...new Set(originalProducts.map((product) => product.gioiTinh))].sort(),
    [originalProducts]
  );

  // Tính toán giá tối thiểu và tối đa
  const minPrice = useMemo(
    () => Math.floor(Math.min(...originalProducts.map((p) => p.price)) || 0),
    [originalProducts]
  );

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...originalProducts.map((p) => p.price)) || Infinity),
    [originalProducts]
  );

  // Lọc và sắp xếp sản phẩm
  useEffect(() => {
    let result = [...originalProducts];

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    // Lọc theo phổ màu
    if (selectedColorRanges.length > 0) {
      result = result.filter((product) =>
        product.mauSac.some((color) => {
          const colorCategory = getColorCategory(color);
          return colorCategory && selectedColorRanges.includes(colorCategory);
        })
      );
    }

    // Lọc theo thương hiệu
    if (selectedBrands.length > 0) {
      result = result.filter((product) => selectedBrands.includes(product.thuongHieu));
    }

    // Lọc theo danh mục
    if (selectedCategories.length > 0) {
      result = result.filter((product) => selectedCategories.includes(product.category));
    }

    // Lọc theo giới tính
    if (selectedGenders.length > 0) {
      result = result.filter((product) => selectedGenders.includes(product.gioiTinh));
    }

    // Lọc theo khoảng giá
    result = result.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sắp xếp sản phẩm
    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "rating_desc":
          return b.averageRating - a.averageRating;
        default:
          return 0;
      }
    });

    setFilteredProducts(result);
  }, [
    originalProducts,
    searchQuery,
    selectedColorRanges,
    selectedBrands,
    selectedCategories,
    selectedGenders,
    priceRange,
    sortBy,
  ]);

  // Xử lý thay đổi bộ lọc
  const handleColorRangeChange = (colorRange: string) => {
    setSelectedColorRanges((prev) =>
      prev.includes(colorRange) ? prev.filter((c) => c !== colorRange) : [...prev, colorRange]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleGenderChange = (gender: string) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  // Xóa bộ lọc
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedColorRanges([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedGenders([]);
    setPriceRange([minPrice, maxPrice]);
    setSortBy("name_asc");
    setShowFilters(false);
    toast({
      title: "Đã xóa bộ lọc",
      description: "Tất cả bộ lọc đã được đặt lại về mặc định.",
    });
  };

  // Áp dụng bộ lọc (cho mobile)
  const applyFilters = () => {
    setShowFilters(false);
    toast({
      title: "Đã áp dụng bộ lọc",
      description: "Bộ lọc sản phẩm của bạn đã được áp dụng.",
    });
  };

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tìm kiếm",
      description: `Đã tìm kiếm: ${searchQuery}`,
    });
  };

  // Xử lý yêu thích
  const toggleFavorite = async (productId: string) => {
    try {
      const product = originalProducts.find(p => p.id === productId);
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
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Không thể xóa sản phẩm khỏi danh sách yêu thích");
        setOriginalProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: false, likedId: undefined } : p)
        );
        setFilteredProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: false, likedId: undefined } : p)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify(yeuThichData),
        });
        if (!response.ok) throw new Error("Không thể thêm sản phẩm vào danh sách yêu thích");
        const addedFavorite = await response.json();
        setOriginalProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p)
        );
        setFilteredProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p)
        );
        showNotification("Đã thêm sản phẩm vào danh sách yêu thích!", "success");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích!", "error");
    }
  };

  // Xử lý mua ngay
  const handleBuyNow = (product: Product) => {
    const cartItem = {
      id: product.id,
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

  const activeFiltersCount = [
    searchQuery,
    selectedColorRanges.length > 0 ? "colors" : null,
    selectedBrands.length > 0 ? "brands" : null,
    selectedCategories.length > 0 ? "categories" : null,
    selectedGenders.length > 0 ? "genders" : null,
    priceRange[0] > minPrice || priceRange[1] < maxPrice ? "price" : null
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-5xl mx-auto">
            {/* Floating Elements */}
            <div className="absolute top-10 left-10 animate-bounce">
              <Sparkles className="h-8 w-8 text-yellow-300 opacity-70" />
            </div>
            <div className="absolute top-20 right-20 animate-pulse">
              <Award className="h-10 w-10 text-pink-300 opacity-60" />
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Zap className="h-16 w-16 text-yellow-400 animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <TrendingUp className="h-6 w-6 text-green-400 animate-bounce" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-yellow-200 to-pink-200 bg-clip-text text-transparent leading-tight">
              Khám Phá Thời Trang
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-purple-100 leading-relaxed max-w-3xl mx-auto">
              Tìm kiếm những sản phẩm thời trang độc đáo và phong cách, được tuyển chọn kỹ lưỡng cho bạn
            </p>

            {/* Stats Row */}
            

            {/* Hero Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-3xl mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm, thương hiệu, màu sắc..."
                  className="pl-14 h-16 text-lg rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl focus:ring-4 focus:ring-white/30 focus:shadow-2xl transition-all duration-300 text-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-16 px-10 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <Search className="h-6 w-6 mr-3" />
                Tìm kiếm ngay
              </Button>
            </form>

            {/* Quick Categories */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {uniqueCategories.slice(0, 6).map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategories([category])}
                  className="rounded-full bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="relative">
          <svg 
            className="w-full h-12 text-slate-50" 
            preserveAspectRatio="none" 
            viewBox="0 0 1200 120" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              opacity=".25" 
              fill="currentColor"
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              opacity=".5" 
              fill="currentColor"
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 mx-auto max-w-7xl py-8">
        {/* Filters and Controls Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="h-12 px-6 rounded-full border-2 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc nâng cao
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-red-500 animate-pulse">{activeFiltersCount}</Badge>
              )}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-60 h-12 rounded-full border-2 shadow-md">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Tên: A đến Z</SelectItem>
                <SelectItem value="name_desc">Tên: Z đến A</SelectItem>
                <SelectItem value="price_asc">Giá: Thấp đến Cao</SelectItem>
                <SelectItem value="price_desc">Giá: Cao đến Thấp</SelectItem>
                <SelectItem value="rating_desc">Đánh giá cao nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border-2 rounded-full p-1 bg-white shadow-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-full"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-full"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 flex items-center bg-white px-4 py-2 rounded-full shadow-md">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              <span className="font-bold text-purple-600">{filteredProducts.length}</span> 
              <span className="ml-1">sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden m-4" onClick={(e) => e.stopPropagation()}>
              {/* Enhanced Modal Header */}
              <div className="flex justify-between items-center p-8 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white">
                <h2 className="text-3xl font-bold flex items-center">
                  <SlidersHorizontal className="h-8 w-8 mr-3" />
                  Bộ Lọc Thông Minh
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                  className="text-white hover:bg-white/20 rounded-full w-12 h-12"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Danh mục với icons */}
                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-gray-800 flex items-center">
                      <Package className="h-6 w-6 mr-3 text-purple-600" />
                      Danh Mục Sản Phẩm
                    </Label>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                      <div className="space-y-4">
                        {uniqueCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/80 transition-colors">
                            <Checkbox
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() => handleCategoryChange(category)}
                              className="rounded-md w-5 h-5"
                            />
                            <label
                              htmlFor={`category-${category}`}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Thương hiệu với styling */}
                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-gray-800 flex items-center">
                      <Award className="h-6 w-6 mr-3 text-blue-600" />
                      Thương Hiệu
                    </Label>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 max-h-80 overflow-y-auto">
                      <div className="space-y-4">
                        {uniqueBrands.map((brand) => (
                          <div key={brand} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/80 transition-colors">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={selectedBrands.includes(brand)}
                              onCheckedChange={() => handleBrandChange(brand)}
                              className="rounded-md w-5 h-5"
                            />
                            <label
                              htmlFor={`brand-${brand}`}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {brand}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Color Range Filter */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                      <ColorRangeFilter 
                        selectedColorRanges={selectedColorRanges}
                        onColorRangeChange={handleColorRangeChange}
                      />
                    </div>
                  </div>

                  {/* Giới tính */}
                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-gray-800 flex items-center">
                      <Users className="h-6 w-6 mr-3 text-pink-600" />
                      Giới Tính
                    </Label>
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6">
                      <div className="space-y-4">
                        {uniqueGenders.map((gender) => (
                          <div key={gender} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/80 transition-colors">
                            <Checkbox
                              id={`gender-${gender}`}
                              checked={selectedGenders.includes(gender)}
                              onCheckedChange={() => handleGenderChange(gender)}
                              className="rounded-md w-5 h-5"
                            />
                            <label
                              htmlFor={`gender-${gender}`}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {gender}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Khoảng giá */}
                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-gray-800">Khoảng Giá</Label>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
                      <Select
                        onValueChange={(value) => {
                          switch (value) {
                            case "all":
                              setPriceRange([minPrice, maxPrice]);
                              break;
                            case "under-100000":
                              setPriceRange([0, 100000]);
                              break;
                            case "100000-200000":
                              setPriceRange([100000, 200000]);
                              break;
                            case "200000-500000":
                              setPriceRange([200000, 500000]);
                              break;
                            case "over-500000":
                              setPriceRange([500000, maxPrice]);
                              break;
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-2">
                          <SelectValue placeholder="Chọn khoảng giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả giá</SelectItem>
                          <SelectItem value="under-100000">Dưới 100,000 VND</SelectItem>
                          <SelectItem value="100000-200000">100,000 - 200,000 VND</SelectItem>
                          <SelectItem value="200000-500000">200,000 - 500,000 VND</SelectItem>
                          <SelectItem value="over-500000">Trên 500,000 VND</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Modal Footer */}
              <div className="flex justify-between items-center p-8 bg-gray-50 border-t">
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="px-8 h-12 rounded-xl border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                >
                  Xóa Tất Cả Bộ Lọc
                </Button>
                <Button 
                  onClick={applyFilters} 
                  className="px-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Áp Dụng Bộ Lọc
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {error ? (
          <div className="py-20 text-center">
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-12">
              <div className="text-8xl mb-6">😔</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Oops! Có lỗi xảy ra</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="rounded-full px-8">
                Thử lại
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-20 text-center">
            <div className="relative">
              <div className="animate-spin h-16 w-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
              </div>
            </div>
            <p className="text-xl text-gray-600 font-medium">Đang tải sản phẩm thời trang tuyệt vời...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-12">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-600 mb-8">Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc để tìm được sản phẩm phù hợp</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={clearFilters} className="rounded-full px-8">
                  Xóa Tất Cả Bộ Lọc
                </Button>
                <Button variant="outline" className="rounded-full px-8">
                  Xem sản phẩm hot
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-8 flex items-center justify-between bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-semibold text-gray-800">
                    Hiển thị <span className="text-purple-600 font-bold">{filteredProducts.length}</span> sản phẩm
                  </span>
                </div>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {activeFiltersCount} bộ lọc đang áp dụng
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-purple-600"
                >
                  Chia sẻ kết quả
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8" : 
              "space-y-6"
            }>
              {filteredProducts.map((product) => (
                <Card key={product.id} className={`overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white ${
                  viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                }`}>
                  <div className={`relative ${viewMode === 'list' ? 'md:w-1/3 aspect-video md:aspect-square' : 'aspect-square'}`}>
                    <Link to={`/products/${product.id}`}>
                      <img
                        src={product.imageSrc}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </Link>
                    
                    {/* Enhanced Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.hot && product.trangThai === 1 ? (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
                          <Zap className="h-3 w-3 mr-1" />
                          Hot
                        </Badge>
                      ) : product.trangThai !== 1 ? (
                        <Badge className="bg-gray-500 text-white px-3 py-1 rounded-full">
                          Ngừng bán
                        </Badge>
                      ) : null}
                    </div>

                    {/* Enhanced Heart Button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 border-2 border-transparent hover:border-red-200"
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart
                        className={`h-5 w-5 transition-all duration-300 ${
                          product.isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-gray-600"
                        }`}
                      />
                    </Button>
                  </div>

                  <CardContent className={`p-6 ${viewMode === 'list' ? 'md:w-2/3 flex-1' : ''}`}>
                    <div className="space-y-4">
                      {/* Enhanced Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.averageRating) 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            ({product.commentCount})
                          </span>
                        </div>
                        {product.averageRating >= 4.5 && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Award className="h-3 w-3 mr-1" />
                            Top rated
                          </Badge>
                        )}
                      </div>

                      {/* Enhanced Title */}
                      <Link to={`/products/${product.id}`} className="block group-hover:text-purple-600 transition-colors">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-2 leading-tight hover:text-purple-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Enhanced Price */}
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-red-600">
                          {product.price.toLocaleString('vi-VN')} VND
                        </span>
                      </div>

                      {/* Enhanced Color Swatches */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Màu sắc:</span>
                        <div className="flex gap-1">
                          {product.mauSac.slice(0, 4).map((color) => (
                            <div
                              key={color}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: `#${color}` }}
                              title={`Màu #${color}`}
                            />
                          ))}
                          {product.mauSac.length > 4 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600">+{product.mauSac.length - 4}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Hashtags */}
                      <div className="flex flex-wrap gap-1">
                        {product.hashtags.slice(0, 3).map((hashtag) => (
                          <Badge
                            key={hashtag.id}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 text-xs px-2 py-1"
                          >
                            #{hashtag.name}
                          </Badge>
                        ))}
                        {product.hashtags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{product.hashtags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Enhanced Product Details */}
                      <div className="flex flex-wrap gap-1">
                        <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 text-xs">
                          {product.category}
                        </Badge>
                        <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs">
                          {product.chatLieu}
                        </Badge>
                        <Badge className="bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200 text-xs">
                          {product.gioiTinh}
                        </Badge>
                      </div>

                      {/* Enhanced Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-full hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
                        >
                          <Link to={`/products/${product.id}`}>
                            <Search className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Enhanced Stats Section */}
        {filteredProducts.length > 0 && (
          <div className="mt-20 bg-gradient-to-r from-purple-100 via-pink-50 to-indigo-100 rounded-3xl p-12 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Thống Kê Sản Phẩm</h2>
              <p className="text-gray-600">Khám phá những con số thú vị về bộ sưu tập của chúng tôi</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">{filteredProducts.length}</div>
                <div className="text-gray-600 font-medium">Sản phẩm hiện có</div>
              </div>
              <div className="text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <Star className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {filteredProducts.length > 0 ? 
                    Math.round(filteredProducts.reduce((sum, product) => sum + product.averageRating, 0) / filteredProducts.length * 10) / 10 : 0}
                </div>
                <div className="text-gray-600 font-medium">Đánh giá trung bình</div>
              </div>
              <div className="text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {uniqueBrands.length}
                </div>
                <div className="text-gray-600 font-medium">Thương hiệu</div>
              </div>
              <div className="text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {filteredProducts.filter(p => p.hot).length}
                </div>
                <div className="text-gray-600 font-medium">Sản phẩm hot</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Call to Action */}
        <div className="mt-20 text-center bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 text-white rounded-3xl p-16 shadow-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 opacity-20">
            <Sparkles className="h-20 w-20 animate-spin" />
          </div>
          <div className="absolute bottom-10 right-10 opacity-20">
            <Star className="h-16 w-16 animate-bounce" />
          </div>
          
          <Sparkles className="h-20 w-20 mx-auto mb-8 text-yellow-400 animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Chưa tìm thấy sản phẩm ưng ý?</h2>
          <p className="text-xl md:text-2xl mb-10 text-purple-100 max-w-2xl mx-auto leading-relaxed">
            Đăng ký nhận thông báo về sản phẩm mới và ưu đãi độc quyền dành riêng cho bạn
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto mb-8">
            <div className="relative flex-1">
              <Input 
                type="email" 
                placeholder="Nhập email để nhận thông báo..." 
                className="h-16 rounded-2xl border-0 bg-white/95 backdrop-blur-sm text-gray-800 pl-6 pr-6 text-lg shadow-xl focus:ring-4 focus:ring-white/30"
              />
            </div>
            <Button 
              size="lg" 
              className="h-16 px-10 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <Zap className="h-5 w-5 mr-3" />
              Đăng ký ngay
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-2xl px-8 h-14 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300"
            >
              Liên hệ tư vấn
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="rounded-2xl px-8 h-14 text-lg font-semibold bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-purple-600 transition-all duration-300"
            >
              Xem combo hot
            </Button>
          </div>
        </div>

        {/* Enhanced Newsletter Section */}
        <div className="mt-20 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-800">Tham gia cộng đồng thời trang</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Cập nhật xu hướng mới nhất, tips phối đồ và những ưu đãi đặc biệt chỉ dành cho thành viên
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Xu hướng mới</h4>
                  <p className="text-sm text-gray-600">Cập nhật trends thời trang hot nhất</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Ưu đãi độc quyền</h4>
                  <p className="text-sm text-gray-600">Giảm giá và khuyến mãi đặc biệt</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Tips phối đồ</h4>
                  <p className="text-sm text-gray-600">Hướng dẫn mix & match chuyên nghiệp</p>
                </div>
              </div>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <Input 
                  type="email" 
                  placeholder="Email của bạn" 
                  className="flex-1 h-14 rounded-2xl border-2 px-6 text-lg focus:ring-2 focus:ring-purple-500"
                />
                <Button 
                  type="submit" 
                  className="h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Tham gia ngay
                </Button>
              </form>
              
              <p className="text-xs text-gray-500 mt-4">
                Bằng cách đăng ký, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của chúng tôi
              </p>
            </div>
          </div>
        </div>

        {/* Floating Back to Top Button */}
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-40"
          size="icon"
        >
          <TrendingUp className="h-6 w-6 rotate-180" />
        </Button>
      </div>
    </div>
  );
};
export default ProductListing;