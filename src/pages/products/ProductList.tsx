import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, SlidersHorizontal, Star } from "lucide-react";
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

const ProductListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [showFilters, setShowFilters] = useState(false);

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

  // Lấy danh sách màu sắc, kích thước, thương hiệu, danh mục duy nhất
  const uniqueColors = useMemo(
    () => [...new Set(originalProducts.flatMap((product) => product.mauSac))].sort(),
    [originalProducts]
  );

  const uniqueSizes = useMemo(
    () => [...new Set(originalProducts.flatMap((product) => product.kichThuoc))].sort(),
    [originalProducts]
  );

  const uniqueBrands = useMemo(
    () => [...new Set(originalProducts.map((product) => product.thuongHieu))].sort(),
    [originalProducts]
  );

  const uniqueCategories = useMemo(
    () => [...new Set(originalProducts.map((product) => product.category))].sort(),
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

    // Lọc theo màu sắc
    if (selectedColors.length > 0) {
      result = result.filter((product) =>
        selectedColors.some((color) => product.mauSac.includes(color))
      );
    }

    // Lọc theo kích thước
    if (selectedSizes.length > 0) {
      result = result.filter((product) =>
        selectedSizes.some((size) => product.kichThuoc.includes(size))
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
    selectedColors,
    selectedSizes,
    selectedBrands,
    selectedCategories,
    priceRange,
    sortBy,
  ]);

  // Xử lý thay đổi bộ lọc
  const handleColorChange = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSizeChange = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
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

  // Xóa bộ lọc
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
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

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl py-8">
          <h1 className="text-3xl font-bold mb-6 gradient-text">Tất Cả Sản Phẩm</h1>

          {/* Thanh tìm kiếm và nút bộ lọc */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Tìm kiếm sản phẩm"
                />
              </div>
              <Button type="submit" size="sm" className="ml-2" aria-label="Tìm kiếm">
                Tìm kiếm
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Mở bộ lọc"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Bộ lọc */}
          {showFilters && (
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Danh mục */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Danh Mục</Label>
                  <div className="space-y-2">
                    {uniqueCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryChange(category)}
                          aria-label={`Chọn danh mục ${category}`}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thương hiệu */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Thương Hiệu</Label>
                  <div className="space-y-2">
                    {uniqueBrands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => handleBrandChange(brand)}
                          aria-label={`Chọn thương hiệu ${brand}`}
                        />
                        <label
                          htmlFor={`brand-${brand}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Màu sắc */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Màu Sắc</Label>
                  <div className="space-y-2">
                    {uniqueColors.map((color) => (
                      <div key={color} className="flex items-center space-x-2">
                        <Checkbox
                          id={`color-${color}`}
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => handleColorChange(color)}
                          aria-label={`Chọn màu ${color}`}
                        />
                        <label
                          htmlFor={`color-${color}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kích thước */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Kích Thước</Label>
                  <div className="space-y-2">
                    {uniqueSizes.map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`size-${size}`}
                          checked={selectedSizes.includes(size)}
                          onCheckedChange={() => handleSizeChange(size)}
                          aria-label={`Chọn kích thước ${size}`}
                        />
                        <label
                          htmlFor={`size-${size}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Khoảng giá */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Khoảng Giá</Label>
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
                    aria-label="Chọn khoảng giá"
                  >
                    <SelectTrigger className="w-full">
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

                {/* Sắp xếp */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Sắp Xếp Theo</Label>
                  <Select value={sortBy} onValueChange={setSortBy} aria-label="Chọn cách sắp xếp">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn cách sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Tên: A đến Z</SelectItem>
                      <SelectItem value="name_desc">Tên: Z đến A</SelectItem>
                      <SelectItem value="price_asc">Giá: Thấp đến Cao</SelectItem>
                      <SelectItem value="price_desc">Giá: Cao đến Thấp</SelectItem>
                      <SelectItem value="rating_desc">Đánh giá: Cao nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <Button variant="outline" onClick={clearFilters} aria-label="Xóa bộ lọc">
                  Xóa Bộ Lọc
                </Button>
                <Button onClick={applyFilters} aria-label="Áp dụng bộ lọc">
                  Áp Dụng Bộ Lọc
                </Button>
              </div>
            </div>
          )}

          {/* Kết quả tìm kiếm */}
          {error ? (
            <div className="py-12 text-center text-red-500" role="alert">{error}</div>
          ) : isLoading ? (
            <div className="py-12 text-center">
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-600 mb-4">Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc</p>
              <Button onClick={clearFilters} aria-label="Xóa tất cả bộ lọc">
                Xóa Tất Cả Bộ Lọc
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600">{filteredProducts.length} sản phẩm được tìm thấy</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden group">
                    <div className="relative aspect-square">
                      <Link to={`/products/${product.id}`} aria-label={`Xem chi tiết ${product.name}`}>
                        <img
                          src={product.imageSrc}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </Link>
                      {/* {product.hot && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                          Đang bán chạy
                        </Badge>
                      )} */}
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
                      <Link to={`/products/${product.id}`} aria-label={`Xem chi tiết ${product.name}`}>
                        <h3 className="font-medium hover:text-crocus-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-semibold">{product.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</p>
                        <div className="flex items-center gap-1" aria-label={`Đánh giá ${product.averageRating} sao`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(product.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                          <span className="text-sm text-gray-600">({product.commentCount})</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.mauSac.slice(0, 3).map((color) => (
                          <span
                            key={color}
                            className="inline-block w-5 h-5 rounded-full border border-gray-300"
                            style={{ backgroundColor: `#${color}` }}
                            title={`Màu #${color}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.kichThuoc.slice(0, 3).map((size) => (
                          <span
                            key={size}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Link to={`/products/${product.id}`} aria-label={`Xem chi tiết ${product.name}`}>
                            Chi tiết
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-crocus-500 hover:bg-crocus-600"
                          onClick={() => handleBuyNow(product)}
                          aria-label={`Mua ngay ${product.name}`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Mua ngay
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductListing;