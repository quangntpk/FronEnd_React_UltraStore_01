import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, Clock, Star, Copy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const APP_TITLE = import.meta.env.VITE_TITLE || "Khuyến mãi cá nhân";

// Định nghĩa interface cho Voucher và Coupon
interface Coupon {
  id: number;
  maNhap: string;
  trangThai: number;
  maNguoiDung: string;
  maVoucher: number;
}

interface Voucher {
  maVoucher: number;
  tenVoucher: string;
  giaTri: number | null;
  moTa: string | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  hinhAnh: string | null;
  dieuKien: number;
  giaTriToiDa: number;
  loaiVoucher: number;
  trangThai: number;
  coupons: Coupon[];
}

// Hàm định dạng ngày giờ
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Hàm định dạng giá trị voucher
const formatVoucherValue = (voucher: Voucher) => {
  if (voucher.loaiVoucher === 0) {
    return `Giảm ${voucher.giaTri ?? 0}%`;
  } else if (voucher.loaiVoucher === 1) {
    return `Giảm ${voucher.giaTri != null ? voucher.giaTri.toLocaleString('vi-VN') : '0'} VND`;
  } else if (voucher.loaiVoucher === 2) {
    return "Miễn phí vận chuyển";
  }
  return "Không xác định";
};

// Hàm lấy nhãn loại voucher
const getVoucherTypeLabel = (loaiVoucher: number) => {
  switch (loaiVoucher) {
    case 0:
      return "Giảm giá theo phần trăm";
    case 1:
      return "Giảm giá theo số tiền";
    case 2:
      return "Miễn phí vận chuyển";
    default:
      return "Không xác định";
  }
};

