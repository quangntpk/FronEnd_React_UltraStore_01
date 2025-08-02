
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Gift, Clock, Sparkles, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PersonalPromotionsList from "@/pages/personalpromotions/PersonalpromotionsList";

// Định nghĩa kiểu dữ liệu cho Voucher
interface Voucher {
  maVoucher: number;
  tenVoucher: string;
  giaTri: number;
  giaTriToiDa?: number;
  loaiVoucher: number; // 0: Giảm giá theo phần trăm, 1: Giảm giá theo số tiền, 2: Miễn phí vận chuyển
  ngayBatDau: string;
  ngayKetThuc: string;
  hinhAnh?: string;
  moTa?: string;
  dieuKien?: number;
  soLuong?: number;
  trangThai?: number;
  tyLe?: number;
  coupons?: { id: number; maNhap: string; trangThai: number; maNguoiDung?: string | null }[];
}

// Định nghĩa cấu trúc cơ sở dữ liệu IndexedDB
interface MyDB extends DBSchema {
  userData: {
    key: string;
    value: {
      lastSpinTime?: number;
      selectedVoucher?: Voucher;
      spinCount?: number;
    };
  };
}

const APP_TITLE = import.meta.env.VITE_TITLE || "Vòng Quay May Mắn";

const SEGMENT_COLORS = [
  '#9b87f5', '#b794f6', '#d6bcfa', '#e9d5ff',
  '#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9',
  '#c4b5fd', '#ddd6fe', '#f3f0ff', '#ede9fe'
];

const VoucherUser = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<{ id: number; maNhap: string; trangThai: number; maNguoiDung?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [db, setDb] = useState<IDBPDatabase<MyDB> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SPIN_COOLDOWN = 24 * 60 * 60 * 1000; // 24 tiếng
  const WHEEL_SIZE = 400;
  const WHEEL_RADIUS = WHEEL_SIZE / 2;

  // Hàm xác định tỷ lệ dựa trên giá trị voucher
  const getTyLeByValue = (giaTri: number): number => {
    if (giaTri >= 50) return 5;
    if (giaTri >= 30) return 10;
    if (giaTri >= 20) return 15;
    if (giaTri >= 10) return 25;
    return 45;
  };

  // Hàm tải danh sách voucher từ API
  const fetchVouchers = async () => {
    try {
      const response = await fetch("http://localhost:5261/api/Voucher", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách voucher");
      }

      const data: Voucher[] = await response.json();
      const currentDate = new Date();

      const validVouchers = data
        .filter((voucher) => {
          const startDate = new Date(voucher.ngayBatDau);
          const endDate = new Date(voucher.ngayKetThuc);
          const hasValidCoupon = voucher.coupons?.some(coupon => coupon.trangThai === 0);
          return (
            voucher.trangThai === 0 &&
            startDate <= currentDate &&
            endDate >= currentDate &&
            hasValidCoupon
          );
        })
        .map((voucher) => ({
          ...voucher,
          tyLe: getTyLeByValue(voucher.giaTri),
        }));

      setVouchers(validVouchers);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<MyDB>("VoucherDB", 1, {
          upgrade(db) {
            db.createObjectStore("userData");
          },
        });
        setDb(database);
      } catch (err) {
        console.error("Không thể khởi tạo IndexedDB:", err);
        toast({
          title: "Lỗi",
          description: "Không thể khởi tạo cơ sở dữ liệu!",
          variant: "destructive",
        });
      }
    };
    initDB();
  }, []);

  // Tải dữ liệu người dùng và danh sách voucher
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setIsLoggedIn(!!userData);
    const currentUserId = userData?.maNguoiDung || null;
    setUserId(currentUserId);

    const loadDataFromDB = async () => {
      if (!db || !currentUserId) return;

      try {
        const tx = db.transaction("userData", "readonly");
        const store = tx.objectStore("userData");
        const storedData = await store.get(currentUserId);
        if (storedData) {
          if (storedData.lastSpinTime) {
            setLastSpinTime(storedData.lastSpinTime);
            setTimeLeft(getTimeUntilNextSpin(storedData.lastSpinTime));
          }
          if (storedData.selectedVoucher) {
            setSelectedVoucher(storedData.selectedVoucher);
            const validCoupon = storedData.selectedVoucher.coupons?.find(coupon => coupon.trangThai === 0);
            if (validCoupon) {
              setSelectedCoupon(validCoupon);
            }
          }
          if (storedData.spinCount) {
            setSpinCount(storedData.spinCount);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu từ IndexedDB:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu từ cơ sở dữ liệu!",
          variant: "destructive",
        });
      }
    };

    if (db) {
      loadDataFromDB();
      fetchVouchers();
    }

    const handleStorageChange = () => {
      const updatedUserData = JSON.parse(localStorage.getItem("user") || "null");
      if (!updatedUserData) {
        setIsLoggedIn(false);
        setSelectedVoucher(null);
        setSelectedCoupon(null);
        setLastSpinTime(null);
        setUserId(null);
        setSpinCount(0);
      } else if (updatedUserData.maNguoiDung !== userId) {
        setUserId(updatedUserData.maNguoiDung);
        loadDataFromDB();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [db, userId]);

  // Cập nhật thời gian thực
  useEffect(() => {
    if (!lastSpinTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = () => {
      const currentTime = Date.now();
      const timeSinceLastSpin = currentTime - lastSpinTime;
      const remainingTime = Math.max(0, SPIN_COOLDOWN - timeSinceLastSpin);
      setTimeLeft(remainingTime);

      if (remainingTime === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    updateTimeLeft();
    intervalRef.current = setInterval(updateTimeLeft, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lastSpinTime]);

  // Kiểm tra xem người dùng có thể quay hay không
  const canSpin = () => {
    return !isSpinning && isLoggedIn && timeLeft <= 0;
  };

  // Tính thời gian còn lại để quay lần tiếp theo
  const getTimeUntilNextSpin = (spinTime: number = lastSpinTime || 0) => {
    const currentTime = Date.now();
    const timeSinceLastSpin = currentTime - spinTime;
    return Math.max(0, SPIN_COOLDOWN - timeSinceLastSpin);
  };

  // Định dạng thời gian còn lại
  const formatTimeLeft = (timeLeft: number) => {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  };

  // Định dạng giá trị voucher dựa trên loại voucher
  const formatVoucherValue = (voucher: Voucher) => {
    if (voucher.loaiVoucher === 0) {
      return `Giảm ${voucher.giaTri}% đơn hàng`;
    } else if (voucher.loaiVoucher === 1) {
      return `Giảm ${formatCondition(voucher.giaTri)} đơn hàng`;
    } else if (voucher.loaiVoucher === 2) {
      return "Miễn phí vận chuyển";
    }
    return "";
  };

  // Tính toán voucher chiến thắng dựa trên tỷ lệ
  const calculateWinningVoucher = (): Voucher => {
    const totalRate = vouchers.reduce((sum, v) => sum + (v.tyLe || 0), 0);
    const random = Math.random() * totalRate;

    let currentRate = 0;
    for (const voucher of vouchers) {
      currentRate += voucher.tyLe || 0;
      if (random <= currentRate) {
        return voucher;
      }
    }

    return vouchers[vouchers.length - 1];
  };

  // Xử lý quay vòng quay
  const handleSpin = async () => {
    if (!canSpin() || vouchers.length === 0 || !userId || !db) return;

    if (!isLoggedIn) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để quay vòng quay may mắn!",
        variant: "destructive",
      });
      return;
    }

    if (timeLeft > 0) {
      toast({
        title: "Chưa thể quay",
        description: `Vui lòng đợi thêm ${formatTimeLeft(timeLeft)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    setSelectedVoucher(null);
    setSelectedCoupon(null);
    setShowWinnerPopup(false);

    const winningVoucher = calculateWinningVoucher();
    const winningIndex = vouchers.findIndex(v => v.maVoucher === winningVoucher.maVoucher);

    const segmentAngle = 360 / vouchers.length;
    const targetAngle = winningIndex * segmentAngle + segmentAngle / 2;
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = spins * 360 + (360 - targetAngle);

    setRotation(rotation + finalAngle);

    setTimeout(async () => {
      setSelectedVoucher(winningVoucher);
      const validCoupon = winningVoucher.coupons?.find(coupon => coupon.trangThai === 0);
      if (validCoupon) {
        setSelectedCoupon(validCoupon);
      }
      const currentTime = Date.now();
      const newSpinCount = spinCount + 1;

      setLastSpinTime(currentTime);
      setSpinCount(newSpinCount);
      setShowWinnerPopup(true);

      try {
        const tx = db.transaction("userData", "readwrite");
        const store = tx.objectStore("userData");
        await store.put(
          {
            lastSpinTime: currentTime,
            selectedVoucher: winningVoucher,
            spinCount: newSpinCount,
          },
          userId
        );
        await tx.done;

        toast({
          title: "🎉 Chúc mừng!",
          description: `Bạn đã trúng: ${winningVoucher.tenVoucher}`,
        });
      } catch (err) {
        console.error("Lỗi khi lưu vào IndexedDB:", err);
        toast({
          title: "Lỗi",
          description: "Không thể lưu kết quả quay, vui lòng thử lại!",
          variant: "destructive",
        });
      }

      setIsSpinning(false);

      popupTimeoutRef.current = setTimeout(() => {
        setShowWinnerPopup(false);
      }, 3000);
    }, 3000);
  };

  // Xử lý lưu mã coupon
  const handleSaveCoupon = async (couponId: number, maNhap: string) => {
    if (!userId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để lưu mã giảm giá!",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy token, vui lòng đăng nhập lại!",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`http://localhost:5261/api/Voucher/Coupon/${couponId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maNguoiDung: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Không thể lưu mã giảm giá: ${errorData}`);
      }

      setSelectedCoupon((prev) =>
        prev && prev.id === couponId
          ? { ...prev, trangThai: 2, maNguoiDung: userId }
          : prev
      );

      setSelectedVoucher((prev) => {
        if (!prev || !prev.coupons) return prev;
        return {
          ...prev,
          coupons: prev.coupons.map((coupon) =>
            coupon.id === couponId
              ? { ...coupon, trangThai: 2, maNguoiDung: userId }
              : coupon
          ),
        };
      });

      setVouchers((prevVouchers) =>
        prevVouchers.map((voucher) =>
          voucher.maVoucher === selectedVoucher?.maVoucher
            ? {
                ...voucher,
                coupons: voucher.coupons?.map((coupon) =>
                  coupon.id === couponId
                    ? { ...coupon, trangThai: 2, maNguoiDung: userId }
                    : coupon
                ),
              }
            : voucher
        )
      );

      toast({
        title: "Thành công",
        description: `Đã lưu mã ${maNhap} thành công!`,
      });
    } catch (err: any) {
      console.error("Lỗi khi lưu mã coupon:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể lưu mã giảm giá, vui lòng thử lại!",
        variant: "destructive",
      });
    }
  };

  // Xử lý đăng nhập giả lập
  const handleLogin = () => {
    const mockUser = { maNguoiDung: "user_" + Math.random().toString(36).substring(2, 15) };
    localStorage.setItem("user", JSON.stringify(mockUser));
    setIsLoggedIn(true);
    setUserId(mockUser.maNguoiDung);
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("user");
    if (db && userId) {
      const tx = db.transaction("userData", "readwrite");
      const store = tx.objectStore("userData");
      store.delete(userId);
    }
    setIsLoggedIn(false);
    setSelectedVoucher(null);
    setSelectedCoupon(null);
    setLastSpinTime(null);
    setTimeLeft(0);
    setSpinCount(0);
    setShowWinnerPopup(false);
    setUserId(null);
  };

  // Đóng popup
  const closePopup = () => {
    setShowWinnerPopup(false);
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
  };

  // Render đoạn vòng quay
  const renderWheelSegment = (voucher: Voucher, index: number) => {
    const total = vouchers.length;
    const angle = 360 / total;
    const startAngle = angle * index;
    const endAngle = startAngle + angle;

    const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
    const endAngleRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = WHEEL_RADIUS + (WHEEL_RADIUS - 20) * Math.cos(startAngleRad);
    const y1 = WHEEL_RADIUS + (WHEEL_RADIUS - 20) * Math.sin(startAngleRad);
    const x2 = WHEEL_RADIUS + (WHEEL_RADIUS - 20) * Math.cos(endAngleRad);
    const y2 = WHEEL_RADIUS + (WHEEL_RADIUS - 20) * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${WHEEL_RADIUS} ${WHEEL_RADIUS}`,
      `L ${x1} ${y1}`,
      `A ${WHEEL_RADIUS - 20} ${WHEEL_RADIUS - 20} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    const textAngle = startAngle + angle / 2 - 90;
    const textAngleRad = (textAngle * Math.PI) / 180;
    const textRadius = WHEEL_RADIUS * 0.7;
    const textX = WHEEL_RADIUS + textRadius * Math.cos(textAngleRad);
    const textY = WHEEL_RADIUS + textRadius * Math.sin(textAngleRad);

    const displayText = voucher.loaiVoucher === 0
      ? `${voucher.giaTri}%`
      : voucher.loaiVoucher === 1
      ? formatCondition(voucher.giaTri)
      : "Miễn phí vận chuyển";

    return (
      <g key={voucher.maVoucher}>
        <path
          d={pathData}
          fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
          stroke="#FFF"
          strokeWidth={3}
        />
        <text
          x={textX}
          y={textY}
          fontSize="16"
          fontWeight="bold"
          fill="#FFF"
          textAnchor="middle"
          alignmentBaseline="middle"
          transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
        >
          {displayText}
        </text>
      </g>
    );
  };

  // Định dạng ngày
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Định dạng điều kiện
  const formatCondition = (condition: number) => {
    const formattedNumber = new Intl.NumberFormat('vi-VN').format(condition);
    return `${formattedNumber} VND`;
  };

  // Trạng thái tải
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Trạng thái lỗi hoặc không có voucher
  if (error || vouchers.length === 0) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || "Chưa có voucher nào dành cho bạn."}</p>
          <Button
            onClick={() => {
              setLoading(true);
              setError(null);
              setVouchers([]);
              fetchVouchers();
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <Tabs defaultValue="wheel" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="wheel">
              <Star className="mr-2 h-4 w-4" />
              Vòng Quay May Mắn
            </TabsTrigger>
            <TabsTrigger value="promotions">
              <Gift className="mr-2 h-4 w-4" />
              Khuyến Mãi Cá Nhân
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wheel">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="text-4xl font-bold mb-4" />
                  <h2 className="text-4xl font-bold mb-4">
                    {APP_TITLE}
                  </h2>
                  <Sparkles className="text-4xl font-bold mb-4"/>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                  Quay để nhận ngay mã giảm giá hoặc miễn phí vận chuyển hấp dẫn dành cho bạn!
                </p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
                {/* Wheel */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <div
                      className="relative transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))',
                      }}
                    >
                      <svg width={WHEEL_SIZE} height={WHEEL_SIZE} className="rounded-full">
                        {vouchers.map((voucher, index) => renderWheelSegment(voucher, index))}
                      </svg>
                      {/* Center circle */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                      <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-red-500 filter drop-shadow-lg"></div>
                    </div>
                  </div>
                </div>

                {/* Controls and Result */}
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <Button
                      onClick={handleSpin}
                      disabled={isSpinning || !canSpin()}
                      className={`px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 ${
                        canSpin() && !isSpinning
                          ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                      style={{
                        background: canSpin() && !isSpinning
                          ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'
                          : undefined
                      }}
                    >
                      {isSpinning ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                          🎯 Đang quay...
                        </>
                      ) : !isLoggedIn ? (
                        <>
                          <Clock className="w-5 h-5 mr-2 inline-block" />
                          Đăng nhập để quay
                        </>
                      ) : timeLeft > 0 ? (
                        <>
                          <Clock className="w-5 h-5 mr-2 inline-block" />
                          ⏰ Chờ {formatTimeLeft(timeLeft)}
                        </>
                      ) : (
                        <>
                          <Star className="w-5 h-5 mr-2 inline-block" />
                          🍀 Quay ngay
                        </>
                      )}
                    </Button>
                  </div>

                  {selectedVoucher && !showWinnerPopup && selectedCoupon && (
                    <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-xl">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <Gift className="w-6 h-6 text-purple-500 mr-2" />
                          <h3 className="text-xl font-bold text-purple-600">
                            🎉 Chúc mừng bạn!
                          </h3>
                        </div>
                      </div>

                      {selectedVoucher.hinhAnh && (
                        <div className="mb-4">
                          <img
                            src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                            alt={selectedVoucher.tenVoucher}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="font-semibold text-gray-800 mb-1">
                            {selectedVoucher.tenVoucher}
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatVoucherValue(selectedVoucher)}
                          </p>
                        </div>

                        {selectedVoucher.moTa && (
                          <p className="text-gray-600 text-sm text-center italic">
                            {selectedVoucher.moTa}
                          </p>
                        )}

                        <div className="text-center text-sm text-gray-500">
                          <p>Hết hạn: {formatDate(selectedVoucher.ngayKetThuc)}</p>
                          {selectedVoucher.dieuKien && (
                            <p>Áp dụng cho đơn hàng từ {formatCondition(selectedVoucher.dieuKien)}</p>
                          )}
                          {selectedVoucher.giaTriToiDa && (
                            <p>Giảm tối đa: {formatCondition(selectedVoucher.giaTriToiDa)}</p>
                          )}
                        </div>

                        {selectedCoupon && (
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700 text-center">Mã</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 border border-purple-200 rounded-lg p-2 text-center">
                                <span className="font-mono font-bold text-purple-600">
                                  {selectedCoupon.maNhap}
                                </span>
                              </div>
                              <Button
                                onClick={() => handleSaveCoupon(selectedCoupon.id, selectedCoupon.maNhap)}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 text-sm"
                                disabled={selectedCoupon.trangThai === 2}
                              >
                                {selectedCoupon.trangThai === 2 ? "Đã lưu" : "Lưu"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedVoucher && !showWinnerPopup && (
                    <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-xl text-center">
                      <Gift className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {isLoggedIn
                          ? "Quay để nhận mã giảm giá nhé!"
                          : "Vui lòng đăng nhập để quay!"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-600">
                  🎯 Mỗi tài khoản chỉ được quay 1 lần trong 24 giờ
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="promotions">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-4">
                  <Gift className="text-4xl font-bold mb-4" />
                  <h2 className="text-4xl font-bold mb-4">
                    Khuyến Mãi Cá Nhân
                  </h2>
                  <Gift className="text-4xl font-bold mb-4"/>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                  Xem các chương trình khuyến mãi dành riêng cho bạn!
                </p>
              </div>
              <PersonalPromotionsList/>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Winner Popup */}
      {showWinnerPopup && selectedVoucher && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center relative"
            style={{
              animation: 'bounceIn 0.5s ease-out',
            }}
          >
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>

            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold text-purple-600 mb-2">
                Chúc mừng!
              </h3>
              <p className="text-lg text-gray-600">
                Bạn đã trúng voucher
              </p>
            </div>

            {selectedVoucher.hinhAnh && (
              <div className="mb-4">
                <img
                  src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                  alt={selectedVoucher.tenVoucher}
                  className="w-full h-48 object-cover rounded-lg mx-auto"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-xl text-gray-800">
                  {selectedVoucher.tenVoucher}
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {formatVoucherValue(selectedVoucher)}
                </p>
              </div>

              {selectedVoucher.moTa && (
                <p className="text-gray-600 text-sm italic">
                  {selectedVoucher.moTa}
                </p>
              )}

              <div className="text-sm text-gray-500">
                <p>Hết hạn: {formatDate(selectedVoucher.ngayKetThuc)}</p>
                {selectedVoucher.dieuKien && (
                  <p>Áp dụng cho đơn hàng từ {formatCondition(selectedVoucher.dieuKien)}</p>
                )}
                {selectedVoucher.giaTriToiDa && (
                  <p>Giảm tối đa: {formatCondition(selectedVoucher.giaTriToiDa)}</p>
                )}
              </div>

              {selectedCoupon && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-700">Mã giảm giá:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 border border-purple-200 rounded-lg p-2 text-center">
                      <span className="font-mono font-bold text-purple-600">
                        {selectedCoupon.maNhap}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleSaveCoupon(selectedCoupon.id, selectedCoupon.maNhap)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 text-sm"
                      disabled={selectedCoupon.trangThai === 2}
                    >
                      {selectedCoupon.trangThai === 2 ? "Đã lưu" : "Lưu"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS Animation for bounceIn
const bounceIn = `
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); opacity: 1; }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = bounceIn;
document.head.appendChild(styleSheet);

export default VoucherUser;
