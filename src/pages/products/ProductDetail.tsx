import { useState, useEffect } from "react";
const Link = ({ to, children, className, ...props }: any) => (
  <a href={to} className={className} {...props}>{children}</a>
);
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { AlignCenter, Heart, ShoppingCart, Printer } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

// Mock data for reviews and related products
const mockReviews = [
  { id: 1, user: "Emma S.", date: "March 15, 2025", rating: 5, comment: "Absolutely love this product! The quality is amazing." },
  { id: 2, user: "Sophia T.", date: "March 10, 2025", rating: 4, comment: "Great fit, very comfortable." },
  { id: 3, user: "Olivia R.", date: "March 5, 2025", rating: 5, comment: "Perfect for my needs, highly recommend!" },
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
const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
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
// Placeholder for showNotification (replace with your actual implementation)
const showNotification = (message: string, type: "success" | "error") => {
  alert(`${type.toUpperCase()}: ${message}`);
  // Example with react-toastify:
  // import { toast } from 'react-toastify';
  // if (type === "success") toast.success(message);
  // else toast.error(message);
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

        // Select the product matching the full id (including color) or fall back to the first product
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

  const toggleFavorite = () => {
    console.log(`Toggle favorite for product ${id}`);
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      showNotification("Vui lòng chọn kích thước trước khi thêm vào giỏ hàng!", "error");
      return;
    }
    const cartData = {
      IDNguoiDung: "KH001", // Replace with dynamic user ID if available
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
          ← Quay lại trang Danh Sách Sản Phẩm
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
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={i < Math.floor(4.5) ? "currentColor" : "none"}
                    stroke={i < Math.floor(4.5) ? "none" : "currentColor"}
                    className={`w-5 h-5 ${
                      i < Math.floor(4.5) ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">4.5 ({mockReviews.length} reviews)</span>
            </div>
            <p className="text-2xl font-bold text-crocus-600 mt-2">
              {(selectedProduct.details[0].gia/1000).toFixed(3)} VND
            </p>
          </div>

          <p className="text-gray-700">{selectedProduct.moTa || "Sản phẩm này chưa có mô tả"}</p>
          
          {/* Color Selection */}
          <div>
            <h3 className="font-medium mb-2">Color</h3>
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
            <h3 className="font-medium mb-2">Size</h3>
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
              Trong kho còn lại : <span className="font-medium">{stock} sản phẩm</span>
            </p>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-2">Số Lượng</h3>
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
              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm Vào Giỏ Hàng
            </Button>
            <Button variant="outline" onClick={toggleFavorite} className="w-12">
              <Heart className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              <Printer className="mr-2 h-4 w-4" /> In
            </Button>         
          </div>
          
          <div className="text-center" style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <img
              alt="Barcode Generator TEC-IT"
              src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(selectedProduct.id)}&translate-esc=on`}
            />          
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="mb-12">
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Chi Tiết Sản Phẩm</TabsTrigger>
            <TabsTrigger value="specifications">Tóm Tắt</TabsTrigger>
            <TabsTrigger value="reviews">Đánh Giá</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="p-4 border rounded-lg">
            <p className="text-gray-700">{selectedProduct.moTa || "Sản Phẩm Này Chưa Có Mô Tả"}</p>
          </TabsContent>
          <TabsContent value="specifications" className="p-4 border rounded-lg">
            <ul className="list-disc pl-5 space-y-2">
              <li className="text-gray-700">Sizes: {selectedProduct.details.map((d) => d.kichThuoc).join(", ")}</li>
              <li className="text-gray-700">Số Lượng còn lại: {stock} units</li>
              <li className="text-gray-700">Chất Liệu: {selectedProduct.chatLieu}</li>
              <li className="text-gray-700">Thương Hiệu: {selectedProduct.maThuongHieu}</li>
            </ul>
          </TabsContent>
          <TabsContent value="reviews" className="p-4 border rounded-lg">
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{review.user}</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={i < review.rating ? "currentColor" : "none"}
                        stroke={i < review.rating ? "none" : "currentColor"}
                        className={`w-4 h-4 ${
                          i < review.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Bạn có thể sẽ thích</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRelatedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-square">
                <Link to={`/products/${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <button
                  onClick={() => console.log(`Toggle favorite for related product ${product.id}`)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      product.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                    }`}
                  />
                </button>
              </div>
              <CardContent className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="font-medium hover:text-crocus-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex justify-between items-center mt-2">
                  <p className="font-semibold">${product.price.toFixed(2)}</p>
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                        stroke={i < Math.floor(product.rating) ? "none" : "currentColor"}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;