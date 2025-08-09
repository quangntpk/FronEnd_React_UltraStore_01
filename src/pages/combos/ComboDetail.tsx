import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductHoverDetail from "@/components/user/ProductHoverDetail"
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  Heart,
  ShoppingCart,
  Tag,
  Star
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Swal from "sweetalert2";

const ComboDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [combo, setCombo] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [comboQuantity, setComboQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selections, setSelections] = useState<any>({});
  const [sizeQuantities, setSizeQuantities] = useState<any>({});
  const [colorSelected, setColorSelected] = useState<any>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [likedId, setLikedId] = useState<string | null>(null);

  // Hàm hiển thị thông báo SweetAlert2, trả về Promise
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

  // Hàm tính toán giá
  const calculatePricing = (data: any) => {
    const originalTotalPrice = data.sanPhams.reduce((sum: number, product: any) => 
      sum + (product.donGia * product.soLuong), 0
    );
    
    const comboBasePrice = data.gia;
    const khuyenMaiMax = data.khuyenMaiMax || 0;
    
    // Tính phần trăm đã giảm từ tổng tiền sản phẩm xuống giá combo
    const bundleDiscountPercent = Math.round(((originalTotalPrice - comboBasePrice) / originalTotalPrice) * 100);
    
    // Giá cuối cùng sau khi áp dụng khuyến mãi
    const finalPrice = comboBasePrice * (1 - khuyenMaiMax / 100);
    
    // Tổng tiền tiết kiệm
    const totalSavings = originalTotalPrice - finalPrice;
    
    return {
      originalTotalPrice,
      comboBasePrice,
      finalPrice,
      totalSavings,
      bundleDiscountPercent,
      promotionPercent: khuyenMaiMax
    };
  };

  useEffect(() => {
    const fetchCombo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5261/api/Combo/ComboSanPhamView?id=${id}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        // Calculate pricing
        const pricing = calculatePricing(data[0]);

        // Process the API data
        const processedCombo = {
          id: data[0].maCombo,
          name: data[0].name,
          description: data[0].moTa || "Không có mô tả",
          longDescription: data[0].moTa || "Không có mô tả chi tiết",
          image: data[0].hinhAnh ? `data:image/jpeg;base64,${data[0].hinhAnh}` : "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
          images: data[0].hinhAnh 
            ? [`data:image/jpeg;base64,${data[0].hinhAnh}`]
            : [
                "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
                "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
                "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
              ],
          rating: 4.8,
          reviews: [
            { id: 1, user: "Madison K.", date: "April 2, 2025", rating: 5, comment: "Giá trị tuyệt vời! Cả ba sản phẩm kết hợp hoàn hảo và chất lượng tuyệt vời." },
            { id: 2, user: "Ryan T.", date: "March 28, 2025", rating: 5, comment: "Mua cho vợ và cô ấy rất thích. Màu sắc rất đẹp." },
            { id: 3, user: "Jamie L.", date: "March 15, 2025", rating: 4, comment: "Combo tuyệt vời, nhưng tôi mong có thêm lựa chọn kích thước cho váy." }
          ],
          isFavorite: false,
          products: data[0].sanPhams.map((product: any) => ({
            id: product.idSanPham,
            name: product.name,
            brand: product.thuongHieu,
            category: product.loaiSanPham,
            price: product.donGia,
            quantity: product.soLuong,
            material: product.chatLieu,
            description: product.moTa || "Không có mô tả chi tiết",
            image: product.hinh && product.hinh.length > 0 
              ? `data:image/jpeg;base64,${product.hinh[0]}`
              : "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
            colors: product.mauSac || [],
            sizes: product.kichThuoc || []
          })),
          // Pricing information
          originalTotalPrice: pricing.originalTotalPrice,
          comboBasePrice: pricing.comboBasePrice,
          finalPrice: pricing.finalPrice,
          totalSavings: pricing.totalSavings,
          bundleDiscountPercent: pricing.bundleDiscountPercent,
          promotionPercent: pricing.promotionPercent,
          // Other combo info
          stock: data[0].soLuong,
          createdDate: data[0].ngayTao,
          status: data[0].trangThai
        };

        // Initialize selections for each product
        const initialSelections = processedCombo.products.reduce((acc: any, product: any) => ({
          ...acc,
          [product.id]: { colorIndex: null, sizeIndex: null }
        }), {});
        setSelections(initialSelections);
        setCombo(processedCombo);
        setMainImage(processedCombo.image);

        // Check favorite status
        try {
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          const currentUserId = userData?.maNguoiDung;
          if (currentUserId) {
            const response = await fetch("http://localhost:5261/api/YeuThich", {
              headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) throw new Error("Failed to fetch favorites");
            const yeuThichData = await response.json();
            const userFavorite = yeuThichData.find(
              (yeuThich: any) => yeuThich.maCombo === processedCombo.id && yeuThich.maNguoiDung === currentUserId
            );
            if (userFavorite) {
              setIsFavorite(true);
              setLikedId(userFavorite.maYeuThich);
            }
          }
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      } catch (error) {
        console.error("Error fetching combo:", error);
        showNotification("Không thể tải thông tin combo!", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCombo();
  }, [id]);

  const fetchSizeQuantities = async (productId: string, color: string) => {
    try {
      const colorCode = color.replace("#", "");
      const response = await fetch(
        `http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${productId}_${colorCode}`,
        {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok) throw new Error("Không thể lấy thông tin kích thước và số lượng");
      const data = await response.json();
      const productData = Array.isArray(data) ? data[0] : data;

      const sizeData = productData.details.map((detail: any) => ({
        size: detail.kichThuoc.trim(),
        quantity: detail.soLuong,
        price: detail.gia,
      }));

      setSizeQuantities((prev: any) => ({
        ...prev,
        [productId]: sizeData,
      }));
    } catch (err) {
      console.error("Lỗi khi lấy thông tin kích thước:", err);
      showNotification("Không thể lấy thông tin kích thước. Vui lòng thử lại.", "error");
    }
  };

  const handleSelectionChange = (productId: string, field: string, value: any) => {
    setSelections((prev: any) => {
      const newSelections = {
        ...prev,
        [productId]: { ...prev[productId], [field]: value },
      };

      if (field === "colorIndex") {
        const selectedColor = combo.products.find((p: any) => p.id === productId).colors[value];
        fetchSizeQuantities(productId, `#${selectedColor}`);
        setColorSelected((prev: any) => ({
          ...prev,
          [productId]: true,
        }));
        newSelections[productId].sizeIndex = null;
      }

      return newSelections;
    });
  };

  const handleAddToCart = async () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData?.maNguoiDung;
    if (!userId) {
      showNotification("Bạn cần đăng nhập để thêm combo vào giỏ hàng.", "warning").then(() => {
        navigate("/login");
      });
      return;
    }

    const invalidProducts = combo.products.filter(
      (product: any) => 
        selections[product.id].colorIndex === null || 
        selections[product.id].sizeIndex === null
    );
    if (invalidProducts.length > 0) {
      showNotification("Vui lòng chọn màu sắc và kích thước cho tất cả sản phẩm trong combo!", "error");
      return;
    }

    const cartData = {
      IDKhachHang: userId,
      IDCombo: Number(combo.id),
      SoLuong: Number(comboQuantity),
      Detail: combo.products.map((product: any) => ({
        MaSanPham: String(product.id),
        MauSac: product.colors[selections[product.id].colorIndex].replace("#", ""),
        KichThuoc: sizeQuantities[product.id][selections[product.id].sizeIndex].size,
      })),
    };

    try {
      const response = await fetch("http://localhost:5261/api/Cart/ThemComboVaoGioHang", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cartData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không thể thêm combo vào giỏ hàng: ${errorText}`);
      }

      showNotification("Đã thêm combo vào giỏ hàng thành công!", "success");
    } catch (err) {
      showNotification(`Có lỗi xảy ra khi thêm vào giỏ hàng: ${(err as Error).message}`, "error");
    }
  };

  const toggleFavorite = async () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData?.maNguoiDung;
    const hoTen = userData?.hoTen;

    if (!userId) {
      showNotification("Vui lòng đăng nhập để thêm combo vào danh sách yêu thích!", "warning").then(() => {
        navigate("/login");
      });
      return;
    }

    if (isFavorite) {
      try {
        const response = await fetch(`http://localhost:5261/api/YeuThich/${likedId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Không thể xóa combo khỏi danh sách yêu thích");
        setIsFavorite(false);
        setLikedId(null);
        showNotification("Đã xóa combo khỏi danh sách yêu thích!", "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi xóa combo yêu thích!", "error");
      }
    } else {
      const yeuThichData = {
        maCombo: combo.id,
        tenCombo: combo.name,
        maNguoiDung: userId,
        hoTen: hoTen,
        soLuongYeuThich: 1,
        ngayYeuThich: new Date().toISOString(),
      };
      try {
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
        setIsFavorite(true);
        setLikedId(addedFavorite.maYeuThich);
        showNotification("Đã thêm combo vào danh sách yêu thích!", "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi thêm combo yêu thích!", "error");
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="aspect-square bg-gray-200 rounded-md"></div>)}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-500">Không tìm thấy combo</h2>
        <Link to="/combos" className="text-crocus-600 hover:underline mt-4 inline-block">
          ← Quay về Trang Danh Sách Combo
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link to="/combos" className="text-crocus-600 hover:underline flex items-center gap-1">
          ← Quay về Trang Danh Sách Combo
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
            <img 
              src={mainImage} 
              alt={combo.name} 
              className="w-full h-full object-cover"
            />
            {/* Discount Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {combo.bundleDiscountPercent > 0 && (
                <div className="right-4 bg-blue-500 text-white p-3 rounded shadow-lg z-10 flex flex-col items-center">
                  <div className="text-xs font-medium">Đã Giảm</div>
                  <div className="text-lg font-bold">{combo.bundleDiscountPercent}%</div>
                </div>
              )}
              {combo.promotionPercent > 0 && (
              <div className="right-4 bg-gradient-to-br from-red-500 to-red-600 text-white p-3 min-w-[80px] min-h-[80px] flex flex-col items-center justify-center shadow-lg z-10 rounded">
                <div className="text-xs font-medium">Khuyến Mãi</div>
                <div className="text-lg font-bold"> -{combo.promotionPercent}%</div>
               </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {combo.images.map((image: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setMainImage(image)}
                className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                  mainImage === image ? 'border-crocus-500' : 'border-gray-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img 
                  src={image} 
                  alt={`${combo.name} view ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{combo.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>Mã combo: {combo.id}</span>
                  <span>•</span>
                  <span>Còn lại: {combo.stock} combo</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={toggleFavorite}
                className="h-10 w-10 p-0 hover:bg-red-50"
              >
                <Heart className={`h-6 w-6 transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
                }`} />
              </Button>
            </div>
            
            {/* Pricing Section */}
            <div className="bg-gradient-to-r from-crocus-50 to-purple-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-crocus-600">
                  {formatPrice(combo.finalPrice)}
                </span>
                <div className="flex gap-2">
                  {combo.bundleDiscountPercent > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      -{combo.bundleDiscountPercent}%
                    </Badge>
                  )}
                  {combo.promotionPercent > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      -{combo.promotionPercent}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Giá các sản phẩm riêng lẻ:</span>
                  <span className="line-through text-gray-400">
                    {formatPrice(combo.originalTotalPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">
                    Tiết kiệm được: {formatPrice(combo.totalSavings)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700">
              <strong>Mô tả:</strong> {combo.description}
            </p>
          </div>

          {/* Products in Combo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Sản Phẩm Trong Combo ({combo.products.length} sản phẩm)
            </h3>
            <div className="space-y-4">
              {combo.products.map((product: any) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                            <div className="text-sm text-gray-500 space-y-1">
                              <div>Thương hiệu: {product.brand}</div>
                              <div>Loại: {product.category}</div>
                              <div>Chất liệu: {product.material}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-semibold text-crocus-600">
                              {formatPrice(product.price)}
                            </div>
                            <div className="text-sm text-gray-500">
                              x{product.quantity}
                            </div>
                          </div>
                        </div>
                        
                        {/* Product Options */}
                        <div className="space-y-3">
                          {/* Color Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Màu Sắc *
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {product.colors.map((color: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => handleSelectionChange(product.id, "colorIndex", index)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                    selections[product.id]?.colorIndex === index
                                      ? "border-crocus-500 ring-2 ring-crocus-200"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                  style={{ backgroundColor: `#${color}` }}
                                  title={`Màu #${color}`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Size Selection */}
                          {colorSelected[product.id] && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kích Thước *
                              </label>
                              {sizeQuantities[product.id]?.length > 0 ? (
                                <div className="flex gap-2 flex-wrap">
                                  {sizeQuantities[product.id].map((size: any, index: number) => (
                                    <button
                                      key={index}
                                      onClick={() => handleSelectionChange(product.id, "sizeIndex", index)}
                                      className={`px-3 py-2 border rounded-md text-sm transition-all ${
                                        selections[product.id]?.sizeIndex === index
                                          ? "border-crocus-500 bg-crocus-50 text-crocus-700"
                                          : "border-gray-300 hover:border-gray-400"
                                      } ${size.quantity === 0 ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:shadow-sm"}`}
                                      disabled={size.quantity === 0}
                                    >
                                      {size.size}
                                      <span className={`ml-1 text-xs ${size.quantity === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                        ({size.quantity === 0 ? 'Hết hàng' : `${size.quantity} còn lại`})
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                  Không có kích thước nào khả dụng cho màu này.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số Lượng
              </label>
              <div className="flex items-center border border-gray-200 rounded-md w-32">
                <button 
                  onClick={() => setComboQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center py-2 font-medium">{comboQuantity}</span>
                <button 
                  onClick={() => setComboQuantity(prev => Math.min(combo.stock, prev + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <Button 
              onClick={handleAddToCart}
              className="w-full bg-crocus-600 hover:bg-crocus-700 text-white font-medium py-3 text-lg transition-colors"
              disabled={combo.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> 
              {combo.stock === 0 ? 'Hết hàng' : 'Thêm Vào Giỏ Hàng'}
            </Button>
            
            {combo.stock <= 5 && combo.stock > 0 && (
              <p className="text-orange-600 text-sm text-center font-medium">
                ⚠️ Chỉ còn {combo.stock} combo cuối cùng!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboDetail;