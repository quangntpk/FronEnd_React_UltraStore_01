import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Package, 
  Percent, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star,
  Image,
  Gift,
  TrendingDown,
  Users,
  Eye,
  Edit,
  Trash2,
  Share2,
  Download,
  Heart,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Info,
  MapPin,
  Globe
} from 'lucide-react';

const ChiTietEvent = ({ promotion, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (ngayBatDau, ngayKetThuc) => {
    const now = new Date();
    const startDate = new Date(ngayBatDau);
    const endDate = new Date(ngayKetThuc);

    if (now < startDate) {
      return { 
        status: 'upcoming', 
        label: 'Sắp diễn ra', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock,
        bgGradient: 'from-blue-500 to-blue-600'
      };
    } else if (now > endDate) {
      return { 
        status: 'expired', 
        label: 'Đã kết thúc', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
        bgGradient: 'from-gray-500 to-gray-600'
      };
    } else {
      return { 
        status: 'active', 
        label: 'Đang diễn ra', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        bgGradient: 'from-green-500 to-green-600'
      };
    }
  };

  const getDaysRemaining = (ngayKetThuc) => {
    const now = new Date();
    const endDate = new Date(ngayKetThuc);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMaxDiscount = (promo) => {
    if (promo.percentChung !== null && promo.percentChung !== undefined) {
      return promo.percentChung;
    }
    if (!promo.danhSachKhuyenMai || promo.danhSachKhuyenMai.length === 0) return 0;
    return Math.max(...promo.danhSachKhuyenMai.map(item => item.percent));
  };

  const isGeneralDiscount = (promo) => {
    return promo.percentChung !== null && promo.percentChung !== undefined;
  };

  const handleImageNavigation = (direction) => {
    if (!promotion?.hinhAnh) return;
    
    const maxIndex = promotion.hinhAnh.length - 1;
    let newIndex = currentImageIndex + direction;
    
    if (newIndex < 0) newIndex = maxIndex;
    if (newIndex > maxIndex) newIndex = 0;
    
    setCurrentImageIndex(newIndex);
  };

  const handleProductSlideChange = (direction) => {
    if (!promotion?.danhSachKhuyenMai) return;
    
    const itemsPerSlide = 4;
    const maxSlides = Math.ceil(promotion.danhSachKhuyenMai.length / itemsPerSlide);
    let newSlide = currentProductSlide + direction;
    
    if (newSlide < 0) newSlide = 0;
    if (newSlide >= maxSlides) newSlide = maxSlides - 1;
    
    setCurrentProductSlide(newSlide);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!promotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy khuyến mãi</h2>
          <p className="text-gray-600 mb-6">Khuyến mãi có thể đã bị xóa hoặc không tồn tại</p>
          <button
            onClick={handleClose}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const status = getEventStatus(promotion.ngayBatDau, promotion.ngayKetThuc);
  const daysRemaining = getDaysRemaining(promotion.ngayKetThuc);
  const maxDiscount = getMaxDiscount(promotion);
  const StatusIcon = status.icon;

  const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: Info },
    { key: 'products', label: 'Sản phẩm', icon: Package },
    { key: 'details', label: 'Chi tiết', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Chi tiết khuyến mãi</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                <StatusIcon className="h-4 w-4 inline mr-1" />
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="relative">
            {/* Background Image */}
            {promotion.hinhAnh && promotion.hinhAnh.length > 0 && (
              <div className="relative h-96 overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${promotion.hinhAnh[currentImageIndex]}`}
                  alt={promotion.tenKhuyenMai}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Image Navigation */}
                {promotion.hinhAnh.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation(-1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleImageNavigation(1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors backdrop-blur-sm"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {promotion.hinhAnh.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Discount Badge */}
                {maxDiscount > 0 && (
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-lg transform rotate-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold">-{maxDiscount}%</div>
                      <div className="text-sm font-medium">
                        {isGeneralDiscount(promotion) ? 'Toàn bộ' : 'Tối đa'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-6 left-6">
                  <div className={`px-4 py-2 rounded-xl backdrop-blur-md border ${status.color} bg-white/20`}>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="h-5 w-5" />
                      <span className="font-semibold">{status.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
                  {promotion.tenKhuyenMai}
                </h1>
                {promotion.moTa?.header?.title && (
                  <p className="text-xl text-white/90 drop-shadow mb-6">
                    {promotion.moTa.header.title}
                  </p>
                )}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">
                      {formatDate(promotion.ngayBatDau)} - {formatDate(promotion.ngayKetThuc)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">
                      {status.status === 'expired' ? 
                        `Đã kết thúc ${Math.abs(daysRemaining)} ngày trước` :
                        `${Math.abs(daysRemaining)} ngày ${status.status === 'active' ? 'còn lại' : 'nữa bắt đầu'}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin tổng quan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <Percent className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{maxDiscount}%</div>
                    <div className="text-sm text-gray-600">Giảm giá tối đa</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {isGeneralDiscount(promotion) ? 'Tất cả' : (promotion.danhSachKhuyenMai?.length || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Sản phẩm</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{Math.abs(daysRemaining)}</div>
                    <div className="text-sm text-gray-600">
                      {status.status === 'expired' ? 'Ngày đã qua' : 'Ngày còn lại'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <Tag className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">#{promotion.id}</div>
                    <div className="text-sm text-gray-600">Mã khuyến mãi</div>
                  </div>
                </div>
              </div>

              {/* Discount Type Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Loại khuyến mãi</h3>
                <div className={`p-6 rounded-xl border-2 ${
                  isGeneralDiscount(promotion) 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-teal-50 border-teal-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      isGeneralDiscount(promotion) ? 'bg-orange-100' : 'bg-teal-100'
                    }`}>
                      <Gift className={`h-8 w-8 ${
                        isGeneralDiscount(promotion) ? 'text-orange-600' : 'text-teal-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xl font-bold ${
                        isGeneralDiscount(promotion) ? 'text-orange-800' : 'text-teal-800'
                      }`}>
                        {isGeneralDiscount(promotion) 
                          ? 'Giảm giá toàn bộ sản phẩm' 
                          : 'Giảm giá theo sản phẩm'}
                      </h4>
                      <p className={`${
                        isGeneralDiscount(promotion) ? 'text-orange-700' : 'text-teal-700'
                      } mt-2`}>
                        {isGeneralDiscount(promotion)
                          ? `Tất cả sản phẩm và combo trong cửa hàng được giảm giá ${promotion.percentChung}%`
                          : `Chỉ áp dụng cho ${promotion.danhSachKhuyenMai?.length || 0} sản phẩm và combo được chọn`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Event Timeline */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Thời gian khuyến mãi</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Play className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Bắt đầu</div>
                      <div className="text-gray-600">{formatDate(promotion.ngayBatDau)}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Pause className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Kết thúc</div>
                      <div className="text-gray-600">{formatDate(promotion.ngayKetThuc)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Sản phẩm khuyến mãi</h3>
            
            {isGeneralDiscount(promotion) ? (
              <div className="text-center py-12">
                <div className="p-6 bg-orange-50 rounded-2xl border-2 border-orange-200 max-w-md mx-auto">
                  <Gift className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-orange-800 mb-2">Áp dụng toàn bộ</h4>
                  <p className="text-orange-700">
                    Tất cả sản phẩm và combo trong cửa hàng được giảm giá {promotion.percentChung}%
                  </p>
                </div>
              </div>
            ) : (
              <>
                {promotion.danhSachKhuyenMai && promotion.danhSachKhuyenMai.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {promotion.danhSachKhuyenMai.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        {item.hinhAnh?.[0] ? (
                          <img
                            src={`data:image/jpeg;base64,${item.hinhAnh[0]}`}
                            alt={item.tenSanPhamCombo}
                            className="w-full h-48 object-cover rounded-xl mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                            <Image className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">
                          {item.tenSanPhamCombo}
                        </h4>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.idCombo ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.idCombo ? 'Combo' : 'Sản phẩm'}
                          </span>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 line-through">
                              {item.giaGoc?.toLocaleString()}đ
                            </div>
                            <div className="font-bold text-green-600">
                              {item.giaMoi?.toLocaleString()}đ
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                            <TrendingDown className="h-4 w-4 inline mr-1" />
                            -{item.percent}%
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {item.idSanPham || item.idCombo}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sản phẩm</h4>
                    <p className="text-gray-600">Khuyến mãi này chưa có sản phẩm nào được áp dụng</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* Description Details */}
            {promotion.moTa && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin chi tiết</h3>
                
                {/* Header Description */}
                {promotion.moTa.header?.title && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h4 className="text-lg font-semibold text-purple-800 mb-3">Mô tả chính</h4>
                    <p className="text-purple-700 text-lg">{promotion.moTa.header.title}</p>
                  </div>
                )}

                {/* Pictures Section */}
                {promotion.moTa.Picture && promotion.moTa.Picture.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh bổ sung</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {promotion.moTa.Picture.map((pic, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden">
                          <img
                            src={`data:image/jpeg;base64,${pic.url}`}
                            alt={`Hình ảnh ${index + 1}`}
                            className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Title Sections */}
                {promotion.moTa.title && promotion.moTa.title.length > 0 && (
                  <div className="space-y-8">
                    <h4 className="text-lg font-semibold text-gray-900">Nội dung chi tiết</h4>
                    {promotion.moTa.title.map((titleItem, titleIndex) => (
                      <div key={titleIndex} className="border-l-4 border-purple-500 pl-6 py-4 bg-gray-50 rounded-r-xl">
                        {/* Title Name */}
                        <h5 className="text-xl font-bold text-gray-900 mb-4">{titleItem.name}</h5>
                        
                        {/* Title Picture */}
                        {titleItem.picture?.url && (
                          <div className="mb-6">
                            <img
                              src={`data:image/jpeg;base64,${titleItem.picture.url}`}
                              alt={titleItem.name}
                              className="w-full max-w-md h-48 object-cover rounded-xl shadow-md"
                            />
                          </div>
                        )}

                        {/* Subtitles */}
                        {titleItem.subtitle && titleItem.subtitle.length > 0 && (
                          <div className="space-y-6">
                            {titleItem.subtitle.map((subtitleItem, subtitleIndex) => (
                              <div key={subtitleIndex} className="bg-white rounded-xl p-6 shadow-sm">
                                <h6 className="text-lg font-semibold text-gray-800 mb-3">
                                  {subtitleItem.name}
                                </h6>
                                
                                {/* Subtitle Picture */}
                                {subtitleItem.picture?.url && (
                                  <div className="mb-4">
                                    <img
                                      src={`data:image/jpeg;base64,${subtitleItem.picture.url}`}
                                      alt={subtitleItem.name}
                                      className="w-full max-w-sm h-40 object-cover rounded-lg"
                                    />
                                  </div>
                                )}

                                {/* Subtitle Description */}
                                {subtitleItem.description?.content && (
                                  <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 leading-relaxed">
                                      {subtitleItem.description.content}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Technical Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin kỹ thuật</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">ID Khuyến mãi</span>
                    <span className="font-mono text-purple-600">#{promotion.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Loại khuyến mãi</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isGeneralDiscount(promotion) 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {isGeneralDiscount(promotion) ? 'Toàn bộ' : 'Đơn lẻ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Trạng thái</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                      <StatusIcon className="h-4 w-4 inline mr-1" />
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Số sản phẩm</span>
                    <span className="font-semibold text-blue-600">
                      {isGeneralDiscount(promotion) ? 'Tất cả' : (promotion.danhSachKhuyenMai?.length || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Giảm giá tối đa</span>
                    <span className="font-semibold text-red-600">{maxDiscount}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Thời gian diễn ra</span>
                    <span className="font-semibold text-green-600">
                      {Math.ceil((new Date(promotion.ngayKetThuc) - new Date(promotion.ngayBatDau)) / (1000 * 60 * 60 * 24))} ngày
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-30"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChiTietEvent;