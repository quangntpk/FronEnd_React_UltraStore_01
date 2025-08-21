import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderDetailsModal from './OrderDetailsModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Ellipsis, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Order {
  maNhanVien?: string; 
  maDonHang: number;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  lyDoHuy?: string;
  tenSanPhamHoacCombo?: string;
  maNguoiDung?: string; 
  hoTenNguoiDuyet?: string; 
  hoTenKhachHang?: string; 
  hoTenNhanVien?: string;
  tongTien?: number;
  diaChi?: string;
  soDienThoai?: string;
  canProcess?: boolean; // ✅ Thêm field này từ Backend
}

interface OrderCount {
  all: number;
  unconfirmed: number;
  processing: number;
  delivering: number;
  completed: number;
  canceled: number;
}

interface CancelledOrdersResponse {
  data: CancelledOrderData[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    totalCancelledOrders: number;
    totalCancelledAmount: number;
    totalFinalAmount: number;
  };
}

interface CancelledOrderData {
  maDonHang: number;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  lyDoHuy?: string;
  tenSanPhamHoacCombo?: string;
  maNguoiDung?: string;
  hoTenKhachHang?: string;
  hoTenNhanVien?: string;
  maNhanVien?: string;
  tongTien?: number;
  diaChi?: string;
  soDienThoai?: string;
  canProcess?: boolean; // ✅ Thêm field này
}

// ✅ USER INFO INTERFACE
interface CurrentUser {
  maNguoiDung: string;
  fullName: string;
  email: string;
  vaiTro: number;
  isAdmin: boolean;
  isStaff: boolean;
}

// Pagination Component
const PaginationComponent: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    for (let i = rangeStart; i <= rangeEnd; i++) {
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
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Trước
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNumber, index) => (
          <React.Fragment key={index}>
            {pageNumber === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Button
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber as number)}
                className={`min-w-[40px] ${
                  pageNumber === currentPage 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-gray-100"
                }`}
              >
                {pageNumber}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        Sau
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCount>({
    all: 0,
    unconfirmed: 0,
    processing: 0,
    delivering: 0,
    completed: 0,
    canceled: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  
  // ✅ STATE CHO USER INFO
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  
  const ordersPerPage = 10;

  // Danh sách các lý do hủy gợi ý
  const cancelReasonsSuggestions = [
    "Khách hàng không muốn mua nữa",
    "Hết hàng", 
    "Khách hủy đơn",
    "Sai thông tin đơn hàng",
    "Khác"
  ];

  // ✅ FETCH CURRENT USER INFO
  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get<CurrentUser>(
        'https://localhost:7051/api/orders/current-user',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Current user from API:', response.data);
      setCurrentUser(response.data);
      
      // ✅ Cập nhật localStorage với thông tin mới nhất
      localStorage.setItem('userId', response.data.maNguoiDung);
      localStorage.setItem('role', response.data.vaiTro.toString());
      localStorage.setItem('user', JSON.stringify(response.data));
      
    } catch (error) {
      console.error('❌ Error fetching current user:', error);
      toast.error('Không thể lấy thông tin người dùng');
      
      // Fallback to localStorage if API fails
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser({
            maNguoiDung: userData.maNguoiDung || localStorage.getItem('userId') || '',
            fullName: userData.fullName || userData.hoTen || 'Unknown',
            email: userData.email || '',
            vaiTro: parseInt(userData.vaiTro || localStorage.getItem('role') || '2'),
            isAdmin: (userData.vaiTro || localStorage.getItem('role')) === '1',
            isStaff: (userData.vaiTro || localStorage.getItem('role')) === '2'
          });
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
        }
      }
    } finally {
      setUserLoading(false);
    }
  };

  // ✅ HELPER FUNCTION - Kiểm tra quyền xử lý đơn hàng (dựa trên dữ liệu từ API)
  const canProcessOrder = (order: Order): boolean => {
    if (!currentUser) return false;
    
    // Ưu tiên dùng canProcess từ Backend nếu có
    if (order.canProcess !== undefined) {
      return order.canProcess;
    }
    
    // Fallback logic
    if (currentUser.isAdmin) return true;
    if (currentUser.isStaff) {
      return !order.maNhanVien || order.maNhanVien === currentUser.maNguoiDung;
    }
    
    return false;
  };

  // Calculate order counts from all orders
  const calculateOrderCounts = (orderList: Order[]): OrderCount => {
    return {
      all: orderList.length,
      unconfirmed: orderList.filter(order => order.trangThaiDonHang === 0).length,
      processing: orderList.filter(order => order.trangThaiDonHang === 1).length,
      delivering: orderList.filter(order => order.trangThaiDonHang === 2).length,
      completed: orderList.filter(order => order.trangThaiDonHang === 3).length,
      canceled: orderList.filter(order => order.trangThaiDonHang === 4).length
    };
  };

  // Unified fetch function with search support
  const fetchOrders = async (resetPage: boolean = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (resetPage) {
        setCurrentPage(1);
      }
      
      const pageToUse = resetPage ? 1 : currentPage;
      
      if (activeTab === 'canceled') {
        // Special API for cancelled orders with pagination
        const response = await axios.get<CancelledOrdersResponse>(
          `https://localhost:7051/api/orders/cancelled?page=${pageToUse}&pageSize=${ordersPerPage}`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        console.log('Fetched cancelled orders:', response.data);
        
        if (response.data && response.data.data) {
          const cancelledOrders = response.data.data.map((order: CancelledOrderData) => ({
            maDonHang: order.maDonHang,
            tenNguoiNhan: order.tenNguoiNhan,
            ngayDat: order.ngayDat,
            trangThaiDonHang: order.trangThaiDonHang,
            trangThaiThanhToan: order.trangThaiThanhToan,
            hinhThucThanhToan: order.hinhThucThanhToan,
            lyDoHuy: order.lyDoHuy,
            tenSanPhamHoacCombo: order.tenSanPhamHoacCombo,
            maNguoiDung: order.maNguoiDung,
            hoTenKhachHang: order.hoTenKhachHang,
            hoTenNhanVien: order.hoTenNhanVien,
            maNhanVien: order.maNhanVien,
            tongTien: order.tongTien,
            diaChi: order.diaChi,
            soDienThoai: order.soDienThoai,
            canProcess: order.canProcess // ✅ Lấy từ Backend
          }));
          
          // Apply search to cancelled orders
          const searchFiltered = applySearchFilter(cancelledOrders);
          setFilteredOrders(searchFiltered);
          
          // Set pagination info
          setTotalPages(response.data.pagination.totalPages);
          
          // Update cancelled count from API
          setOrderCounts(prev => ({
            ...prev,
            canceled: response.data.pagination.totalRecords
          }));
        }
      } else {
        // Main API for all other orders
        const response = await axios.get<Order[]>('https://localhost:7051/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Fetched all orders:', response.data);
        setOrders(response.data);
        
        // Calculate all counts
        const counts = calculateOrderCounts(response.data);
        
        // Get cancelled count from separate API call
        try {
          const cancelledResponse = await axios.get<CancelledOrdersResponse>(
            'https://localhost:7051/api/orders/cancelled?page=1&pageSize=1',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          counts.canceled = cancelledResponse.data.pagination.totalRecords;
          counts.all = response.data.length + counts.canceled; // Update total count
        } catch (error) {
          console.warn('Could not fetch cancelled count:', error);
        }
        
        setOrderCounts(counts);
        
        // Filter and paginate for current tab
        const filteredByTab = filterOrdersByStatus(response.data, activeTab);
        const searchFiltered = applySearchFilter(filteredByTab);
        
        // CLIENT-SIDE PAGINATION for non-cancelled tabs
        const totalFiltered = searchFiltered.length;
        const totalPagesCalculated = Math.ceil(totalFiltered / ordersPerPage);
        setTotalPages(totalPagesCalculated);
        
        const startIndex = (pageToUse - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const paginatedOrders = searchFiltered.slice(startIndex, endIndex);
        
        setFilteredOrders(paginatedOrders);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Có lỗi xảy ra khi lấy danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  // Pure filter function by status
  const filterOrdersByStatus = (orderList: Order[], tab: string): Order[] => {
    switch (tab) {
      case 'all':
        return orderList;
      case 'unconfirmed':
        return orderList.filter(order => order.trangThaiDonHang === 0);
      case 'processing':
        return orderList.filter(order => order.trangThaiDonHang === 1);
      case 'delivering':
        return orderList.filter(order => order.trangThaiDonHang === 2);
      case 'completed':
        return orderList.filter(order => order.trangThaiDonHang === 3);
      case 'canceled':
        return orderList.filter(order => order.trangThaiDonHang === 4);
      default:
        return orderList;
    }
  };

  // Pure search filter function
  const applySearchFilter = (orderList: Order[]): Order[] => {
    if (!searchTerm.trim()) {
      return orderList;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return orderList.filter(order => {
      return (
        order.maDonHang.toString().toLowerCase().includes(searchLower) ||
        (order.tenNguoiNhan?.toLowerCase().includes(searchLower) || false) ||
        (order.tenSanPhamHoacCombo?.toLowerCase().includes(searchLower) || false) ||
        (order.ngayDat?.toLowerCase().includes(searchLower) || false) ||
        (order.hinhThucThanhToan?.toLowerCase().includes(searchLower) || false) ||
        (order.lyDoHuy?.toLowerCase().includes(searchLower) || false) ||
        (order.hoTenNguoiDuyet || '').toLowerCase().includes(searchLower) ||
        (order.hoTenKhachHang || '').toLowerCase().includes(searchLower) ||
        getStatusLabel(order.trangThaiDonHang).toLowerCase().includes(searchLower) ||
        getPaymentStatusLabel(order.trangThaiThanhToan, order.trangThaiDonHang).toLowerCase().includes(searchLower)
      );
    });
  };

  // ✅ EFFECT: Fetch user info first, then orders
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // EFFECT: Fetch orders when user is loaded and tab/page changes
  useEffect(() => {
    if (currentUser && !userLoading) {
      fetchOrders();
    }
  }, [activeTab, currentPage, currentUser, userLoading]);

  // EFFECT: Handle search with debounce
  useEffect(() => {
    if (currentUser && !userLoading) {
      const debounce = setTimeout(() => {
        fetchOrders(true); // Reset to page 1 when searching
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchTerm, currentUser, userLoading]);

  // Tab change handler
  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
    setCurrentPage(1);
    setSearchTerm(''); // Clear search when changing tabs
  };

  // Page change handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Utility functions
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Chưa xác nhận';
      case 1: return 'Đang xử lý';
      case 2: return 'Đang giao hàng';
      case 3: return 'Hoàn thành';
      case 4:
      case 5: return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getPaymentStatusLabel = (trangThaiThanhToan: number, trangThaiDonHang: number) => {
    return trangThaiThanhToan === 1 && trangThaiDonHang === 3 ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  // ✅ APPROVE HANDLER
  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!currentUser?.maNguoiDung) {
        toast.error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      console.log('Sending userId:', currentUser.maNguoiDung);

      const response = await axios.put(
        `https://localhost:7051/api/orders/approve/${id}`,
        { userId: currentUser.maNguoiDung },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success("Duyệt đơn hàng thành công!", { duration: 2000 });
      
      // Refresh current page
      setTimeout(() => {
        fetchOrders();
      }, 1000);
      
    } catch (error) {
      console.error('Error approving order:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi duyệt đơn hàng.";
      toast.error(errorMessage);
    }
  };

  // Modal handlers
  const openCancelModal = (id: number) => {
    setCancelOrderId(id);
    setCancelReason('');
    setShowCancelModal(true);
  };

  // ✅ CANCEL HANDLER
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy!");
      return;
    }
    if (cancelOrderId === null) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://localhost:7051/api/orders/cancel/${cancelOrderId}`,
        JSON.stringify(cancelReason),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        }
      );
      
      toast.success("Hủy đơn hàng thành công!");
      
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
      
      // Refresh and switch to cancelled tab
      await fetchOrders();
      setActiveTab('canceled');
      
    } catch (error) {
      console.error('Error canceling order:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng.";
      toast.error(errorMessage);
    }
  };

  const openDetailsModal = (order: Order) => {
    console.log('Opening details for order:', order.maDonHang);
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleReasonSuggestionClick = (reason: string) => {
    setCancelReason(reason);
  };

  // ✅ LOADING STATE
  if (userLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải thông tin người dùng...</span>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (!currentUser) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center py-8">
          <p className="text-red-600">Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.</p>
          <Button 
            onClick={() => window.location.href = '/login'} 
            className="mt-4"
          >
            Đăng nhập lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-semibold mb-4">Quản lý đơn hàng</h1>

      {/* ✅ ROLE INDICATOR - Hiển thị vai trò từ API */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Vai trò hiện tại:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
            currentUser.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {currentUser.isAdmin ? 'Admin (Toàn quyền)' : 'Nhân viên (Hạn chế)'}
          </span>
          <span className="ml-2 text-gray-500">
            • {currentUser.fullName} ({currentUser.email})
          </span>
        </p>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Đơn hàng</h1>
<br></br>
      {/* Search with loading state */}
      <div className="relative w-full sm:w-[300px] mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm đơn hàng..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* TABS - Updated with 6 tabs including "Tất cả đơn hàng" */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 grid w-full grid-cols-6 bg-gray-100 rounded-lg p-1">
          <TabsTrigger 
            value="all"
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'all' 
                ? 'bg-purple-100 text-purple-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'all' && (
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium">
              Tất cả ({orderCounts.all})
            </span>
          </TabsTrigger>

          <TabsTrigger 
            value="unconfirmed"
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'unconfirmed' 
                ? 'bg-gray-200 text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'unconfirmed' && (
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium">
              Chưa xác nhận ({orderCounts.unconfirmed})
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="processing"
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'processing' 
                ? 'bg-yellow-100 text-yellow-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'processing' && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium">
              Đang xử lý ({orderCounts.processing})
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="delivering"
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'delivering' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'delivering' && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium">
              Đang giao ({orderCounts.delivering})
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="completed"
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'completed' 
                ? 'bg-green-100 text-green-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'completed' && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium">
              Hoàn thành ({orderCounts.completed})
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="canceled"
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'canceled' 
                ? 'bg-red-100 text-red-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'canceled' && (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium">
              Đã hủy ({orderCounts.canceled})
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table with fixed column widths */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead className="min-w-32">Tên khách hàng</TableHead>
              <TableHead className="min-w-48">Tên sản phẩm/Combo</TableHead>
              <TableHead className="min-w-24 text-center">Ngày đặt</TableHead>
              <TableHead className="w-36 text-center">Trạng thái</TableHead>
              <TableHead className="min-w-28 text-center">Thanh toán</TableHead>
              <TableHead className="w-24 text-center">
                <div className="leading-tight">
                  <div>Hình thức</div>
                  <div>thanh toán</div>
                </div>
              </TableHead>
              <TableHead className="min-w-32 text-center">Nhân viên xử lý</TableHead>
              {activeTab === 'canceled' && <TableHead className="min-w-32 text-center">Lý do hủy</TableHead>}
              <TableHead className="w-72 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={activeTab === 'canceled' ? 10 : 9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <TableRow key={order.maDonHang} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-center">{order.maDonHang}</TableCell>
                  <TableCell className="max-w-32 truncate" title={order.tenNguoiNhan}>
                    {order.tenNguoiNhan || 'N/A'}
                  </TableCell>
                  <TableCell className="max-w-48 truncate" title={order.tenSanPhamHoacCombo}>
                    {order.tenSanPhamHoacCombo || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {order.ngayDat
                      ? new Date(order.ngayDat.split('/').reverse().join('-')).toLocaleDateString('vi-VN')
                      : 'Không có ngày'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      (order.trangThaiDonHang === 4 || order.trangThaiDonHang === 5)
                        ? 'bg-red-100 text-red-800' 
                        : order.trangThaiDonHang === 3 
                        ? 'bg-green-100 text-green-800'
                        : order.trangThaiDonHang === 2 
                        ? 'bg-blue-100 text-blue-800'
                        : order.trangThaiDonHang === 1 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusLabel(order.trangThaiDonHang)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      getPaymentStatusLabel(order.trangThaiThanhToan, order.trangThaiDonHang) === 'Đã thanh toán'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {getPaymentStatusLabel(order.trangThaiThanhToan, order.trangThaiDonHang)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.hinhThucThanhToan === 'VNPay' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {order.hinhThucThanhToan || 'COD'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm ${
                      order.hoTenNhanVien 
                        ? 'text-gray-900' 
                        : 'text-gray-500 italic'
                    }`}>
                      {order.hoTenNhanVien || 'Chưa có'}
                    </span>
                  </TableCell>

                  {activeTab === 'canceled' && (
                    <TableCell className="text-center max-w-32 truncate" title={order.lyDoHuy}>
                      <span className="text-red-600 text-sm">
                        {order.lyDoHuy || 'Không có lý do'}
                      </span>
                    </TableCell>
                  )}
                  
                  {/* ✅ ACTIONS COLUMN - Sử dụng canProcessOrder với dữ liệu từ API */}
                  <TableCell className="w-72">
                    <div className="flex justify-center items-center gap-2 min-h-[40px]">
                      {/* Button xem chi tiết - ai cũng được xem */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDetailsModal(order)}
                        className="hover:bg-blue-50 flex-shrink-0"
                        title="Xem chi tiết đơn hàng"
                      >
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                      
                      {/* Button duyệt đơn - áp dụng phân quyền */}
                      {(order.trangThaiDonHang === 0 || order.trangThaiDonHang === 1 || order.trangThaiDonHang === 2) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(order.maDonHang)}
                          disabled={!canProcessOrder(order)}
                          className={`flex-shrink-0 ${
                            canProcessOrder(order) 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !canProcessOrder(order) 
                              ? currentUser.isStaff 
                                ? 'Đơn hàng đã được gán cho nhân viên khác xử lý' 
                                : 'Bạn không có quyền duyệt đơn hàng này'
                              : 'Duyệt đơn hàng'
                          }
                        >
                          Duyệt đơn
                        </Button>
                      )}
                      
                      {/* Button hủy đơn - áp dụng phân quyền */}
                      {(order.trangThaiDonHang === 0 || order.trangThaiDonHang === 1) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openCancelModal(order.maDonHang)}
                          disabled={!canProcessOrder(order)}
                          className={`flex-shrink-0 ${
                            canProcessOrder(order) 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !canProcessOrder(order) 
                              ? currentUser.isStaff 
                                ? 'Chỉ nhân viên đã duyệt đơn hoặc admin mới có thể hủy' 
                                : 'Bạn không có quyền hủy đơn hàng này'
                              : 'Hủy đơn hàng'
                          }
                        >
                          Hủy đơn
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={activeTab === 'canceled' ? 10 : 9} className="text-center py-8">
                  <div className="text-gray-500">
                    {searchTerm ? (
                      <>
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Không tìm thấy đơn hàng nào với từ khóa "<strong>{searchTerm}</strong>"</p>
                      </>
                    ) : (
                      <>
                        <p>Không có đơn hàng nào trong trạng thái này.</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Component */}
      <PaginationComponent
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* MODALS */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          orderId={selectedOrder.maDonHang}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhập lý do hủy đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              type="text"
              placeholder="Lý do hủy"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full"
            />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Chọn lý do gợi ý:</p>
              <div className="flex flex-wrap gap-2">
                {cancelReasonsSuggestions.map((reason, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleReasonSuggestionClick(reason)}
                    className={`text-sm transition-colors ${
                      cancelReason === reason 
                        ? 'bg-blue-100 border-blue-300 text-blue-800' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Đóng
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
            >
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;