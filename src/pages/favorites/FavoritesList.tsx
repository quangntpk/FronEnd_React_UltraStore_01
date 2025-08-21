import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, SlidersHorizontal, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

// Define interfaces
interface UserData {
  maNguoiDung?: string;
  hoTen?: string;
}

interface HashTag {
  id: number;
  name: string;
}

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

interface Combo {
  id: number;
  name: string;
  description: string;
  imageSrc: string;
  price: number;
  products: string[];
  productCount: number;
  rating: number;
  isFavorite: boolean;
  occasion: string;
  savings: number;
  savingsPercentage: number;
  likedId?: string;
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

const YeuThich = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [minItems, setMinItems] = useState<string | undefined>(undefined);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const userData: UserData = JSON.parse(localStorage.getItem("user") || "null");
        setIsLoggedIn(!!userData);
        const currentUserId = userData?.maNguoiDung || null;

        if (!currentUserId) {
          setIsLoading(false);
          showNotification("Vui lòng đăng nhập để xem danh sách yêu thích!", "warning").then(() => {
            navigate("/login");
          });
          return;
        }

        // Lấy danh sách yêu thích
        const yeuThichResponse = await fetch(
          `https://localhost:7051/api/YeuThich?maNguoiDung=${currentUserId}`,
          {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
          }
        );
        if (!yeuThichResponse.ok) throw new Error("Không thể lấy danh sách yêu thích");
        const yeuThichData = await yeuThichResponse.json();

        // Lấy danh sách sản phẩm
        const productResponse = await fetch("https://localhost:7051/api/SanPham/ListSanPham", {
          headers: { Accept: "application/json" },
        });
        if (!productResponse.ok) throw new Error("Không thể tải danh sách sản phẩm");
        const productData = await productResponse.json();

        // Lấy danh sách bình luận
        const commentResponse = await fetch("https://localhost:7051/api/Comment/list");
        if (!commentResponse.ok) throw new Error("Không thể tải bình luận");
        const commentData = await commentResponse.json();

        // Map sản phẩm
        const mappedProducts: Product[] = productData.map((product: any) => {
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
        }).filter((product) => product.isFavorite);

        // Lấy danh sách combo
        const comboResponse = await fetch("https://localhost:7051/api/Combo/ComboSanPhamView");
        if (!comboResponse.ok) throw new Error("Không thể tải danh sách combo");
        const comboData = await comboResponse.json();

        const mappedCombos: Combo[] = comboData.map((item: ApiCombo) => {
          const userFavorite = yeuThichData.find(
            (yeuThich: any) => yeuThich.maCombo === item.maCombo && yeuThich.maNguoiDung === currentUserId
          );
          return {
            id: item.maCombo,
            name: item.name || "Không có tên",
            description: item.moTa || "Không có mô tả",
            imageSrc: item.hinhAnh ? `data:image/jpeg;base64,${item.hinhAnh}` : "/placeholder-image.jpg",
            price: item.gia || 0,
            products: Array.isArray(item.sanPhams) ? item.sanPhams.map((p) => p.name || "Không có tên") : [],
            productCount: Array.isArray(item.sanPhams) ? item.sanPhams.length : 0,
            rating: 4 + Math.random() * 0.9,
            isFavorite: !!userFavorite,
            occasion: item.moTa?.includes("Casual")
              ? "Casual"
              : item.moTa?.includes("Office")
              ? "Office"
              : item.moTa?.includes("Evening")
              ? "Evening"
              : item.moTa?.includes("Athletic")
              ? "Athletic"
              : "Other",
            savings: item.gia * 0.15,
            savingsPercentage: 15,
            likedId: userFavorite?.maYeuThich,
          };
        }).filter((combo) => combo.isFavorite);

        setProducts(mappedProducts);
        setCombos(mappedCombos);
        setFilteredProducts(mappedProducts);
        setFilteredCombos(mappedCombos);
        setPriceRange([
          Math.min(...[...mappedProducts, ...mappedCombos].map((item) => item.price)) || 0,
          Math.max(...[...mappedProducts, ...mappedCombos].map((item) => item.price)) || 0,
        ]);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách yêu thích:", err);
        setError("Không thể tải danh sách yêu thích. Vui lòng thử lại sau.");
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách yêu thích",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [navigate]);

  // Lấy danh sách màu sắc, kích thước, thương hiệu, danh mục, giới tính, dịp sử dụng duy nhất
  const uniqueColors = useMemo<string[]>(
    () => [...new Set(products.flatMap((product) => product.mauSac))].sort(),
    [products]
  );

  const uniqueSizes = useMemo<string[]>(
    () => [...new Set(products.flatMap((product) => product.kichThuoc))].sort(),
    [products]
  );

  const uniqueBrands = useMemo<string[]>(
    () => [...new Set(products.map((product) => product.thuongHieu))].sort(),
    [products]
  );

  const uniqueCategories = useMemo<string[]>(
    () => [...new Set(products.map((product) => product.category || ''))].sort(),
    [products]
  );

  const uniqueGenders = useMemo<string[]>(
    () => [...new Set(products.map((product) => product.gioiTinh))].sort(),
    [products]
  );

  const uniqueOccasions = useMemo<string[]>(
    () => [...new Set(combos.map((combo) => combo.occasion))].sort(),
    [combos]
  );

  const minPrice = useMemo(
    () => {
      const allItems = [...products, ...combos];
      return allItems.length > 0 ? Math.floor(Math.min(...allItems.map((item) => item.price))) : 0;
    },
    [products, combos]
  );

  const maxPrice = useMemo(
    () => {
      const allItems = [...products, ...combos];
      return allItems.length > 0 ? Math.ceil(Math.max(...allItems.map((item) => item.price))) : 0;
    },
    [products, combos]
  );

  // Lọc và sắp xếp
  useEffect(() => {
    let resultProducts = [...products];
    let resultCombos = [...combos];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      resultProducts = resultProducts.filter((product) => product.name.toLowerCase().includes(query));
      resultCombos = resultCombos.filter((combo) => combo.name.toLowerCase().includes(query));
    }

    // Lọc sản phẩm
    if (selectedColors.length > 0) {
      resultProducts = resultProducts.filter((product) =>
        selectedColors.some((color) => product.mauSac.includes(color))
      );
    }

    if (selectedSizes.length > 0) {
      resultProducts = resultProducts.filter((product) =>
        selectedSizes.some((size) => product.kichThuoc.includes(size))
      );
    }

    if (selectedBrands.length > 0) {
      resultProducts = resultProducts.filter((product) => selectedBrands.includes(product.thuongHieu));
    }

    if (selectedCategories.length > 0) {
      resultProducts = resultProducts.filter((product) => selectedCategories.includes(product.category));
    }

    if (selectedGenders.length > 0) {
      resultProducts = resultProducts.filter((product) => selectedGenders.includes(product.gioiTinh));
    }

    // Lọc combo
    if (minItems) {
      resultCombos = resultCombos.filter((combo) => combo.productCount >= parseInt(minItems));
    }

    if (selectedOccasions.length > 0) {
      resultCombos = resultCombos.filter((combo) => selectedOccasions.includes(combo.occasion));
    }

    if (priceRange[0] > 0 || priceRange[1] > 0) {
      resultProducts = resultProducts.filter(
        (product) =>
          (priceRange[0] === 0 || product.price >= priceRange[0]) &&
          (priceRange[1] === 0 || product.price <= priceRange[1])
      );
      resultCombos = resultCombos.filter(
        (combo) =>
          (priceRange[0] === 0 || combo.price >= priceRange[0]) &&
          (priceRange[1] === 0 || combo.price <= priceRange[1])
      );
    }

    // Sắp xếp
    const sortFunction = (a: Product | Combo, b: Product | Combo) => {
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
          return ("averageRating" in b ? b.averageRating : b.rating) - ("averageRating" in a ? a.averageRating : a.rating);
        case "items_desc":
          return ("productCount" in b ? b.productCount : 0) - ("productCount" in a ? a.productCount : 0);
        default:
          return 0;
      }
    };

    resultProducts.sort(sortFunction);
    resultCombos.sort(sortFunction);

    setFilteredProducts(resultProducts);
    setFilteredCombos(resultCombos);
  }, [
    products,
    combos,
    searchQuery,
    selectedColors,
    selectedSizes,
    selectedBrands,
    selectedCategories,
    selectedGenders,
    minItems,
    selectedOccasions,
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

  const handleGenderChange = (gender: string) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const handleOccasionChange = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedGenders([]);
    setMinItems(undefined);
    setSelectedOccasions([]);
    setPriceRange([minPrice, maxPrice]);
    setSortBy("name_asc");
    setShowFilters(false);
    toast({
      title: "Đã xóa bộ lọc",
      description: "Tất cả bộ lọc đã được đặt lại về mặc định.",
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    toast({
      title: "Đã áp dụng bộ lọc",
      description: "Bộ lọc của bạn đã được áp dụng.",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tìm kiếm",
      description: `Đã tìm kiếm: ${searchQuery}`,
    });
  };

  const toggleFavorite = async (item: Product | Combo) => {
    try {
      const userData: UserData = JSON.parse(localStorage.getItem("user") || "null");
      const userId = userData?.maNguoiDung;
      const hoTen = userData?.hoTen;

      if (!userId) {
        showNotification("Vui lòng đăng nhập để cập nhật danh sách yêu thích!", "warning").then(() => {
          navigate("/login");
        });
        return;
      }

      if (item.isFavorite) {
        const response = await fetch(`https://localhost:7051/api/YeuThich/${item.likedId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Không thể xóa khỏi danh sách yêu thích");
        if ("mauSac" in item) {
          setProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, isFavorite: false, likedId: undefined } : p))
          );
          setFilteredProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, isFavorite: false, likedId: undefined } : p))
          );
        } else {
          setCombos((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, isFavorite: false, likedId: undefined } : c))
          );
          setFilteredCombos((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, isFavorite: false, likedId: undefined } : c))
          );
        }
        showNotification("Đã xóa khỏi danh sách yêu thích!", "success");
      } else {
        const yeuThichData = {
          maSanPham: "mauSac" in item ? item.id.split("_")[0] || item.id : undefined,
          tenSanPham: "mauSac" in item ? item.name : undefined,
          maCombo: "productCount" in item ? item.id : undefined,
          tenCombo: "productCount" in item ? item.name : undefined,
          maNguoiDung: userId,
          hoTen: hoTen,
          soLuongYeuThich: 1,
          ngayYeuThich: new Date().toISOString(),
        };
        const response = await fetch("https://localhost:7051/api/YeuThich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify(yeuThichData),
        });
        if (!response.ok) throw new Error("Không thể thêm vào danh sách yêu thích");
        const addedFavorite = await response.json();
        if ("mauSac" in item) {
          setProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p))
          );
          setFilteredProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p))
          );
        } else {
          setCombos((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, isFavorite: true, likedId: addedFavorite.maYeuThich } : c))
          );
          setFilteredCombos((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, isFavorite: true, likedId: addedFavorite.maYeuThich } : c))
          );
        }
        showNotification("Đã thêm vào danh sách yêu thích!", "success");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích!", "error");
    }
  };

  const handleBuyNow = (item: Product | Combo) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      image: item.imageSrc,
      price: item.price,
      quantity: 1,
      type: "mauSac" in item ? "product" : "combo",
    };
    console.log("Đã thêm vào giỏ hàng:", cartItem);
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${item.name} đã được thêm vào giỏ hàng của bạn.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl py-8">
          <h1 className="text-3xl font-bold mb-6 gradient-text">Danh Sách Yêu Thích</h1>

          {/* Thanh tìm kiếm và nút bộ lọc */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm trong danh sách yêu thích..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Tìm kiếm sản phẩm và combo yêu thích"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
              <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Bộ Lọc</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Bộ lọc sản phẩm */}
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

                    <Label className="text-lg font-medium mb-3 mt-4 block">Thương Hiệu</Label>
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

                    {/* <Label className="text-lg font-medium mb-3 mt-4 block">Màu Sắc</Label>
                    <div className="space-y-2">
                      {uniqueColors.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={selectedColors.includes(color)}
                            onCheckedChange={() => handleColorChange(color)}
                            aria-label={`Chọn màu ${color}`}
                          />
                          <span
                            className="inline-block w-5 h-5 rounded-full border border-gray-300"
                            style={{ backgroundColor: `#${color.replace(/^#/, '')}` }}
                            title={`Màu #${color.replace(/^#/, '')}`}
                          />
                          <label
                            htmlFor={`color-${color}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {`Màu ${color.replace(/^#/, '')}`}
                          </label>
                        </div>
                      ))}
                    </div> */}

                    <Label className="text-lg font-medium mb-3 mt-4 block">Kích Thước</Label>
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

                    <Label className="text-lg font-medium mb-3 mt-4 block">Giới Tính</Label>
                    <div className="space-y-2">
                      {uniqueGenders.map((gender) => (
                        <div key={gender} className="flex items-center space-x-2">
                          <Checkbox
                            id={`gender-${gender}`}
                            checked={selectedGenders.includes(gender)}
                            onCheckedChange={() => handleGenderChange(gender)}
                            aria-label={`Chọn giới tính ${gender}`}
                          />
                          <label
                            htmlFor={`gender-${gender}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {gender}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bộ lọc combo */}
                  <div>
                    <Label className="text-lg font-medium mb-3 block">Dịp Sử Dụng</Label>
                    <div className="space-y-2">
                      {uniqueOccasions.map((occasion) => (
                        <div key={occasion} className="flex items-center space-x-2">
                          <Checkbox
                            id={`occasion-${occasion}`}
                            checked={selectedOccasions.includes(occasion)}
                            onCheckedChange={() => handleOccasionChange(occasion)}
                            aria-label={`Chọn dịp sử dụng ${occasion}`}
                          />
                          <label
                            htmlFor={`occasion-${occasion}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {occasion}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Label className="text-lg font-medium mb-3 mt-4 block">Số Lượng Sản Phẩm Tối Thiểu</Label>
                    <Select value={minItems || ""} onValueChange={setMinItems}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn số lượng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="2">2 sản phẩm trở lên</SelectItem>
                        <SelectItem value="3">3 sản phẩm trở lên</SelectItem>
                        <SelectItem value="4">4 sản phẩm trở lên</SelectItem>
                        <SelectItem value="5">5 sản phẩm trở lên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bộ lọc chung */}
                  <div>
                    <Label className="text-lg font-medium mb-3 block">Khoảng Giá</Label>
                    <div className="space-y-3">
                      <div className="px-3">
                        <Slider
                          min={0}
                          max={maxPrice}
                          step={10000}
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <span>{priceRange[0].toLocaleString('vi-VN')} VND</span>
                          <span>{priceRange[1].toLocaleString('vi-VN')} VND</span>
                        </div>
                      </div>
                    </div>

                    <Label className="text-lg font-medium mb-3 mt-4 block">Sắp Xếp Theo</Label>
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
                        <SelectItem value="items_desc">Số sản phẩm: Nhiều nhất</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={resetFilters}>
                    Xóa Bộ Lọc
                  </Button>
                  <Button onClick={applyFilters}>Áp Dụng</Button>
                </div>
              </div>
            </div>
          )}

          {/* Kết quả hiển thị */}
          {error ? (
            <div className="py-12 text-center text-red-500" role="alert">{error}</div>
          ) : isLoading ? (
            <div className="py-12 text-center">
              <p>Đang tải danh sách yêu thích...</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Vui lòng đăng nhập</h3>
              <p className="text-gray-600 mb-4">Đăng nhập để xem danh sách yêu thích của bạn.</p>
              <Button asChild>
                <Link to="/login" aria-label="Đăng nhập">Đăng nhập ngay</Link>
              </Button>
            </div>
          ) : filteredProducts.length === 0 && filteredCombos.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Chưa có sản phẩm hoặc combo yêu thích</h3>
              <p className="text-gray-600 mb-4">Hãy thêm sản phẩm hoặc combo vào danh sách yêu thích để xem tại đây.</p>
              <Button asChild>
                <Link to="/products" aria-label="Xem tất cả sản phẩm">Xem tất cả sản phẩm</Link>
              </Button>
              <Button asChild className="ml-2">
                <Link to="/combos" aria-label="Xem tất cả combo">Xem tất cả combo</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Sản phẩm yêu thích */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Sản Phẩm Yêu Thích</h2>
                {filteredProducts.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-gray-600">Chưa có sản phẩm yêu thích nào.</p>
                    <Button asChild className="mt-4">
                      <Link to="/products" aria-label="Xem tất cả sản phẩm">Xem tất cả sản phẩm</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-gray-600">{filteredProducts.length} sản phẩm yêu thích được tìm thấy</p>
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
                            {product.hot && product.trangThai === 1 ? (
                              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                                Đang bán chạy
                              </Badge>
                            ) : product.trangThai !== 1 ? (
                              <Badge className="absolute top-2 left-2 bg-gray-500 text-white">
                                Đã ngừng bán
                              </Badge>
                            ) : null}
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/80 hover:bg-white"
                              onClick={() => toggleFavorite(product)}
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
                            <div className="mt-2 flex flex-wrap gap-1">
                              {product.hashtags.slice(0, 3).map((hashtag) => (
                                <Badge
                                  key={hashtag.id}
                                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                                >
                                  #{hashtag.name}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                {product.category}
                              </Badge>
                              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                {product.chatLieu}
                              </Badge>
                              <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                                {product.gioiTinh}
                              </Badge>
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

              {/* Combo yêu thích */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Combo Yêu Thích</h2>
                {filteredCombos.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-gray-600">Chưa có combo yêu thích nào.</p>
                    <Button asChild className="mt-4">
                      <Link to="/combos" aria-label="Xem tất cả combo">Xem tất cả combo</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-gray-600">{filteredCombos.length} combo yêu thích được tìm thấy</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredCombos.map((combo) => (
                        <Card key={combo.id} className="overflow-hidden group">
                          <div className="relative aspect-square">
                            <Link to={`/combos/${combo.id}`} aria-label={`Xem chi tiết ${combo.name}`}>
                              <img
                                src={combo.imageSrc}
                                alt={combo.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/80 hover:bg-white"
                              onClick={() => toggleFavorite(combo)}
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
                            <Link to={`/combos/${combo.id}`} aria-label={`Xem chi tiết ${combo.name}`}>
                              <h3 className="font-medium hover:text-crocus-600 transition-colors">
                                {combo.name}
                              </h3>
                            </Link>
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-semibold">{combo.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</p>
                              <p className="text-green-600 font-medium">
                                Tiết Kiệm {combo.savings.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND ({combo.savingsPercentage}% off)
                              </p>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Link to={`/combos/${combo.id}`} aria-label={`Xem chi tiết ${combo.name}`}>
                                  Chi tiết
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-crocus-500 hover:bg-crocus-600"
                                onClick={() => handleBuyNow(combo)}
                                aria-label={`Mua ngay ${combo.name}`}
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default YeuThich;