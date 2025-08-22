import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Package, Percent, Eye, Edit, Trash2, Plus, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Filter, X,CalendarDays, ShoppingCart, Heart } from 'lucide-react';
import PromotionForm from '@/components/admin/EventAdmin/CreateEvent';
import EditPromotionForm from '@/components/admin/EventAdmin/EditEvent';
import ViewEvent from '@/components/admin/EventAdmin/ViewEvent';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const ListKhuyenMai = () => {
  const [khuyenMaiList, setKhuyenMaiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlides, setCurrentSlides] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const ITEMS_PER_PAGE = 6;

  const fetchKhuyenMaiList = async () => {
    try {
      setError(null);
      const response = await fetch('https://bicacuatho.azurewebsites.net/api/KhuyenMai/ListKhuyenMaiAdmin');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data)
      setKhuyenMaiList(data);
      const initialSlides = {};
      data.forEach(promo => {
        initialSlides[promo.id] = 0;
      });
      setCurrentSlides(initialSlides);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKhuyenMaiList();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, discountTypeFilter, searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKhuyenMaiList();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPromotionStatus = (ngayBatDau, ngayKetThuc) => {
    const now = new Date();
    const startDate = new Date(ngayBatDau);
    const endDate = new Date(ngayKetThuc);

    if (now < startDate) {
      return { status: 'upcoming', label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800' };
    } else if (now > endDate) {
      return { status: 'expired', label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { status: 'active', label: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
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

  const getDiscountTypeLabel = (promo) => {
    if (promo.percentChung !== null && promo.percentChung !== undefined) {
      return 'Giảm giá toàn bộ sản phẩm';
    }
    return 'Giảm giá theo sản phẩm';
  };

  const isGeneralDiscount = (promo) => {
    return promo.percentChung !== null && promo.percentChung !== undefined;
  };

  const handleSlideChange = (promoId, direction) => {
    setCurrentSlides(prev => {
      const items = khuyenMaiList.find(p => p.id === promoId)?.danhSachKhuyenMai || [];
      const maxSlides = Math.ceil(items.length / 3);
      let newIndex = prev[promoId] + direction;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= maxSlides) newIndex = maxSlides - 1;
      return { ...prev, [promoId]: newIndex };
    });
  };

  const getFilteredPromotions = (status) => {
    return khuyenMaiList
      .filter(promo => {
        const promoStatus = getPromotionStatus(promo.ngayBatDau, promo.ngayKetThuc).status;
        if (promoStatus !== status) return false;
        const matchesSearch = promo.tenKhuyenMai.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (discountTypeFilter === 'general' && !isGeneralDiscount(promo)) return false;
        if (discountTypeFilter === 'specific' && isGeneralDiscount(promo)) return false;
        return true;
      })
      .sort((a, b) => {
        const discountA = getMaxDiscount(a);
        const discountB = getMaxDiscount(b);
        return discountB - discountA;
      });
  };

  const getPaginatedPromotions = (promotions) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return promotions.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    {
      key: 'active',
      label: 'Đang diễn ra',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      activeTabBg: 'bg-green-500',
      count: getFilteredPromotions('active').length
    },
    {
      key: 'upcoming',
      label: 'Sắp diễn ra',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      activeTabBg: 'bg-blue-500',
      count: getFilteredPromotions('upcoming').length
    },
    {
      key: 'expired',
      label: 'Đã kết thúc',
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-500',
      activeTabBg: 'bg-gray-500',
      count: getFilteredPromotions('expired').length
    }
  ];

  const filteredPromotions = getFilteredPromotions(activeTab);
  const currentPromotions = getPaginatedPromotions(filteredPromotions);
  const totalPages = getTotalPages(filteredPromotions.length);

  const toggleCreateModal = () => {
    setIsCreateModalOpen(!isCreateModalOpen);
  };

  const toggleEditModal = (promoId) => {
    setSelectedPromotionId(promoId);
    setIsEditModalOpen(!isEditModalOpen);
  };

  const toggleViewModal = (promo) => {
    setSelectedPromotion(promo);
    setIsViewModalOpen(!isViewModalOpen);
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg ${
              page === currentPage
                ? 'bg-purple-600 text-white'
                : page === '...'
                ? 'cursor-default text-gray-400'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Đang tải danh sách khuyến mãi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <button 
              onClick={toggleCreateModal}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo khuyến mãi mới</span>
            </button>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={toggleCreateModal}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            <PromotionForm />
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => toggleEditModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            <EditPromotionForm 
              promotionId={selectedPromotionId} 
              onClose={() => toggleEditModal(null)} 
            />
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => toggleViewModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            <ViewEvent promotion={selectedPromotion} />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{khuyenMaiList.length}</div>
              <div className="text-sm text-gray-600">Tổng số khuyến mãi</div>
            </div>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <div key={tab.key} className={`text-center p-4 ${tab.bgColor} rounded-lg`}>
                  <div className={`text-2xl font-bold ${tab.color}`}>{tab.count}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm khuyến mãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Loại giảm giá:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDiscountTypeFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    discountTypeFilter === 'all' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setDiscountTypeFilter('general')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    discountTypeFilter === 'general' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Toàn bộ
                </button>
                <button
                  onClick={() => setDiscountTypeFilter('specific')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    discountTypeFilter === 'specific' 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Đơn lẻ
                </button>
              </div>
            </div>
          </div>

          {(searchTerm || discountTypeFilter !== 'all') && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Đang lọc:</span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Tìm kiếm: "{searchTerm}"
                  </span>
                )}
                {discountTypeFilter !== 'all' && (
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    discountTypeFilter === 'general' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    Loại: {discountTypeFilter === 'general' ? 'Toàn bộ' : 'Đơn lẻ'}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDiscountTypeFilter('all');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Lỗi tải dữ liệu:</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? `${tab.borderColor} ${tab.color}`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isActive ? `${tab.activeTabBg} text-white` : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {filteredPromotions.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                {totalPages > 1 && (
                  <div className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </div>
                )}
              </div>
            )}

            {currentPromotions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || discountTypeFilter !== 'all' ? 'Không tìm thấy khuyến mãi' : `Chưa có khuyến mãi ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || discountTypeFilter !== 'all'
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' 
                    : `Chưa có chương trình khuyến mãi nào ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}`}
                </p>
                {!searchTerm && discountTypeFilter === 'all' && activeTab === 'active' && (
                  <button 
                    onClick={toggleCreateModal}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tạo khuyến mãi mới</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentPromotions.map((promo) => {
                    const status = getPromotionStatus(promo.ngayBatDau, promo.ngayKetThuc);
                    const daysRemaining = getDaysRemaining(promo.ngayKetThuc);
                    const maxDiscount = getMaxDiscount(promo);
                    const discountTypeLabel = getDiscountTypeLabel(promo);
                    const productCount = promo.percentChung ? 'Tất cả' : (promo.danhSachKhuyenMai?.length || 0);
                    const currentSlide = currentSlides[promo.id] || 0;
                    const itemsToShow = promo.danhSachKhuyenMai?.slice(currentSlide * 3, (currentSlide + 1) * 3) || [];

                    return (
                      <div key={promo.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-l-4 border-purple-500 flex flex-col">
                        {promo.hinhAnh && (
                          <div className="relative h-64 overflow-hidden">
                            <img
                              src={`data:image/jpeg;base64,${promo.hinhAnh[0]}`}
                              alt={promo.tenKhuyenMai}
                              className="w-full max-h-80 object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent max-h-80"></div>
                            {maxDiscount > 0 && (
                              <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-center shadow-lg">
                                <div className="text-xl font-bold">-{maxDiscount}%</div>
                                <div className="text-xs">{promo.percentChung !== null ? 'Toàn bộ' : 'Tối đa'}</div>
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${status.color} bg-opacity-90`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{promo.tenKhuyenMai}</h3>
                                {!promo.hinhAnh && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                    {status.label}
                                  </span>
                                )}
                              </div>
                              {promo.moTa?.header?.title && (
                                <p className="text-gray-600 mb-3">{promo.moTa.header.title}</p>
                              )}
                              <div className="flex items-center space-x-2 mb-3">
                                <Percent className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">{discountTypeLabel}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isGeneralDiscount(promo) 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {isGeneralDiscount(promo) ? 'Toàn bộ' : 'Đơn lẻ'}
                                </span>
                              </div>
                            </div>
                            {!promo.hinhAnh && maxDiscount > 0 && (
                              <div className="bg-red-500 text-white px-3 py-2 rounded-lg text-center">
                                <div className="text-lg font-bold">-{maxDiscount}%</div>
                                <div className="text-xs">{promo.percentChung !== null ? 'Toàn bộ' : 'Tối đa'}</div>
                              </div>
                            )}
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-600">Thời gian</p>
                                <p className="font-medium text-gray-900 text-sm">
                                  {formatDate(promo.ngayBatDau)} - {formatDate(promo.ngayKetThuc)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                              <Package className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm text-gray-600">Sản phẩm và Combo</p>
                                <p className="font-medium text-gray-900">Áp dụng cho: {productCount} đối tượng</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                              <Tag className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="text-sm text-gray-600">
                                  {status.status === 'active' ? 'Còn lại' : 
                                   status.status === 'upcoming' ? 'Bắt đầu sau' : 'Đã kết thúc'}
                                </p>
                                <p className="font-medium text-gray-900">
                                  {status.status === 'expired' ? 
                                    `${Math.abs(daysRemaining)} ngày trước` :
                                    `${Math.abs(daysRemaining)} ngày`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {productCount > 0 && !promo.percentChung && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Sản phẩm và Combo khuyến mãi:</h4>
                              <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(promo.danhSachKhuyenMai.map(p => p.tenSanPhamCombo)))
                                  .slice(0, 3)
                                  .map((productName, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                      {productName}
                                    </span>
                                  ))}
                                {Array.from(new Set(promo.danhSachKhuyenMai.map(p => p.tenSanPhamCombo))).length > 3 && (
                                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                    +{Array.from(new Set(promo.danhSachKhuyenMai.map(p => p.tenSanPhamCombo))).length - 3} khác
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {promo.percentChung && (
                            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Tag className="h-5 w-5 text-purple-600" />
                                <h4 className="font-medium text-purple-800">Áp dụng cho toàn bộ sản phẩm và combo</h4>
                              </div>
                              <p className="text-sm text-purple-700">
                                Tất cả sản phẩm và combo trong cửa hàng được giảm giá {promo.percentChung}%
                              </p>
                            </div>
                          )}

                          {productCount !== 'Tất cả' && promo.danhSachKhuyenMai && promo.danhSachKhuyenMai.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Danh sách sản phẩm và combo:</h4>
                              <div className="relative">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {itemsToShow.map((item, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                                      {item.hinhAnh?.[0] ? (
                                        <img
                                          src={`data:image/jpeg;base64,${item.hinhAnh[0]}`}
                                          alt={item.tenSanPhamCombo}
                                          className="w-full h-32 object-cover rounded-md mb-3"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                                          <span className="text-gray-500">Không có hình ảnh</span>
                                        </div>
                                      )}
                                      <p className="text-sm font-medium text-gray-900 truncate">{item.tenSanPhamCombo}</p>
                                      <p className="text-xs text-gray-600">
                                        {item.idCombo ? 'Combo' : 'Sản phẩm'} {item.idSanPham || item.idCombo}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                {promo.danhSachKhuyenMai.length > 3 && (
                                  <div className="flex justify-between mt-4">
                                    <button
                                      onClick={() => handleSlideChange(promo.id, -1)}
                                      disabled={currentSlide === 0}
                                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50"
                                    >
                                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => handleSlideChange(promo.id, 1)}
                                      disabled={currentSlide >= Math.ceil(promo.danhSachKhuyenMai.length / 3) - 1}
                                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50"
                                    >
                                      <ChevronRight className="h-5 w-5 text-gray-600" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto absolute bottom-4" >
                            <div className="text-sm text-gray-500">
                              ID: {promo.id}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => toggleViewModal(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => toggleEditModal(promo.id)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListKhuyenMai;