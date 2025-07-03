import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Heart, ShoppingCart, Printer } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import Swal from "sweetalert2";
import Comments from "./Comments"; // If you actually need Comments component
import Testing from "@/components/default/Testing";
// ---------- Types ---------- //
interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
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
}

// ---------- Mock Data (remove when API is ready) ---------- //
const mockReviews = [
  {
    id: 1,
    user: "Emma S.",
    date: "March 15, 2025",
    rating: 5,
    comment: "Absolutely love this product! The quality is amazing.",
  },
  {
    id: 2,
    user: "Sophia T.",
    date: "March 10, 2025",
    rating: 4,
    comment: "Great fit, very comfortable.",
  },
  {
    id: 3,
    user: "Olivia R.",
    date: "March 5, 2025",
    rating: 5,
    comment: "Perfect for my needs, highly recommend!",
  },
];

const mockRelatedProducts = [
  {
    id: "A00002",
    name: "Áo thun S Đen",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    rating: 4.8,
    isFavorite: true,
  },
  {
    id: "A00003",
    name: "Áo thun M Trắng",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    rating: 4.2,
    isFavorite: false,
  },
  {
    id: "A00004",
    name: "Áo thun L Đen",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b",
    rating: 4.9,
    isFavorite: false,
  },
];

// ---------- Helpers ---------- //
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

const handlePrint = () => {
  const printWindow = window.open("", "", "width=800,height=600");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { size: 4.02in 5.91in; margin: 0.25in; }
            body { margin: 0; }
            img { width: 100%; height: 100%; object-fit: fill; }
          </style>
        </head>
        <body>
          <img src="https://cdn-media.sforum.vn/storage/app/media/anh-dep-82.jpg" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

// ---------- Component ---------- //
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();

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

  // ---- Effects ---- //
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        const baseId = id.split("_")[0];
        const response = await fetch(
          `http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${baseId}`
        );
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data: Product[] = await response.json();
        if (data.length === 0) throw new Error("No products found");

        setProducts(data);

        // Pick exact variant or first item
        const product = data.find((p) => p.id === id) || data[0];
        setSelectedProduct(product);
        setSelectedColor(product.mauSac);
        setSelectedSize(product.details[0]?.kichThuoc || "");
        setMainImage(
          product.hinhAnhs[0] ? `data:image/jpeg;base64,${product.hinhAnhs[0]}` : ""
        );
        setStock(product.details[0]?.soLuong || 0);

        // Fetch favorite state for current user
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const currentUserId = userData?.maNguoiDung;
        if (currentUserId) {
          const favRes = await fetch("http://localhost:5261/api/YeuThich");
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
      product.hinhAnhs[0] ? `data:image/jpeg;base64,${product.hinhAnhs[0]}` : ""
    );
    setStock(product.details[0]?.soLuong || 0);
    setQuantity(1);
  };

  const handleSizeChange = (size: string) => {
    if (!selectedProduct) return;
    setSelectedSize(size);
    const detail = selectedProduct.details.find((d) => d.kichThuoc === size);
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
      // Remove favorite
      try {
        const res = await fetch(`http://localhost:5261/api/YeuThich/${likedId}`, {
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
      // Add favorite
      const payload = {
        maSanPham: baseProductId,
        tenSanPham: selectedProduct.tenSanPham,
        maNguoiDung,
        hoTen,
        soLuongYeuThich: 1,
        ngayYeuThich: new Date().toISOString(),
      };
      try {
        const res = await fetch("http://localhost:5261/api/YeuThich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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
        "http://localhost:5261/api/Cart/ThemSanPhamVaoGioHang",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(cartData),
        }
      );
      if (!res.ok) throw new Error("Failed to add to cart");
      showNotification("Đã thêm vào giỏ hàng thành công!", "success");
    } catch {
      showNotification("Có lỗi xảy ra khi thêm vào giỏ hàng!", "error");
    }
  };

  // ---- Render ---- //
  if (loading) return <div className="container mx-auto py-8">Loading...</div>;
  if (error || !selectedProduct)
    return <div className="container mx-auto py-8">{error || "Product not found."}</div>;

  return (
    <div className="container mx-auto py-8">
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
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={mainImage}
              alt={selectedProduct.tenSanPham}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {selectedProduct.hinhAnhs.map((img, idx) => (
              <button
                key={idx}
                onClick={() =>
                  setMainImage(`data:image/jpeg;base64,${img}`)
                }
                className={`aspect-square rounded-md overflow-hidden ${
                  mainImage === `data:image/jpeg;base64,${img}`
                    ? "ring-2 ring-crocus-500"
                    : "opacity-70"
                }`}
              >
                <img
                  src={`data:image/jpeg;base64,${img}`}
                  alt={`thumb-${idx}`}
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
            <p className="text-2xl font-bold text-crocus-600 mt-2">
              {(selectedProduct.details[0].gia / 1000).toFixed(3)} VND
            </p>
          </div>

          <p className="text-gray-700">
            {selectedProduct.moTa || "Sản phẩm này chưa có mô tả"}
          </p>

          {/* Color */}
          <div>
            <h3 className="font-medium mb-2">Color</h3>
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
            <h3 className="font-medium mb-2">Kích thước</h3>
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
            Trong kho còn lại : <span className="font-medium">{stock}</span>
          </p>

          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-2">Số Lượng</h3>
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
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-crocus-600 hover:bg-crocus-700"
              disabled={stock === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm Vào Giỏ Hàng
            </Button>
            <Button variant="outline" onClick={toggleFavorite} className="w-12">
              <Heart
                className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              <Printer className="mr-2 h-4 w-4" /> In
            </Button>
          </div>

          {/* Barcode */}
          <div className="text-center flex justify-center">
            <img
              alt="Barcode"
              src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
                selectedProduct.id
              )}&translate-esc=on`}
            />
          </div>
        </div>
      </div>


      <Testing />      
      {/* Comments Section */}
      <Comments productId={id} />
  
    </div>
  );
};

export default ProductDetail;
