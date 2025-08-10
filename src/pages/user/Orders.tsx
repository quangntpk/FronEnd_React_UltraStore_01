import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Package, Truck, CheckCircle, ChevronDown, ChevronUp, Star, CreditCard, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Interfaces
interface CancelOrderResponse {
  message: string;
  isAccountLocked: boolean;
  lockoutMessage?: string;
  remainingCancellations?: number;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CancelOrderRequest {
  lyDoHuy: string;
}

type OrderStatus = "pending" | "processing" | "shipping" | "completed" | "paid" | "canceled";

type Product = {
  maChiTietDh: number;
  laCombo: boolean;
  tenSanPham: string;
  soLuong: number;
  gia: number;
  thanhTien: number;
  hinhAnh: string;
  maCombo: number | null;
  maSanPham: string | null;
  combo: ComboDetail | null;
  mauSac?: string;
  kichThuoc?: string;
  mauSacHex?: string;
};

type ComboDetail = {
  tenCombo: string;
  giaCombo: number;
  sanPhamsTrongCombo: {
    tenSanPham: string;
    soLuong: number;
    gia: number;
    thanhTien: number;
    hinhAnh: string;
    maSanPham: string;
    mauSac?: string;
    kichThuoc?: string;
    mauSacHex?: string;
  }[];
};

type Order = {
  maDonHang: number;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  paymentStatusText?: string;
  lyDoHuy: string | null;
  tongTien: number;
  finalAmount: number;
  sanPhams: Product[];
  thongTinNguoiDung: {
    tenNguoiNhan: string;
    diaChi: string;
    sdt: string;
    tenNguoiDat: string;
  };
  thongTinDonHang: {
    ngayDat: string;
    trangThai: number;
    thanhToan: number;
    hinhThucThanhToan: string;
    trangThaiThanhToan: string;
    soTienGiam: number;
    phiGiaoHang: number;
    thanhTienCuoiCung: number;
    tongTien: number;
  };
};

interface CommentState {
  productId: number;
  content: string;
  rating: number;
}

interface OrderItemProps {
  order: Order;
  onCancel: (orderId: string) => void;
  onAddComment: (orderId: string, productId: number, content: string, rating: number) => Promise<boolean>;
  commentedProducts: Set<number>;
}

// Constants
const orderStatuses = {
  pending: { color: "bg-gray-500", icon: ClipboardList, label: "Chờ xác nhận" },
  processing: { color: "bg-yellow-500", icon: Package, label: "Đang xử lý" },
  shipping: { color: "bg-blue-500", icon: Truck, label: "Đang giao hàng" },
  completed: { color: "bg-green-500", icon: CheckCircle, label: "Đã hoàn thành" },
  paid: { color: "bg-green-500", icon: CreditCard, label: "Đã thanh toán" },
  canceled: { color: "bg-red-500", icon: CheckCircle, label: "Đã hủy" },
} as const;

const cancelReasonsSuggestions = [
  "Đổi ý không muốn mua nữa",
  "Tìm được giá rẻ hơn ở nơi khác",
  "Đặt nhầm sản phẩm",
  "Thay đổi địa chỉ giao hàng",
  "Cần gấp nhưng giao hàng chậm",
  "Lý do khác"
];

// Helper Functions
const mapStatus = (status: number): OrderStatus => {
  const statusMap = { 0: "pending", 1: "processing", 2: "shipping", 3: "completed", 4: "paid", 5: "canceled" };
  return (statusMap[status as keyof typeof statusMap] || "pending") as OrderStatus;
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (date: string) => 
  date ? new Date(date).toLocaleDateString('vi-VN') : "N/A";

// Notification Component
const NotificationComponent = ({ notification, onClose }: { 
  notification: { message: string; type: "success" | "error"; duration?: number } | null, 
  onClose: () => void 
}) => {
  useEffect(() => {
    if (notification) {
      const duration = notification.duration || (notification.type === 'success' ? 5000 : 8000);
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md transition-all duration-300 ${
      notification.type === 'success' 
        ? 'bg-green-100 border border-green-400 text-green-700' 
        : 'bg-red-100 border border-red-400 text-red-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          ) : (
            <div className="h-5 w-5 mr-2 mt-0.5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium text-sm leading-relaxed">
              {notification.message}
            </div>
            {notification.type === 'error' && notification.message.includes('khóa') && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border-l-4 border-red-400">
                💡 <strong>Lưu ý:</strong> Tài khoản sẽ được tự động mở khóa sau 3 ngày kể từ thời điểm bị khóa.
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600 text-lg font-bold leading-none">×</button>
      </div>
    </div>
  );
};

// OrderItem Component
const OrderItem = ({ order, onCancel, onAddComment, commentedProducts }: OrderItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentStates, setCommentStates] = useState<{ [key: number]: CommentState }>({});
  const [isCommenting, setIsCommenting] = useState<{ [key: number]: boolean }>({});
  const statusInfo = orderStatuses[mapStatus(order.trangThaiDonHang)] || orderStatuses.pending;
  const StatusIcon = statusInfo.icon;
  const [productImages, setProductImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchImages = async () => {
      const idsToFetch = new Set<string>();
      for (const item of order.sanPhams) {
        if (!item.laCombo) {
          if (item.maSanPham && !item.hinhAnh) {
            idsToFetch.add(item.maSanPham);
          }
        } else {
          if (item.combo?.sanPhamsTrongCombo) {
            for (const sub of item.combo.sanPhamsTrongCombo) {
              if (sub.maSanPham && !sub.hinhAnh) {
                idsToFetch.add(sub.maSanPham);
              }
            }
          }
        }
      }

      const imagesMap: { [key: string]: string } = {};
      for (const id of idsToFetch) {
        try {
          const response = await axios.get(`http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${id}`);
          const data = response.data;
          if (Array.isArray(data) && data.length > 0 && data[0].hinhAnhs?.length > 0) {
            imagesMap[id] = `data:image/jpeg;base64,${data[0].hinhAnhs[0]}`;
          }
        } catch (error) {
          console.error(`Error fetching image for ${id}`, error);
        }
      }
      setProductImages(imagesMap);
    };
    fetchImages();
  }, [order.sanPhams]);

  const getComboImage = (item: Product) => {
    if (item.hinhAnh) return item.hinhAnh;
    if (item.combo?.sanPhamsTrongCombo?.length > 0) {
      const firstSub = item.combo.sanPhamsTrongCombo[0];
      return productImages[firstSub.maSanPham] || firstSub.hinhAnh || "https://via.placeholder.com/150";
    }
    return "https://via.placeholder.com/150";
  };

  const getPaymentStatusDisplay = () => {
    if (order.paymentStatusText) return order.paymentStatusText;
    if (order.hinhThucThanhToan === "VNPay") return "Đã thanh toán";
    if (order.hinhThucThanhToan === "COD") {
      return order.trangThaiDonHang === 3 ? "Đã thanh toán" : "Chưa thanh toán";
    }
    return "Chưa thanh toán";
  };

  const handleCommentChange = (productId: number, field: keyof CommentState, value: string | number) => {
    setCommentStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId] || { productId, content: "", rating: 0 },
        [field]: value,
      },
    }));
  };

  const handleAddComment = async (productId: number) => {
    const comment = commentStates[productId];
    if (!comment || !comment.content || comment.rating < 1 || comment.rating > 5) {
      alert("Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!");
      return;
    }

    setIsCommenting((prev) => ({ ...prev, [productId]: true }));
    const success = await onAddComment(order.maDonHang.toString(), productId, comment.content, comment.rating);
    if (success) {
      setCommentStates((prev) => ({
        ...prev,
        [productId]: { productId, content: "", rating: 0 },
      }));
    }
    setIsCommenting((prev) => ({ ...prev, [productId]: false }));
  };

  const renderProductInfo = (item: Product) => (
    <div key={item.maChiTietDh} className="flex flex-col gap-4">
      <a
        href={`http://localhost:8080/${item.laCombo ? 'combos' : 'products'}/${item.laCombo ? item.maCombo : item.maSanPham?.substring(0,6)}`}
        className="grid grid-cols-12 gap-4 items-start hover:bg-gray-50 p-3 rounded-lg transition-colors"
      >
        <div className="col-span-12 sm:col-span-2">
          <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={item.laCombo ? getComboImage(item) : (item.maSanPham ? productImages[item.maSanPham] || item.hinhAnh || "https://via.placeholder.com/150" : "https://via.placeholder.com/150")}
              alt={item.laCombo ? 'Combo Preview' : 'Product Preview'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="col-span-12 sm:col-span-7">
          <div className="font-medium text-gray-800 mb-2">
            {item.laCombo ? item.combo?.tenCombo : item.tenSanPham || 'N/A'}
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center">
              <span className="font-medium">Số lượng:</span>
              <span className="ml-2">{item.soLuong || 0} x {formatCurrency(item.gia || 0)}</span>
            </div>
            
            {!item.laCombo && (item.mauSac || item.kichThuoc) && (
              <div className="flex items-center space-x-4">
                {item.mauSac && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Màu:</span>
                    <div className="flex items-center space-x-1">
                      {item.mauSacHex && (
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.mauSacHex }}
                          title={item.mauSac}
                        />
                      )}
                      <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                        {item.mauSac}
                      </span>
                    </div>
                  </div>
                )}
                
                {item.kichThuoc && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Size:</span>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {item.kichThuoc}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {item.laCombo && item.combo?.sanPhamsTrongCombo && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-700 mb-2">Sản phẩm trong combo:</div>
                <div className="space-y-2">
                  {item.combo.sanPhamsTrongCombo.map((comboProduct, index) => (
                    <div key={index} className="flex items-start justify-between text-xs text-gray-600 bg-white p-3 rounded border">
                      <div className="flex items-center space-x-3">
                        {comboProduct.hinhAnh && (
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={productImages[comboProduct.maSanPham] || comboProduct.hinhAnh}
                              alt={comboProduct.tenSanPham}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="font-medium text-gray-800">{comboProduct.tenSanPham || 'Sản phẩm không có tên'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            {comboProduct.mauSac && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Màu:</span>
                                {comboProduct.mauSacHex && (
                                  <div 
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: comboProduct.mauSacHex }}
                                    title={comboProduct.mauSac}
                                  />
                                )}
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                  {comboProduct.mauSac}
                                </span>
                              </div>
                            )}
                            
                            {comboProduct.kichThuoc && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Size:</span>
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                                  {comboProduct.kichThuoc}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          x{comboProduct.soLuong || 0}
                        </span>
                        <span className="text-gray-600 font-medium">
                          {formatCurrency(comboProduct.gia || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 sm:col-span-3 text-right">
          <div className="font-medium text-lg text-gray-800">
            {formatCurrency(item.thanhTien || 0)}
          </div>
        </div>
      </a>

      {/* Comment Section for completed orders */}
      {mapStatus(order.trangThaiDonHang) === "completed" && 
       !commentedProducts.has(item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)) && (
        <div className="ml-4">
          <h3 className="text-lg font-medium mb-4 text-blue-800">
            Viết bình luận cho {item.laCombo ? item.combo?.tenCombo : item.tenSanPham}
          </h3>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="mr-2 text-sm font-medium">Đánh giá:</span>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "w-6 h-6 cursor-pointer transition-colors",
                    index < (commentStates[item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)]?.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 hover:text-yellow-200"
                  )}
                  onClick={() => handleCommentChange(
                    item.laCombo ? item.maCombo! : parseInt(item.maSanPham!), 
                    "rating", 
                    index + 1
                  )}
                />
              ))}
            </div>
            <Textarea
              value={commentStates[item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)]?.content || ""}
              onChange={(e) => handleCommentChange(
                item.laCombo ? item.maCombo! : parseInt(item.maSanPham!), 
                "content", 
                e.target.value
              )}
              placeholder="Nhập bình luận của bạn..."
              className="w-full mb-4"
              rows={4}
              disabled={isCommenting[item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)]}
            />
            <Button
              onClick={() => handleAddComment(item.laCombo ? item.maCombo! : parseInt(item.maSanPham!))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isCommenting[item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)]}
            >
              {isCommenting[item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)] ? "Đang gửi..." : "Gửi Bình Luận"}
            </Button>
          </div>
        </div>
      )}

      {/* Already commented message */}
      {mapStatus(order.trangThaiDonHang) === "completed" && 
       commentedProducts.has(item.laCombo ? item.maCombo! : parseInt(item.maSanPham!)) && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg ml-4">
          <p className="text-green-700 text-sm font-medium">✓ Bạn đã bình luận cho sản phẩm này trong đơn hàng này.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="border rounded-lg overflow-hidden mb-4 transition-all duration-200 hover:shadow-md">
      <div className="p-4 bg-gray-50 overflow-x-auto">
        <div className="grid grid-cols-12 gap-4 items-center min-w-[700px]">
          <div className="col-span-12 sm:col-span-5 flex flex-col gap-1">
            <span className="font-medium text-gray-800">Mã đơn hàng: {order.maDonHang || "N/A"}</span>
            <span className="text-sm text-gray-500">Người nhận: {order.tenNguoiNhan || "N/A"}</span>
            <span className="text-sm text-gray-500">Ngày đặt: {formatDate(order.ngayDat)}</span>
            <span className="text-sm text-gray-500">SĐT: {order.thongTinNguoiDung?.sdt || "N/A"}</span>
            <span className="text-sm text-gray-500">Phương thức thanh toán: {order.hinhThucThanhToan || "N/A"}</span>
            <span className={`text-sm font-medium ${
              getPaymentStatusDisplay() === "Đã thanh toán" ? 'text-green-600' : 'text-orange-600'
            }`}>
              Trạng thái thanh toán: {getPaymentStatusDisplay()}
            </span>
          </div>
          <div className="col-span-6 sm:col-span-3 flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", statusInfo.color)}></span>
            <span className="text-sm font-medium flex items-center gap-1">
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </span>
          </div>
          <div className="col-span-6 sm:col-span-2 text-right">
            <div className="font-semibold text-lg text-gray-800">
              {formatCurrency(order.finalAmount || 0)}
            </div>
            <span className="text-sm text-gray-500">{order.sanPhams?.length || 0} sản phẩm</span>
          </div>
          <div className="col-span-12 sm:col-span-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center rounded-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> Chi tiết
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t">
          <div className="space-y-4 mb-6">
            {(order.sanPhams || []).map(renderProductInfo)}
          </div>

          <div className="border-t pt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span className="font-medium">
                    {formatCurrency(order.thongTinDonHang?.tongTien || 0)}
                  </span>
                </div>

                {order.thongTinDonHang?.soTienGiam > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(order.thongTinDonHang.soTienGiam)}
                    </span>
                  </div>
                )}

                {order.thongTinDonHang?.phiGiaoHang > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí giao hàng:</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(order.thongTinDonHang.phiGiaoHang)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-800">Tổng thanh toán:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(order.thongTinDonHang?.thanhTienCuoiCung || 0)}
                  </span>
                </div>
              </div>
            </div>

            {(mapStatus(order.trangThaiDonHang) === "pending" || mapStatus(order.trangThaiDonHang) === "processing") && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancel(order.maDonHang.toString())}
                  className="rounded-full"
                >
                  Hủy đơn hàng
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// OrderTrackingTimeline Component
const OrderTrackingTimeline = ({ order }: { order: Order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentStatus = mapStatus(order.trangThaiDonHang);
  
  const getPaymentStatusDisplay = () => {
    if (order.paymentStatusText) return order.paymentStatusText;
    if (order.hinhThucThanhToan === "VNPay") return "Đã thanh toán";
    if (order.hinhThucThanhToan === "COD") {
      return order.trangThaiDonHang === 3 ? "Đã thanh toán" : "Chưa thanh toán";
    }
    return "Chưa thanh toán";
  };

  const getPaymentStatusColor = () => {
    const status = getPaymentStatusDisplay();
    return status === "Đã thanh toán" ? 'bg-green-500' : 'bg-orange-500';
  };

  const getPaymentStatusTextColor = () => {
    const status = getPaymentStatusDisplay();
    return status === "Đã thanh toán" ? 'text-green-600' : 'text-orange-600';
  };
  
  const trackingSteps = [
    { 
      status: 'pending', 
      label: 'Chưa xác nhận', 
      bgColor: 'bg-gray-200', 
      textColor: 'text-gray-800',
      dotColor: 'bg-gray-500',
      borderColor: 'border-gray-300',
      description: 'Đơn hàng đã được tạo và đang chờ xác nhận'
    },
    { 
      status: 'processing', 
      label: 'Đang chuẩn bị hàng', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800',
      dotColor: 'bg-yellow-500',
      borderColor: 'border-yellow-300',
      description: 'Đơn hàng đã được xác nhận và đang chuẩn bị'
    },
    { 
      status: 'shipping', 
      label: 'Đang giao hàng', 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-800',
      dotColor: 'bg-blue-500',
      borderColor: 'border-blue-300',
      description: 'Đơn hàng đang được vận chuyển đến bạn'
    },
    { 
      status: 'completed', 
      label: 'Đã giao hàng', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800',
      dotColor: 'bg-green-500',
      borderColor: 'border-green-300',
      description: 'Đơn hàng đã được giao thành công'
    },
    { 
      status: 'canceled', 
      label: 'Đã hủy', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-800',
      dotColor: 'bg-red-500',
      borderColor: 'border-red-300',
      description: 'Đơn hàng đã bị hủy'
    }
  ];

  const getStepState = (stepStatus: string, index: number) => {
    if (currentStatus === 'canceled') {
      return stepStatus === 'canceled' ? 'active' : 'inactive';
    }
    
    const currentIndex = trackingSteps.findIndex(step => step.status === currentStatus);
    if (index <= currentIndex) {
      return stepStatus === currentStatus ? 'active' : 'completed';
    }
    return 'inactive';
  };

  const visibleSteps = currentStatus === 'canceled' 
    ? [trackingSteps[4]] 
    : trackingSteps.slice(0, 4);

  const getCurrentStep = () => {
    return trackingSteps.find(step => step.status === currentStatus) || trackingSteps[0];
  };

  const currentStep = getCurrentStep();

  return (
    <div className="bg-white rounded-lg border shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${currentStep.bgColor} ${currentStep.borderColor} border`}>
              <div className={`w-3 h-3 rounded-full ${currentStep.dotColor} ${currentStatus === currentStep.status ? 'animate-pulse' : ''}`}></div>
              <span className={`text-sm font-medium ${currentStep.textColor}`}>
                {currentStep.label}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Đơn hàng #{order.maDonHang}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(order.ngayDat)} • {order.tenNguoiNhan || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Tổng tiền</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(order.thongTinDonHang?.thanhTienCuoiCung || 0)}
              </div>
            </div>

            <Button variant="ghost" size="sm" className="p-2">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 bg-gray-50 border-t">
          <div className="relative py-6">
            <h4 className="text-md font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="mr-2 h-5 w-5 text-blue-500" />
              Trạng thái vận chuyển
            </h4>
            
            <div className="relative">
              <div className="absolute top-6 left-12 right-12 h-1 bg-gray-200 rounded-full"></div>
              
              <div 
                className="absolute top-6 left-12 h-1 bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
                style={{ 
                  width: `${Math.max(0, Math.min(100, ((trackingSteps.findIndex(step => step.status === currentStatus) + 1) / visibleSteps.length) * 100))}%`,
                  right: `${100 - Math.max(0, Math.min(100, ((trackingSteps.findIndex(step => step.status === currentStatus) + 1) / visibleSteps.length) * 100))}%`
                }}
              ></div>
              
              <div className="flex items-start justify-between relative">
                {visibleSteps.map((step, index) => {
                  const stepState = getStepState(step.status, index);
                  const isActive = stepState === 'active';
                  const isCompleted = stepState === 'completed';
                  const isInactive = stepState === 'inactive';

                  return (
                    <div key={step.status} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                        isActive ? `${step.bgColor} ${step.borderColor} shadow-lg` :
                        isCompleted ? 'bg-blue-500 border-blue-500 shadow-md' :
                        'bg-white border-gray-300 shadow-sm'
                      }`}>
                        {isActive && (
                          <div className={`w-4 h-4 rounded-full ${step.dotColor} animate-pulse`}></div>
                        )}
                        {isCompleted && (
                          <CheckCircle className="w-6 h-6 text-white" />
                        )}
                        {isInactive && (
                          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                        )}
                      </div>

                      <div className="mt-3 text-center max-w-20">
                        <div className={`text-xs font-medium ${
                          isActive ? step.textColor :
                          isCompleted ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </div>
                        
                        {isActive && (
                          <div className="mt-2 text-xs text-gray-600 leading-tight">
                            {step.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-3">Thông tin đơn hàng</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-gray-600">Người nhận:</span>
                  <div className="font-medium">{order.tenNguoiNhan || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <span className="text-gray-600">Thanh toán:</span>
                  <div className="font-medium">{order.hinhThucThanhToan || 'COD'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor()}`}></div>
                <div>
                  <span className="text-gray-600">Trạng thái:</span>
                  <div className={`font-medium ${getPaymentStatusTextColor()}`}>
                    {getPaymentStatusDisplay()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderHistory = () => {
  const navigate = useNavigate();
  
  // States
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [allOrdersSearch, setAllOrdersSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ 
    message: string; 
    type: "success" | "error"; 
    duration?: number 
  } | null>(null);
  const [commentedProducts, setCommentedProducts] = useState<Set<number>>(new Set());

  const [allOrdersPagination, setAllOrdersPagination] = useState<PaginationInfo>({
    currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  });
  const [pendingPagination, setPendingPagination] = useState<PaginationInfo>({
    currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  });
  const [processingPagination, setProcessingPagination] = useState<PaginationInfo>({
    currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  });
  const [shippingPagination, setShippingPagination] = useState<PaginationInfo>({
    currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  });
  const [completedPagination, setCompletedPagination] = useState<PaginationInfo>({
    currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  });
  const [canceledPagination, setCanceledPagination] = useState<PaginationInfo>({
    currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  });

  const [allOrdersData, setAllOrdersData] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [processingOrders, setProcessingOrders] = useState<Order[]>([]);
  const [shippingOrders, setShippingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [canceledOrders, setCanceledOrders] = useState<Order[]>([]);
  const [trackingOrders, setTrackingOrders] = useState<Order[]>([]);

  const searchTrackingOrders = async (query: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotification({ message: "Vui lòng đăng nhập để tra cứu đơn hàng!", type: "error" });
        navigate("/login");
        return;
      }

      if (!query.trim()) {
        setTrackingOrders(allOrdersData);
        return;
      }

      const response = await axios.get('http://localhost:5261/api/user/orders/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: query },
      });

      const rawOrders = response.data;
      if (!Array.isArray(rawOrders)) {
        setTrackingOrders([]);
        return;
      }

      setTrackingOrders(rawOrders);

    } catch (error: any) {
      console.error("Error searching tracking orders:", error);
      if (error.response?.status === 401) {
        setNotification({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!", type: "error" });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setNotification({ message: error.response?.data?.message || "Đã xảy ra lỗi khi tra cứu đơn hàng!", type: "error" });
        setTrackingOrders([]);
      }
    }
  };

  // Helper functions
  const updateTabData = (status: string, data: Order[], pagination: PaginationInfo) => {
    const setters = {
      'all': [setAllOrdersData, setAllOrdersPagination],
      'pending': [setPendingOrders, setPendingPagination],
      'processing': [setProcessingOrders, setProcessingPagination],
      'shipping': [setShippingOrders, setShippingPagination],
      'completed': [setCompletedOrders, setCompletedPagination],
      'canceled': [setCanceledOrders, setCanceledPagination]
    };
    
    const [setData, setPagination] = setters[status as keyof typeof setters] || [];
    if (setData && setPagination) {
      (setData as React.Dispatch<React.SetStateAction<Order[]>>)(data);
      (setPagination as React.Dispatch<React.SetStateAction<PaginationInfo>>)(pagination);
    }
  };

  const getCurrentPagination = (status: string): PaginationInfo => {
    const paginationMap = {
      'all': allOrdersPagination,
      'pending': pendingPagination,
      'processing': processingPagination,
      'shipping': shippingPagination,
      'completed': completedPagination,
      'canceled': canceledPagination
    };
    return paginationMap[status as keyof typeof paginationMap] || allOrdersPagination;
  };

  const getTabOrders = (status: string): Order[] => {
    const ordersMap = {
      'all': allOrdersData,
      'pending': pendingOrders,
      'processing': processingOrders,
      'shipping': shippingOrders,
      'completed': completedOrders,
      'canceled': canceledOrders
    };
    return ordersMap[status as keyof typeof ordersMap] || allOrdersData;
  };

  const getOrderCountByStatus = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length;
    return orders.filter(order => mapStatus(order.trangThaiDonHang) === status).length;
  };

  // API Functions
  const fetchOrdersByStatus = async (status: string, page: number = 1) => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      if (!maNguoiDung) {
        setNotification({ message: "Vui lòng đăng nhập để xem lịch sử đơn hàng!", type: "error" });
        navigate("/login");
        return;
      }

      const response = await axios.get(`http://localhost:5261/api/user/orders/${maNguoiDung}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const allOrders = response.data;
      if (!Array.isArray(allOrders)) {
        setNotification({ message: "Dữ liệu đơn hàng không hợp lệ!", type: "error" });
        return;
      }

      let filteredData = allOrders;
      if (status !== 'all') {
        filteredData = allOrders.filter(order => mapStatus(order.trangThaiDonHang) === status);
      }

      const pageSize = 10;
      const totalRecords = filteredData.length;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      const mockPagination: PaginationInfo = {
        currentPage: page,
        pageSize: pageSize,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };

      updateTabData(status, paginatedData, mockPagination);

    } catch (error: any) {
      console.error("Error fetching orders by status:", error);
      setNotification({ 
        message: error.response?.data?.message || "Đã xảy ra lỗi khi tải đơn hàng!", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (newStatus: string) => {
    setFilterStatus(newStatus);
    
    if (newStatus === "all") {
      await fetchOrdersByStatus("all", 1);
    } else {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      if (!maNguoiDung) {
        setNotification({ message: "Vui lòng đăng nhập để xem lịch sử đơn hàng!", type: "error" });
        navigate("/login");
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`http://localhost:5261/api/user/orders/${maNguoiDung}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const allOrders = response.data;
        if (!Array.isArray(allOrders)) {
          setNotification({ message: "Dữ liệu đơn hàng không hợp lệ!", type: "error" });
          return;
        }

        const filteredOrders = allOrders.filter(order => mapStatus(order.trangThaiDonHang) === newStatus);
        
        const pageSize = 10;
        const totalRecords = filteredOrders.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        const paginatedData = filteredOrders.slice(0, pageSize);

        const filterPagination: PaginationInfo = {
          currentPage: 1,
          pageSize: pageSize,
          totalRecords: totalRecords,
          totalPages: totalPages,
          hasNextPage: totalPages > 1,
          hasPreviousPage: false
        };

        updateTabData("all", paginatedData, filterPagination);
        setOrders(allOrders);

      } catch (error: any) {
        console.error("Error filtering orders:", error);
        setNotification({ 
          message: error.response?.data?.message || "Đã xảy ra lỗi khi lọc đơn hàng!", 
          type: "error" 
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchOrdersByUserId = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      if (!maNguoiDung) {
        setNotification({ message: "Vui lòng đăng nhập để xem lịch sử đơn hàng!", type: "error" });
        navigate("/login");
        return;
      }

      const response = await axios.get(`http://localhost:5261/api/user/orders/${maNguoiDung}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const rawOrders = response.data;
      
      if (!Array.isArray(rawOrders)) {
        setNotification({ message: "Dữ liệu đơn hàng không hợp lệ!", type: "error" });
        setOrders([]);
        return;
      }

      setOrders(rawOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setNotification({ message: error.response?.data?.message || "Đã xảy ra lỗi khi tải lịch sử đơn hàng!", type: "error" });
      setOrders([]);
    }
  };

  const fetchCommentedProducts = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      if (!maNguoiDung) {
        setNotification({ message: "Vui lòng đăng nhập để kiểm tra bình luận!", type: "error" });
        navigate("/login");
        return;
      }

      const likedCommentsKey = `likedComments_${maNguoiDung}`;
      const storedCommentedProducts = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as number[];
      setCommentedProducts(new Set(storedCommentedProducts));

      const response = await axios.get("http://localhost:5261/api/Comment/list", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const comments = response.data || [];
      const userComments = Array.isArray(comments) 
        ? comments.filter((comment: any) => comment.maNguoiDung === parseInt(maNguoiDung))
        : [];
      const apiCommentedProductIds = new Set(userComments.map((comment: any) => parseInt(comment.maSanPham)));

      const mergedCommentedProductIds = new Set([...apiCommentedProductIds, ...storedCommentedProducts]);
      setCommentedProducts(mergedCommentedProductIds);
      localStorage.setItem(likedCommentsKey, JSON.stringify([...mergedCommentedProductIds]));
    } catch (error) {
      console.error("Error fetching commented products:", error);
      setNotification({ message: "Đã xảy ra lỗi khi kiểm tra bình luận!", type: "error" });
    }
  };

  const searchOrders = async (query: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotification({ message: "Vui lòng đăng nhập để tra cứu đơn hàng!", type: "error" });
        navigate("/login");
        return;
      }

      if (!query.trim()) {
        await fetchOrdersByUserId();
        await fetchOrdersByStatus("all", 1);
        return;
      }

      const response = await axios.get('http://localhost:5261/api/user/orders/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: query },
      });

      const rawOrders = response.data;
      if (!Array.isArray(rawOrders)) {
        setOrders([]);
        updateTabData("all", [], { currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
        return;
      }

      setOrders(rawOrders);
      
      const pageSize = 10;
      const totalRecords = rawOrders.length;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const paginatedResults = rawOrders.slice(0, pageSize);

      const searchPagination: PaginationInfo = {
        currentPage: 1,
        pageSize: pageSize,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNextPage: totalPages > 1,
        hasPreviousPage: false
      };

      updateTabData("all", paginatedResults, searchPagination);

    } catch (error: any) {
      console.error("Error searching orders:", error);
      if (error.response?.status === 401) {
        setNotification({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!", type: "error" });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setNotification({ message: error.response?.data?.message || "Đã xảy ra lỗi khi tra cứu đơn hàng!", type: "error" });
        setOrders([]);
        updateTabData("all", [], { currentPage: 1, pageSize: 10, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
      }
    }
  };

  const handleAddComment = async (orderId: string, productId: number, content: string, rating: number) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      const token = localStorage.getItem("token");

      if (!maNguoiDung || !token) {
        setNotification({ message: "Vui lòng đăng nhập để thêm bình luận!", type: "error" });
        navigate("/login");
        return false;
      }

      if (!content.trim() || rating < 1 || rating > 5) {
        setNotification({ message: "Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!", type: "error" });
        return false;
      }

      const commentData = {
        maSanPham: productId.toString(),
        maNguoiDung: maNguoiDung,
        noiDungBinhLuan: content,
        danhGia: rating,
        ngayBinhLuan: new Date().toISOString(),
        trangThai: 0,
        soTimBinhLuan: 0,
        maDonHang: orderId
      };

      const response = await axios.post("http://localhost:5261/api/Comment/add", commentData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setCommentedProducts((prev) => {
          const newSet = new Set(prev);
          newSet.add(productId);
          const likedCommentsKey = `likedComments_${maNguoiDung}`;
          localStorage.setItem(likedCommentsKey, JSON.stringify([...newSet]));
          return newSet;
        });
        setNotification({ message: "Bình luận của bạn đã được ghi lại và đang chờ duyệt!", type: "success" });
        await fetchCommentedProducts();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      let errorMessage = "Có lỗi xảy ra khi thêm bình luận!";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!";
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setNotification({ message: errorMessage, type: "error" });
      return false;
    }
  };

  const handleCancelClick = (orderId: string) => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    
    if (!userData?.maNguoiDung || !token) {
      setNotification({ message: "Vui lòng đăng nhập để hủy đơn hàng!", type: "error" });
      navigate("/login");
      return;
    }

    const order = orders.find(o => o.maDonHang.toString() === orderId);
    if (!order) {
      setNotification({ message: "Đơn hàng không tồn tại!", type: "error" });
      return;
    }

    const orderStatus = mapStatus(order.trangThaiDonHang);
    if (orderStatus !== "pending" && orderStatus !== "processing") {
      setNotification({ message: "Chỉ có thể hủy đơn hàng khi chưa xác nhận hoặc đang xử lý!", type: "error" });
      return;
    }

    setCancelOrderId(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setNotification({ message: "Vui lòng nhập lý do hủy!", type: "error" });
      return;
    }
    if (cancelOrderId === null) return;

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      const token = localStorage.getItem("token");
      
      if (!maNguoiDung || !token) {
        setNotification({ message: "Vui lòng đăng nhập để hủy đơn hàng!", type: "error" });
        navigate("/login");
        return;
      }

      const orderIdNumber = parseInt(cancelOrderId);
      if (isNaN(orderIdNumber)) {
        setNotification({ message: "Mã đơn hàng không hợp lệ!", type: "error" });
        return;
      }

      const cancelRequest: CancelOrderRequest = {
        lyDoHuy: cancelReason.trim()
      };

      const response = await axios.put<CancelOrderResponse>(
        `http://localhost:5261/api/user/orders/cancel/${orderIdNumber}`,
        cancelRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);

      if (response.data.isAccountLocked) {
        const lockMessage = response.data.lockoutMessage || 
          "Tài khoản của bạn đã bị khóa do hủy đơn hàng quá 3 lần trong vòng 30 ngày. Tài khoản sẽ được mở khóa sau 3 ngày.";
        
        setNotification({ message: lockMessage, type: "error" });
        
        setTimeout(() => {
          setNotification({ 
            message: "Bạn sẽ được đăng xuất khỏi hệ thống. Vui lòng đợi 3 ngày để đăng nhập lại.", 
            type: "error" 
          });
        }, 3000);
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (maNguoiDung) {
          localStorage.removeItem(`likedComments_${maNguoiDung}`);
        }
        
        setTimeout(() => {
          navigate("/login");
        }, 6000);
      } else {
        setNotification({ 
          message: response.data.message || "Đơn hàng đã được hủy thành công!", 
          type: "success" 
        });
        
        await fetchOrdersByUserId();
      }

    } catch (error: any) {
      console.error("Error canceling order:", error);
      
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
      
      let errorMessage = "Đã xảy ra lỗi khi hủy đơn hàng!";
      
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!";
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setNotification({ message: errorMessage, type: "error" });
    }
  };

  const handleTabPageChange = (status: string, newPage: number) => {
    const currentPagination = getCurrentPagination(status);
    if (newPage >= 1 && newPage <= currentPagination.totalPages) {
      fetchOrdersByStatus(status, newPage);
    }
  };

  // Pagination Component
  const TabPaginationComponent = ({ status }: { status: string }) => {
    const pagination = getCurrentPagination(status);
    
    if (pagination.totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5;
      let startPage = Math.max(1, pagination.currentPage - 2);
      let endPage = Math.min(pagination.totalPages, startPage + showPages - 1);
      
      if (endPage - startPage < showPages - 1) {
        startPage = Math.max(1, endPage - showPages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Hiển thị {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} của {pagination.totalRecords} đơn hàng
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTabPageChange(status, pagination.currentPage - 1)}
            disabled={!pagination.hasPreviousPage || isLoading}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Trước</span>
          </Button>

          <div className="flex space-x-1">
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={page === pagination.currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabPageChange(status, page)}
                disabled={isLoading}
                className={`w-10 h-10 ${page === pagination.currentPage ? 'bg-blue-600 text-white' : ''}`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTabPageChange(status, pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            className="flex items-center space-x-1"
          >
            <span>Sau</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Effects
  useEffect(() => {
    const loadAllTabsData = async () => {
      await Promise.all([
        fetchOrdersByStatus('all', 1),
        fetchOrdersByStatus('pending', 1),
        fetchOrdersByStatus('processing', 1),
        fetchOrdersByStatus('shipping', 1),
        fetchOrdersByStatus('completed', 1),
        fetchOrdersByStatus('canceled', 1)
      ]);
    };

    fetchOrdersByUserId();
    fetchCommentedProducts();
    loadAllTabsData();
  }, [navigate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (allOrdersSearch.trim()) {
        searchOrders(allOrdersSearch);
      } else {
        setFilterStatus("all");
        fetchOrdersByUserId().then(() => {
          fetchOrdersByStatus("all", 1);
        });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [allOrdersSearch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchTrackingOrders(trackingSearch);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [trackingSearch]);

  useEffect(() => {
    if (!trackingSearch.trim()) {
      setTrackingOrders(allOrdersData);
    }
  }, [allOrdersData, trackingSearch]);

  // Render functions
  const renderEmptyState = (status: string, icon: any, title: string, description: string) => (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      {icon}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
      {status === 'all' && (!searchQuery && !allOrdersSearch) && (
        <Button onClick={() => navigate("/products")} className="mt-4">
          Khám phá sản phẩm
        </Button>
      )}
    </div>
  );

  const renderTabContent = (status: string, orders: Order[], title: string) => (
    <TabsContent value={status} className="space-y-6">
      {status === 'all-orders' && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Tìm trong tất cả đơn hàng..."
                value={allOrdersSearch}
                onChange={(e) => setAllOrdersSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipping">Đang giao hàng</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="canceled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {status !== 'all-orders' && (
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      )}

      {orders.length === 0 ? (
        renderEmptyState(
          status,
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
          `Không có ${title.toLowerCase()}`,
          status === 'all-orders' && (searchQuery || allOrdersSearch) 
            ? "Không tìm thấy đơn hàng nào phù hợp với từ khóa tìm kiếm." 
            : "Không có đơn hàng nào."
        )
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderItem
                key={order.maDonHang}
                order={order}
                onCancel={handleCancelClick}
                onAddComment={handleAddComment}
                commentedProducts={commentedProducts}
              />
            ))}
          </div>
          <TabPaginationComponent status={status === 'all-orders' ? 'all' : status} />
        </>
      )}
    </TabsContent>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <NotificationComponent notification={notification} onClose={() => setNotification(null)} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử đơn hàng</h1>
        <p className="text-gray-600">Theo dõi và quản lý các đơn hàng của bạn</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      )}

      <Tabs defaultValue="all-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
          {[
            { value: "all-orders", icon: ClipboardList, label: "Tất cả", status: "all" },
            { value: "pending", icon: ClipboardList, label: "Chờ xác nhận", status: "pending" },
            { value: "processing", icon: Package, label: "Đang xử lý", status: "processing" },
            { value: "shipping", icon: Truck, label: "Đang giao", status: "shipping" },
            { value: "completed", icon: CheckCircle, label: "Hoàn thành", status: "completed" },
            { value: "tracking", icon: Package, label: "Theo dõi", status: "tracking" }
          ].map(({ value, icon: Icon, label, status }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              {status !== "tracking" && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  status === "all" ? "bg-gray-200 text-gray-700" :
                  status === "processing" ? "bg-yellow-200 text-yellow-700" :
                  status === "shipping" ? "bg-blue-200 text-blue-700" :
                  status === "completed" ? "bg-green-200 text-green-700" :
                  "bg-gray-200 text-gray-700"
                }`}>
                  {getOrderCountByStatus(status as OrderStatus | "all")}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {renderTabContent("all-orders", allOrdersData, "Tất cả đơn hàng")}
        {renderTabContent("pending", pendingOrders, "Đơn hàng chờ xác nhận")}
        {renderTabContent("processing", processingOrders, "Đơn hàng đang xử lý")}
        {renderTabContent("shipping", shippingOrders, "Đơn hàng đang giao")}
        {renderTabContent("completed", completedOrders, "Đơn hàng đã hoàn thành")}

        <TabsContent value="tracking" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Theo dõi đơn hàng</h2>
              <p className="text-gray-600">Xem chi tiết tiến trình các đơn hàng của bạn</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm đơn hàng theo dõi..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64"
              />
            </div>
          </div>
          
          {trackingOrders.length === 0 ? (
            renderEmptyState(
              "tracking",
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />,
              trackingSearch.trim() ? "Không tìm thấy đơn hàng" : "Không có đơn hàng để theo dõi",
              trackingSearch.trim() 
                ? "Không tìm thấy đơn hàng nào phù hợp với từ khóa tìm kiếm." 
                : "Bạn chưa có đơn hàng nào để theo dõi."
            )
          ) : (
            <>
              <div className="space-y-6">
                {trackingOrders.map((order) => (
                  <OrderTrackingTimeline key={order.maDonHang} order={order} />
                ))}
              </div>
              {!trackingSearch.trim() && <TabPaginationComponent status="all" />}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng #{cancelOrderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy đơn hàng <span className="text-red-500">*</span>
              </label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {cancelReasonsSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelReason(suggestion)}
                    className={cn(
                      "text-xs",
                      cancelReason === suggestion && "bg-primary text-primary-foreground"
                    )}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                className="w-full"
                rows={3}
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Đơn hàng chỉ có thể hủy khi chưa được giao hàng</li>
                      <li>Sau khi hủy, bạn sẽ không thể khôi phục đơn hàng</li>
                      <li>Việc hủy đơn hàng quá nhiều có thể ảnh hưởng đến tài khoản</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
                setCancelOrderId(null);
              }}
            >
              Không hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
            >
              Xác nhận hủy đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;