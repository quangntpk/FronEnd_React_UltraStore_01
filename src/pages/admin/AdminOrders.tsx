import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderDetailsModal from './AdminDetailsOrder';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Ellipsis, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Order {
  maDonHang: number;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  lyDoHuy?: string;
  tenSanPhamHoacCombo?: string;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('completed');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ordersPerPage = 10;

  // Danh sách các lý do hủy gợi ý
  const cancelReasonsSuggestions = [
    "Khách hàng không muốn mua nữa",
    "Hết hàng",
    "Sai thông tin đơn hàng",
    "Khác"
  ];

  // Hàm lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      const response = await axios.get<Order[]>('http://localhost:5261/api/orders');
      setOrders(response.data);
      handleTabChange(activeTab); // Gọi lại hàm lọc theo tab
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Có lỗi xảy ra khi lấy danh sách đơn hàng.');
    }
  };

  // Gọi API khi component được mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Hàm lọc đơn hàng theo tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset về trang 1 khi đổi tab
    let filtered = orders;
    if (value === 'unconfirmed') {
      filtered = orders.filter(order => order.trangThaiDonHang === 0);
    } else if (value === 'processing') {
      filtered = orders.filter(order => order.trangThaiDonHang === 1);
    } else if (value === 'delivering') {
      filtered = orders.filter(order => order.trangThaiDonHang === 2);
    } else if (value === 'completed') {
      filtered = orders.filter(order => order.trangThaiDonHang === 3);
    } else if (value === 'canceled') {
      filtered = orders.filter(order => order.trangThaiDonHang === 4);
    }
    // Áp dụng tìm kiếm trên danh sách đã lọc
    applySearch(filtered);
  };

  // Hàm chuyển đổi trạng thái đơn hàng thành chuỗi để tìm kiếm
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Chưa xác nhận';
      case 1: return 'Đang xử lý';
      case 2: return 'Đang giao hàng';
      case 3: return 'Hoàn thành';
      case 4: return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  // Hàm chuyển đổi trạng thái thanh toán thành chuỗi để tìm kiếm
  const getPaymentStatusLabel = (trangThaiThanhToan: number, trangThaiDonHang: number) => {
    return trangThaiThanhToan === 1 && trangThaiDonHang === 3 ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  // Hàm áp dụng tìm kiếm trên tất cả các trường
  const applySearch = (orderList: Order[]) => {
    const filtered = orderList.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      return (
        // Tìm kiếm trên các trường trực tiếp
        order.maDonHang.toString().toLowerCase().includes(searchLower) ||
        (order.tenNguoiNhan?.toLowerCase().includes(searchLower) || '') ||
        (order.tenSanPhamHoacCombo?.toLowerCase().includes(searchLower) || '') ||
        (order.ngayDat?.toLowerCase().includes(searchLower) || '') ||
        (order.hinhThucThanhToan?.toLowerCase().includes(searchLower) || '') ||
        (order.lyDoHuy?.toLowerCase().includes(searchLower) || '') ||
        // Tìm kiếm trên các giá trị đã dịch
        getStatusLabel(order.trangThaiDonHang).toLowerCase().includes(searchLower) ||
        getPaymentStatusLabel(order.trangThaiThanhToan, order.trangThaiDonHang).toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  };

  // Tìm kiếm "ghi tới đâu tìm tới đó"
  useEffect(() => {
    const debounce = setTimeout(() => {
      handleTabChange(activeTab); // Gọi lại hàm lọc khi searchTerm thay đổi
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, orders]);

  // Hàm duyệt đơn hàng
  const handleApprove = async (id: number) => {
    try {
      const response = await axios.put(`http://localhost:5261/api/orders/approve/${id}`);
      toast.success("Duyệt đơn hàng thành công!", { duration: 2000 });
      setTimeout(() => {
        fetchOrders(); // Lấy lại danh sách đơn hàng sau khi duyệt
      }, 2000);
    } catch (error) {
      console.error('Error approving order:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi duyệt đơn hàng.";
      toast.error(errorMessage);
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
      const response = await axios.put(
        `http://localhost:5261/api/orders/cancel/${cancelOrderId}`,
        cancelReason,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success("Hủy đơn hàng thành công!");
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error('Error canceling order:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng.";
      toast.error(errorMessage);
    }
  };

  // Hàm mở modal chi tiết đơn hàng
  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Hàm chọn lý do hủy gợi ý
  const handleReasonSuggestionClick = (reason: string) => {
    setCancelReason(reason);
  };

  // Logic phân trang
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-semibold mb-4">Đơn hàng</h1>

      {/* Thanh tìm kiếm */}
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

      {/* Tabs trạng thái đơn hàng */}
      <Tabs defaultValue="completed" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="unconfirmed">Chưa xác nhận</TabsTrigger>
          <TabsTrigger value="processing">Đang xử lý</TabsTrigger>
          <TabsTrigger value="delivering">Đang giao</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
          <TabsTrigger value="canceled">Đã hủy</TabsTrigger>
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
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Hình thức thanh toán</TableHead>
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
                    {order.trangThaiDonHang === 0 && 'Chưa xác nhận'}
                    {order.trangThaiDonHang === 1 && 'Đang xử lý'}
                    {order.trangThaiDonHang === 2 && 'Đang giao hàng'}
                    {order.trangThaiDonHang === 3 && 'Hoàn thành'}
                    {order.trangThaiDonHang === 4 && 'Đã hủy'}
                  </TableCell>
                  <TableCell>
                    {order.trangThaiThanhToan === 1 && order.trangThaiDonHang === 3 ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </TableCell>
                  <TableCell>{order.hinhThucThanhToan || 'COD'}</TableCell>
                  {activeTab === 'canceled' && <TableCell>{order.lyDoHuy || 'Không có lý do'}</TableCell>}
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDetailsModal(order)}>
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                      {(order.trangThaiDonHang === 0 || order.trangThaiDonHang === 1 || order.trangThaiDonHang === 2) && (
                        <Button variant="default" size="sm" onClick={() => handleApprove(order.maDonHang)}>
                          Duyệt đơn
                        </Button>
                      )}
                      {(order.trangThaiDonHang === 0 || order.trangThaiDonHang === 1) && (
                        <Button variant="destructive" size="sm" onClick={() => openCancelModal(order.maDonHang)}>
                          Hủy đơn
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={activeTab === 'canceled' ? 9 : 8} className="text-center py-4">
                  Không tìm thấy đơn hàng nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
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
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          orderId={selectedOrder.maDonHang}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Modal hủy đơn hàng */}
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

export default OrderList;