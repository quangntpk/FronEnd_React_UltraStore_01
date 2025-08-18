import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Package, Percent, Clock, ArrowLeft, Heart, Share2, ShoppingCart, Star, Eye } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
  giaNhap: number;
  hinhAnh: string | null;
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
  th: number;
  lsp: number;
  mauSac: string;
  moTa: string | null;
  chatLieu: string;
  gioiTinh: number;
  details: ProductDetail[];
  hinhAnhs: string[];
  moTaChiTiet: string | null;
  listHashTag: HashTag[];
  khuyenMaiMax: number;
}

interface ComboProduct {
  id: number;
  idSanPham: string;
  name: string;
  thuongHieu: string;
  loaiSanPham: string;
  kichThuoc: string[];
  soLuong: number;
  donGia: number;
  moTa: string | null;
  chatLieu: string;
  mauSac: string[];
  hinh: string[];
}

interface Combo {
  maCombo: number;
  name: string;
  hinhAnh: string;
  sanPhams: ComboProduct[];
}

interface PromotionItem {
  id: number;
  idSanPham?: string;
  idCombo?: number;
  tenSanPhamCombo: string;
  giaMoi: number;
  percent: number;
  giaGoc: number;
  hinhAnh: string[];
}

interface PromotionData {
  id: number;
  tenKhuyenMai: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  percentChung: number | null;
  hinhAnh: string[];
  danhSachKhuyenMai: PromotionItem[];
  moTa: {
    header: {
      title: string;
    };
    Picture: Array<{
      url: string;
    }>;
    title: Array<{
      name: string;
      subtitle: Array<{
        name: string;
        description: {
          content: string;
        };
        picture: {
          url: string;
        };
      }>;
      picture: {
        url: string;
      };
    }>;
  };
}

interface DetailedPromotionItem extends PromotionItem {
  productDetails?: Product[];
  comboDetails?: Combo[];
}

const ChiTietKhuyenMai = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [khuyenMaiData, setKhuyenMaiData] = useState<PromotionData | null>(null);
  const [detailedItems, setDetailedItems] = useState<DetailedPromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('products');

  useEffect(() => {
    if (id) {
      fetchPromotionData(id);
    }
  }, [id]);

  const fetchPromotionData = async (promotionId: string) => {
    try {
      setLoading(true);
      
      // Fetch promotion data
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/KhuyenMai/ListKhuyenMaiUser?id=${promotionId}`);
      if (!response.ok) throw new Error('Failed to fetch promotion data');
      
      const promotionData: PromotionData[] = await response.json();
      setKhuyenMaiData(promotionData[0]);
      
      // Fetch detailed product/combo information
      const detailedPromises = promotionData[0].danhSachKhuyenMai.map(async (item) => {
        const detailedItem: DetailedPromotionItem = { ...item };

        // If it's a product
        if (item.idSanPham) {
          try {
            const productId = item.idSanPham.split('_')[0]; // Extract base product ID
            const productResponse = await fetch(`https://bicacuatho.azurewebsites.net/api/SanPham/SanPhamByIDSorted?id=${productId}`);
            if (productResponse.ok) {
              detailedItem.productDetails = await productResponse.json();
            }
          } catch (error) {
            console.error(`Error fetching product details for ${item.idSanPham}:`, error);
          }
        }

        // If it's a combo
        if (item.idCombo) {
          try {
            const comboResponse = await fetch(`https://bicacuatho.azurewebsites.net/api/Combo/ComboSanPhamView?id=${item.idCombo}`);
            if (comboResponse.ok) {
              detailedItem.comboDetails = await comboResponse.json();
            }
          } catch (error) {
            console.error(`Error fetching combo details for ${item.idCombo}:`, error);
          }
        }

        return detailedItem;
      });

      const detailedResults = await Promise.all(detailedPromises);
      setDetailedItems(detailedResults);
    } catch (error) {
      console.error('Error fetching promotion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateDiscountedPrice = (originalPrice: number, percent: number) => {
    return originalPrice * (100 - percent) / 100;
  };

  const getColorName = (colorCode: string) => {
    const colorMap: { [key: string]: string } = {
      'ff0000': 'Đỏ',
      'ff00ff': 'Hồng',
      '000000': 'Đen',
      '0C06F5': 'Xanh dương',
      'ffffff': 'Trắng',
      '00ff00': 'Xanh lá',
      'ffff00': 'Vàng',
      'ffa500': 'Cam'
    };
    return colorMap[colorCode.toLowerCase()] || 'Không xác định';
  };

  const getSizeFromId = (idSanPham: string) => {
    const parts = idSanPham.split('_');
    return parts[parts.length - 1];
  };

  const getColorFromId = (idSanPham: string) => {
    const parts = idSanPham.split('_');
    if (parts.length >= 2) {
      return getColorName(parts[1]);
    }
    return 'Không xác định';
  };

  const groupItemsByType = (items: DetailedPromotionItem[]) => {
    const products: DetailedPromotionItem[] = [];
    const combos: DetailedPromotionItem[] = [];

    items.forEach(item => {
      if (item.idSanPham) {
        products.push(item);
      } else if (item.idCombo) {
        combos.push(item);
      }
    });

    return { products, combos };
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
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { products, combos } = groupItemsByType(detailedItems);
  const maxDiscount = Math.max(...detailedItems.map(item => item.percent));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
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
            {khuyenMaiData.hinhAnh && khuyenMaiData.hinhAnh.length > 0 && (
              <img 
                src={khuyenMaiData.hinhAnh[0].startsWith('data:') ? khuyenMaiData.hinhAnh[0] : `data:image/jpeg;base64,${khuyenMaiData.hinhAnh[0]}`}
                alt={khuyenMaiData.tenKhuyenMai}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-2">{khuyenMaiData.tenKhuyenMai}</h1>
                {khuyenMaiData.moTa?.header?.title && (
                  <p className="text-xl opacity-90">{khuyenMaiData.moTa.header.title}</p>
                )}
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
                  <p className="text-sm text-gray-600">Số đối tượng</p>
                  <p className="font-semibold text-gray-900">
                    {products.length} sản phẩm, {combos.length} combo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
                <Percent className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Giảm giá</p>
                  <p className="font-semibold text-gray-900">
                    {khuyenMaiData.percentChung ? `${khuyenMaiData.percentChung}%` : `Lên đến ${maxDiscount}%`}
                  </p>
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
                Sản phẩm & Combo khuyến mãi ({products.length + combos.length})
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
              <div className="space-y-8">
                {/* Products Section */}
                {products.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Package className="h-6 w-6 mr-2 text-blue-600" />
                      Sản phẩm khuyến mãi ({products.length})
                    </h3>
                    <div className="space-y-6">
                      {products.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-xl font-semibold text-gray-900">{item.tenSanPhamCombo}</h4>
                              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                -{item.percent}%
                              </span>
                            </div>
                            {item.idSanPham && (
                              <div className="text-sm text-gray-500">
                                Màu: {getColorFromId(item.idSanPham)} | Size: {getSizeFromId(item.idSanPham)}
                              </div>
                            )}
                          </div>

                          {item.productDetails && item.productDetails.length > 0 && (
                            <div className="space-y-4">
                              {item.productDetails.map((product, prodIndex) => (
                                <div key={prodIndex} className="bg-gray-50 rounded-lg p-4">
                                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Thương hiệu:</span> {product.maThuongHieu}
                                      </p>
                                      <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Chất liệu:</span> {product.chatLieu}
                                      </p>
                                      <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Màu sắc:</span> {getColorName(product.mauSac)}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Loại:</span> {product.loaiSanPham}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(calculateDiscountedPrice(item.giaGoc, item.percent))}
                                      </p>
                                      <p className="text-lg text-gray-500 line-through">
                                        {formatCurrency(item.giaGoc)}
                                      </p>
                                      <p className="text-sm text-green-600 font-medium">
                                        Tiết kiệm: {formatCurrency(item.giaGoc - calculateDiscountedPrice(item.giaGoc, item.percent))}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Size options */}
                                  <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Kích thước có sẵn:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {product.details.map((detail, detailIndex) => (
                                        <div key={detailIndex} className="bg-white border border-gray-300 rounded-lg px-3 py-2">
                                          <span className="font-medium">{detail.kichThuoc.trim()}</span>
                                          <span className="text-gray-500 text-sm ml-2">({detail.soLuong} còn lại)</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Hash tags */}
                                  {product.listHashTag && product.listHashTag.length > 0 && (
                                    <div className="mb-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {product.listHashTag.map((tag, tagIndex) => (
                                          <span key={tagIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                            #{tag.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">ID: {item.idSanPham}</span>
                                    <button className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center">
                                      <ShoppingCart className="w-4 h-4 mr-2" />
                                      Thêm vào giỏ
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combos Section */}
                {combos.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Tag className="h-6 w-6 mr-2 text-green-600" />
                      Combo khuyến mãi ({combos.length})
                    </h3>
                    <div className="space-y-6">
                      {combos.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-xl font-semibold text-gray-900">{item.tenSanPhamCombo}</h4>
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                -{item.percent}% combo
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(calculateDiscountedPrice(item.giaGoc, item.percent))}
                              </p>
                              <p className="text-lg text-gray-500 line-through">
                                {formatCurrency(item.giaGoc)}
                              </p>
                            </div>
                          </div>

                          {item.comboDetails && item.comboDetails.length > 0 && (
                            <div className="space-y-4">
                              {item.comboDetails.map((combo, comboIndex) => (
                                <div key={comboIndex} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-lg font-semibold text-gray-800">{combo.name}</h5>
                                    {combo.hinhAnh && (
                                      <img 
                                        src={combo.hinhAnh.startsWith('data:') ? combo.hinhAnh : `data:image/jpeg;base64,${combo.hinhAnh}`}
                                        alt={combo.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                      />
                                    )}
                                  </div>

                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {combo.sanPhams.map((comboProduct, productIndex) => (
                                      <div key={productIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="mb-3">
                                          <h6 className="font-medium text-gray-900">{comboProduct.name}</h6>
                                          <p className="text-sm text-gray-600">{comboProduct.thuongHieu} • {comboProduct.loaiSanPham}</p>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Chất liệu:</span>
                                            <span className="font-medium">{comboProduct.chatLieu}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Số lượng:</span>
                                            <span className="font-medium">{comboProduct.soLuong}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Đơn giá:</span>
                                            <span className="font-medium text-blue-600">{formatCurrency(comboProduct.donGia)}</span>
                                          </div>
                                        </div>

                                        <div className="mt-3">
                                          <p className="text-xs text-gray-600 mb-1">Kích thước:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {comboProduct.kichThuoc.map((size, sizeIndex) => (
                                              <span key={sizeIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {size}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="mt-3">
                                          <p className="text-xs text-gray-600 mb-1">Màu sắc:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {comboProduct.mauSac.map((color, colorIndex) => (
                                              <div key={colorIndex} className="flex items-center space-x-1">
                                                <div 
                                                  className="w-4 h-4 rounded-full border border-gray-300" 
                                                  style={{ backgroundColor: `#${color}` }}
                                                ></div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex justify-between items-center mt-4">
                                    <span className="text-xs text-gray-500">Combo ID: {item.idCombo}</span>
                                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center">
                                      <ShoppingCart className="w-4 h-4 mr-2" />
                                      Thêm combo vào giỏ
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'details' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Mô tả chi tiết</h3>
                <div className="prose max-w-none">
                  {khuyenMaiData.moTa?.title?.map((section, index) => (
                    <div key={index} className="mb-8">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">{section.name}</h4>
                      {section.picture?.url && (
                        <div className="mb-6">
                          <img 
                            src={section.picture.url.startsWith('data:') ? section.picture.url : `data:image/jpeg;base64,${section.picture.url}`}
                            alt={section.name}
                            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                          />
                        </div>
                      )}
                      {section.subtitle?.map((subsection, subIndex) => (
                        <div key={subIndex} className="mb-6">
                          <h5 className="text-lg font-medium text-gray-800 mb-3">{subsection.name}</h5>
                          {subsection.picture?.url && (
                            <div className="mb-4">
                              <img 
                                src={subsection.picture.url.startsWith('data:') ? subsection.picture.url : `data:image/jpeg;base64,${subsection.picture.url}`}
                                alt={subsection.name}
                                className="w-full max-w-lg mx-auto rounded-lg shadow-md"
                              />
                            </div>
                          )}
                          <div 
                            className="prose prose-lg text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: subsection.description.content }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                  {khuyenMaiData.moTa?.Picture?.map((pic, index) => (
                    <div key={index} className="mb-6">
                      <img 
                        src={pic.url.startsWith('data:') ? pic.url : `data:image/jpeg;base64,${pic.url}`}
                        alt={`Promotion image ${index + 1}`}
                        className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                      />
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
            Chương trình khuyến mãi này sẽ kết thúc vào ngày {formatDate(khuyenMaiData.ngayKetThuc)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/products')}
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <Eye className="w-5 h-5 mr-2" />
              Xem tất cả sản phẩm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiTietKhuyenMai;