import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Package, Percent, Clock, ArrowLeft, Heart, Share2 } from 'lucide-react';

const ChiTietKhuyenMai = () => {
  const [khuyenMaiData, setKhuyenMaiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('products');

  // Mock data dựa trên API response
  useEffect(() => {
    const mockData = {
      "id": 2,
      "tenKhuyenMai": "Khuyến mãi Sinh nhật",
      "ngayBatDau": "2025-08-15",
      "ngayKetThuc": "2025-08-20",
      "percentChung": null,
      "hinhAnh": null,
      "danhSachKhuyenMai": [
        {
          "id": 0,
          "idSanPham": "A00001_ff0000_S",
          "tenSanPhamCombo": "Áo thun nam",
          "giaMoi": 150000,
          "percent": 15,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00001_ff0000_XL",
          "tenSanPhamCombo": "Áo thun nam",
          "giaMoi": 150000,
          "percent": 15,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00001_ff0000_XXL",
          "tenSanPhamCombo": "Áo thun nam",
          "giaMoi": 150000,
          "percent": 15,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00001_ff00ff_M",
          "tenSanPhamCombo": "Áo thun nam",
          "giaMoi": 150000,
          "percent": 15,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00001_ff00ff_XL",
          "tenSanPhamCombo": "Áo thun nam",
          "giaMoi": 150000,
          "percent": 15,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00002_ff0000_XL",
          "tenSanPhamCombo": "Áo khoác nữ",
          "giaMoi": 150000,
          "percent": 20,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00002_ff0000_XXL",
          "tenSanPhamCombo": "Áo khoác nữ",
          "giaMoi": 150000,
          "percent": 20,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00002_ff00ff_M",
          "tenSanPhamCombo": "Áo khoác nữ",
          "giaMoi": 150000,
          "percent": 20,
          "giaGoc": 150000
        },
        {
          "id": 0,
          "idSanPham": "A00002_ff00ff_XL",
          "tenSanPhamCombo": "Áo khoác nữ",
          "giaMoi": 150000,
          "percent": 20,
          "giaGoc": 150000
        }
      ],
      "moTa": {
        "header": {
          "title": "Khuyến mãi siêu hạ giá Thu - Đông 2025"
        },
        "picture": {
          "url": "<binary data>"
        },
        "title": [
          {
            "name": "Thế giới hoàn mỹ",
            "subtitle": [
              {
                "name": "Trọng lượng tạo nên đẳng cấp – Áo len không chỉ để mặc, mà để cảm nhận",
                "description": {
                  "content": "<p>Trong thế giới thời trang, một chiếc áo len đẹp không chỉ nằm ở kiểu dáng hay màu sắc, mà còn ở <strong>trọng lượng vải</strong> – yếu tố tinh tế nhưng quyết định trải nghiệm mặc.</p><p>Chiếc áo len này được dệt từ sợi cao cấp với <strong>trọng lượng lý tưởng</strong>, tạo cảm giác <strong>đầm tay, ôm cơ thể vừa vặn</strong> mà không gây nặng nề. Mỗi lần khoác lên, bạn sẽ cảm nhận được <strong>sự chắc chắn</strong>, <strong>ấm áp</strong>, và <strong>độ rủ tự nhiên</strong> – dấu hiệu của một thiết kế chất lượng và đắt giá.</p><p>Trọng lượng được tính toán cẩn thận giúp áo giữ <strong>phom dáng bền bỉ</strong>, không bị bai dão sau nhiều lần mặc, đồng thời mang lại cảm giác <strong>cao cấp</strong> ngay từ lần chạm đầu tiên.</p>"
                },
                "picture": {
                  "url": "<binary data>"
                }
              }
            ],
            "picture": {
              "url": "<binary data>"
            }
          }
        ]
      }
    };

    setTimeout(() => {
      setKhuyenMaiData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateDiscountedPrice = (originalPrice, percent) => {
    return originalPrice * (100 - percent) / 100;
  };

  const getColorFromId = (idSanPham) => {
    if (idSanPham.includes('ff0000')) return 'Đỏ';
    if (idSanPham.includes('ff00ff')) return 'Hồng';
    return 'Không xác định';
  };

  const getSizeFromId = (idSanPham) => {
    const parts = idSanPham.split('_');
    return parts[parts.length - 1];
  };

  const groupProductsByName = (products) => {
    const grouped = {};
    products.forEach(product => {
      if (!grouped[product.tenSanPhamCombo]) {
        grouped[product.tenSanPhamCombo] = [];
      }
      grouped[product.tenSanPhamCombo].push(product);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Đang tải thông tin khuyến mãi...</p>
        </div>
      </div>
    );
  }

  if (!khuyenMaiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy thông tin khuyến mãi</h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const groupedProducts = groupProductsByName(khuyenMaiData.danhSachKhuyenMai);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Chi tiết khuyến mãi</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Heart className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="relative h-64 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-2">{khuyenMaiData.tenKhuyenMai}</h1>
                <p className="text-xl opacity-90">{khuyenMaiData.moTa.header.title}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(khuyenMaiData.ngayBatDau)} - {formatDate(khuyenMaiData.ngayKetThuc)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                <Tag className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Số sản phẩm</p>
                  <p className="font-semibold text-gray-900">{khuyenMaiData.danhSachKhuyenMai.length} sản phẩm</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
                <Percent className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Giảm giá</p>
                  <p className="font-semibold text-gray-900">Lên đến 20%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setSelectedTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'products'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="inline h-4 w-4 mr-2" />
                Sản phẩm khuyến mãi
              </button>
              <button
                onClick={() => setSelectedTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'details'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mô tả chi tiết
              </button>
            </nav>
          </div>

          <div className="p-8">
            {selectedTab === 'products' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm khuyến mãi</h3>
                <div className="space-y-8">
                  {Object.entries(groupedProducts).map(([productName, variants]) => (
                    <div key={productName} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-gray-900">{productName}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                            -{variants[0].percent}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {variants.map((variant, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Màu: {getColorFromId(variant.idSanPham)}</p>
                                <p className="text-sm text-gray-600">Size: {getSizeFromId(variant.idSanPham)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">
                                  {formatCurrency(calculateDiscountedPrice(variant.giaGoc, variant.percent))}
                                </p>
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(variant.giaGoc)}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">ID: {variant.idSanPham}</span>
                              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                                Thêm vào giỏ
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'details' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Mô tả chi tiết</h3>
                <div className="prose max-w-none">
                  {khuyenMaiData.moTa.title.map((section, index) => (
                    <div key={index} className="mb-8">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">{section.name}</h4>
                      {section.subtitle.map((subsection, subIndex) => (
                        <div key={subIndex} className="mb-6">
                          <h5 className="text-lg font-medium text-gray-800 mb-3">{subsection.name}</h5>
                          <div 
                            className="prose prose-lg text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: subsection.description.content }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Đừng bỏ lỡ cơ hội này!</h3>
          <p className="text-lg mb-6 opacity-90">
            Chương trình khuyến mãi sẽ kết thúc vào ngày {formatDate(khuyenMaiData.ngayKetThuc)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Xem tất cả sản phẩm
            </button>
            <button className="bg-purple-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-900 transition-colors">
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiTietKhuyenMai;