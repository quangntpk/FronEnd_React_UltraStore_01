import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

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

// Interface cho Combo
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

const CombosList = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minItems, setMinItems] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Lấy danh sách combo từ API
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:5261/api/Combo/ComboSanPhamView");
        if (!response.ok) {
          throw new Error("Không thể tải danh sách combo");
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu API không phải là mảng");
        }

        const transformedCombos = data.map((item: ApiCombo) => ({
          id: item.maCombo,
          name: item.name || "Không có tên",
          description: item.moTa || "Không có mô tả",
          imageSrc:
            item.hinhAnh
              ? `data:image/jpeg;base64,${item.hinhAnh}`
              : "/placeholder-image.jpg",
          price: item.gia || 0,
          products: Array.isArray(item.sanPhams)
            ? item.sanPhams.map((p) => p.name || "Không có tên")
            : [],
          productCount: Array.isArray(item.sanPhams) ? item.sanPhams.length : 0,
          rating: 4 + Math.random() * 0.9,
          isFavorite: false,
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
        }));

        // Kiểm tra trạng thái yêu thích
        try {
          const userData: UserData = JSON.parse(localStorage.getItem("user") || "{}");
          const currentUserId = userData?.maNguoiDung;
          if (currentUserId) {
            const response = await fetch("http://localhost:5261/api/YeuThich", {
              headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) throw new Error("Không thể lấy danh sách yêu thích");
            const yeuThichData = await response.json();
            const updatedCombos = transformedCombos.map(combo => {
              const userFavorite = yeuThichData.find(
                (yeuThich: any) => yeuThich.maCombo === combo.id && yeuThich.maNguoiDung === currentUserId
              );
              return {
                ...combo,
                isFavorite: !!userFavorite,
                likedId: userFavorite?.maYeuThich,
              };
            });
            setCombos(updatedCombos);
            setFilteredCombos(updatedCombos);
          } else {
            setCombos(transformedCombos);
            setFilteredCombos(transformedCombos);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra yêu thích:", error);
          setCombos(transformedCombos);
          setFilteredCombos(transformedCombos);
        }

        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy combo:", err);
        setError("Không thể tải combo. Vui lòng thử lại sau.");
        toast({
          title: "Lỗi",
          description: "Không thể tải combo",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCombos();
  }, []);

  // Lấy danh sách dịp sử dụng duy nhất
  const uniqueOccasions = useMemo(
    () => [...new Set(combos.map((combo) => combo.occasion))].sort(),
    [combos]
  );

  // Tính toán giá tối thiểu và tối đa
  const minPrice = useMemo(
    () => (combos.length > 0 ? Math.floor(Math.min(...combos.map((c) => c.price))) : 0),
    [combos]
  );
  const maxPrice = useMemo(
    () => (combos.length > 0 ? Math.ceil(Math.max(...combos.map((c) => c.price))) : 0),
    [combos]
  );

  // Lọc và sắp xếp combo
  useEffect(() => {
    let result = [...combos];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter((combo) => combo.name.toLowerCase().includes(query));
    }

    // Lọc theo số lượng sản phẩm tối thiểu
    if (minItems) {
      result = result.filter((combo) => combo.productCount >= parseInt(minItems));
    }

    // Lọc theo dịp sử dụng
    if (selectedOccasions.length > 0) {
      result = result.filter((combo) => selectedOccasions.includes(combo.occasion));
    }

    // Lọc theo khoảng giá
    if (priceRange[0] > 0 || priceRange[1] > 0) {
      result = result.filter(
        (combo) =>
          (priceRange[0] === 0 || combo.price >= priceRange[0]) &&
          (priceRange[1] === 0 || combo.price <= priceRange[1])
      );
    }

    // Sắp xếp combo
    switch (sortBy) {
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating_desc":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "items_desc":
        result.sort((a, b) => b.productCount - a.productCount);
        break;
      default:
        break;
    }

    setFilteredCombos(result);
  }, [combos, searchTerm, minItems, selectedOccasions, priceRange, sortBy]);

  // Xử lý thay đổi bộ lọc
  const handleOccasionChange = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tìm kiếm",
      description: `Đã tìm kiếm: ${searchTerm}`,
    });
  };

  // Xóa bộ lọc
  const resetFilters = () => {
    setSearchTerm("");
    setMinItems("");
    setPriceRange([0, 0]);
    setSortBy("name_asc");
    setSelectedOccasions([]);
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
      description: "Bộ lọc combo của bạn đã được áp dụng.",
    });
  };

  // Xử lý yêu thích
  const toggleFavorite = async (comboId: number) => {
    try {
      const combo = combos.find(c => c.id === comboId);
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
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Không thể xóa combo khỏi danh sách yêu thích");
        setFilteredCombos((prev) =>
          prev.map((c) => c.id === comboId ? { ...c, isFavorite: false, likedId: undefined } : c)
        );
        setCombos((prev) =>
          prev.map((c) => c.id === comboId ? { ...c, isFavorite: false, likedId: undefined } : c)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(yeuThichData),
        });
        if (!response.ok) throw new Error("Không thể thêm combo vào danh sách yêu thích");
        const addedFavorite = await response.json();
        setFilteredCombos((prev) =>
          prev.map((c) => c.id === comboId ? { ...c, isFavorite: true, likedId: addedFavorite.maYeuThich } : c)
        );
        setCombos((prev) =>
          prev.map((c) => c.id === comboId ? { ...c, isFavorite: true, likedId: addedFavorite.maYeuThich } : c)
        );
        showNotification("Đã thêm combo vào danh sách yêu thích!", "success");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích!", "error");
    }
  };

  // Xử lý mua ngay
  const handleBuyNow = (combo: Combo) => {
    const cartItem = {
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Combo Thời Trang</h1>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm combo..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" className="ml-2">
            Tìm kiếm
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-lg font-medium mb-3 block">Dịp Sử Dụng</Label>
              <div className="space-y-2">
                {uniqueOccasions.map((occasion) => (
                  <div key={occasion} className="flex items-center space-x-2">
                    <Checkbox
                      id={`occasion-${occasion}`}
                      checked={selectedOccasions.includes(occasion)}
                      onCheckedChange={() => handleOccasionChange(occasion)}
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
            </div>

            <div>
              <Label className="text-lg font-medium mb-3 block">Số Lượng Sản Phẩm Tối Thiểu</Label>
              <Select value={minItems} onValueChange={setMinItems}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn số lượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="2">2 sản phẩm trở lên</SelectItem>
                  <SelectItem value="3">3 sản phẩm trở lên</SelectItem>
                  <SelectItem value="4">4 sản phẩm trở lên</SelectItem>
                  <SelectItem value="5">5 sản phẩm trở lên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-lg font-medium mb-3 block">Khoảng Giá</Label>
              <Select
                onValueChange={(value) => {
                  switch (value) {
                    case "all":
                      setPriceRange([0, 0]);
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

            <div>
              <Label className="text-lg font-medium mb-3 block">Sắp Xếp Theo</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
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
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={resetFilters}>
              Xóa Bộ Lọc
            </Button>
            <Button onClick={applyFilters}>Áp Dụng Bộ Lọc</Button>
          </div>
        </div>
      )}

      {error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : isLoading ? (
        <div className="py-12 text-center">
          <p>Đang tải combo...</p>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy combo</h3>
          <p className="text-gray-600 mb-4">Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc</p>
          <Button onClick={resetFilters}>Xóa Tất Cả Bộ Lọc</Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">{filteredCombos.length} combo được tìm thấy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((combo) => (
              <Card key={combo.id} className="overflow-hidden group">
                <div className="relative aspect-video">
                  <Link to={`/combos/${combo.id}`}>
                    <img
                      src={combo.imageSrc}
                      alt={combo.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/80 hover:bg-white"
                    onClick={() => toggleFavorite(combo.id)}
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
                    <h3 className="font-medium hover:text-crocus-600 transition-colors text-lg">
                      {combo.name}
                    </h3>
                  </Link>
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <p className="font-semibold text-lg">
                        {combo.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                      </p>
                      <p className="text-green-600 font-medium">
                        Tiết Kiệm {combo.savings.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND ({combo.savingsPercentage}% off)
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/combos/${combo.id}`}>Chi tiết</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-crocus-500 hover:bg-crocus-600"
                      onClick={() => handleBuyNow(combo)}
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
  );
};

export default CombosList;