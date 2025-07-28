import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Package, Truck, CheckCircle, ChevronDown, ChevronUp, Star, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Swal from 'sweetalert2';

// Interface for API Responses
interface CancelOrderResponse {
  message: string;
  isAccountLocked: boolean;
  lockoutMessage?: string;
  remainingCancellations?: number;
}
interface CancelOrderRequest {
  lyDoHuy: string;
}

const orderStatuses = {
  pending: { color: "bg-yellow-500", icon: ClipboardList, label: "Chờ xác nhận" },
  processing: { color: "bg-blue-500", icon: Package, label: "Đang xử lý" },
  shipping: { color: "bg-purple-500", icon: Truck, label: "Đang giao hàng" },
  completed: { color: "bg-green-500", icon: CheckCircle, label: "Đã hoàn thành" },
  paid: { color: "bg-green-500", icon: CreditCard, label: "Đã thanh toán" },
  canceled: { color: "bg-red-500", icon: CheckCircle, label: "Đã hủy" },
} as const;

type OrderStatus = keyof typeof orderStatuses;

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

type ThongTinNguoiDung = {
  tenNguoiNhan: string;
  diaChi: string;
  sdt: string;
  tenNguoiDat: string;
};

type ThongTinDonHang = {
  ngayDat: string;
  trangThai: number;
  thanhToan: number;
  hinhThucThanhToan: string;
  soTienGiam: number;
  phiGiaoHang: number;
  thanhTienCuoiCung: number;
  tongTien: number;
};

type Order = {
  maDonHang: number;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  lyDoHuy: string | null;
  tongTien: number;
  finalAmount: number;
  sanPhams: Product[];
  thongTinNguoiDung: ThongTinNguoiDung;
  thongTinDonHang: ThongTinDonHang;
};

interface CommentState {
  productId: number;
  content: string;
  rating: number;
}

interface Comment {
  maBinhLuan: number;
  maSanPham: string;
  maNguoiDung: number;
  noiDungBinhLuan: string;
  soTimBinhLuan: number;
  danhGia: number;
  trangThai: number;
  ngayBinhLuan: string;
  maDonHang: string; // Added to match backend API
}

interface OrderItemProps {
  order: Order;
  onCancel: (orderId: string) => void;
  onAddComment: (orderId: string, productId: number, content: string, rating: number) => Promise<boolean>;
  commentedProducts: Set<string>;
  canComment: boolean;
  timeUntilNextComment: number;
  formatTimeRemaining: (seconds: number) => string;
}