// Hàm xử lý sao chép mã coupon
const handleCopyCode = (code: string) => {
  navigator.clipboard.writeText(code)
    .then(() => {
      MySwal.fire({
        icon: "success",
        title: "Thành công!",
        text: `Đã sao chép mã: ${code}`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    })
    .catch(() => {
      MySwal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể sao chép mã",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    });
};

// CSS Animation for fadeIn
const fadeIn = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = fadeIn;
document.head.appendChild(styleSheet);

const PersonalPromotionsList = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setIsLoggedIn(!!userData);
    const currentUserId = userData?.maNguoiDung || null;
    setUserId(currentUserId);

    const fetchVouchers = async () => {
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (userData?.token) {
          headers["Authorization"] = `Bearer ${userData.token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Voucher`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(`Không thể lấy danh sách voucher: ${response.status} ${response.statusText}`);
        }

        const data: Voucher[] = await response.json();
        
        // Điều chỉnh định dạng ngày
        const adjustedData = data.map((voucher) => ({
          ...voucher,
          giaTri: voucher.giaTri ?? (voucher.loaiVoucher === 2 ? 0 : 0),
          ngayBatDau: new Date(new Date(voucher.ngayBatDau).getTime() - new Date(voucher.ngayBatDau).getTimezoneOffset() * 60000).toISOString().split('T')[0],
          ngayKetThuc: new Date(new Date(voucher.ngayKetThuc).getTime() - new Date(voucher.ngayKetThuc).getTimezoneOffset() * 60000).toISOString().split('T')[0],
        }));

        setVouchers(adjustedData);
      } catch (err: any) {
        setError(err.message);
        MySwal.fire({
          icon: "error",
          title: "Lỗi",
          text: err.message,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          showCloseButton: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const handleDetailClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setOpenDetailModal(true);
  };

  // Lọc voucher chỉ hiển thị những voucher có coupon với maNguoiDung khớp với userId
  const filteredVouchers = vouchers.filter(voucher =>
    voucher.coupons.some(coupon => coupon.maNguoiDung === userId)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-crocus-200 border-t-crocus-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-crocus-300 opacity-30"></div>
          </div>
          <p className="text-base font-medium text-gray-600">Đang tải khuyến mãi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <Gift className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-medium text-gray-800 mb-4">Có lỗi xảy ra</h3>
          <p className="text-base text-red-600 mb-6">{error}</p>
          <Button 
            className="bg-crocus-500 hover:bg-crocus-600 text-white px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center max-w-lg mx-auto px-6">
          <div className="bg-crocus-500 rounded-full p-10 w-28 h-28 mx-auto mb-8 animate-pulse">
            <Gift className="w-10 h-10 text-white mx-auto" />
          </div>
          <h2 className="text-4xl font-bold text-crocus-600 mb-6">{APP_TITLE}</h2>
          <p className="text-base text-gray-600 mb-8 font-light tracking-wide">
            Đăng nhập ngay để khám phá các ưu đãi độc quyền dành riêng cho bạn
          </p>
          <Link 
            to="/auth/login" 
            className="inline-block px-10 py-4 bg-crocus-500 text-white rounded-lg hover:bg-crocus-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-crocus-500 rounded-full mb-4 shadow-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-crocus-600 mb-4">{APP_TITLE}</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Khám phá các ưu đãi đặc biệt được tuyển chọn dành riêng cho bạn
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-crocus-600">Voucher của bạn</CardTitle>
            <CardDescription className="text-sm">
              Bạn hiện có <Badge className="bg-crocus-100 text-crocus-700 px-3 py-1 rounded-full">{filteredVouchers.length} voucher</Badge> khả dụng
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {filteredVouchers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVouchers.map((item) => (
                  <Card 
                    key={item.maVoucher} 
                    className="group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-2xl overflow-hidden transform hover:-translate-y-1"
                  >
                    <CardHeader className="bg-crocus-500/10 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-crocus-600 line-clamp-2">
                          {item.tenVoucher}
                        </h3>
                        <Badge 
                          className={`${
                            item.trangThai === 1 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-crocus-100 text-crocus-700 border-crocus-200'
                          } text-sm font-medium px-3 py-1 rounded-full`}
                        >
                          {item.trangThai === 1 ? 'Hết hạn' : 'Còn hiệu lực'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      {item.hinhAnh && (
                        <div className="relative overflow-hidden rounded-lg shadow-md">
                          <img
                            src={`data:image/jpeg;base64,${item.hinhAnh}`}
                            alt={item.tenVoucher}
                            className="w-full h-36 object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <Star className="h-4 w-4 text-crocus-500 mr-2" />
                          <span className="text-base font-medium">{formatVoucherValue(item)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 text-crocus-500 mr-2" />
                          <span className="text-base font-medium">Hết hạn: {formatDateTime(item.ngayKetThuc)}</span>
                        </div>
                        {item.dieuKien > 0 && (
                          <div className="bg-crocus-50 rounded-lg p-2">
                            <p className="text-sm text-crocus-700 font-medium">
                              Áp dụng cho đơn hàng từ {item.dieuKien.toLocaleString('vi-VN')} VND
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => handleDetailClick(item)}
                        className="w-full bg-crocus-500 hover:bg-crocus-600 text-white border-none rounded-lg py-2 font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-crocus-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có voucher nào</h3>
                <p className="text-base text-gray-600 mb-6">
                  Bạn chưa có chương trình khuyến mãi nào.
                </p>
                <Link 
                  to="/promotions"
                  className="inline-block px-8 py-2 bg-crocus-500 text-white rounded-lg hover:bg-crocus-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                >
                  Khám phá thêm ưu đãi
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-crocus-600 mb-4">Kết nối với chúng tôi</h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto mb-6">
            Theo dõi chúng tôi trên mạng xã hội để nhận cập nhật mới nhất và ưu đãi độc quyền.
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://www.facebook.com/FashionHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-crocus-600 transition-colors"
            >
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/FashionHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-crocus-600 transition-colors"
            >
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.045-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href="https://www.twitter.com/FashionHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-crocus-600 transition-colors"
            >
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>

        {/* Modal chi tiết voucher */}
        <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
          <DialogContent className="max-w-2xl rounded-2xl bg-white shadow-xl p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-crocus-600">Chi Tiết Voucher</DialogTitle>
            </DialogHeader>
            
            {selectedVoucher && (
              <div className="flex flex-col gap-4">
                {/* Voucher Image */}
                {selectedVoucher.hinhAnh && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hình Ảnh</label>
                    <div className="relative overflow-hidden rounded-lg shadow-md">
                      <img
                        src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                        alt={selectedVoucher.tenVoucher}
                        className="w-full h-32 object-cover transform hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                )}

                {/* Voucher Header */}
                <div className="bg-crocus-500/10 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Gift className="h-6 w-6 text-crocus-500 mr-2" />
                    <h2 className="text-lg font-bold text-gray-800">{selectedVoucher.tenVoucher}</h2>
                  </div>
                  <p className="text-base font-semibold text-crocus-600">{formatVoucherValue(selectedVoucher)}</p>
                  <p className="text-xs text-gray-600 mt-1">{getVoucherTypeLabel(selectedVoucher.loaiVoucher)}</p>
                </div>

                {/* Voucher Details */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[150px] bg-crocus-50 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày Kết Thúc</label>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-crocus-500 mr-2" />
                      <span className="text-sm text-gray-800">
                        {selectedVoucher.ngayKetThuc ? formatDateTime(selectedVoucher.ngayKetThuc) : "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[150px] bg-crocus-50 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Điều Kiện Đơn Hàng</label>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-crocus-500 mr-2" />
                      <span className="text-sm text-gray-800">
                        {selectedVoucher.dieuKien ? `${selectedVoucher.dieuKien.toLocaleString('vi-VN')} VND` : "Không giới hạn"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[150px] bg-crocus-50 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giá Trị Tối Đa</label>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-crocus-500 mr-2" />
                      <span className="text-sm text-gray-800">
                        {selectedVoucher.giaTriToiDa ? `${selectedVoucher.giaTriToiDa.toLocaleString('vi-VN')} VND` : "Không giới hạn"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mô Tả</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-[120px] overflow-y-auto">
                    <p className="text-sm text-gray-800">
                      {selectedVoucher.moTa || "Chưa có mô tả chi tiết"}
                    </p>
                  </div>
                </div>

                {/* Coupon Codes */}
                <div className="bg-crocus-50 rounded-lg p-4">
                  <label className="block text-sm font-bold text-crocus-700 mb-2">Mã voucher dành cho bạn</label>
                  {selectedVoucher.coupons && selectedVoucher.coupons.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {selectedVoucher.coupons
                        .filter((coupon) => coupon.maNguoiDung === userId)
                        .map((coupon) => (
                          <div 
                            key={coupon.id}
                            className={`bg-white rounded-lg p-3 border border-crocus-200 shadow-sm flex items-center gap-2 flex-1 min-w-[200px] ${
                              coupon.trangThai === 1 ? "opacity-60" : ""
                            }`}
                          >
                            <span className={`font-mono font-semibold text-crocus-600 flex-1 text-center text-base ${
                              coupon.trangThai === 1 ? "line-through text-gray-400" : ""
                            }`}>
                              {coupon.maNhap}
                            </span>
                            {coupon.trangThai === 1 ? (
                              <Badge className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                                Đã sử dụng
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyCode(coupon.maNhap)}
                                className="bg-crocus-500 hover:bg-crocus-600 text-white border-none rounded-lg px-3 py-1 text-xs"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Sao chép
                              </Button>
                            )}
                          </div>
                        ))}
                      {selectedVoucher.coupons.filter((coupon) => coupon.maNguoiDung === userId).length === 0 && (
                        <div className="w-full text-center py-2">
                          <p className="text-sm text-gray-600">Không có mã voucher phù hợp</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-600">Không có mã voucher</p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <Button 
                  onClick={() => setOpenDetailModal(false)}
                  className="w-full bg-crocus-500 hover:bg-crocus-600 text-white rounded-lg py-2 font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  Đóng
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PersonalPromotionsList;