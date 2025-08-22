import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Clock, Star } from "lucide-react";
import { openDB, DBSchema, IDBPDatabase } from "idb";

// --- Interfaces ---
interface Coupon {
  id: number;
  maNhap: string;
  trangThai: number;
  maNguoiDung?: string | null;
}

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
  coupons?: Coupon[];
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

interface Ball {
  dom: HTMLElement;
  x: number;
  y: number;
  rotate: number;
  size: number;
  setX: (value: number) => void;
  setY: (value: number) => void;
  setRotate: (value: number) => void;
}

interface ConfettiParticle {
  dom: HTMLSpanElement;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
}

// --- Constants ---
const APP_TITLE = import.meta.env.VITE_TITLE || "Gắp Thú May Mắn";
const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;
const SPEED = 1;

// --- Main Component ---
const GapThu: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [db, setDb] = useState<IDBPDatabase<MyDB> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWinnerPopup, setShowWinnerPopup] = useState<boolean>(false);
  const [spinCount, setSpinCount] = useState<number>(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [prizeBall, setPrizeBall] = useState<Ball | null>(null);
  const [started, setStarted] = useState<boolean>(false);
  const [showHint2, setShowHint2] = useState<boolean>(false);
  const [showVoucherDetails, setShowVoucherDetails] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const machineRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLImageElement>(null);
  const ballsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const jittersRef = useRef<NodeJS.Timeout[]>([]);
  const prizeContainerRef = useRef<HTMLDivElement>(null);

  // --- Helper Functions ---
  const getTyLeByValue = useCallback((giaTri: number): number => {
    if (giaTri >= 50) return 5;
    if (giaTri >= 30) return 10;
    if (giaTri >= 20) return 15;
    if (giaTri >= 10) return 25;
    return 45;
  }, []);

  const getTimeUntilNextSpin = useCallback((spinTime: number): number => {
    return Math.max(0, SPIN_COOLDOWN - (Date.now() - spinTime));
  }, []);

  const formatTimeLeft = useCallback((timeLeft: number): string => {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  }, []);

  const formatVoucherValue = useCallback((voucher: Voucher): string => {
    if (voucher.loaiVoucher === 0) return `Giảm ${voucher.giaTri}%`;
    if (voucher.loaiVoucher === 1) return `Giảm ${formatCondition(voucher.giaTri)}`;
    return "Miễn phí vận chuyển";
  }, []);

  const formatCondition = useCallback((condition: number): string => {
    return new Intl.NumberFormat("vi-VN").format(condition) + " VND";
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  }, []);

  // --- Animation Functions ---
  const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  const confetti = ($parent: HTMLElement): void => {
    const $container = document.createElement("div");
    $container.className = "gacha-confetti fixed inset-0 pointer-events-none z-[100] perspective-[100vmin]";
    const particles: ConfettiParticle[] = [];

    for (let i = 0; i < 100; i++) {
      const $particle = document.createElement("span");
      $particle.className = "gacha-confetti-particle absolute block";
      const settings: ConfettiParticle = {
        dom: $particle,
        x: 50 + Math.random() * 10 - 5,
        y: 50 + Math.random() * 10 - 5,
        speedX: Math.random() * 1 - 0.5,
        speedY: -2 + Math.random() * 1,
        size: 8 + Math.random() * 4,
      };
      
      $particle.style.backgroundColor = `hsl(${Math.random() * 360}deg, 80%, 60%)`;
      $particle.style.width = `${settings.size}px`;
      $particle.style.height = `${settings.size}px`;
      $particle.style.setProperty('--rx', String(Math.random() * 2 - 1));
      $particle.style.setProperty('--ry', String(Math.random() * 2 - 1));
      $particle.style.setProperty('--rz', String(Math.random() * 2 - 1));
      $particle.style.setProperty('--rs', String(Math.random() * 2 + 0.5));
      $particle.style.animation = `gacha-rotate linear ${Math.random() * 2 + 0.5}s infinite`;
      
      particles.push(settings);
      $container.appendChild($particle);
    }

    const update = (): void => {
      particles.forEach((config, i) => {
        if (config.y > 100) {
          particles.splice(i, 1);
          config.dom.remove();
        }
        config.dom.style.left = config.x + "%";
        config.dom.style.top = config.y + "%";
        config.x += config.speedX;
        config.y += config.speedY;
        config.speedY += 0.02;
      });
      if (particles.length) requestAnimationFrame(update);
      else $container.remove();
    };

    update();
    $parent.appendChild($container);
  };

  const createBalls = useCallback((): void => {
    if (!ballsRef.current) return;
    
    ballsRef.current.innerHTML = '';

    let id = 0;
    const createBall = (x: number, y: number, rotate = Math.floor(Math.random() * 360), hue = Math.floor(Math.random() * 360)): Ball => {
      const size = 8;
      const $ball = document.createElement("figure");
      $ball.className = "gacha-ball absolute rounded-full overflow-hidden";
      $ball.setAttribute("data-id", String(++id));
      $ball.style.width = `${size}vh`;
      $ball.style.height = `${size}vh`;
      $ball.style.backgroundColor = `hsl(${hue}deg, 80%, 70%)`;
      $ball.style.border = `0.8vh solid hsl(${hue}deg, 50%, 55%)`;

      const inner = document.createElement("div");
      inner.className = "gacha-ball-inner absolute rounded-full";
      inner.style.backgroundColor = `hsl(${hue + 20}deg, 50%, 90%)`;
      inner.style.width = "200%";
      inner.style.height = "200%";
      inner.style.top = "50%";
      inner.style.transform = "translate(-25%, -5%)";
      $ball.appendChild(inner);

      ballsRef.current!.appendChild($ball);

      const update = (): void => {
        $ball.style.left = `calc(${x} * (100% - ${size}vh))`;
        $ball.style.top = `calc(${y} * (100% - ${size}vh))`;
        $ball.style.transform = `rotate(${rotate}deg)`;
      };

      const ball: Ball = {
        dom: $ball,
        x,
        y,
        rotate,
        size,
        setX: (value: number) => {
          x = value;
          update();
        },
        setY: (value: number) => {
          y = value;
          update();
        },
        setRotate: (value: number) => {
          rotate = value;
          update();
        },
      };

      update();
      return ball;
    };

    const newBalls = [
      createBall(0.5, 0.6),
      createBall(0, 0.68),
      createBall(0.22, 0.65),
      createBall(0.7, 0.63),
      createBall(0.96, 0.66),
      createBall(0.75, 0.79),
      createBall(0.5, 0.8),
      createBall(0.9, 0.81),
      createBall(0, 0.82),
      createBall(1, 0.9),
      createBall(0.25, 0.85),
      createBall(0.9, 1),
      createBall(0.4, 1),
      createBall(0.65, 1),
      createBall(0.09, 1),
    ];

    setBalls(newBalls);
    setPrizeBall(newBalls[7]);
  }, []);

  const jitter = useCallback((): void => {
    balls.forEach(({ dom, rotate }, i) => {
      const duration = Math.random() * 0.1 + 0.05;
      const moveY = -(Math.random() * 6 + 2);
      const moveRotate = rotate - Math.random() * 10 - 5;

      const animate = (): void => {
        dom.style.transition = `transform ${duration}s ease-out`;
        dom.style.transform = `translateY(${moveY}vh) rotate(${rotate}deg)`;
        setTimeout(() => {
          dom.style.transition = `transform ${duration}s ease-in`;
          dom.style.transform = `translateY(0) rotate(${moveRotate}deg)`;
        }, duration * 1000);
      };

      const interval = setInterval(animate, duration * 2000);
      jittersRef.current.push(interval);
      animate();
    });

    if (machineRef.current) {
      const shakeInterval = setInterval(() => {
        if (machineRef.current) {
          machineRef.current.style.transform = "translateX(2px)";
          setTimeout(() => {
            if (machineRef.current) machineRef.current.style.transform = "translateX(0)";
          }, 100);
        }
      }, 200);
      jittersRef.current.push(shakeInterval);
    }
  }, [balls]);

  const stopJittering = useCallback(async (): Promise<void> => {
    jittersRef.current.forEach((interval) => clearInterval(interval));
    jittersRef.current = [];

    balls.forEach(({ dom, rotate }) => {
      dom.style.transition = "transform 0.1s";
      dom.style.transform = `translateY(0) rotate(${rotate}deg)`;
    });

    if (machineRef.current) {
      machineRef.current.style.transform = "translateX(0)";
    }

    await delay(200);
  }, [balls]);

  const pickup = useCallback(async (): Promise<void> => {
    if (!prizeBall?.dom) return;

    const rect = prizeBall.dom.getBoundingClientRect();
    const x = (rect.left / window.innerHeight) * 100;
    const y = (rect.top / window.innerHeight) * 100;

    if (prizeContainerRef.current) {
      const prizeBallContainer = prizeContainerRef.current.querySelector('.gacha-prize-ball-container');
      if (prizeBallContainer) {
        prizeBallContainer.appendChild(prizeBall.dom);
      }
    }

    prizeBall.dom.style.position = "absolute";
    prizeBall.dom.style.left = "0";
    prizeBall.dom.style.top = "0";
    prizeBall.dom.style.zIndex = "1000";
    prizeBall.dom.style.transform = `translate(${x}vh, ${y}vh) rotate(${prizeBall.rotate}deg)`;
    prizeBall.dom.style.transition = "all 1s ease-in-out";

    const gameLayer = document.querySelector('.gacha-game-layer');
    if (gameLayer) {
      (gameLayer as HTMLElement).style.filter = "brightness(0.6) saturate(0.8)";
      (gameLayer as HTMLElement).style.transition = "0.5s linear";
    }

    setTimeout(() => {
      if (prizeBall.dom) {
        prizeBall.dom.style.transform = "translate(50vw, 50vh) scale(2) rotate(-180deg)";
      }
    }, 100);

    setTimeout(() => {
      if (prizeBall.dom) {
        prizeBall.dom.style.transform = "translate(50vw, 50vh) scale(2.1, 1.9) rotate(-180deg)";
        setTimeout(() => {
          if (prizeBall.dom) {
            prizeBall.dom.style.transform = "translate(50vw, 50vh) scale(1.9, 2.1) rotate(-180deg)";
            setTimeout(() => {
              if (prizeBall.dom) {
                prizeBall.dom.style.transform = "translate(50vw, 50vh) scale(2.6, 1.6) rotate(-180deg)";
                setTimeout(() => {
                  if (prizeBall.dom) {
                    prizeBall.dom.style.transform = "translate(50vw, 50vh) scale(1.6, 2.4) rotate(-180deg)";
                    setTimeout(() => {
                      pop();
                    }, 100);
                  }
                }, 500);
              }
            }, 300);
          }
        }, 200);
      }
    }, 1000);
  }, [prizeBall]);

  const pop = useCallback((): void => {
    confetti(document.body);
    
    if (prizeBall?.dom) {
      prizeBall.dom.style.opacity = "0";
    }

    if (titleRef.current) {
      const titleElement = titleRef.current.querySelector('h2');
      if (titleElement && selectedVoucher) {
      
      }
    }

    setShowWinnerPopup(true);
    toast({
      title: "🎉 Chúc mừng!",
      description: `Bạn đã gắp được: ${selectedVoucher?.tenVoucher} (${selectedVoucher ? formatVoucherValue(selectedVoucher) : ''})`,
    });

    popupTimeoutRef.current = setTimeout(() => {
      setShowWinnerPopup(false);
      setShowVoucherDetails(true);
    }, 2000);
  }, [prizeBall, selectedVoucher, formatVoucherValue]);

  // --- Data Fetching and Initialization ---
  const fetchVouchers = useCallback(async (): Promise<void> => {
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
          const hasValidCoupon = voucher.coupons?.some((coupon) => coupon.trangThai === 0);
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

  const initDB = useCallback(async (): Promise<void> => {
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
  }, []);

  useEffect(() => {
    initDB();
  }, [initDB]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setIsLoggedIn(!!userData);
    setUserId(userData?.maNguoiDung || null);

    const loadDataFromDB = async (): Promise<void> => {
      if (!db || !userData?.maNguoiDung) return;

      try {
        const storedData = await db.get("userData", userData.maNguoiDung);
        if (storedData) {
          if (storedData.lastSpinTime) setLastSpinTime(storedData.lastSpinTime);
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

  useEffect(() => {
    if (!lastSpinTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = (): void => {
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

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading && vouchers.length > 0) {
      setTimeout(() => {
        createBalls();
      }, 500 * SPEED);
    }
  }, [loading, vouchers, createBalls, started]);

  // --- Game Logic ---
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

  const handleSpin = useCallback(async (): Promise<void> => {
    if (!isLoggedIn || !userId) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng đăng nhập để gắp thú may mắn!",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    if (timeLeft > 0 || isSpinning || vouchers.length === 0 || !db) {
      return;
    }

    setStarted(true);
    setShowHint2(false);
    setIsSpinning(true);
    setSelectedVoucher(null);
    setSelectedCoupon(null);
    setShowWinnerPopup(false);
    setShowVoucherDetails(false);

    try {
      const winningVoucher = calculateWinningVoucher();
      if (!winningVoucher) throw new Error("Không thể xác định voucher chiến thắng.");

      const winningCoupon = winningVoucher.coupons?.find((c) => c.trangThai === 0);
      if (!winningCoupon) throw new Error("Voucher chiến thắng không có coupon hợp lệ.");

      setSelectedVoucher(winningVoucher);
      setSelectedCoupon(winningCoupon);

      if (handleRef.current) {
        handleRef.current.style.transition = "transform 0.3s ease-in";
        handleRef.current.style.transform = "rotate(90deg)";

        setTimeout(async () => {
          jitter();
          await delay(2000 * SPEED);
          await stopJittering();

          if (prizeBall?.dom) {
            prizeBall.dom.style.transition = "transform 0.5s ease-in";
            prizeBall.dom.style.transform = "translateX(-3vh) rotate(" + (prizeBall.rotate + 10) + "deg)";
            
            setTimeout(() => {
              if (prizeBall?.dom) {
                prizeBall.dom.style.transform = "translateY(12vh) translateX(-3vh) rotate(" + (prizeBall.rotate + 10) + "deg)";
                setTimeout(() => {
                  if (prizeBall?.dom) {
                    prizeBall.dom.style.transform = "translateY(30vh) translateX(-3vh) rotate(" + (prizeBall.rotate + 10) + "deg)";
                    setTimeout(() => {
                      if (prizeBall?.dom) {
                        prizeBall.dom.style.transform = "translateY(29vh) translateX(-3vh) rotate(" + (prizeBall.rotate + 10) + "deg)";
                        setTimeout(() => {
                          if (prizeBall?.dom) {
                            prizeBall.dom.style.transform = "translateY(30vh) translateX(-3vh) rotate(" + (prizeBall.rotate + 10) + "deg)";
                            prizeBall.dom.style.cursor = "pointer";
                            
                            let shouldShowHint = true;
                            prizeBall.dom.onclick = () => {
                              if (prizeBall?.dom) {
                                prizeBall.dom.style.cursor = "default";
                                prizeBall.dom.onclick = null;
                              }
                              shouldShowHint = false;
                              setShowHint2(false);
                              pickup();

                              const currentTime = Date.now();
                              setLastSpinTime(currentTime);
                              setSpinCount((prev) => prev + 1);
                              if (db && userId) {
                                db.put("userData", { lastSpinTime: currentTime, spinCount: spinCount + 1 }, userId);
                              }
                            };

                            setTimeout(() => {
                              if (shouldShowHint) {
                                setShowHint2(true);
                              }
                            }, 2000);
                          }
                        }, 100);
                      }
                    }, 200);
                  }
                }, 500);
              }
            }, 500);
          }

          if (handleRef.current) {
            handleRef.current.style.transition = "transform 1s ease-out";
            handleRef.current.style.transform = "rotate(0deg)";
          }

          setIsSpinning(false);
        }, 300);
      }
    } catch (err: any) {
      console.error("Lỗi khi gắp:", err);
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
    navigate,
    jitter,
    stopJittering,
    pickup,
    prizeBall,
  ]);

  const handleSaveCoupon = useCallback(
    async (couponId: number, maNhap: string): Promise<void> => {
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

  // --- Render ---
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
       
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || vouchers.length === 0) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap");
        
        .gacha-main .gacha-container {
          width: 100%;
          height: auto;
          overflow: hidden;
          position: relative;
        }
        
        .gacha-game-layer {
          width: 100%;
          max-width: 360px;
          height: 600px;
          overflow: visible;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: transparent;
          margin: 0 auto;
          transform: scale(0.75);
        }
        
        .gacha-machine-container {
          position: relative;
          white-space: nowrap;
        }
        
        .gacha-machine {
          position: relative;
          z-index: 1;
          max-height: 85%;
          pointer-events: none;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
        }
        
        .gacha-machine-title {
          position: absolute;
          display: block;
          top: 8%;
          width: 100%;
          text-align: center;
          font-size: 1.8rem;
          font-weight: bold;
          z-index: 3;
          color: #fff;
          text-shadow: 0px 0px 10px #ad8bd6, 0px 0px 20px #ad8bd6, 0px 2px 4px rgba(0, 0, 0, 0.3);
          filter: drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.2));
        }
        
        .gacha-machine-title span {
          animation: gacha-blink 1.2s linear infinite;
        }
        
        .gacha-machine-title span:nth-child(1) { animation-delay: 0.1s; }
        .gacha-machine-title span:nth-child(2) { animation-delay: 0.2s; }
        .gacha-machine-title span:nth-child(3) { animation-delay: 0.3s; }
        .gacha-machine-title span:nth-child(4) { animation-delay: 0.4s; }
        .gacha-machine-title span:nth-child(5) { animation-delay: 0.5s; }
        .gacha-machine-title span:nth-child(6) { animation-delay: 0.6s; }
        .gacha-machine-title span:nth-child(7) { animation-delay: 0.7s; }
        
        .gacha-handle {
          z-index: 3;
          position: absolute;
          height: 4.5%;
          left: 13%;
          top: 69%;
          cursor: pointer;
          transition: all 0.2s ease;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }
        
        .gacha-handle:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
        }
        
        .gacha-balls {
          position: absolute;
          top: 22%;
          left: 2%;
          width: 96%;
          height: 34.5%;
        }
        
        .gacha-ui-layer {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          pointer-events: none;
        }
        
        .gacha-title-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 10;
        }
        
        .gacha-title {
          transform: translateY(80%);
        }
        
        .gacha-title h2 {
          text-shadow: 0px 0px 10px #f06e5b, 0px 0px 20px #f06e5b;
          filter: drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.3));
          text-align: center;
          font-size: 1.6rem;
          font-weight: bold;
          color: #fff;
        }
        
        .gacha-prize-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .gacha-prize-ball-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .gacha-prize-reward-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .gacha-prize-reward-container > * {
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .gacha-shine img {
          height: 100%;
          animation: gacha-spin linear 5s infinite;
        }
        
        .gacha-ball {
          width: 8%;
          height: 8%;
          border-radius: 100%;
          position: absolute;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        
        .gacha-ball:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }
        
        .gacha-ball::after {
          content: "";
          display: block;
          position: absolute;
          top: 50%;
          height: 200%;
          width: 200%;
          border-radius: 100%;
          transform: translate(-25%, -5%);
        }
        
        .gacha-wiggle {
          animation: gacha-wiggle 2s ease-in-out infinite;
        }
        
        @keyframes gacha-blink {
          0% { color: #ffc7e5; text-shadow: 0px 0px 10px #ffc7e5, 0px 0px 20px #ffc7e5; }
          50% { color: #fcff33; text-shadow: 0px 0px 10px #fcff33, 0px 0px 20px #fcff33; }
          100% { color: #ffc7e5; text-shadow: 0px 0px 10px #ffc7e5, 0px 0px 20px #ffc7e5; }
        }
        
        @keyframes gacha-wiggle {
          0% { transform: rotate(-3deg) scale(1); }
          25% { transform: rotate(3deg) scale(1.02); }
          50% { transform: rotate(-2deg) scale(1); }
          75% { transform: rotate(2deg) scale(1.01); }
          100% { transform: rotate(-3deg) scale(1); }
        }
        
        @keyframes gacha-spin {
          from { transform: rotate(1turn); }
          to { transform: rotate(0turn); }
        }
        
        @keyframes gacha-rotate {
          from { transform: rotate3d(var(--rx), var(--ry), var(--rz), 0turn); }
          to { transform: rotate3d(var(--rx), var(--ry), var(--rz), 1turn); }
        }
        
        .gacha-confetti span {
          display: block;
          position: absolute;
          background-color: blue;
          animation: gacha-rotate linear infinite;
        }

        @keyframes gacha-bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .gacha-animate-bounceIn { animation: gacha-bounceIn 0.6s ease-out; }
        
        @keyframes gacha-animate-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .gacha-animate-spin { animation: gacha-animate-spin 1s linear infinite; }
      `}</style>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {APP_TITLE}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Gắp để nhận ngay mã giảm giá hoặc miễn phí vận chuyển!
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            <div className="relative flex-shrink-0">
              <div className="gacha-game-layer">
                <div className="gacha-machine-container" ref={machineRef}>
                  <div className="gacha-balls" ref={ballsRef}></div>
                  <img className="gacha-machine" src="https://assets.codepen.io/2509128/gotcha.svg" alt="Gacha Machine" />
                  <div className="gacha-machine-title">
                    {[...APP_TITLE].map((char, i) => (
                      <span key={i}>{char}</span>
                    ))}
                  </div>
                  <img 
                    className="gacha-handle" 
                    src="https://assets.codepen.io/2509128/handle.svg" 
                    alt="Handle"
                    ref={handleRef}
                    onClick={handleSpin}
                    style={{ cursor: isLoggedIn && timeLeft === 0 && !isSpinning ? 'pointer' : 'default' }}
                  />
                </div>
                <div className="gacha-ui-layer">
                  <div className="gacha-title-container">
                    <div className="gacha-title" ref={titleRef}>
                      <h2 className="gacha-wiggle">
                  
                      </h2>
                    </div>
                  </div>
                  <div className="gacha-prize-container" ref={prizeContainerRef}>
                    <div className="gacha-prize-ball-container"></div>
                    <div className="gacha-prize-reward-container">
                      <div className="gacha-shine">
                        <img src="https://assets.codepen.io/2509128/shine.png" alt="Shine" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                {!isLoggedIn ? (
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate("/auth/login")}
                      className="px-10 py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Star className="w-6 h-6 mr-3" />
                      Đăng nhập để gắp
                    </Button>
                    <p className="text-sm text-gray-500">Đăng nhập để bắt đầu gắp thú may mắn!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={handleSpin}
                      disabled={isSpinning || timeLeft > 0}
                      className={`px-10 py-4 text-xl font-bold rounded-2xl shadow-lg transform transition-all duration-200 ${
                        !isSpinning && timeLeft <= 0
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-xl hover:scale-105'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isSpinning ? (
                        <>
                          <div className="gacha-animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3 inline-block"></div>
                          Đang gắp...
                        </>
                      ) : timeLeft > 0 ? (
                        <>
                          <Clock className="w-6 h-6 mr-3 inline-block" />
                          Chờ {formatTimeLeft(timeLeft)}
                        </>
                      ) : (
                        <>
                          <Star className="w-6 h-6 mr-3 inline-block" />
                          Gắp ngay
                        </>
                      )}
                    </Button>
                    {timeLeft <= 0 && !isSpinning && (
                      <p className="text-sm text-gray-500">Click vào cần gắp để bắt đầu!</p>
                    )}
                  </div>
                )}
              </div>

              {selectedVoucher && selectedCoupon && showVoucherDetails && !showWinnerPopup && (
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
          
          <div className="text-center mt-12 bg-white/50 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-gray-700 font-medium">🎯 Mỗi tài khoản chỉ được gắp 1 lần trong 24 giờ</p>
            {isLoggedIn && (
              <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                Số lần đã gắp: <span className="font-bold text-purple-600">{spinCount}</span>
              </p>
            )}
          </div>
        </div>

        {showWinnerPopup && selectedVoucher && selectedCoupon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center gacha-animate-bounceIn">
              <button
                onClick={() => {
                  setShowWinnerPopup(false);
                  if (popupTimeoutRef.current) {
                    clearTimeout(popupTimeoutRef.current);
                    popupTimeoutRef.current = null;
                  }
                  setShowVoucherDetails(true);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-purple-600 mb-2">Chúc mừng!</h3>
                <p className="text-lg text-gray-600">Bạn đã gắp được voucher</p>
              </div>

              {selectedVoucher.hinhAnh && (
                <img
                  src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                  alt={selectedVoucher.tenVoucher}
                  className="w-full h-48 object-cover rounded-lg mb-4"
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
                    setShowVoucherDetails(true);
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
    </div>
  );
};

export default GapThu;