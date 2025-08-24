import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Gift, Clock, Sparkles, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PersonalPromotionsList from "@/pages/personalpromotions/PersonalpromotionsList";
import GapThu from "../gapthu/GapThuUser";

// --- Interfaces and Constants ---

interface Voucher {
  maVoucher: number;
  tenVoucher: string;
  giaTri: number;
  giaTriToiDa?: number;
  loaiVoucher: number;
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
  '#ff6b6b', '#ffb347', '#ffe66d', '#6bcB77', '#4ecdc4',
  '#5eead4', '#48bfe3', '#5c7cfa', '#a259ff', '#f06595',
  '#ff87ab', '#ff9ff3', '#feca57', '#00d2d3', '#00b894',
  '#fd79a8', '#e17055', '#fab1a0', '#d63031', '#ffeaa7'
];

const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;
const WHEEL_SIZE = 400;
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const SPIN_DURATION = 7000;

// --- Main Component ---

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
  const navigate = useNavigate();

  // --- Helper Functions ---

  const getTyLeByValue = useCallback((giaTri: number): number => {
    if (giaTri >= 50) return 5;
    if (giaTri >= 30) return 10;
    if (giaTri >= 20) return 15;
    if (giaTri >= 10) return 25;
    return 45;
  }, []);

  const getTimeUntilNextSpin = useCallback((spinTime: number) => {
    return Math.max(0, SPIN_COOLDOWN - (Date.now() - spinTime));
  }, []);

  const formatTimeLeft = useCallback((timeLeft: number) => {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  }, []);

  const formatVoucherValue = useCallback((voucher: Voucher) => {
    if (voucher.loaiVoucher === 0) return `Giảm ${voucher.giaTri}%`;
    if (voucher.loaiVoucher === 1) return `Giảm ${formatCondition(voucher.giaTri)}`;
    return "Miễn phí vận chuyển";
  }, []);

  const formatCondition = useCallback((condition: number) => {
    return new Intl.NumberFormat('vi-VN').format(condition) + ' VND';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }, []);

  // --- Data Fetching and Initialization ---

  const fetchVouchers = useCallback(async () => {
    try {
      const response = await fetch("https://bicacuatho.azurewebsites.net/api/Voucher", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Không thể lấy danh sách voucher");
      const data: Voucher[] = await response.json();
      const currentDate = new Date();

      const validVouchers = data
        .filter((voucher) => {
          const startDate = new Date(voucher.ngayBatDau);
          const endDate = new Date(voucher.ngayKetThuc);
          const hasValidCoupon = voucher.coupons?.some(coupon => coupon.trangThai === 0);
          return voucher.trangThai === 0 && startDate <= currentDate && endDate >= currentDate && hasValidCoupon;
        })
        .map((voucher) => ({
          ...voucher,
          tyLe: getTyLeByValue(voucher.giaTri),
        }));

      setVouchers(validVouchers);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getTyLeByValue]);

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

  // Tải dữ liệu người dùng và voucher khi DB sẵn sàng
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setIsLoggedIn(!!userData);
    setUserId(userData?.maNguoiDung || null);

    const loadDataFromDB = async () => {
      if (!db || !userData?.maNguoiDung) return;

      try {
        const storedData = await db.get("userData", userData.maNguoiDung);
        if (storedData) {
          if (storedData.lastSpinTime) {
            setLastSpinTime(storedData.lastSpinTime);
          }
          if (storedData.spinCount) setSpinCount(storedData.spinCount);
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
  }, [db, fetchVouchers]);

  // Cập nhật thời gian chờ
  useEffect(() => {
    if (!lastSpinTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = () => {
      const remainingTime = getTimeUntilNextSpin(lastSpinTime);
      setTimeLeft(remainingTime);
      if (remainingTime === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    updateTimeLeft();
    intervalRef.current = setInterval(updateTimeLeft, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastSpinTime, getTimeUntilNextSpin]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // --- Wheel Logic ---

  const calculateWinningVoucher = useCallback((): Voucher => {
    const totalRate = vouchers.reduce((sum, v) => sum + (v.tyLe || 0), 0);
    const random = Math.random() * totalRate;
    let currentRate = 0;

    for (const voucher of vouchers) {
      currentRate += voucher.tyLe || 0;
      if (random <= currentRate) return voucher;
    }
    return vouchers[vouchers.length - 1];
  }, [vouchers]);

  const handleSpin = useCallback(async () => {
    // Check if user is logged in
    if (!isLoggedIn || !userId) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng đăng nhập để quay vòng quay may mắn!",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    // Existing conditions to prevent spinning
    if (timeLeft > 0 || isSpinning || vouchers.length === 0 || !db) {
      return;
    }

    // Reset states
    setSelectedVoucher(null);
    setSelectedCoupon(null);
    setShowWinnerPopup(false);
    setIsSpinning(true);

    try {
      // 1. Pre-calculate the winning voucher
      const winningVoucher = calculateWinningVoucher();
      if (!winningVoucher) {
        throw new Error("Không thể xác định voucher chiến thắng.");
      }
      const winningCoupon = winningVoucher.coupons?.find((c) => c.trangThai === 0);
      if (!winningCoupon) {
        throw new Error("Voucher chiến thắng không có coupon hợp lệ.");
      }

      // 2. Find the index of the winning voucher
      const winningIndex = vouchers.findIndex((v) => v.maVoucher === winningVoucher.maVoucher);
      if (winningIndex === -1) {
        throw new Error("Voucher chiến thắng không có trong danh sách.");
      }

      // 3. Calculate the final rotation angle
      const segmentAngle = 360 / vouchers.length;
      const targetAngle = 360 - (winningIndex * segmentAngle + segmentAngle / 2); // Adjust for pointer at the top
      const spins = 7 + Math.floor(Math.random() * 3); // 7-9 full spins
      const finalRotation = spins * 360 + targetAngle;

      setRotation(finalRotation);

      // 4. Wait for the animation to complete
      setTimeout(async () => {
        setIsSpinning(false);
        setSelectedVoucher(winningVoucher);
        setSelectedCoupon(winningCoupon);
        setShowWinnerPopup(true);

        // 5. Save spin data and update local state
        const currentTime = Date.now();
        setLastSpinTime(currentTime);
        setSpinCount((prev) => prev + 1);

        await db.put(
          "userData",
          {
            lastSpinTime: currentTime,
            spinCount: spinCount + 1,
          },
          userId
        );

        toast({
          title: "🎉 Chúc mừng!",
          description: `Bạn đã trúng: ${winningVoucher.tenVoucher} (${formatVoucherValue(winningVoucher)})`,
        });

        popupTimeoutRef.current = setTimeout(() => {
          setShowWinnerPopup(false);
        }, 5000);
      }, SPIN_DURATION);
    } catch (err: any) {
      console.error("Lỗi khi quay:", err);
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
      setIsSpinning(false);
    }
  }, [
    isLoggedIn,
    userId,
    db,
    timeLeft,
    isSpinning,
    vouchers,
    spinCount,
    calculateWinningVoucher,
    formatVoucherValue,
    navigate,
  ]);

  // --- Rendering Functions ---

  const renderWheelSegment = useCallback(
    (voucher: Voucher, index: number) => {
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
        'Z',
      ].join(' ');

      const textAngle = startAngle + angle / 2;
      const textAngleRad = ((textAngle - 90) * Math.PI) / 180;
      const textRadius = WHEEL_RADIUS * 0.7;
      const textX = WHEEL_RADIUS + textRadius * Math.cos(textAngleRad);
      const textY = WHEEL_RADIUS + textRadius * Math.sin(textAngleRad);

      const displayText =
        voucher.loaiVoucher === 0
          ? `${voucher.giaTri}%`
          : voucher.loaiVoucher === 1
            ? formatCondition(voucher.giaTri)
            : "Free Ship";

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
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
          >
            {displayText}
          </text>
        </g>
      );
    },
    [vouchers.length, formatCondition]
  );

  const handleSaveCoupon = useCallback(
    async (couponId: number, maNhap: string) => {
      if (!userId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng đăng nhập để lưu mã giảm giá.",
          variant: "destructive",
        });
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");

        const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Voucher/Coupon/${couponId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ maNguoiDung: userId }),
        });

        if (!response.ok) throw new Error("Không thể lưu mã giảm giá");

        setSelectedCoupon((prev) =>
          prev ? { ...prev, trangThai: 2, maNguoiDung: userId } : null
        );
        setVouchers((prev) =>
          prev.map((v) => ({
            ...v,
            coupons: v.coupons?.map((c) =>
              c.id === couponId ? { ...c, trangThai: 2, maNguoiDung: userId } : c
            ),
          }))
        );

        toast({
          title: "Thành công",
          description: `Đã lưu mã ${maNhap} thành công!`,
        });
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err.message,
          variant: "destructive",
        });
      }
    },
    [userId]
  );

  // --- Component Rendering ---

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
      <style>
        {`
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); opacity: 1; }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
          }
          .wheel {
            transition: transform ${SPIN_DURATION}ms cubic-bezier(0.23, 1, 0.32, 1);
          }
        `}
      </style>
      <div className="container mx-auto py-8 px-4">
        <Tabs defaultValue="wheel" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid grid-cols-3 mb-8">


            <TabsTrigger value="wheel">
              <Star className="mr-2 h-4 w-4" />
              Vòng Quay May Mắn
            </TabsTrigger>

            
              <TabsTrigger value="gapthu">
              <Gift className="mr-2 h-4 w-4" />
              Gắp Thú May Mắn
            </TabsTrigger>
          
            <TabsTrigger value="promotions">
              <Gift className="mr-2 h-4 w-4" />
              Mã Voucher Cá Nhân
            </TabsTrigger>
            
          </TabsList>

          <TabsContent value="wheel">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">{APP_TITLE}</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                  Quay để nhận ngay mã giảm giá hoặc miễn phí vận chuyển!
                </p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
                {/* Wheel */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <div
                      className="relative wheel"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))',
                      }}
                    >
                      <svg width={WHEEL_SIZE} height={WHEEL_SIZE} className="rounded-full">
                        {vouchers.map(renderWheelSegment)}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                      <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-red-500 filter drop-shadow-lg transform rotate-180"></div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    {!isLoggedIn ? (
                      <Button
                        onClick={() => navigate("/auth/login")}
                        className="px-8 py-4 text-lg font-bold rounded-xl bg-green-500 hover:bg-green-600 text-white"
                      >
                        Đăng nhập để quay
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSpin}
                        disabled={isSpinning || timeLeft > 0}
                        className={`px-8 py-4 text-lg font-bold rounded-xl ${!isSpinning && timeLeft <= 0
                            ? 'bg-purple-500 hover:bg-purple-600 text-white'
                            : 'bg-gray-400 text-gray-600'
                          }`}
                      >
                        {isSpinning ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                            Đang quay...
                          </>
                        ) : timeLeft > 0 ? (
                          <>
                            <Clock className="w-5 h-5 mr-2 inline-block" />
                            Chờ {formatTimeLeft(timeLeft)}
                          </>
                        ) : (
                          <>
                            <Star className="w-5 h-5 mr-2 inline-block" />
                            Quay ngay
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Result */}
                  {selectedVoucher && selectedCoupon && !showWinnerPopup && (
                    <div className="bg-white rounded-2xl p-6 shadow-xl">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-purple-600">
                          🎉 Chúc mừng bạn!
                        </h3>
                        <p className="font-semibold text-gray-800">{selectedVoucher.tenVoucher}</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatVoucherValue(selectedVoucher)}
                        </p>
                      </div>

                      {selectedVoucher.hinhAnh && (
                        <img
                          src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                          alt={selectedVoucher.tenVoucher}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                          loading="eager"
                        />
                      )}

                      <div className="space-y-3">
                        {selectedVoucher.moTa && (
                          <p className="text-gray-600 text-sm text-center italic">{selectedVoucher.moTa}</p>
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
                        <div className="flex items-center gap-2 mt-4">
                          <div className="flex-1 bg-gray-100 border border-purple-200 rounded-lg p-2 text-center">
                            <span className="font-mono font-bold text-purple-600">
                              {selectedCoupon.maNhap}
                            </span>
                          </div>
                          <Button
                            onClick={() => handleSaveCoupon(selectedCoupon.id, selectedCoupon.maNhap)}
                            disabled={selectedCoupon.trangThai === 2}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            {selectedCoupon.trangThai === 2 ? "Đã lưu" : "Lưu"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center mt-12">
                <p className="text-gray-600">🎯 Mỗi tài khoản chỉ được quay 1 lần trong 24 giờ</p>
                {isLoggedIn && (
                  <p className="text-gray-500 text-sm mt-2">Số lần đã quay: {spinCount}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="promotions">
            <PersonalPromotionsList />
          </TabsContent>

          <TabsContent value="gapthu">
            <GapThu />
          </TabsContent>
        </Tabs>
      </div>

      {/* Winner Popup */}
      {showWinnerPopup && selectedVoucher && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center" style={{ animation: 'bounceIn 0.6s ease-out' }}>
            <button
              onClick={() => {
                setShowWinnerPopup(false);
                if (popupTimeoutRef.current) {
                  clearTimeout(popupTimeoutRef.current);
                  popupTimeoutRef.current = null;
                }
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-purple-600 mb-2">Chúc mừng!</h3>
              <p className="text-lg text-gray-600">Bạn đã trúng voucher</p>
            </div>

            {selectedVoucher.hinhAnh && (
              <img
                src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                alt={selectedVoucher.tenVoucher}
                className="w-full h-48 object-cover rounded-lg mx-auto mb-4"
                loading="eager"
              />
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-xl text-gray-800">{selectedVoucher.tenVoucher}</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {formatVoucherValue(selectedVoucher)}
                </p>
              </div>
              {selectedVoucher.moTa && (
                <p className="text-gray-600 text-sm italic">{selectedVoucher.moTa}</p>
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
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 border border-purple-200 rounded-lg p-2 text-center">
                  <span className="font-mono font-bold text-purple-600">
                    {selectedCoupon.maNhap}
                  </span>
                </div>
                <Button
                  onClick={() => handleSaveCoupon(selectedCoupon.id, selectedCoupon.maNhap)}
                  disabled={selectedCoupon.trangThai === 2}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {selectedCoupon.trangThai === 2 ? "Đã lưu" : "Lưu"}
                </Button>
              </div>
              <Button
                onClick={() => {
                  setShowWinnerPopup(false);
                  if (popupTimeoutRef.current) {
                    clearTimeout(popupTimeoutRef.current);
                    popupTimeoutRef.current = null;
                  }
                }}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white mt-4"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherUser;