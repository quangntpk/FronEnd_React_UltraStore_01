import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductHoverDetail from "@/components/user/ProductHoverDetail";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import Swal from "sweetalert2";

interface ComboProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  colors: string[];
  sizes: string[];
}

interface Combo {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  savings: number;
  savingsPercentage: number;
  image: string;
  products: ComboProduct[];
}

interface ComboDetailViewProps {
  comboId: string;
  onClose: () => void;
}

const ComboDetailView = ({ comboId, onClose }: ComboDetailViewProps) => {
  const navigate = useNavigate();
  const [combo, setCombo] = useState<Combo | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [comboQuantity, setComboQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selections, setSelections] = useState<{ [key: string]: { colorIndex: number | null; sizeIndex: number | null } }>({});
  const [sizeQuantities, setSizeQuantities] = useState<{ [key: string]: { size: string; quantity: number; price: number }[] }>({});
  const [colorSelected, setColorSelected] = useState<{ [key: string]: boolean }>({});
  const [showSelectionError, setShowSelectionError] = useState(false);

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
        const response = await fetch(`http://localhost:5261/api/Combo/ComboSanPhamView?id=${comboId}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        const processedCombo: Combo = {
          id: String(data[0].maCombo),
          name: data[0].name || "Không có tên",
          price: data[0].gia || 0,
          originalPrice: (data[0].gia || 0) * 1.15,
          savings: (data[0].gia || 0) * 0.15,
          savingsPercentage: 15,
          image: data[0].hinhAnh
            ? `data:image/jpeg;base64,${data[0].hinhAnh}`
            : "https://via.placeholder.com/600x400?text=Combo+Image",
          products: data[0].sanPhams.map((product: any) => ({
            id: product.idSanPham,
            name: product.name || "Không có tên",
            price: product.donGia || 0,
            image: product.hinh && product.hinh.length > 0
              ? `data:image/jpeg;base64,${product.hinh[0]}`
              : "https://via.placeholder.com/150?text=Product+Image",
            colors: product.mauSac || [],
            sizes: product.kichThuoc || [],
          })),
        };

        const initialSelections = processedCombo.products.reduce(
          (acc: any, product: ComboProduct) => ({
            ...acc,
            [product.id]: { colorIndex: null, sizeIndex: null },
          }),
          {}
        );
        setSelections(initialSelections);
        setCombo(processedCombo);
        setMainImage(processedCombo.image);
      } catch (error) {
        console.error("Error fetching combo:", error);
        showNotification("Không thể tải thông tin combo!", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCombo();
  }, [comboId]);

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

      setSizeQuantities((prev) => ({
        ...prev,
        [productId]: sizeData,
      }));
    } catch (err) {
      console.error("Lỗi khi lấy thông tin kích thước:", err);
      showNotification("Không thể lấy thông tin kích thước. Vui lòng thử lại.", "error");
    }
  };

  const handleSelectionChange = (productId: string, field: string, value: number) => {
    setSelections((prev) => {
      const newSelections = {
        ...prev,
        [productId]: { ...prev[productId], [field]: value },
      };

      if (field === "colorIndex") {
        const selectedColor = combo!.products.find((p) => p.id === productId)!.colors[value];
        fetchSizeQuantities(productId, `#${selectedColor}`);
        setColorSelected((prev) => ({
          ...prev,
          [productId]: true,
        }));
        newSelections[productId].sizeIndex = null;
      }

      return newSelections;
    });
    setShowSelectionError(false);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1)) {
      setComboQuantity(value === "" ? 1 : parseInt(value));
    }
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

    const invalidProducts = combo!.products.filter(
      (product) => selections[product.id].colorIndex === null || selections[product.id].sizeIndex === null
    );
    if (invalidProducts.length > 0) {
      setShowSelectionError(true);
      return;
    }

    const cartData = {
      IDKhachHang: userId,
      IDCombo: Number(combo!.id),
      SoLuong: Number(comboQuantity),
      Detail: combo!.products.map((product) => ({
        MaSanPham: String(product.id),
        MauSac: product.colors[selections[product.id].colorIndex!].replace("#", ""),
        KichThuoc: sizeQuantities[product.id][selections[product.id].sizeIndex!].size,
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

      setShowSelectionError(false);
      showNotification("Đã thêm combo vào giỏ hàng thành công!", "success");
      onClose();
    } catch (err) {
      setShowSelectionError(false);
      showNotification(`Có lỗi xảy ra khi thêm vào giỏ hàng: ${(err as Error).message}`, "error");
    }
  };

  const handleViewDetails = () => {
    navigate(`/combos/${comboId}`);
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center text-gray-600">Đang tải...</div>;
  }

  if (!combo) {
    return <div className="container mx-auto py-8 text-center text-red-500">Không tìm thấy combo</div>;
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 text-gray-600 hover:text-gray-800 hover:bg-gray-120 bg-gray-100 rounded-full w-10 h-10"
            aria-label="Đóng"
          >
            <X className="h-8 w-8" />
          </Button>
        </Dialog.Close>
        <div className="container mx-auto py-6 px-4">
          <Card className="border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 max-w-md order-1 md:order-1">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{combo.name}</h1>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-crocus-600">{combo.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</p>
                        <p className="text-sm line-through text-gray-500">{combo.originalPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</p>
                      </div>
                      <p className="text-green-600 font-medium">
                        Tiết Kiệm {combo.savings.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND ({combo.savingsPercentage}% off)
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-gray-700">Bao Gồm các Sản Phẩm ({combo.products.length})</h3>
                    <div className="space-y-3">
                      {combo.products.map((product) => (
                        <Card key={product.id} className="bg-gray-50 p-3 rounded-md">
                          <CardContent className="p-0">
                            <ProductHoverDetail
                              product={{
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                colors: product.colors,
                                sizes: product.sizes,
                              }}
                            />
                            <div className="space-y-2 mt-2">
                              <div>
                                <label className="block text-sm font-medium mb-1 text-gray-600">Màu Sắc</label>
                                <div className="flex gap-2">
                                  {product.colors.map((color, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleSelectionChange(product.id, "colorIndex", index)}
                                      className={`w-7 h-7 rounded-full border-2 ${
                                        selections[product.id]?.colorIndex === index
                                          ? "border-crocus-500"
                                          : "border-gray-300"
                                      }`}
                                      style={{ backgroundColor: `#${color}` }}
                                      title={`#${color}`}
                                      aria-label={`Chọn màu ${color}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {colorSelected[product.id] && sizeQuantities[product.id]?.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium mb-1 text-gray-600">Kích Thước</label>
                                  <div className="flex gap-2 flex-wrap">
                                    {sizeQuantities[product.id].map((size, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleSelectionChange(product.id, "sizeIndex", index)}
                                        className={`px-2 py-1 border rounded-md text-sm ${
                                          selections[product.id]?.sizeIndex === index
                                            ? "border-crocus-500 bg-crocus-50"
                                            : "border-gray-300"
                                        } ${size.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={size.quantity === 0}
                                        aria-label={`Chọn kích thước ${size.size}`}
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 order-2 md:order-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={mainImage}
                      alt={combo.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/600x400?text=Combo+Image")}
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2 text-gray-700">Số Lượng:</h3>
                      <div className="flex items-center border border-gray-200 rounded-md w-90">
                        <button
                          onClick={() => setComboQuantity((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-1 text-gray-500 hover:text-gray-700"
                          aria-label="Giảm số lượng"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={comboQuantity}
                          onChange={handleQuantityChange}
                          className="flex-1 text-center border-none focus:ring-0 bg-transparent text-sm"
                          min="1"
                          aria-label="Nhập số lượng combo"
                        />
                        <button
                          onClick={() => setComboQuantity((prev) => prev + 1)}
                          className="px-3 py-1 text-gray-500 hover:text-gray-700"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={handleAddToCart}
                        className="w-full bg-crocus-600 hover:bg-crocus-700"
                        aria-label="Thêm combo vào giỏ hàng"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" /> Thêm Vào Giỏ Hàng
                      </Button>
                      <Button
                        onClick={handleViewDetails}
                        variant="link"
                        className="w-full text-crocus-600 hover:text-crocus-700 mt-2"
                        aria-label="Xem chi tiết combo"
                      >
                        Chi tiết Combo
                      </Button>
                      {showSelectionError && (
                        <p className="text-sm text-red-500 mt-2">
                          Vui lòng chọn màu sắc và kích thước cho tất cả sản phẩm trong combo!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default ComboDetailView;