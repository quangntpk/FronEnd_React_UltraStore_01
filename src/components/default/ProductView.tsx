import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, X } from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";

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

interface ProductViewProps {
  productId: string | null;
  onClose: () => void;
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

const ProductView = ({ productId, onClose }: ProductViewProps) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const id = productId || paramId;

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
          `https://localhost:7051/api/SanPham/SanPhamByIDSorted?id=${baseId}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
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
      showNotification("Vui lòng chọn kích thước!", "error");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập!", "error");
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
        "https://localhost:7051/api/Cart/ThemSanPhamVaoGioHang",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(cartData),
        }
      );
      if (!res.ok) throw new Error("Failed to add to cart");
      showNotification("Thêm vào giỏ hàng thành công!", "success");
      onClose();
    } catch {
      showNotification("Lỗi khi thêm vào giỏ hàng!", "error");
    }
  };

  const handleViewDetails = () => {
    navigate(`/products/${selectedProduct?.id.split("_")[0]}`);
  };

  if (loading) return <div className="p-4 text-center text-lg text-gray-600">Loading...</div>;
  if (error || !selectedProduct) return <div className="p-4 text-center text-lg text-red-500">{error || "Product not found."}</div>;

  const selectedDetail = selectedProduct.details.find((d) => d.kichThuoc === selectedSize);
  const price = selectedDetail ? selectedDetail.gia : selectedProduct.details[0]?.gia || 0;

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
        <Dialog.Close
          className="absolute top-2 right-2 p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-gray-600" />
        </Dialog.Close>
        <Card className="border-none">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="aspect-square rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={mainImage}
                    alt={selectedProduct.tenSanPham}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      setMainImage(
                        products[0].hinhAnhs[0]
                          ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}`
                          : ""
                      )
                    }
                    className={`aspect-square rounded-sm overflow-hidden ${
                      mainImage === (products[0].hinhAnhs[0]
                        ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}`
                        : "")
                        ? "ring-1 ring-crocus-500"
                        : "opacity-70"
                    }`}
                  >
                    <img
                      src={
                        products[0].hinhAnhs[0]
                          ? `data:image/jpeg;base64,${products[0].hinhAnhs[0]}`
                          : ""
                      }
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
                        className={`aspect-square rounded-sm overflow-hidden ${
                          mainImage === item.image
                            ? "ring-1 ring-crocus-500"
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

              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-bold">{selectedProduct.tenSanPham}</h1>
                  <p className="text-2xl font-bold text-crocus-600 mt-1">
                    {(price / 1000).toFixed(3)} VND
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-base">Màu sắc</h3>
                  <div className="flex gap-2">
                    {products.map((p) => (
                      <button
                        key={p.mauSac}
                        onClick={() => handleColorChange(p.mauSac)}
                        className={`w-8 h-8 rounded-full border ${
                          selectedColor === p.mauSac
                            ? "border-crocus-500 ring-1 ring-crocus-500"
                            : "border-gray-200"
                        }`}
                        style={{ backgroundColor: `#${p.mauSac}` }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-base">Kích thước</h3>
                  <div className="flex gap-2">
                    {selectedProduct.details.map((d) => (
                      <button
                        key={d.kichThuoc}
                        onClick={() => handleSizeChange(d.kichThuoc)}
                        className={`w-10 h-10 flex items-center justify-center rounded-sm border ${
                          selectedSize === d.kichThuoc
                            ? "border-crocus-500 bg-crocus-50"
                            : "border-gray-200"
                        } text-base`}
                      >
                        {d.kichThuoc}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 text-base">
                  Còn lại: <span className="font-medium">{stock}</span>
                </p>

                <div>
                  <h3 className="font-medium text-base">Số lượng</h3>
                  <div className="flex items-center border border-gray-200 rounded w-70">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2 py-1 text-gray-500 text-base"
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
                        if (!isNaN(num)) setQuantity(num);
                      }}
                      onBlur={() => setQuantity(Math.min(Math.max(quantity, 1), stock))}
                      className="flex-1 text-center text-base border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={stock === 0}
                    />
                    <button
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                      className="px-2 py-1 text-gray-500 text-base"
                      disabled={stock === 0 || quantity >= stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={stock === 0}
                    className="w-full bg-gradient-to-r from-[#0E5AF0] to-[#EF00D6] text-white py-2 rounded font-medium text-base disabled:opacity-50"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Thêm vào giỏ
                  </Button>
                  <Button
                    onClick={handleViewDetails}
                    variant="link"
                    className="w-full text-crocus-600 hover:text-crocus-700 mt-2"
                    aria-label="Xem chi tiết sản phẩm"
                  >
                    Chi tiết sản phẩm
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default ProductView;