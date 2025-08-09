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

// CSS Animation for centerUp và thanh cuộn tùy chỉnh
const centerUp = `
  @keyframes centerUp {
    0% { transform: scale(0.7) translateY(20px); opacity: 0; }
    100% { transform: scale(1) translateY(-20px); opacity: 1; }
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = centerUp;
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

  // Lọc voucher chỉ hiển thị những voucher có coupon với maNguoiDung khớp với userId và trangThai === 2
  const filteredVouchers = vouchers.filter(voucher =>
    voucher.coupons.some(coupon => coupon.maNguoiDung === userId && coupon.trangThai === 2)
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
    <div className="">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        {/* <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-crocus-500 rounded-full mb-4 shadow-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-crocus-600 mb-4">{APP_TITLE}</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Khám phá các ưu đãi đặc biệt được tuyển chọn dành riêng cho bạn
          </p>
        </div> */}

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

       
        {/* Modal chi tiết voucher */}
        <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
          <DialogContent className="max-w-md w-full rounded-lg bg-white shadow-lg p-4" style={{ animation: 'centerUp 0.3s ease-out' }}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-bold text-crocus-600">Chi Tiết Voucher</DialogTitle>
            </DialogHeader>
            {selectedVoucher && (
              <div className="flex flex-col gap-3">
                {/* Voucher Header */}
                <div className="bg-crocus-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Gift className="h-5 w-5 text-crocus-500 mr-2" />
                    <h2 className="text-base font-semibold text-gray-800 line-clamp-1">{selectedVoucher.tenVoucher}</h2>
                  </div>
                  <p className="text-sm font-medium text-crocus-600">{formatVoucherValue(selectedVoucher)}</p>
                </div>

                {/* Voucher Image */}
                {selectedVoucher.hinhAnh && (
                  <div className="relative overflow-hidden rounded-md shadow-sm">
                    <img
                      src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                      alt={selectedVoucher.tenVoucher}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  </div>
                )}

                {/* Voucher Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-md p-2">
                    <label className="block text-xs font-medium text-gray-600">Ngày Kết Thúc</label>
                    <p className="text-sm text-gray-800">
                      {selectedVoucher.ngayKetThuc ? formatDateTime(selectedVoucher.ngayKetThuc) : "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2">
                    <label className="block text-xs font-medium text-gray-600">Loại Voucher</label>
                    <p className="text-sm text-gray-800">
                      {getVoucherTypeLabel(selectedVoucher.loaiVoucher)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2">
                    <label className="block text-xs font-medium text-gray-600">Điều Kiện</label>
                    <p className="text-sm text-gray-800">
                      {selectedVoucher.dieuKien ? `${selectedVoucher.dieuKien.toLocaleString('vi-VN')} VND` : "Không giới hạn"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2">
                    <label className="block text-xs font-medium text-gray-600">Giá Trị Tối Đa</label>
                    <p className="text-sm text-gray-800">
                      {selectedVoucher.giaTriToiDa ? `${selectedVoucher.giaTriToiDa.toLocaleString('vi-VN')} VND` : "Không giới hạn"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mô Tả</label>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-md p-2 max-h-20 overflow-y-auto">
                    {selectedVoucher.moTa || "Chưa có mô tả chi tiết"}
                  </p>
                </div>

                {/* Coupon Codes */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mã Coupon</label>
                  {selectedVoucher.coupons && selectedVoucher.coupons.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-2">
                        {selectedVoucher.coupons
                          .filter((coupon) => coupon.maNguoiDung === userId && coupon.trangThai === 2)
                          .map((coupon) => (
                            <div
                              key={coupon.id}
                              className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 shadow-sm"
                            >
                              <span
                                className="font-mono text-sm text-crocus-600 flex-1 text-center"
                              >
                                {coupon.maNhap}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyCode(coupon.maNhap)}
                                className="bg-crocus-500 hover:bg-crocus-600 text-white border-none rounded-md px-2 py-0.5 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Sao chép
                              </Button>
                            </div>
                          ))}
                        {selectedVoucher.coupons.filter((coupon) => coupon.maNguoiDung === userId && coupon.trangThai === 2).length === 0 && (
                          <p className="text-sm text-gray-600 text-center col-span-2">Không có mã coupon khả dụng</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center">Không có mã coupon</p>
                  )}
                </div>

                {/* Close Button */}
                <Button
                  onClick={() => setOpenDetailModal(false)}
                  className="w-full bg-crocus-500 hover:bg-crocus-600 text-white rounded-md py-2 text-sm font-medium transition-all duration-300 shadow-sm"
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