const OrderItem = ({
  order,
  onCancel,
  onAddComment,
  commentedProducts,
  canComment,
  timeUntilNextComment,
  formatTimeRemaining,
}: OrderItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentStates, setCommentStates] = useState<{ [key: string]: CommentState }>({});
  const [isCommenting, setIsCommenting] = useState<{ [key: string]: boolean }>({});
  const statusInfo = orderStatuses[mapStatus(order.trangThaiDonHang)] || orderStatuses.pending;
  const StatusIcon = statusInfo.icon;

  // Calculate total item cost and shipping fee
  const totalItemCost = (order.sanPhams || []).reduce(
    (sum, item) => sum + (item.soLuong || 0) * (item.gia || 0),
    0
  );
  const shippingFee = Math.max(0, (order.finalAmount || 0) - totalItemCost);

  const handleCommentChange = (commentKey: string, field: keyof CommentState, value: string | number) => {
    setCommentStates((prev) => ({
      ...prev,
      [commentKey]: {
        ...prev[commentKey] || { productId: parseInt(commentKey.split('-')[1]), content: "", rating: 0 },
        [field]: value,
      },
    }));
  };

  const handleAddComment = async (commentKey: string) => {
    const comment = commentStates[commentKey];
    if (!comment || !comment.content || comment.rating < 1 || comment.rating > 5) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!',
      });
      return;
    }

    setIsCommenting((prev) => ({ ...prev, [commentKey]: true }));
    const productId = parseInt(commentKey.split('-')[1]);
    const success = await onAddComment(order.maDonHang.toString(), productId, comment.content, comment.rating);
    if (success) {
      setCommentStates((prev) => ({
        ...prev,
        [commentKey]: { productId, content: "", rating: 0 },
      }));
    }
    setIsCommenting((prev) => ({ ...prev, [commentKey]: false }));
  };

  return (
    <div className="border rounded-lg overflow-hidden mb-4 transition-all duration-200 hover:shadow-md">
      <div className="p-4 bg-gray-50 overflow-x-auto">
        <div className="grid grid-cols-12 gap-4 items-center min-w-[700px]">
          <div className="col-span-12 sm:col-span-5 flex flex-col gap-1">
            <span className="font-medium text-gray-800">Mã đơn hàng: {order.maDonHang || "N/A"}</span>
            <span className="text-sm text-gray-500">Người nhận: {order.tenNguoiNhan || "N/A"}</span>
            <span className="text-sm text-gray-500">
              Ngày đặt: {order.ngayDat
                ? (() => {
                    const parts = order.ngayDat.split('/');
                    if (parts.length === 3) {
                      // dd/MM/yyyy -> yyyy-MM-dd
                      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      const d = new Date(iso);
                      return !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : order.ngayDat;
                    }
                    return order.ngayDat;
                  })()
                : "N/A"}
            </span>
            <span className="text-sm text-gray-500">SĐT: {order.thongTinNguoiDung?.sdt || "N/A"}</span>
            <span className="text-sm text-gray-500">Phương thức thanh toán: {order.hinhThucThanhToan || "N/A"}</span>
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
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalAmount || 0)}
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
          {/* Product List */}
          <div className="space-y-4 mb-6">
            {(order.sanPhams || []).map((item) => {
              const productId = item.laCombo ? item.maCombo! : parseInt(item.maSanPham!);
              const commentKey = `${order.maDonHang}-${productId}`;
              const hasCommented = commentedProducts.has(commentKey);

              return (
                <div key={item.maChiTietDh} className="flex flex-col gap-4">
                  {/* Product Item */}
                  <a
                    href={`http://localhost:8080/${item.laCombo ? 'combo' : 'products'}/${item.laCombo ? item.maCombo : item.maSanPham?.substring(0,6)}`}
                    className="grid grid-cols-12 gap-4 items-start hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    {/* Product Image */}
                    <div className="col-span-12 sm:col-span-2">
                      <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={item.hinhAnh || "https://via.placeholder.com/150"}
                          alt={item.laCombo ? 'Combo Preview' : 'Product Preview'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="col-span-12 sm:col-span-7">
                      <div className="font-medium text-gray-800 mb-2">
                        {item.laCombo ? item.combo?.tenCombo : item.tenSanPham || 'N/A'}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium">Số lượng:</span>
                          <span className="ml-2">{item.soLuong || 0} x {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.gia || 0)}</span>
                        </div>
                        
                        {/* Color and Size for regular products */}
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
                        
                        {/* Combo products details */}
                        {item.laCombo && item.combo?.sanPhamsTrongCombo && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-700 mb-2">Sản phẩm trong combo:</div>
                            <div className="space-y-2">
                              {item.combo.sanPhamsTrongCombo.map((comboProduct, index) => (
                                <div key={index} className="flex items-center justify-between text-xs text-gray-600 bg-white p-2 rounded">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span className="font-medium">{comboProduct.tenSanPham}</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    {comboProduct.mauSac && (
                                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {comboProduct.mauSac}
                                      </span>
                                    )}
                                    {comboProduct.kichThuoc && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {comboProduct.kichThuoc}
                                      </span>
                                    )}
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                      x{comboProduct.soLuong}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Price */}
                    <div className="col-span-12 sm:col-span-3 text-right">
                      <div className="font-medium text-lg text-gray-800">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.thanhTien || 0)}
                      </div>
                    </div>
                  </a>

                  {/* Comment Section for completed orders */}
                  {mapStatus(order.trangThaiDonHang) === "completed" && !hasCommented && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg ml-4">
                      <h3 className="text-lg font-medium mb-4 text-blue-800">
                        Viết bình luận cho {item.laCombo ? item.combo?.tenCombo : item.tenSanPham}
                      </h3>
                      {!canComment && (
                        <p className="text-red-600 text-sm mb-4">
                          Bạn phải đợi {formatTimeRemaining(timeUntilNextComment)} trước khi có thể bình luận lại.
                        </p>
                      )}
                      <div className="flex items-center mb-4">
                        <span className="mr-2 text-sm font-medium">Đánh giá:</span>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "w-6 h-6 cursor-pointer transition-colors",
                              index < (commentStates[commentKey]?.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 hover:text-yellow-200",
                              !canComment && "cursor-not-allowed opacity-50"
                            )}
                            onClick={() => canComment && handleCommentChange(commentKey, "rating", index + 1)}
                          />
                        ))}
                      </div>
                      <Textarea
                        value={commentStates[commentKey]?.content || ""}
                        onChange={(e) => canComment && handleCommentChange(commentKey, "content", e.target.value)}
                        placeholder="Nhập bình luận của bạn..."
                        className="w-full mb-4"
                        rows={4}
                        disabled={isCommenting[commentKey] || !canComment}
                      />
                      <Button
                        onClick={() => handleAddComment(commentKey)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isCommenting[commentKey] || !canComment}
                      >
                        {isCommenting[commentKey] ? "Đang gửi..." : "Gửi Bình Luận"}
                      </Button>
                    </div>
                  )}

                  {/* Already commented message */}
                  {mapStatus(order.trangThaiDonHang) === "completed" && hasCommented && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg ml-4">
                      <p className="text-green-700 text-sm font-medium">✓ Bạn đã bình luận cho sản phẩm này trong đơn hàng này.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.thongTinDonHang?.tongTien || 0)}
                  </span>
                </div>

                {/* Discount */}
                {order.thongTinDonHang?.soTienGiam > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium text-red-600">
                      -{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.thongTinDonHang.soTienGiam)}
                    </span>
                  </div>
                )}

                {/* Shipping Fee */}
                {order.thongTinDonHang?.phiGiaoHang > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí giao hàng:</span>
                    <span className="font-medium text-green-600">
                      +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.thongTinDonHang.phiGiaoHang)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-800">Tổng thanh toán:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.thongTinDonHang?.thanhTienCuoiCung || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
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

