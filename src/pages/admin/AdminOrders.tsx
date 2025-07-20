import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderDetailsModal from './OrderDetailsModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Ellipsis, Search } from 'lucide-react';
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
}

interface OrderCount {
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
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCount>({
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
  const [activeTab, setActiveTab] = useState<string>('completed');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const ordersPerPage = 10;

  // Danh sách các lý do hủy gợi ý
  const cancelReasonsSuggestions = [
    "Khách hàng không muốn mua nữa",
    "Hết hàng", 
    "Khách hủy đơn",
    "Sai thông tin đơn hàng",
    "Khác"
  ];

  // Hàm tính toán số lượng đơn hàng theo trạng thái
  const calculateOrderCounts = (orderList: Order[]): OrderCount => {
    return {
      unconfirmed: orderList.filter(order => order.trangThaiDonHang === 0).length,
      processing: orderList.filter(order => order.trangThaiDonHang === 1).length,
      delivering: orderList.filter(order => order.trangThaiDonHang === 2).length,
      completed: orderList.filter(order => order.trangThaiDonHang === 3).length,
      canceled: orderList.filter(order => order.trangThaiDonHang === 5).length // Fix: Đổi từ 4 thành 5
    };
  };

  // Hàm lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Nếu tab hiện tại là canceled, sử dụng API riêng cho đơn hàng đã hủy
      if (activeTab === 'canceled') {
        const response = await axios.get<CancelledOrdersResponse>(
          `http://localhost:5261/api/orders/cancelled?page=${currentPage}&pageSize=${ordersPerPage}`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        console.log('Fetched cancelled orders:', response.data);
        
        // Xử lý response từ API cancelled orders - sử dụng lowercase keys
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
            soDienThoai: order.soDienThoai
          }));
          
          setFilteredOrders(cancelledOrders);
          
          // Set pagination info
          setTotalPages(response.data.pagination.totalPages);
          
          // Cập nhật order counts với thông tin từ API
          setOrderCounts(prev => ({
            ...prev,
            canceled: response.data.pagination.totalRecords
          }));
          
          console.log('Set cancelled orders:', cancelledOrders);
        }
      } else {
        // API gốc cho các tab khác
        const response = await axios.get<Order[]>('http://localhost:5261/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Fetched orders:', response.data);
        setOrders(response.data);
        
        // Cập nhật số lượng đơn hàng
        const counts = calculateOrderCounts(response.data);
        setOrderCounts(counts);
        console.log('Order counts:', counts);
        
        // Filter orders theo tab hiện tại
        filterOrdersByTab(response.data, activeTab);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Có lỗi xảy ra khi lấy danh sách đơn hàng.');
    }
  };

  const filterOrdersByTab = (orderList: Order[], tab: string) => {
    let filtered = orderList;
    console.log('Filtering for tab:', tab);
    
    if (tab === 'unconfirmed') {
      filtered = orderList.filter(order => order.trangThaiDonHang === 0);
    } else if (tab === 'processing') {
      filtered = orderList.filter(order => order.trangThaiDonHang === 1);
    } else if (tab === 'delivering') {
      filtered = orderList.filter(order => order.trangThaiDonHang === 2);
    } else if (tab === 'completed') {
      filtered = orderList.filter(order => order.trangThaiDonHang === 3);
    } else if (tab === 'canceled') {
      filtered = orderList.filter(order => order.trangThaiDonHang === 5); // Fix: Đổi từ 4 thành 5
    }
    
    console.log('Filtered orders for', tab, ':', filtered);
    applySearch(filtered);
  };

  // Gọi API khi component được mount hoặc khi tab/page thay đổi
  useEffect(() => {
    fetchOrders();
  }, [activeTab, currentPage]);

  // Hàm lọc đơn hàng theo tab
  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
    setCurrentPage(1); 
    
    // Reset search khi chuyển tab
    setSearchTerm('');
  };

  // Hàm chuyển đổi trạng thái đơn hàng thành chuỗi để tìm kiếm
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Chưa xác nhận';
      case 1: return 'Đang xử lý';
      case 2: return 'Đang giao hàng';
      case 3: return 'Hoàn thành';
      case 5: return 'Đã hủy'; // Fix: Đổi từ case 4 thành case 5
      default: return 'Không xác định';
    }
  };

  // Hàm chuyển đổi trạng thái thanh toán thành chuỗi để tìm kiếm
  const getPaymentStatusLabel = (trangThaiThanhToan: number, trangThaiDonHang: number) => {
    return trangThaiThanhToan === 1 && trangThaiDonHang === 3 ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  // Hàm áp dụng tìm kiếm trên tất cả các trường
  const applySearch = (orderList: Order[]) => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orderList);
      return;
    }
    
    const filtered = orderList.filter(order => {
      const searchLower = searchTerm.toLowerCase();
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
    console.log('Search applied, filtered orders:', filtered);
    setFilteredOrders(filtered);
  };

  // Tìm kiếm "ghi tới đâu tìm tới đó"
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (activeTab === 'canceled') {
        applySearch(filteredOrders); // Apply search directly to current filtered orders for cancelled
      } else {
        filterOrdersByTab(orders, activeTab); 
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Hàm duyệt đơn hàng
  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      let userId = localStorage.getItem('userId');
      
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.maNguoiDung;
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
      }
      
      if (!userId && token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userId = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      if (!userId) {
        toast.error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      console.log('Sending userId:', userId);

      const response = await axios.put(
        `http://localhost:5261/api/orders/approve/${id}`,
        { userId: userId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success("Duyệt đơn hàng thành công!", { duration: 2000 });
      setTimeout(() => {
        fetchOrders();
      }, 2000);
    } catch (error) {
      console.error('Error approving order:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi duyệt đơn hàng.";
      toast.error(errorMessage);
    }
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      return tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Hàm mở modal hủy đơn hàng
  const openCancelModal = (id: number) => {
    setCancelOrderId(id);
    setCancelReason('');
    setShowCancelModal(true);
  };

  // Hàm hủy đơn hàng
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy!");
      return;
    }
    if (cancelOrderId === null) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5261/api/orders/cancel/${cancelOrderId}`,
        JSON.stringify(cancelReason),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        }
      );
      
      toast.success("Hủy đơn hàng thành công!");
      
      // Đóng modal trước
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
      
      // Fetch lại orders từ API
      await fetchOrders();
      
      // Chuyển sang tab canceled
      setActiveTab('canceled');
      
    } catch (error) {
      console.error('Error canceling order:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng.";
      toast.error(errorMessage);
    }
  };

  // Hàm mở modal chi tiết đơn hàng
  const openDetailsModal = (order: Order) => {
    console.log('Opening details for order:', order.maDonHang);
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Hàm chọn lý do hủy gợi ý
  const handleReasonSuggestionClick = (reason: string) => {
    setCancelReason(reason);
  };

  // Logic phân trang cho cancelled orders
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate pagination for non-cancelled orders
  const calculatePagination = () => {
    if (activeTab === 'canceled') {
      return {
        totalPages: totalPages,
        paginatedOrders: filteredOrders,
        currentPage: currentPage
      };
    } else {
      const total = Math.ceil(filteredOrders.length / ordersPerPage);
      const startIndex = (currentPage - 1) * ordersPerPage;
      const endIndex = startIndex + ordersPerPage;
      const paginated = filteredOrders.slice(startIndex, endIndex);
      
      return {
        totalPages: total,
        paginatedOrders: paginated,
        currentPage: currentPage
      };
    }
  };

  const { totalPages: calculatedTotalPages, paginatedOrders } = calculatePagination();

  // Lấy vai trò từ token
  const userId = getUserIdFromToken() || localStorage.getItem('userId');
  const role = localStorage.getItem('role') || '2';
  const isAdmin = role === '1';
  const isStaff = role === '2';

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-semibold mb-4">Đơn hàng</h1>

      <div className="relative w-full sm:w-[300px] mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm đơn hàng..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="unconfirmed">
            Chưa xác nhận ({orderCounts.unconfirmed})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Đang xử lý ({orderCounts.processing})
          </TabsTrigger>
          <TabsTrigger value="delivering">
            Đang giao ({orderCounts.delivering})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Hoàn thành ({orderCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="canceled">
            Đã hủy ({orderCounts.canceled})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Tên khách hàng</TableHead>
              <TableHead>Tên sản phẩm/Combo</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead className="w-36">Trạng thái</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Hình thức thanh toán</TableHead>
              <TableHead>Nhân viên xử lý</TableHead>
              {activeTab === 'canceled' && <TableHead>Lý do hủy</TableHead>}
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map(order => (
                <TableRow key={order.maDonHang} className="hover:bg-gray-50">
                  <TableCell>{order.maDonHang}</TableCell>
                  <TableCell>{order.tenNguoiNhan || 'N/A'}</TableCell>
                  <TableCell>{order.tenSanPhamHoacCombo || 'N/A'}</TableCell>
                  <TableCell>
                    {order.ngayDat
                      ? new Date(order.ngayDat.split('/').reverse().join('-')).toLocaleDateString('vi-VN')
                      : 'Không có ngày'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.trangThaiDonHang === 5 
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
                  <TableCell>
                    {getPaymentStatusLabel(order.trangThaiThanhToan, order.trangThaiDonHang)}
                  </TableCell>
                  <TableCell>{order.hinhThucThanhToan || 'COD'}</TableCell>
                  <TableCell>{order.hoTenNhanVien || 'Chưa có'}</TableCell>

                  {activeTab === 'canceled' && <TableCell>{order.lyDoHuy || 'Không có lý do'}</TableCell>}
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDetailsModal(order)}>
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                      {(order.trangThaiDonHang === 0 || order.trangThaiDonHang === 1 || order.trangThaiDonHang === 2) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(order.maDonHang)}
                          disabled={
                            isStaff && order.maNhanVien && order.maNhanVien !== userId
                          }
                        >
                          Duyệt đơn
                        </Button>
                      )}
                      {(order.trangThaiDonHang === 0 || order.trangThaiDonHang === 1) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openCancelModal(order.maDonHang)}
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
                <TableCell colSpan={activeTab === 'canceled' ? 10 : 9} className="text-center py-4">
                  {activeTab === 'canceled' 
                    ? "Không có đơn hàng nào bị hủy." 
                    : "Không tìm thấy đơn hàng nào phù hợp."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {calculatedTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          {Array.from({ length: calculatedTotalPages }, (_, index) => index + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === calculatedTotalPages}
          >
            Sau
          </Button>
        </div>
      )}

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
        <DialogContent>
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
                    className={`text-sm ${cancelReason === reason ? 'bg-gray-200' : ''}`}
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
            <Button variant="destructive" onClick={handleCancel}>
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;