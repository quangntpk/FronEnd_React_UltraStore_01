import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter, Clock, Percent, Calendar, Star, Gift, Sparkles, Timer, Tag, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
// Flip Countdown Timer Component
const FlipCountdownTimer = ({ endDate, promotionId }) => {
  const flipdownRef = useRef(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    
    const endTimestamp = Math.floor(endDateTime.getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    if (endTimestamp <= now) {
      setIsExpired(true);
      return;
    }

    if (!document.getElementById('flipdown-css')) {
      const cssLink = document.createElement('link');
      cssLink.id = 'flipdown-css';
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://pbutcher.uk/flipdown/css/flipdown/flipdown.css';
      document.head.appendChild(cssLink);
    }

    if (!window.FlipDown) {
      const script = document.createElement('script');
      script.src = 'https://pbutcher.uk/flipdown/js/flipdown/flipdown.js';
      script.onload = () => {
        initFlipDown();
      };
      document.body.appendChild(script);
    } else {
      initFlipDown();
    }

    function initFlipDown() {
      if (flipdownRef.current && window.FlipDown) {
        try {
          flipdownRef.current.innerHTML = '';
          const flipdownId = `flipdown-${promotionId}`;
          flipdownRef.current.id = flipdownId;
          const flipdown = new window.FlipDown(endTimestamp, flipdownId)
            .start()
            .ifEnded(() => {
              setIsExpired(true);
              if (flipdownRef.current) {
                flipdownRef.current.innerHTML = `<h2 style="color: #fca5a5; font-weight: bold; text-align: center; padding: 20px;">Timer is ended</h2>`;
              }
            });
        } catch (error) {
          console.error('FlipDown initialization error:', error);
          setIsExpired(true);
        }
      }
    }

    return () => {
      if (flipdownRef.current) {
        flipdownRef.current.innerHTML = '';
      }
    };
  }, [endDate, promotionId]);

  if (isExpired) {
    return (
      <div className="bg-red-500/20 border border-red-300/50 rounded-xl p-4 text-center">
        <p className="text-red-300 font-bold text-lg">⏰ Khuyến mại đã hết hạn</p>
      </div>
    );
  }

  return (
    <div className="count-down" style={{ width: '550px', maxHeight: '300px', marginLeft: '-105px', padding: '20px', overflow: 'hidden', scale: '0.6' }}>
      <div ref={flipdownRef} className="flipdown" style={{ margin: 'auto', width: '600px', marginTop: '-30px', maxHeight: '200px', overflow: 'hidden' }}></div>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .count-down {
          width: 550px;
          max-height: 300px;
          margin: auto;
          padding: 20px;
          overflow: hidden;
        }
        .count-down .flipdown {
          margin: auto;
          width: 600px;
          margin-top: 30px;
          max-height: 200px;
          overflow: hidden;
        }
        .count-down h1 {
          text-align: center;
          font-weight: 400;
          font-size: 2em;
          margin-top: 0;
          margin-bottom: 10px;
        }
        @media (max-width: 550px) {
          .count-down {
            width: 100%;
            height: 362px;
          }
          .count-down h1 {
            font-size: 1.5em;
          }
        }
      `}</style>
    </div>
  );
};

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    discountType: 'all',
    discountRange: 'all',
    timeRemaining: 'all'
  });

  const itemsPerPage = 5;

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [promotions, filters]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://bicacuatho.azurewebsites.net/api/KhuyenMai/ListKhuyenMaiUser');
      const data = await response.json();
      setPromotions(data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionDiscount = (promotion) => {
    if (promotion.percentChung !== null && promotion.percentChung !== undefined) {
      return promotion.percentChung;
    }
    if (promotion.danhSachKhuyenMai && promotion.danhSachKhuyenMai.length > 0) {
      return Math.max(...promotion.danhSachKhuyenMai.map(item => item.percent || 0));
    }
    return 0;
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Đã hết hạn', status: 'expired' };
    if (diffDays === 0) return { text: 'Hết hạn hôm nay', status: 'urgent' };
    if (diffDays === 1) return { text: 'Còn 1 ngày', status: 'urgent' };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, status: 'warning' };
    return { text: `Còn ${diffDays} ngày`, status: 'normal' };
  };

  const getTimeStatus = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 7) return 'ending-soon';
    if (diffDays <= 30) return 'active';
    return 'long-term';
  };

  const applyFilters = () => {
    let filtered = [...promotions];

    if (filters.discountType !== 'all') {
      filtered = filtered.filter(promotion => {
        const isGeneral = promotion.percentChung !== null && promotion.percentChung !== undefined;
        return filters.discountType === 'general' ? isGeneral : !isGeneral;
      });
    }

    if (filters.discountRange !== 'all') {
      filtered = filtered.filter(promotion => {
        const discount = getPromotionDiscount(promotion);
        switch (filters.discountRange) {
          case '0-20': return discount >= 0 && discount <= 20;
          case '21-40': return discount >= 21 && discount <= 40;
          case '41-60': return discount >= 41 && discount <= 60;
          case '60+': return discount > 60;
          default: return true;
        }
      });
    }

    if (filters.timeRemaining !== 'all') {
      filtered = filtered.filter(promotion => {
        const status = getTimeStatus(promotion.ngayKetThuc);
        return status === filters.timeRemaining;
      });
    }

    setFilteredPromotions(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPromotions = filteredPromotions.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-500 mx-auto"></div>
            <Sparkles className="w-8 h-8 text-purple-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-6 text-purple-200 text-lg font-medium">Đang tải khuyến mại...</p>
        </div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full shadow-2xl">
              <Gift className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-4 margin-bottom-2">
            KHUYẾN MẠI HOT
          </h1>
          <p className="text-xl text-purple-200 font-light max-w-2xl mx-auto">
            🔥 Khám phá những deal siêu hót đang chờ bạn khám phá! Nhanh tay kẻo lỡ! 🔥
          </p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse" />
            <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse animation-delay-200" />
            <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse animation-delay-400" />
            <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse animation-delay-600" />
            <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse animation-delay-800" />
          </div>
        </div>

        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center mx-auto shadow-xl"
          >
            <Filter className="w-5 h-5 mr-2" />
            Bộ lọc thông minh
            <ChevronRight className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="block text-white font-semibold text-lg flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-purple-300" />
                    Loại giảm giá
                  </label>
                  <select 
                    value={filters.discountType}
                    onChange={(e) => handleFilterChange('discountType', e.target.value)}
                    className="w-full p-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/70 focus:ring-4 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                  >
                    <option value="all" className="text-gray-800">🌟 Tất cả</option>
                    <option value="general" className="text-gray-800">🔥 Giảm giá chung</option>
                    <option value="specific" className="text-gray-800">🎯 Giảm giá riêng</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-white font-semibold text-lg flex items-center">
                    <Percent className="w-5 h-5 mr-2 text-green-300" />
                    Mức giảm giá
                  </label>
                  <select 
                    value={filters.discountRange}
                    onChange={(e) => handleFilterChange('discountRange', e.target.value)}
                    className="w-full p-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/70 focus:ring-4 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                  >
                    <option value="all" className="text-gray-800">💎 Tất cả</option>
                    <option value="0-20" className="text-gray-800">🥉 0% - 20%</option>
                    <option value="21-40" className="text-gray-800">🥈 21% - 40%</option>
                    <option value="41-60" className="text-gray-800">🥇 41% - 60%</option>
                    <option value="60+" className="text-gray-800">💥 Trên 60%</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-white font-semibold text-lg flex items-center">
                    <Timer className="w-5 h-5 mr-2 text-red-300" />
                    Thời gian
                  </label>
                  <select 
                    value={filters.timeRemaining}
                    onChange={(e) => handleFilterChange('timeRemaining', e.target.value)}
                    className="w-full p-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/70 focus:ring-4 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                  >
                    <option value="all" className="text-gray-800">⏰ Tất cả</option>
                    <option value="urgent" className="text-gray-800">🚨 Cực gấp (≤1 ngày)</option>
                    <option value="ending-soon" className="text-gray-800">⚠️ Sắp hết (2-7 ngày)</option>
                    <option value="active" className="text-gray-800">✨ Còn thời gian (8-30 ngày)</option>
                    <option value="long-term" className="text-gray-800">🔮 Dài hạn (&gt;30 ngày)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <p className="text-white font-medium">
              ✨ Tìm thấy <span className="text-yellow-300 font-bold">{currentPromotions.length}</span> trong tổng số <span className="text-yellow-300 font-bold">{filteredPromotions.length}</span> khuyến mại hot ✨
            </p>
          </div>
        </div>

        {currentPromotions.length > 0 ? (
          <div className="grid gap-8 mb-12">
            {currentPromotions.map((promotion, index) => {
              const discount = getPromotionDiscount(promotion);
              const timeRemaining = getTimeRemaining(promotion.ngayKetThuc);
              const isGeneral = promotion.percentChung !== null && promotion.percentChung !== undefined;
              const mainImage = promotion.moTa?.Picture?.[0]?.url;

              return (
                <div 
                  key={promotion.id} 
                  className={`group relative bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/25 h-[700px] ${
                    index % 2 === 0 ? 'animate-slide-in-left' : 'animate-slide-in-right'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>

                  <div className="md:flex relative z-10 h-full">
                    <div className="md:w-2/5 relative overflow-hidden">
                      {mainImage ? (
                        <img 
                          src={mainImage.startsWith('data:') ? mainImage : `data:image/jpeg;base64,${mainImage}`}
                          alt={promotion.tenKhuyenMai}
                          className="w-full h-80 md:h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-80 md:h-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 text-center">
                            <span className="text-white text-8xl font-black drop-shadow-2xl">{discount}%</span>
                            <div className="text-white text-xl font-bold mt-2">GIẢM GIÁ</div>
                          </div>
                          <Sparkles className="absolute top-4 left-4 w-8 h-8 text-yellow-300 animate-pulse" />
                          <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-pink-300 animate-pulse animation-delay-1000" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full font-black text-xl shadow-2xl animate-bounce">
                        -{discount}%
                      </div>

                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
                        isGeneral 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      }`}>
                        {isGeneral ? '🔥 CHUNG' : '🎯 RIÊNG'}
                      </div>

                      <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-full text-sm font-bold shadow-lg ${
                        timeRemaining.status === 'urgent' 
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse' 
                          : timeRemaining.status === 'warning'
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                          : 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                      }`}>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {timeRemaining.text}
                      </div>
                    </div>

                    <div className="md:w-3/5 p-8 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex flex-wrap gap-4 mb-6">
                          <div className="bg-blue-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center shadow-lg">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div className="text-sm">
                              <div className="font-semibold">Thời gian</div>
                              <div>{formatDate(promotion.ngayBatDau)} - {formatDate(promotion.ngayKetThuc)}</div>
                            </div>
                          </div>

                          <div className="bg-green-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center shadow-lg">
                            <Gift className="w-4 h-4 mr-2" />
                            <div className="text-sm">
                              <div className="font-semibold">Sản phẩm và Combo</div>
                              <div>Áp dụng cho: {isGeneral ? 'Tất cả đối tượng' : `${promotion.danhSachKhuyenMai?.length || 0} đối tượng`}</div>
                            </div>
                          </div>

                          <div className={`backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center shadow-lg ${
                            timeRemaining.status === 'urgent' 
                              ? 'bg-red-500/80' 
                              : timeRemaining.status === 'warning'
                              ? 'bg-orange-500/80'
                              : 'bg-purple-500/80'
                          }`}>
                            <Clock className="w-4 h-4 mr-2" />
                            <div className="text-sm">
                              <div className="font-semibold">Còn lại</div>
                              <div>{timeRemaining.text}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                          <h2 className="text-3xl font-black text-white group-hover:text-yellow-300 transition-colors duration-300 flex-1 pr-4 leading-tight font-family: 'Poppins', sans-serif">
                            {promotion.tenKhuyenMai}
                          </h2>
                        </div>

                        {isGeneral && (
                          <div className="mb-6 p-4 bg-purple-500/20 rounded-2xl border border-purple-300/30 backdrop-blur-sm">
                            <div className="flex items-center mb-2">
                              <Tag className="w-5 h-5 text-purple-300 mr-2" />
                              <span className="text-purple-200 font-bold">Áp dụng cho toàn bộ sản phẩm và combo</span>
                            </div>
                            <p className="text-purple-100 text-sm">
                              Tất cả sản phẩm và combo trong cửa hàng được giảm giá {discount}%
                            </p>
                          </div>
                        )}

                        {promotion.moTa?.header?.title && (
                          <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-purple-100 text-lg leading-relaxed">
                              {promotion.moTa.header.title}
                            </p>
                          </div>
                        )}

                        {!isGeneral && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-white mb-3 text-sm opacity-80">
                              Sản phẩm và Combo khuyến mại:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {promotion.danhSachKhuyenMai && promotion.danhSachKhuyenMai.length > 0 ? (
                                <>
                                  {promotion.danhSachKhuyenMai.slice(0, 4).map((item, index) => (
                                    <span key={index} className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                                      {item.tenSanPhamCombo}
                                    </span>
                                  ))}
                                  {promotion.danhSachKhuyenMai.length > 4 && (
                                    <span className="bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-sm border border-purple-300/30">
                                      +{promotion.danhSachKhuyenMai.length - 4} khác
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-purple-200 text-sm italic">Không có sản phẩm cụ thể</span>
                              )}
                            </div>
                          </div>
                        )}

                        {promotion.danhSachKhuyenMai && promotion.danhSachKhuyenMai.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-bold text-white mb-3 text-lg">
                              📋 Danh sách sản phẩm và combo:
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {promotion.danhSachKhuyenMai.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/10">
                                  <div className="flex-1">
                                    <span className="text-white font-medium">{item.tenSanPhamCombo}</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    {item.giaGoc && item.giaMoi && (
                                        <div className="text-gray-300 line-through text-sm">
                                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.giaGoc)}
                                        </div>

                                    )}
                                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                      -{item.percent}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* New 2-column layout for countdown and button */}
                      <div className="grid grid-cols-2 gap-4 items-center mt-auto bg-white/5 rounded-2xl p-4 border border-white/10">
                        {/* Left column - Countdown Timer */}
                        <div className="flex justify-center">
                          <div className="w-full max-w-xs">
                            <FlipCountdownTimer 
                              endDate={promotion.ngayKetThuc}
                              promotionId={promotion.id}
                            />
                          </div>
                        </div>
                        
                        {/* Right column - Detail Button */}
                        <div className="flex justify-center items-center">
                          <button className="bg-white text-purple-600 px-6 py-4 rounded-2xl font-black text-lg hover:bg-gradient-to-r hover:from-pink-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl group-hover:animate-pulse w-full max-w-xs">
                            <Link to={`/khuyenmais/${promotion.id}`} className="flex items-center justify-center">
                            <span className="flex items-center justify-center">
                              <Sparkles className="w-5 h-5 mr-2" />
                              XEM CHI TIẾT
                              <Sparkles className="w-5 h-5 ml-2" />
                            </span>
                            </Link>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 max-w-lg mx-auto">
              <div className="text-purple-300 mb-6">
                <Filter className="w-20 h-20 mx-auto opacity-50" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Không tìm thấy khuyến mại phù hợp</h3>
              <p className="text-purple-200 text-lg">Thử thay đổi bộ lọc để khám phá thêm deal hot khác nhé! 🔍</p>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-xl"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Trước
            </button>

            <div className="flex space-x-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-12 h-12 rounded-2xl font-bold transition-all duration-300 shadow-xl ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white scale-110'
                      : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-xl"
            >
              Sau
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        
        .animation-delay-800 {
          animation-delay: 800ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
        
        .animation-delay-4000 {
          animation-delay: 4000ms;
        }
      `}</style>
    </div>

  );
};

export default PromotionList;