const mapStatus = (status: number): OrderStatus => {
  switch (status) {
    case 0: return "pending";
    case 1: return "processing";
    case 2: return "shipping";
    case 3: return "completed";
    case 4: return "paid";
    case 5: return "canceled";
    default: return "pending";
  }
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentedProducts, setCommentedProducts] = useState<Set<string>>(new Set());
  const [canComment, setCanComment] = useState(true);
  const [timeUntilNextComment, setTimeUntilNextComment] = useState(0);

  const cancelReasonsSuggestions = [
    "Không muốn mua nữa",
    "Hết hàng",
    "Sai thông tin đơn hàng",
    "Khác"
  ];

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} phút`;
  };

  const checkCommentAvailability = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const maNguoiDung = userData?.maNguoiDung;
    if (!maNguoiDung) return;

    const lastCommentTime = localStorage.getItem(`lastCommentTime_${maNguoiDung}`);
    if (lastCommentTime) {
      const lastTime = parseInt(lastCommentTime);
      const currentTime = Date.now();
      const secondsSinceLastComment = (currentTime - lastTime) / 1000;
      const cooldownSeconds = 3600; // 1 hour
      if (secondsSinceLastComment < cooldownSeconds) {
        setCanComment(false);
        setTimeUntilNextComment(cooldownSeconds - secondsSinceLastComment);
      } else {
        setCanComment(true);
        setTimeUntilNextComment(0);
      }
    } else {
      setCanComment(true);
      setTimeUntilNextComment(0);
    }
  };

  useEffect(() => {
    checkCommentAvailability();
    const interval = setInterval(checkCommentAvailability, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchOrdersByUserId = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      if (!maNguoiDung) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng đăng nhập để xem lịch sử đơn hàng!',
          confirmButtonText: 'Đăng nhập',
        }).then(() => navigate("/login"));
        return;
      }

      const response = await axios.get(`http://localhost:5261/api/user/orders/${maNguoiDung}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const rawOrders = response.data;
      
      if (!Array.isArray(rawOrders)) {
        console.error("API did not return an array:", rawOrders);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Dữ liệu đơn hàng không hợp lệ!',
        });
        setOrders([]);
        return;
      }

      setOrders(rawOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.message || "Đã xảy ra lỗi khi tải lịch sử đơn hàng!",
      });
      setOrders([]);
    }
  };

  const fetchCommentedProducts = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      if (!maNguoiDung) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng đăng nhập để kiểm tra bình luận!',
        }).then(() => navigate("/login"));
        return;
      }

      const likedCommentsKey = `likedComments_${maNguoiDung}`;
      const storedCommentedProducts = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as string[];
      setCommentedProducts(new Set(storedCommentedProducts));

      const response = await axios.get<Comment[]>("http://localhost:5261/api/Comment/list", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const comments = response.data || [];
      const userComments = comments.filter((comment) => comment.maNguoiDung === parseInt(maNguoiDung));
      const apiCommentedProductKeys = new Set(
        userComments.map((comment) => `${comment.maDonHang}-${comment.maSanPham}`)
      );

      const mergedCommentedProductKeys = new Set([...apiCommentedProductKeys, ...storedCommentedProducts]);
      setCommentedProducts(mergedCommentedProductKeys);
      localStorage.setItem(likedCommentsKey, JSON.stringify([...mergedCommentedProductKeys]));
    } catch (error) {
      console.error("Error fetching commented products:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Đã xảy ra lỗi khi kiểm tra bình luận!',
      });
    }
  };

  const handleAddComment = async (orderId: string, productId: number, content: string, rating: number) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      const token = localStorage.getItem("token");

      if (!maNguoiDung) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng đăng nhập để thêm bình luận!',
        }).then(() => navigate("/login"));
        return false;
      }

      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Token xác thực không tồn tại. Vui lòng đăng nhập lại!',
        }).then(() => navigate("/login"));
        return false;
      }

      if (!content.trim() || rating < 1 || rating > 5) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!',
        });
        return false;
      }

      if (!canComment) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: `Bạn phải đợi ${formatTimeRemaining(timeUntilNextComment)} trước khi có thể bình luận lại.`,
        });
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
          newSet.add(`${orderId}-${productId}`);
          const likedCommentsKey = `likedComments_${maNguoiDung}`;
          localStorage.setItem(likedCommentsKey, JSON.stringify([...newSet]));
          localStorage.setItem(`lastCommentTime_${maNguoiDung}`, Date.now().toString());
          return newSet;
        });
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Bình luận của bạn đã được ghi lại và đang chờ duyệt!',
          timer: 3000,
          showConfirmButton: false,
        });
        await fetchCommentedProducts();
        checkCommentAvailability();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      let errorMessage = "Có lỗi xảy ra khi thêm bình luận!";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!";
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: errorMessage,
          }).then(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
          });
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Lỗi server: ${error.response.status} - ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng!";
      } else {
        errorMessage = `Lỗi: ${error.message}`;
      }
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage,
      });
      return false;
    }
  };

  const searchOrders = async (query: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng đăng nhập để tra cứu đơn hàng!',
          confirmButtonText: 'Đăng nhập',
        }).then(() => navigate("/login"));
        return;
      }

      if (!query.trim()) {
        await fetchOrdersByUserId();
        return;
      }

      const response = await axios.get('http://localhost:5261/api/user/orders/search', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query,
        },
      });

      const rawOrders = response.data;
      if (!Array.isArray(rawOrders)) {
        console.error("API did not return an array:", rawOrders);
        setOrders([]);
        return;
      }

      setOrders(rawOrders);
    } catch (error: any) {
      console.error("Error searching orders:", error);
      if (error.response?.status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
        }).then(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || "Đã xảy ra lỗi khi tra cứu đơn hàng!",
        });
        setOrders([]);
      }
    }
  };

  useEffect(() => {
    fetchOrdersByUserId();
    fetchCommentedProducts();
  }, [navigate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchOrders(searchQuery);
      } else {
        fetchOrdersByUserId();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(order => mapStatus(order.trangThaiDonHang) === filterStatus);

  const handleCancelClick = (orderId: string) => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    
    console.log("Debug cancel click:", {
      orderId,
      userData,
      hasToken: !!token
    });
    
    if (!userData?.maNguoiDung || !token) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng đăng nhập để hủy đơn hàng!',
      }).then(() => navigate("/login"));
      return;
    }

    const order = orders.find(o => o.maDonHang.toString() === orderId);
    if (!order) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Đơn hàng không tồn tại!',
      });
      return;
    }

    const orderStatus = mapStatus(order.trangThaiDonHang);
    if (orderStatus !== "pending" && orderStatus !== "processing") {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Chỉ có thể hủy đơn hàng khi chưa xác nhận hoặc đang xử lý!',
      });
      return;
    }

    setCancelOrderId(orderId);
    setCancelReason('');
    setShowCancelModal(true);
};

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng nhập lý do hủy!',
      });
      return;
    }
    if (cancelOrderId === null) return;

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      const token = localStorage.getItem("token");
      
      if (!maNguoiDung || !token) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng đăng nhập để hủy đơn hàng!',
        }).then(() => navigate("/login"));
        return;
      }

      const orderIdNumber = parseInt(cancelOrderId);
      if (isNaN(orderIdNumber)) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Mã đơn hàng không hợp lệ!',
        });
        return;
      }

      const order = orders.find(o => o.maDonHang === orderIdNumber);
      if (!order) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Đơn hàng không tồn tại!',
        });
        setShowCancelModal(false);
        return;
      }

      console.log("Canceling order:", {
        orderId: orderIdNumber,
        reason: cancelReason.trim(),
        userId: maNguoiDung
      });

      const cancelRequest: CancelOrderRequest = {
        lyDoHuy: cancelReason.trim()
      };

      console.log("Cancel request payload:", cancelRequest);

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

      console.log("Cancel response:", response.data);

      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);

      if (response.data.isAccountLocked) {
        const lockMessage = response.data.lockoutMessage || 
          "Tài khoản của bạn đã bị khóa do hủy đơn hàng quá 3 lần trong vòng 30 ngày. Tài khoản sẽ được mở khóa sau 3 ngày.";
        
        Swal.fire({
          icon: 'error',
          title: 'Tài khoản bị khóa',
          text: lockMessage,
          footer: '<p>Tài khoản sẽ được tự động mở khóa sau 3 ngày.</p>',
        }).then(() => {
          Swal.fire({
            icon: 'info',
            title: 'Đăng xuất',
            text: 'Bạn sẽ được đăng xuất khỏi hệ thống. Vui lòng đợi 3 ngày để đăng nhập lại.',
            timer: 3000,
            showConfirmButton: false,
          }).then(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (maNguoiDung) {
              localStorage.removeItem(`likedComments_${maNguoiDung}`);
              localStorage.removeItem(`lastCommentTime_${maNguoiDung}`);
            }
            navigate("/login");
          });
        });
      } else {
        let successMessage = response.data.message || "Hủy đơn hàng thành công!";
        
        if (response.data.remainingCancellations !== undefined) {
          if (response.data.remainingCancellations === 1) {
            successMessage += " ⚠️ Cảnh báo: Bạn chỉ còn 1 lần hủy đơn hàng. Nếu hủy thêm 1 lần nữa, tài khoản sẽ bị khóa trong 3 ngày.";
          } else if (response.data.remainingCancellations === 2) {
            successMessage += " ⚠️ Cảnh báo: Bạn chỉ còn 2 lần hủy đơn hàng. Hãy cẩn thận khi đặt hàng để tránh bị khóa tài khoản.";
          }
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: successMessage,
          timer: 5000,
          showConfirmButton: false,
        });
        
        await fetchOrdersByUserId();
      }

    } catch (error: any) {
      console.error("Error canceling order:", error);
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const maNguoiDung = userData?.maNguoiDung;
      
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
      
      if (error.response?.status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
        }).then(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (maNguoiDung) {
            localStorage.removeItem(`likedComments_${maNguoiDung}`);
            localStorage.removeItem(`lastCommentTime_${maNguoiDung}`);
          }
          navigate("/login");
        });
      } else if (error.response?.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Bạn không có quyền hủy đơn hàng này. Vui lòng kiểm tra lại thông tin đăng nhập.',
        });
      } else if (error.response?.status === 400) {
        if (error.response?.data?.isAccountLocked) {
          const lockMessage = error.response.data.lockoutMessage || 
            "Tài khoản của bạn đã bị khóa do hủy đơn hàng quá nhiều lần. Tài khoản sẽ được mở khóa sau 3 ngày.";
          
          Swal.fire({
            icon: 'error',
            title: 'Tài khoản bị khóa',
            text: lockMessage,
            footer: '<p>Tài khoản sẽ được tự động mở khóa sau 3 ngày.</p>',
          }).then(() => {
            Swal.fire({
              icon: 'info',
              title: 'Đăng xuất',
              text: 'Bạn sẽ được đăng xuất khỏi hệ thống. Vui lòng đợi 3 ngày để đăng nhập lại.',
              timer: 3000,
              showConfirmButton: false,
            }).then(() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              if (maNguoiDung) {
                localStorage.removeItem(`likedComments_${maNguoiDung}`);
                localStorage.removeItem(`lastCommentTime_${maNguoiDung}`);
              }
              navigate("/login");
            });
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: error.response.data.message || "Không thể hủy đơn hàng này.",
          });
        }
      } else if (error.response?.status === 404) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Đơn hàng không tồn tại hoặc không thuộc về bạn.',
        });
      } else if (error.code === 'ECONNABORTED') {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Yêu cầu hủy đơn hàng bị timeout. Vui lòng thử lại.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại.",
        });
      }
    }
  };

  const handleReasonSuggestionClick = (reason: string) => {
    setCancelReason(reason);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto my-[50px]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight gradient-text">Lịch sử đơn hàng</h1>
            <p className="mt-2 text-muted-foreground">Xem và quản lý các đơn hàng của bạn</p>
          </div>
          <div className="colorful-card p-6 rounded-lg shadow-lg">
            <Tabs defaultValue="all-orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="all-orders">
                  <ClipboardList className="mr-2 h-4 w-4" /> Tất cả đơn hàng
                </TabsTrigger>
                <TabsTrigger value="tracking">
                  <Truck className="mr-2 h-4 w-4" /> Theo dõi đơn hàng
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all-orders">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium">Đơn hàng của bạn</h2>
                  <div className="w-48">
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Trạng thái" />
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
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map(order => (
                      <OrderItem
                        key={order.maDonHang}
                        order={order}
                        onCancel={handleCancelClick}
                        onAddComment={handleAddComment}
                        commentedProducts={commentedProducts}
                        canComment={canComment}
                        timeUntilNextComment={timeUntilNextComment}
                        formatTimeRemaining={formatTimeRemaining}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Không có đơn hàng nào</h3>
                    <p className="text-muted-foreground">Bạn chưa có đơn hàng nào trong trạng thái này</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="tracking">
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-4">Tra cứu đơn hàng</h2>
                  <div className="flex gap-4">
                    <Input
                      type="text"
                      placeholder="Nhập mã đơn hàng của bạn"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map(order => (
                      <OrderItem
                        key={order.maDonHang}
                        order={order}
                        onCancel={handleCancelClick}
                        onAddComment={handleAddComment}
                        commentedProducts={commentedProducts}
                        canComment={canComment}
                        timeUntilNextComment={timeUntilNextComment}
                        formatTimeRemaining={formatTimeRemaining}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Không tìm thấy đơn hàng</h3>
                    <p className="text-muted-foreground">Vui lòng nhập mã đơn hàng để kiểm tra</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
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
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Đóng</Button>
            <Button variant="destructive" onClick={handleCancel}>Xác nhận hủy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;