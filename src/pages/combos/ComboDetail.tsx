import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  Heart,
  ShoppingCart
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

        // Process the API data
        const processedCombo = {
          id: data[0].maCombo,
          name: data[0].name,
          price: data[0].gia,
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
            price: product.donGia,
            image: product.hinh && product.hinh.length > 0 
              ? `data:image/jpeg;base64,${product.hinh[0]}`
              : "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
            colors: product.mauSac || [],
            sizes: product.kichThuoc || []
          })),
          originalPrice: data[0].gia * 1.15,
          savings: data[0].gia * 0.15,
          savingsPercentage: 15
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

  if (isLoading) {
    return <div className="container mx-auto py-8">Đang tải...</div>;
  }

  if (!combo) {
    return <div className="container mx-auto py-8">Không tìm thấy combo</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link to="/combos" className="text-crocus-600 hover:underline flex items-center gap-1">
          ← Quay về Trang Danh Sách Combo
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={mainImage} 
              alt={combo.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {combo.images.map((image: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setMainImage(image)}
                className={`aspect-square rounded-md overflow-hidden ${mainImage === image ? 'ring-2 ring-crocus-500' : 'opacity-70'}`}
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

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{combo.name}</h1>
              <Button 
                variant="ghost" 
                onClick={toggleFavorite}
                className="h-10 w-10 p-0"
              >
                <Heart className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">

            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-crocus-600">{(combo.price/1000).toFixed(3)} VND</p>
                <p className="text-sm line-through text-gray-500">{(combo.originalPrice/1000).toFixed(3)} VND</p>
              </div>
              <p className="text-green-600 font-medium">Tiết Kiệm {(combo.savings/1000).toFixed(3)} VND ({combo.savingsPercentage}% off)</p>
            </div>
          </div>

          <p className="text-gray-700"> <strong>Mô tả:</strong>  {combo.description}</p>

          <div>
            <h3 className="font-medium mb-3">Bao Gồm các Sản Phẩm ({combo.products.length})</h3>
            <div className="space-y-3">
              {combo.products.map((product: any) => (
                <div key={product.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-14 h-14 rounded object-cover"
                    />
                    <div>
                      <h4 className="font-medium">
                        <Link to={`/products/${product.id}`} className="hover:text-crocus-600 transition-colors">
                          {product.name}
                        </Link>
                      </h4>
                      <p className="text-sm text-gray-600">{(product.price/1000).toFixed(3)} VND</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Màu Sắc</label>
                      <div className="flex gap-2">
                        {product.colors.map((color: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleSelectionChange(product.id, "colorIndex", index)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              selections[product.id]?.colorIndex === index
                                ? "border-crocus-500"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: `#${color}` }}
                            title={`#${color}`}
                          />
                        ))}
                      </div>
                    </div>
                    {colorSelected[product.id] && sizeQuantities[product.id]?.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Kích Thước</label>
                        <div className="flex gap-2 flex-wrap">
                          {sizeQuantities[product.id].map((size: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleSelectionChange(product.id, "sizeIndex", index)}
                              className={`px-3 py-1 border rounded-md text-sm ${
                                selections[product.id]?.sizeIndex === index
                                  ? "border-crocus-500 bg-crocus-50"
                                  : "border-gray-300"
                              } ${size.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                              disabled={size.quantity === 0}
                            >
                              {size.size} ({size.quantity} còn lại)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {colorSelected[product.id] && !sizeQuantities[product.id]?.length && (
                      <p className="text-sm text-red-500">Không có kích thước nào khả dụng cho màu này.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Số Lượng</h3>
            <div className="flex items-center border border-gray-200 rounded-md w-32">
              <button 
                onClick={() => setComboQuantity(prev => Math.max(1, prev - 1))}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
              >
                -
              </button>
              <span className="flex-1 text-center">{comboQuantity}</span>
              <button 
                onClick={() => setComboQuantity(prev => prev + 1)}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <Button 
              onClick={handleAddToCart}
              className="w-full bg-crocus-600 hover:bg-crocus-700"
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm Vào Giỏ Hàng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboDetail;