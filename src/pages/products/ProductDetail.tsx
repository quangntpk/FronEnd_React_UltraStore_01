import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Zap, Sparkles, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Swal from "sweetalert2";
import Comments from "./Comments";
import SelectSize from "@/components/default/SelectSize";
import SanPhamLienQuan from "@/pages/products/ProductShowcase";
import MoTaSanPham from "./MoTaSanPham";
import Testings from "@/components/default/Testing";

// ---------- Types ---------- //
interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
  hinhAnh: string;
}

interface HashTag {
  id: number;
  name: string;
}

interface Product {
  id: string;
  tenSanPham: string;
  maThuongHieu: string;
  loaiSanPham: string;
  mauSac: string;
  moTa: string | null;
  chatLieu: string;
  details: ProductDetail[];
  hinhAnhs: string[];
  listHashTag: HashTag[];
  khuyenMaiMax: number;
}

const showNotification = (message: string, type: "success" | "error") => {
  Swal.fire({
    toast: true,
    title: message,
    icon: type,
    timer: 2500,
    position: "top-end",
    showConfirmButton: false,
  });
};

// ---------- Component ---------- //
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ---- State ---- //
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [stock, setStock] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likedId, setLikedId] = useState<string | null>(null);
  const [showTesting, setShowTesting] = useState<boolean>(false);

  // ---- Effects ---- //
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        const baseId = id.split("_")[0];
        const response = await fetch(
          `https://bicacuatho.azurewebsites.net/api/SanPham/SanPhamByIDSorted?id=${baseId}`
        );
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data: Product[] = await response.json();
        if (data.length === 0) throw new Error("No products found");

        setProducts(data);
        const product = data.find((p) => p.id === id) || data[0];
        setSelectedProduct(product);
        setSelectedColor(product.mauSac);
        setSelectedSize(product.details[0]?.kichThuoc || "");
        setMainImage(
          product.hinhAnhs[0] ? `data:image/jpeg;base64,${product.hinhAnhs[0]}` : ""
        );
        setStock(product.details[0]?.soLuong || 0);

        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const currentUserId = userData?.maNguoiDung;
        if (currentUserId) {
          const favRes = await fetch("https://bicacuatho.azurewebsites.net/api/YeuThich");
          if (favRes.ok) {
            const favs = await favRes.json();
            const existing = favs.find(
              (x: any) => x.maSanPham === baseId && x.maNguoiDung === currentUserId
            );
            if (existing) {
              setIsLiked(true);
              setLikedId(existing.maYeuThich);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---- Handlers ---- //
  const handleColorChange = (color: string) => {
    const product = products.find((p) => p.mauSac === color);
    if (!product) return;

    setSelectedProduct(product);
    setSelectedColor(color);
    setSelectedSize(product.details[0]?.kichThuoc || "");
    setMainImage(
      product.details[0]?.hinhAnh ? `data:image/jpeg;base64,${product.details[0].hinhAnh}` : ""
    );
    setStock(product.details[0]?.soLuong || 0);
    setQuantity(1);
  };

  const handleSizeChange = (size: string) => {
    if (!selectedProduct) return;
    setSelectedSize(size);
    const detail = selectedProduct.details.find((d) => d.kichThuoc === size);
    setMainImage(
      detail?.hinhAnh ? `data:image/jpeg;base64,${detail.hinhAnh}` : ""
    );
    setStock(detail?.soLuong || 0);
  };

  const toggleFavorite = async () => {
    if (!selectedProduct) return;
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;
    const hoTen = userData?.hoTen;

    if (!maNguoiDung) {
      showNotification(
        "Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!",
        "error"
      );
      return;
    }

    const baseProductId = selectedProduct.id.split("_")[0];

    if (isLiked && likedId) {
      try {
        const res = await fetch(`https://bicacuatho.azurewebsites.net/api/YeuThich/${likedId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error("Failed to remove favorite");
        setIsLiked(false);
        setLikedId(null);
        showNotification("Đã xóa sản phẩm khỏi danh sách yêu thích!", "success");
      } catch {
        showNotification("Có lỗi xảy ra khi xóa yêu thích!", "error");
      }
    } else {
      const payload = {
        maSanPham: baseProductId,
        tenSanPham: selectedProduct.tenSanPham,
        maNguoiDung,
        hoTen,
        soLuongYeuThich: 1,
        ngayYeuThich: new Date().toISOString(),
      };
      try {
        const res = await fetch("https://bicacuatho.azurewebsites.net/api/YeuThich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add favorite");
        const added = await res.json();
        setIsLiked(true);
        setLikedId(added.maYeuThich);
        showNotification("Đã thêm sản phẩm vào danh sách yêu thích!", "success");
      } catch {
        showNotification("Có lỗi xảy ra khi thêm yêu thích!", "error");
      }
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (!selectedSize) {
      showNotification("Vui lòng chọn kích thước trước khi thêm vào giỏ hàng!", "error");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!", "error");
      return;
    }

    const cartData = {
      IDNguoiDung: maNguoiDung,
      IDSanPham: selectedProduct.id.split("_")[0],
      MauSac: selectedProduct.mauSac,
      KichThuoc: selectedSize,
      SoLuong: quantity,
    };

    try {
      const res = await fetch(
        "https://bicacuatho.azurewebsites.net/api/Cart/ThemSanPhamVaoGioHang",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify(cartData),
        }
      );
      if (!res.ok) throw new Error("Failed to add to cart");
      showNotification("Đã thêm vào giỏ hàng thành công!", "success");
    } catch {
      showNotification("Có lỗi xảy ra khi thêm vào giỏ hàng!", "error");
    }
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;

    if (!selectedSize) {
      showNotification("Vui lòng chọn kích thước trước khi mua!", "error");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập để mua sản phẩm!", "error");
      return;
    }

    const cartData = {
      IDNguoiDung: maNguoiDung,
      IDSanPham: selectedProduct.id.split("_")[0],
      MauSac: selectedProduct.mauSac,
      KichThuoc: selectedSize,
      SoLuong: quantity,
      TenSanPham: selectedProduct.tenSanPham,
      Gia: selectedProduct.details.find((d) => d.kichThuoc === selectedSize)?.gia || 0,
      NgayMua: new Date().toISOString(),
    };

    try {
      const existingData = JSON.parse(localStorage.getItem("InstantBuy") || "[]");
      existingData.length = 0;
      existingData.push(cartData);
      localStorage.setItem("InstantBuy", JSON.stringify(existingData, null, 2));
      navigate("/user/CheckOutInstant");
      showNotification("Đang chuyển đến trang thanh toán!", "success");
    } catch {
      showNotification("Có lỗi xảy ra khi mua sản phẩm!", "error");
    }
  };

  const handleAITryOn = () => {
    setShowTesting(!showTesting);
    if (!showTesting) {
      showNotification("Đang mở tính năng mặc thử bằng AI...", "success");
      setTimeout(() => {
        const testingElement = document.querySelector("#testing-section");
        if (testingElement) {
          testingElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);
    } else {
      showNotification("Đã đóng tính năng mặc thử AI", "success");
    }
  };

  // ---- Render ---- //
  if (loading) return <div className="container mx-auto py-8">Loading...</div>;
  if (error || !selectedProduct)
    return <div className="container mx-auto py-8">{error || "Product not found."}</div>;

  const selectedDetail = selectedProduct.details.find((d) => d.kichThuoc === selectedSize);
  const originalPrice = selectedDetail ? selectedDetail.gia : selectedProduct.details[0]?.gia || 0;
  const discountPercentage = selectedProduct.khuyenMaiMax || 0;
  const discountedPrice = originalPrice * (1 - discountPercentage / 100);
  const savings = originalPrice * (discountPercentage / 100);

  return (
    <div className="container mx-auto py-8 pb-24 relative">
      {/* Back link */}
      <div className="mb-4">
        <Link to="/products" className="text-crocus-600 hover:underline flex items-center gap-1">
          ← Quay lại trang Danh Sách Sản Phẩm
        </Link>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
            <img
              src={mainImage}
              alt={selectedProduct.tenSanPham}
              className="w-full h-full object-cover"
            />
            {discountPercentage > 0 && (
              <div className="absolute top-4 right-4 bg-gradient-to-br from-red-500 to-red-600 text-white p-3 min-w-[80px] min-h-[80px] flex flex-col items-center justify-center shadow-lg z-10 rounded">
                <div className="text-xs font-medium">Khuyến Mãi</div>
                <div className="text-lg font-bold"> -{discountPercentage}%</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <button
              key={products[0].tenSanPham.substring(0, 6)}
              onClick={() =>
                setMainImage(
                  products[0].hinhAnhs[0] ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}` : ""
                )
              }
              className={`aspect-square rounded-md overflow-hidden ${
                mainImage === (products[0].hinhAnhs[0] ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}` : "")
                  ? "ring-2 ring-crocus-500"
                  : "opacity-70"
              }`}
            >
              <img
                src={products[0].hinhAnhs[0] ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}` : ""}
                alt={`${products[0].tenSanPham.substring(0, 6)}`}
                className="w-full h-full object-cover"
              />
            </button>
            {products
              .filter((product) => product.details[0]?.hinhAnh)
              .map((product, idx) => ({
                image: `data:image/jpeg;base64,${product.details[0].hinhAnh}`,
                productId: product.id,
              }))
              .filter((item) => item.image !== "data:image/jpeg;base64,")
              .map((item, idx) => (
                <button
                  key={`${item.productId}-${idx}`}
                  onClick={() => setMainImage(item.image)}
                  className={`aspect-square rounded-md overflow-hidden ${
                    mainImage === item.image ? "ring-2 ring-crocus-500" : "opacity-70"
                  }`}
                >
                  <img
                    src={item.image}
                    alt={`thumb-${item.productId}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Title & price */}
          <div>
            <h1 className="text-3xl font-bold">{selectedProduct.tenSanPham}</h1>
            <div className="mt-2 items-center gap-3">
              {discountPercentage > 0 ? (
                <>
                  <div className="mb-1">
                    <p className="text-4xl font-bold text-red-600">
                      {(discountedPrice / 1000).toFixed(3)} VND
                    </p>
                    <p className="text-lg text-gray-500 line-through">
                      {(originalPrice / 1000).toFixed(3)} VND
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-600">
                      Tiết kiệm: {(savings / 1000).toFixed(3)} VND
                    </h4>
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-crocus-600">
                  {(originalPrice / 1000).toFixed(3)} VND
                </p>
              )}
            </div>
          </div>

          {/* Material */}
          <p className="text-gray-700 text-2xl">
            <h3 className="font-bold mb-2 text-2xl">Chất liệu</h3>
            {selectedProduct.chatLieu || "Chưa có thông tin chất liệu"}
          </p>

          {/* Brand */}
          <p className="text-gray-700 text-2xl">
            <h3 className="font-bold mb-2 text-2xl">Thương hiệu</h3>
            {selectedProduct.maThuongHieu || "Chưa có thông tin thương hiệu"}
          </p>

          {/* Hashtags */}
          <p className="text-gray-700">
            <h3 className="font-bold mb-2 text-2xl">Hashtags</h3>
            {selectedProduct.listHashTag && selectedProduct.listHashTag.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedProduct.listHashTag.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            ) : (
              "Chưa có hashtag"
            )}
          </p>

          {/* Color */}
          <div>
            <h3 className="font-bold mb-2 text-2xl">Màu sắc</h3>
            <div className="flex gap-3">
              {products.map((p) => (
                <button
                  key={p.mauSac}
                  onClick={() => handleColorChange(p.mauSac)}
                  className={`w-10 h-10 rounded-full border ${
                    selectedColor === p.mauSac
                      ? "border-crocus-500 ring-2 ring-crocus-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: `#${p.mauSac}` }}
                  title={p.mauSac}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold mb-2 text-2xl text-gray-900">Kích thước</h3>
              <SelectSize />
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedProduct.details.map((d) => (
                <button
                  key={d.kichThuoc}
                  onClick={() => handleSizeChange(d.kichThuoc)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md border ${
                    selectedSize === d.kichThuoc
                      ? "border-crocus-500 bg-crocus-50 text-crocus-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {d.kichThuoc}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <p className="text-gray-700">
            Trong kho còn lại: <span className="font-medium">{stock}</span>
          </p>

          {/* Quantity */}
          <div>
            <h3 className="font-bold mb-2 text-2xl">Số Lượng</h3>
            <div className="flex items-center border border-gray-200 rounded-md w-32">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="flex-1 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                disabled={quantity >= stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Main Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className="flex-1 relative overflow-hidden group bg-gradient-to-r from-[#0E5AF0] to-[#EF00D6] text-white py-3 px-6 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                style={{
                  background: stock === 0 ? "#gray" : "linear-gradient(to right, #0E5AF0, #EF00D6)",
                }}
                onMouseEnter={(e) => {
                  if (stock > 0) {
                    e.currentTarget.style.background = "#EF00D6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (stock > 0) {
                    e.currentTarget.style.background = "linear-gradient(to right, #0E5AF0, #EF00D6)";
                  }
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </div>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={stock === 0}
                className="flex-1 relative overflow-hidden group bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white py-3 px-6 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                style={{
                  background: stock === 0 ? "#gray" : "linear-gradient(to right, #FF6B35, #F7931E)",
                }}
                onMouseEnter={(e) => {
                  if (stock > 0) {
                    e.currentTarget.style.background = "#F7931E";
                  }
                }}
                onMouseLeave={(e) => {
                  if (stock > 0) {
                    e.currentTarget.style.background = "linear-gradient(to right, #FF6B35, #F7931E)";
                  }
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Mua Ngay</span>
                </div>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleFavorite}
                className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 flex items-center justify-center gap-2"
              >
                <Heart
                  className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{isLiked ? "Đã Yêu Thích" : "Yêu Thích"}</span>
              </button>
            </div>
          </div>

          {/* Barcode */}
          <div className="text-center flex justify-center pt-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img
                alt="Barcode"
                src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
                  `${selectedProduct.id.split("_")[0]}_${selectedProduct.mauSac}_${selectedSize}`
                )}&translate-esc=on`}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Testing Component */}
      <div
        id="testing-section"
        className={`transition-all duration-700 ease-in-out transform ${
          showTesting
            ? "translate-y-0 opacity-100 max-h-screen mb-12"
            : "translate-y-full opacity-0 max-h-0 overflow-hidden"
        }`}
      >
        <Testings defaultClothingImage={mainImage} />
      </div>

      <MoTaSanPham product={selectedProduct} />
      <Comments productId={id} />
      <SanPhamLienQuan productId={id} />

      {/* Fixed AI Try-On Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={handleAITryOn}
          className={`relative group text-white py-4 px-8 rounded-full font-bold text-lg shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-3xl ${
            showTesting
              ? "bg-gradient-to-r from-red-500 via-pink-600 to-red-700"
              : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-pulse"
          }`}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-75 blur-md animate-pulse"></div>
          <div className="relative flex items-center justify-center gap-3">
            {showTesting ? (
              <>
                <X className="h-6 w-6" />
                <span className="whitespace-nowrap">Đóng Mặc Thử AI</span>
                <X className="h-6 w-6" />
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6 animate-spin" />
                <span className="whitespace-nowrap">Mặc Thử Đồ Bằng AI</span>
                <Sparkles className="h-6 w-6 animate-spin" />
              </>
            )}
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
        </button>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;