import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Swal from "sweetalert2";

interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
  hinhAnh: string;
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

const ProductView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [stock, setStock] = useState<number>(0);

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
        const product = data.find((p) => p.id === id) || data[0];
        setSelectedProduct(product);
        setSelectedColor(product.mauSac);
        setSelectedSize(product.details[0]?.kichThuoc || "");
        setMainImage(
          product.hinhAnhs[0] ? `data:image/jpeg;base64,${product.hinhAnhs[0]}` : ""
        );
        const initialStock = product.details[0]?.soLuong || 0;
        setStock(initialStock);
        setQuantity(initialStock > 0 ? 1 : 0);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleColorChange = (color: string) => {
    const product = products.find((p) => p.mauSac === color);
    if (!product) return;

    setSelectedProduct(product);
    setSelectedColor(color);
    setSelectedSize(product.details[0]?.kichThuoc || "");
    const newStock = product.details[0]?.soLuong || 0;
    setStock(newStock);
    setQuantity(newStock > 0 ? 1 : 0);
    setMainImage(
      product.details[0]?.hinhAnh ? `data:image/jpeg;base64,${product.details[0].hinhAnh}` : ""
    );
  };

  const handleSizeChange = (size: string) => {
    if (!selectedProduct) return;
    setSelectedSize(size);
    const detail = selectedProduct.details.find((d) => d.kichThuoc === size);
    const newStock = detail?.soLuong || 0;
    setStock(newStock);
    setQuantity(newStock > 0 ? 1 : 0);
    setMainImage(
      detail?.hinhAnh ? `data:image/jpeg;base64,${detail.hinhAnh}` : ""
    );
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

  if (loading) return <div className="container mx-auto py-8 text-2xl">Loading...</div>;
  if (error || !selectedProduct)
    return <div className="container mx-auto py-8 text-2xl">{error || "Product not found."}</div>;

  const selectedDetail = selectedProduct.details.find((d) => d.kichThuoc === selectedSize);
  const price = selectedDetail ? selectedDetail.gia : selectedProduct.details[0]?.gia || 0;

  return (
    <div className="container mx-auto py-8">
      <Card className="border border-gray-200 rounded-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={mainImage}
                  alt={selectedProduct.tenSanPham}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button
                  key={products[0].tenSanPham.substring(0,6)}
                  onClick={() => setMainImage(
                    products[0].hinhAnhs[0] ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}` : ""
                  )}
                  className={`aspect-square rounded-md overflow-hidden ${
                    mainImage === (products[0].hinhAnhs[0] ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}` : "")
                      ? "ring-2 ring-crocus-500"
                      : "opacity-70"
                  }`}
                >
                  <img
                    src={products[0].hinhAnhs[0] ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}` : ""}
                    alt={`${products[0].tenSanPham.substring(0,6)}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                {products
                  .filter(product => product.details[0]?.hinhAnh)
                  .map((product, idx) => ({
                    image: `data:image/jpeg;base64,${product.details[0].hinhAnh}`,
                    productId: product.id
                  }))
                  .filter(item => item.image !== 'data:image/jpeg;base64,')
                  .map((item, idx) => (
                    <button
                      key={`${item.productId}-${idx}`}
                      onClick={() => setMainImage(item.image)}
                      className={`aspect-square rounded-md overflow-hidden ${
                        mainImage === item.image
                          ? "ring-2 ring-crocus-500"
                          : "opacity-70"
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

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold">{selectedProduct.tenSanPham}</h1>
                <p className="text-4xl font-extrabold text-crocus-600 mt-2 p-2 rounded">
                  {(price / 1000).toFixed(3)} VND
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-2">Màu sắc</h3>
                <div className="flex gap-3">
                  {products.map((p) => (
                    <button
                      key={p.mauSac}
                      onClick={() => handleColorChange(p.mauSac)}
                      className={`w-12 h-12 rounded-full border ${
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

              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium text-lg text-gray-900">Kích thước</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.details.map((d) => (
                    <button
                      key={d.kichThuoc}
                      onClick={() => handleSizeChange(d.kichThuoc)}
                      className={`w-12 h-12 flex items-center justify-center rounded-md border ${
                        selectedSize === d.kichThuoc
                          ? "border-crocus-500 bg-crocus-50 text-crocus-700"
                          : "border-gray-200 hover:border-gray-300"
                      } text-lg`}
                    >
                      {d.kichThuoc}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-gray-700 text-lg">
                Trong kho còn lại: <span className="font-medium">{stock}</span>
              </p>

              <div>
                <h3 className="font-medium text-lg mb-2">Số Lượng</h3>
                <div className="flex items-center border border-gray-200 rounded-md w-72">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 text-gray-500 hover:text-gray-700 text-xl"
                    disabled={stock === 0 || quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      const num = parseInt(value, 10);
                      if (!isNaN(num)) {
                        setQuantity(num);
                      }
                    }}
                    onBlur={() => {
                      setQuantity(Math.min(Math.max(quantity, 1), stock));
                    }}
                    className="flex-1 text-center text-lg border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    disabled={stock === 0}
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    className="px-4 py-3 text-gray-500 hover:text-gray-700 text-xl"
                    disabled={stock === 0 || quantity >= stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={stock === 0}
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-[#0E5AF0] to-[#EF00D6] text-white py-4 px-8 rounded-lg font-semibold text-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                  style={{
                    background: stock === 0 ? '#gray' : 'linear-gradient(to right, #0E5AF0, #EF00D6)',
                  }}
                  onMouseEnter={(e) => {
                    if (stock > 0) {
                      e.currentTarget.style.background = '#EF00D6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (stock > 0) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #0E5AF0, #EF00D6)';
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingCart className="h-6 w-6" />
                    <span>Thêm Vào Giỏ Hàng</span>
                  </div>
                </button>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-2">Thông tin chi tiết</h3>
                <div className="space-y-2 text-gray-600 text-lg">
                  <p>Thương hiệu: {selectedProduct.maThuongHieu}</p>
                  <p>Loại sản phẩm: {selectedProduct.loaiSanPham}</p>
                  <p>Chất liệu: {selectedProduct.chatLieu}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductView;