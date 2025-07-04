import { useState, useEffect } from "react";
import { X, Edit, Trash } from "lucide-react";

const ProductDetailAdminModal = ({ productId, isOpen, onClose }) => {
  const [products, setProducts] = useState([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !isOpen) return;

      try {
        setLoading(true);
        const baseProductId = productId.split('_')[0] || productId;
        const response = await fetch(`http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${baseProductId}`);
        if (!response.ok) {
          throw new Error('Không thể tải thông tin sản phẩm');
        }
        const data = await response.json();
        const productArray = Array.isArray(data) ? data : [data];

        const formattedProducts = productArray.map(product => ({
          id: product.id,
          name: product.tenSanPham,
          description: product.moTa || "Không có mô tả",
          color: `#${product.mauSac}`,
          sizes: product.details.map(detail => ({
            size: detail.kichThuoc.trim(),
            quantity: detail.soLuong,
            price: detail.gia // Keep price in VND without dividing by 1000
          })),
          material: product.chatLieu,
          brand: product.maThuongHieu,
          productType: product.loaiSanPham,
          images: product.hinhAnhs?.map(base64 => 
            `data:image/jpeg;base64,${base64}`
          ) || []
        }));

        setProducts(formattedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isOpen]);

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        const response = await fetch(`http://localhost:5261/api/SanPham/${productId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Xóa sản phẩm thất bại");
        }
        alert("Xóa sản phẩm thành công!");
        onClose();
      } catch (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        alert("Có lỗi xảy ra khi xóa sản phẩm!");
      }
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <p className="text-lg text-gray-700">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !products.length) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <p className="text-lg text-red-600">Lỗi: {error || "Không tìm thấy sản phẩm"}</p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const currentProduct = products[selectedColorIndex];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Chi Tiết Sản Phẩm</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng modal"
          >
            <X className="h-7 w-7 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={currentProduct.images[selectedImage]}
                alt={currentProduct.name}
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto py-2">
              {currentProduct.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-24 h-24 rounded-lg border-2 transition-all duration-200 ${
                    selectedImage === index ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${currentProduct.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">{currentProduct.name}</h3>
              <p className="text-gray-600 mt-3 leading-relaxed">{currentProduct.description}</p>
            </div>

            {/* Colors */}
            <div>
              <h4 className="text-lg font-medium text-gray-700">Màu sắc:</h4>
              <div className="flex gap-4 mt-3">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    className={`w-10 h-10 rounded-full transition-all duration-200 ${
                      selectedColorIndex === index
                        ? "ring-2 ring-offset-2 ring-blue-500"
                        : "ring-1 ring-gray-200 hover:ring-blue-300"
                    }`}
                    style={{ backgroundColor: product.color }}
                    onClick={() => setSelectedColorIndex(index)}
                    aria-label={`Chọn màu ${product.color}`}
                  />
                ))}
              </div>
            </div>

            {/* Sizes & Prices */}
            <div>
              <h4 className="text-lg font-medium text-gray-700">Kích thước & Giá:</h4>
              <ul className="mt-3 space-y-3 text-gray-600">
                {currentProduct.sizes.map((size, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-medium">{size.size}:</span>
                    <span>{size.quantity} sản phẩm</span>
                    <span>(Giá: {size.price.toLocaleString('vi-VN')} VND)</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Info */}
            <div>
              <h4 className="text-lg font-medium text-gray-700">Thông tin bổ sung:</h4>
              <ul className="mt-3 space-y-3 text-gray-600">
                <li><span className="font-medium">Chất liệu:</span> {currentProduct.material}</li>
                <li><span className="font-medium">Thương hiệu:</span> {currentProduct.brand}</li>
                <li><span className="font-medium">Loại sản phẩm:</span> {currentProduct.productType}</li>
              </ul>
            </div>

        
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailAdminModal;