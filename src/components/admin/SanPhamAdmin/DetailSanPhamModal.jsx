import { useState, useEffect } from "react";
import { X, Edit, Trash, Package, Palette, Ruler, TrendingUp, Eye,  DollarSign, Coins} from "lucide-react";
import Swal from "sweetalert2";
import MoTaSanPham from '../.././/../pages/products/MoTaSanPham';

const ProductDetailAdminModal = ({ productId, isOpen, onClose }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper để hiển thị thông báo
  const showNotification = (message, type) => {
    Swal.fire({
      toast: true,
      title: message,
      icon: type,
      timer: 2500,
      position: "top-end",
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !isOpen) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const baseProductId = productId.split('_')[0] || productId;
        const response = await fetch(`http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${baseProductId}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
          }
        });
        if (!response.ok) {
          throw new Error('Không thể tải thông tin sản phẩm');
        }
        const data = await response.json();
        const productArray = Array.isArray(data) ? data : [data];
        const formattedProducts = productArray.map(product => ({
          id: product.id,
          tenSanPham: product.tenSanPham,
          maThuongHieu: product.maThuongHieu,
          loaiSanPham: product.loaiSanPham,
          mauSac: product.mauSac,
          moTa: product.moTa || "Không có mô tả rút gọn",
          chatLieu: product.chatLieu,
          details: product.details.map(detail => ({
            kichThuoc: detail.kichThuoc.trim(),
            soLuong: detail.soLuong,
            gia: detail.gia,
            hinhAnh: detail.hinhAnh,
            giaNhap: detail.giaNhap
          })),
          hinhAnhs: product.hinhAnhs?.map(base64 => `data:image/jpeg;base64,${base64}`) || [],
          moTaChiTiet: product.moTaChiTiet
        }));
        setProducts(formattedProducts);
        setSelectedProduct(formattedProducts[0]);
        if (formattedProducts.length > 0 && formattedProducts[0].hinhAnhs.length > 0) {
          setMainImage(formattedProducts[0].hinhAnhs[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, isOpen]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa sản phẩm',
      text: 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    });
    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:5261/api/SanPham/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (!response.ok) {
          throw new Error("Xóa sản phẩm thất bại");
        }
        showNotification("Xóa sản phẩm thành công!", "success");
        onClose();
      } catch (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        showNotification("Có lỗi xảy ra khi xóa sản phẩm!", "error");
      }
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-lg text-gray-700 font-medium">Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !products.length || !selectedProduct) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-lg text-red-600 font-medium mb-4">
              {error || "Không tìm thấy sản phẩm"}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Thu thập tất cả hình ảnh từ mọi biến thể
  const allImages = [
    ...selectedProduct.hinhAnhs,
    ...products
      .flatMap(product => product.details
        .filter(size => size.hinhAnh)
        .map(size => `data:image/jpeg;base64,${size.hinhAnh}`)
      )
  ].filter((image, index, self) => image && self.indexOf(image) === index);

  // Tính tổng số lượng tồn kho và đã bán
  const totalStock = products.reduce((sum, product) =>
    sum + product.details.reduce((sizeSum, size) => sizeSum + size.soLuong, 0), 0
  );
  const totalSold = products.reduce((sum, product) =>
    sum + product.details.reduce((sizeSum, size) => sizeSum + Math.floor(Math.random() * 100), 0), 0
  );

  // Slider logic
  const imagesPerSlide = 3;
  const totalSlides = Math.ceil(allImages.length / imagesPerSlide);
  
  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
  };
  
  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" >
        <div className="bg-white rounded-2xl w-full max-w-7xl h-[80vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Chi Tiết Sản Phẩm</h2>
                <p className="text-gray-500 mt-1">Quản lý thông tin sản phẩm</p>
              </div>
              <div className="flex gap-3">          
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  aria-label="Đóng modal"
                  title="Đóng"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Section with Scroll */}
          <div className="flex-1 overflow-y-auto p-8 " style={{maxHeight:"650px"}}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Images */}
              <div className="space-y-6">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                  <img
                    src={mainImage || (selectedProduct.hinhAnhs[0] || "")}
                    alt={selectedProduct.tenSanPham}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                {/* Image Slider */}
                <div className="relative">
                  <div className="overflow-hidden">
                    <div 
                      className="flex transition-transform duration-300"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                        <div key={slideIndex} className="flex-shrink-0 w-full grid grid-cols-3 gap-4">
                          {allImages
                            .slice(slideIndex * imagesPerSlide, (slideIndex + 1) * imagesPerSlide)
                            .map((image, idx) => (
                              <button
                                key={`slide-${slideIndex}-${idx}`}
                                onClick={() => setMainImage(image)}
                                className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                                  mainImage === image
                                    ? "ring-3 ring-blue-500 shadow-lg transform scale-105"
                                    : "opacity-70 hover:opacity-100 hover:shadow-md"
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`${selectedProduct.tenSanPham} ${slideIndex * imagesPerSlide + idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  {totalSlides > 1 && (
                    <>
                      <button
                        onClick={handlePrevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-800"
                        aria-label="Previous slide"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleNextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-800"
                        aria-label="Next slide"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedProduct.tenSanPham}</h1>
                  <p className="text-gray-600 text-lg leading-relaxed">{selectedProduct.moTa}</p>
                </div>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8" />
                      <div>
                        <p className="text-blue-100 text-sm">Tổng tồn kho</p>
                        <p className="text-2xl font-bold">{totalStock}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8" />
                      <div>
                        <p className="text-green-100 text-sm">Đã bán</p>
                        <p className="text-2xl font-bold">{totalSold}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Product Details */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-600" />
                      Thông tin cơ bản
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Chất liệu</p>
                        <p className="font-medium">{selectedProduct.chatLieu}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Thương hiệu</p>
                        <p className="font-medium">{selectedProduct.maThuongHieu}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Loại sản phẩm</p>
                        <p className="font-medium">{selectedProduct.loaiSanPham}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Số biến thể</p>
                        <p className="font-medium">{products.length} màu sắc</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-6 flex justify-center">
                    <button
                      onClick={() => setIsDetailModalOpen(true)}
                      className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                      aria-label="Xem chi tiết sản phẩm"
                      title="Chi Tiết Sản Phẩm"
                    >
                      <Eye className="h-6 w-6" />
                      <span>Xem chi tiết Mô Tả</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mt-8">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Palette className="h-6 w-6" />
                  Tất cả biến thể sản phẩm
                </h3>
                <p className="text-gray-600 mt-1">Quản lý thông tin chi tiết từng biến thể</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Màu sắc
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          Kích thước
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Tồn kho
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Đã bán
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4" />
                          Giá Nhập
                        </div>
                      </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Giá Nhập
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product, productIndex) =>
                      product.details.map((size, sizeIndex) => (
                        <tr
                          key={`${productIndex}-${sizeIndex}`}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: `#${product.mauSac}` }}
                                title={`#${product.mauSac}`}
                              />
                              <div>
                                <p className="font-medium text-gray-900">#{product.mauSac}</p>
                                <p className="text-sm text-gray-500">Màu {productIndex + 1}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {size.kichThuoc}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-semibold ${
                                size.soLuong > 10 ? 'text-green-600' :
                                size.soLuong > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {size.soLuong}
                              </span>
                              <span className="text-gray-500 text-sm">cái</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">{Math.floor(Math.random() * 100)}</span>
                              <span className="text-gray-500 text-sm">cái</span>
                            </div>
                          </td>
                            <td className="px-6 py-5">
                            <div className="text-lg font-bold text-blue-600">
                              {(size.giaNhap / 1000).toFixed(3)} VND
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-lg font-bold text-blue-600">
                              {(size.gia / 1000).toFixed(3)} VND
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              size.soLuong > 10
                                ? 'bg-green-100 text-green-800'
                                : size.soLuong > 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {size.soLuong > 10 ? 'Còn hàng' : size.soLuong > 0 ? 'Sắp hết' : 'Hết hàng'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Table Footer with Summary */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Tổng cộng: {products.reduce((sum, p) => sum + p.details.length, 0)} biến thể
                  </span>
                  <div className="flex gap-6">
                    <span className="text-gray-600">
                      Tổng tồn kho: <span className="font-semibold text-blue-600">{totalStock}</span>
                    </span>
                    <span className="text-gray-600">
                      Tổng đã bán: <span className="font-semibold text-green-600">{totalSold}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-8 py-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">© 2025 FashionHub. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-7xl h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Mô Tả Chi Tiết Sản Phẩm</h2>
                  <p className="text-gray-500 mt-1">Xem chi tiết sản phẩm</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  aria-label="Đóng modal"
                  title="Đóng"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8" style={{maxHeight:"650px"}}>
              <MoTaSanPham product={selectedProduct} />
            </div>
            {/* Modal Footer */}
            <div className="bg-gray-100 px-8 py-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">© 2025 FashionHub. All rights reserved.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailAdminModal;