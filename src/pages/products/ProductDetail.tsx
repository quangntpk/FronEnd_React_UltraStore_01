import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Heart, ShoppingCart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Swal from "sweetalert2";
import Comments from "./Comments"; // Import Comments thay vì Comment

// Interface for product details
interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
}

// Interface for product data based on API response
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

// Notification function using SweetAlert2
const showNotification = (message: string, type: "success" | "error") => {
  Swal.fire({
    title: type === "error" ? "Lỗi!" : "Thành công!",
    text: message,
    icon: type,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [stock, setStock] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likedId, setLikedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const baseId = id?.split('_')[0] || id;
        console.log(`Fetching products for base ID: ${baseId}`);
        const response = await fetch(
          `http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${baseId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: Product[] = await response.json();
        console.log("API response data:", data);

        if (!data || data.length === 0) {
          throw new Error("No products returned from API.");
        }

        setProducts(data);

        const product = data.find((p) => p.id === id) || data[0];
        if (product) {
          console.log("Selected product:", product);
          setSelectedProduct(product);
          setSelectedColor(product.mauSac);
          setSelectedSize(product.details[0]?.kichThuoc || "");
          setMainImage(product.hinhAnhs[0] ? `data:image/jpeg;base64,${product.hinhAnhs[0]}` : "");
          setStock(product.details[0]?.soLuong || 0);
        } else {
          setError(`Product with ID ${id} not found in API response.`);
          console.error(`Product with ID ${id} not found. Available IDs:`, data.map(p => p.id));
        }

        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const currentUserId = userData?.maNguoiDung;
        if (currentUserId) {
          const yeuThichResponse = await fetch("http://localhost:5261/api/YeuThich");
          if (!yeuThichResponse.ok) throw new Error("Failed to fetch favorites");
          const yeuThichData = await yeuThichResponse.json();
          const userFavorite = yeuThichData.find(
            (yeuThich: any) =>
              yeuThich.maSanPham === baseId && yeuThich.maNguoiDung === currentUserId
          );
          if (userFavorite) {
            setIsLiked(true);
            setLikedId(userFavorite.maYeuThich);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred.";
        setError(`Failed to fetch product details: ${errorMessage}`);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [id]);

  const handleColorChange = (color: string) => {
    const product = products.find((p) => p.mauSac === color);
    if (product) {
      console.log("Changed to product:", product);
      setSelectedProduct(product);
      setSelectedColor(color);
      setSelectedSize(product.details[0]?.kichThuoc || "");
      setMainImage(product.hinhAnhs[0] ? `data:image/jpeg;base64,${product.hinhAnhs[0]}` : "");
      setStock(product.details[0]?.soLuong || 0);
      setQuantity(1);
    }
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const detail = selectedProduct?.details.find((d) => d.kichThuoc === size);
    setStock(detail?.soLuong || 0);
    console.log(`Selected size: ${size}, Stock: ${detail?.soLuong || 0}`);
  };

  const toggleFavorite = async () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;
    const hoTen = userData?.hoTen;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!", "error");
      return;
    }

    const baseProductId = id?.split("_")[0] || id;
    const tenSanPham = selectedProduct?.tenSanPham;

    if (isLiked) {
      try {
        const response = await fetch(`http://localhost:5261/api/YeuThich/${likedId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Failed to remove favorite");
        setIsLiked(false);
        setLikedId(null);
        showNotification("Đã xóa sản phẩm khỏi danh sách yêu thích!", "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi xóa yêu thích!", "error");
      }
    } else {
      const yeuThichData = {
        maSanPham: baseProductId,
        tenSanPham: tenSanPham,
        maNguoiDung: maNguoiDung,
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
        if (!response.ok) throw new Error("Failed to add favorite");
        const addedFavorite = await response.json();
        setIsLiked(true);
        setLikedId(addedFavorite.maYeuThich);
        showNotification("Đã thêm sản phẩm vào danh sách yêu thích!", "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi thêm yêu thích!", "error");
      }
    }
  };

  const handleAddToCart = async () => {
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
      IDSanPham: id?.split("_")[0] || id,
      MauSac: selectedProduct?.mauSac,
      KichThuoc: selectedSize,
      SoLuong: quantity,
    };
    try {
      const response = await fetch("http://localhost:5261/api/Cart/ThemSanPhamVaoGioHang", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cartData),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      showNotification("Đã thêm vào giỏ hàng thành công!", "success");
    } catch (err) {
      showNotification("Có lỗi xảy ra khi thêm vào giỏ hàng!", "error");
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (error || !selectedProduct) {
    return <div className="container mx-auto py-8">{error || "Product not found."}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link
          to="/products"
          className="text-crocus-600 hover:underline flex items-center gap-1"
        >
          ← Quay về cửa hàng
        </Link>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={mainImage}
              alt={selectedProduct.tenSanPham}
              className="w-full h-full object-cover"
              onError={() => console.error("Failed to load main image:", mainImage)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {selectedProduct.hinhAnhs.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setMainImage(`data:image/jpeg;base64,${image}`)}
                className={`aspect-square rounded-md overflow-hidden ${
                  mainImage === `data:image/jpeg;base64,${image}` ? "ring-2 ring-crocus-500" : "opacity-70"
                }`}
              >
                <img
                  src={`data:image/jpeg;base64,${image}`}
                  alt={`${selectedProduct.tenSanPham} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => console.error("Failed to load thumbnail image:", image)}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{selectedProduct.tenSanPham}</h1>
            
            <p className="text-2xl font-bold text-crocus-600 mt-2">
              {selectedProduct.details[0].gia.toFixed()} VND
              
            </p>
          </div>

          <p className="text-gray-700">{selectedProduct.moTa || "Không có mô tả."}</p>

          {/* Color Selection */}
          <div>
            <h3 className="font-medium mb-2">Màu</h3>
            <div className="flex gap-3">
              {products.map((product) => (
                <button
                  key={product.mauSac}
                  onClick={() => handleColorChange(product.mauSac)}
                  className={`w-10 h-10 rounded-full border ${
                    selectedColor === product.mauSac
                      ? "border-crocus-500 ring-2 ring-crocus-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: `#${product.mauSac}` }}
                  title={product.mauSac}
                ></button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="font-medium mb-2">Kích thước</h3>
            <div className="flex flex-wrap gap-3">
              {selectedProduct.details.map((detail) => (
                <button
                  key={detail.kichThuoc}
                  onClick={() => handleSizeChange(detail.kichThuoc)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md border ${
                    selectedSize === detail.kichThuoc
                      ? "border-crocus-500 bg-crocus-50 text-crocus-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {detail.kichThuoc}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <p className="text-gray-700">
              Kho: <span className="font-medium">{stock} </span>
            </p>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-2">Số lượng</h3>
            <div className="flex items-center border border-gray-200 rounded-md w-32">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="flex-1 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => Math.min(stock, prev + 1))}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                disabled={quantity >= stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-crocus-600 hover:bg-crocus-700"
              disabled={stock === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm vào giỏ hàng
            </Button>
            <Button
              variant="outline"
              onClick={toggleFavorite}
              className="w-12"
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-500"}`}
              />
            </Button>
          </div>
        </div>
      </div>
      {/* Comments Section */}
      <Comments productId={id} />
    </div>
  );
};

export default ProductDetail;