import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Sparkles, Gift, Heart } from "lucide-react";

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get("status");
    const orderId = queryParams.get("orderId");
    const transactionId = queryParams.get("transactionId");

    // Debug để kiểm tra tham số URL
    console.log("PaymentSuccess URL Params:", {
      status,
      orderId,
      transactionId,
      rawQuery: location.search,
      statusCheck: status?.toLowerCase().trim() === "success",
    });

    if (status?.toLowerCase().trim() === "success" && orderId) {
      setIsSuccess(true);
      setOrderId(orderId);
      setTransactionId(transactionId);
      
      setTimeout(() => setShowConfetti(true), 500);

      toast.success(
        `Thanh toán VNPay thành công! Mã đơn hàng: ${orderId}`,
        {
          duration: 5000,
          className: "bg-green-500 text-white border border-green-700 shadow-lg",
        }
      );

      localStorage.removeItem("checkoutForm");
      localStorage.removeItem("showAddressModal");
      localStorage.removeItem("scrollY");


      const timer = setTimeout(() => {
        console.log("Navigating to home with clearCart");
        navigate("/", { state: { orderId, clearCart: true } });
      }, 10000); // 10 giây để người dùng đọc thông báo

      return () => clearTimeout(timer);
    } else {
      setIsSuccess(false);


      toast.error("Không tìm thấy thông tin thanh toán VNPay", {
        duration: 7000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg",
      });

      const timer = setTimeout(() => {
        console.log("Navigating to cart after error");
        navigate("/user/cart");
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const ConfettiPiece = ({ delay, left, color }: { delay: number; left: string; color: string }) => (
    <div
      className={`absolute w-3 h-3 ${color} opacity-80 animate-bounce`}
      style={{
        left,
        top: '-10px',
        animationDelay: `${delay}s`,
        animationDuration: '3s',
        animationIterationCount: 'infinite'
      }}
    />
  );


  const FloatingElement = ({ icon: Icon, delay, position }: { icon: any; delay: number; position: string }) => (
    <div
      className={`absolute ${position} text-yellow-400 opacity-60 animate-ping`}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '2s',
        animationIterationCount: 'infinite'
      }}
    >
      <Icon size={24} />
    </div>
  );


  if (isSuccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center relative">
          {/* Animated background circles */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse" />
            <div className="absolute top-10 right-0 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-0 left-1/2 w-20 h-20 bg-pink-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* Main loading spinner */}
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-300 border-t-blue-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-blue-400 opacity-30"></div>
          </div>
          
          <div className="mt-6 animate-pulse">
            <p className="text-xl text-gray-700 font-medium">Đang xử lý kết quả thanh toán...</p>
            <div className="flex justify-center mt-3 space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trang thành công
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating sparkles */}
          <FloatingElement icon={Sparkles} delay={0} position="top-20 left-20" />
          <FloatingElement icon={Heart} delay={1} position="top-32 right-32" />
          <FloatingElement icon={Gift} delay={2} position="bottom-40 left-40" />
          <FloatingElement icon={Sparkles} delay={1.5} position="bottom-32 right-20" />
          
          {/* Confetti */}
          {showConfetti && (
            <>
              {Array.from({ length: 20 }).map((_, i) => (
                <ConfettiPiece
                  key={i}
                  delay={i * 0.1}
                  left={`${Math.random() * 100}%`}
                  color={['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]}
                />
              ))}
            </>
          )}
          
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-green-300 to-blue-300 rounded-full opacity-10 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center relative transform animate-scale-in border border-white/20">
          {/* Success icon with progressive animation */}
          <div className="relative mb-6">
            {/* Background ping effect */}
            <div className="absolute inset-0 animate-ping">
              <div className="w-20 h-20 rounded-full border-4 border-green-400 mx-auto opacity-30" />
            </div>
            
            {/* Custom animated checkmark */}
            <div className="relative z-10 mx-auto w-20 h-20">
              <svg 
                className="w-20 h-20 mx-auto" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circle animation */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#10b981"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  className="animate-draw-circle"
                />
                {/* Checkmark animation */}
                <path
                  d="M25 50 L40 65 L75 30"
                  stroke="#10b981"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-check"
                />
              </svg>
            </div>
            
            {/* Radiating circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border-2 border-green-300 rounded-full animate-scale-pulse opacity-20" style={{ animationDelay: '1.5s' }} />
              <div className="absolute w-32 h-32 border border-green-200 rounded-full animate-scale-pulse opacity-10" style={{ animationDelay: '2s' }} />
            </div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 animate-slide-up">
            Thanh toán VNPay thành công! 🎉
          </h1>
          
          <div className="space-y-3 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 transform hover:scale-105 transition-transform">
              <p className="text-gray-700">Mã đơn hàng: <span className="font-bold text-green-700">{orderId}</span></p>
            </div>
            {transactionId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 transform hover:scale-105 transition-transform">
                <p className="text-gray-700">Mã giao dịch: <span className="font-bold text-blue-700">{transactionId}</span></p>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-8 text-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi! ❤️
          </p>
          
          <Button
            onClick={() => {
              console.log("Navigating to order details with orderId:", orderId);
              navigate("/user/orders", { state: { orderId } });
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '0.6s' }}
          >
            <Gift className="w-5 h-5 mr-2" />
            Xem chi tiết đơn hàng
          </Button>
          
          {/* Progress indicator for auto redirect */}
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <p className="text-sm text-gray-500 mb-2">Tự động chuyển về trang chủ sau 10 giây...</p>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full animate-progress" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trang lỗi
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 relative overflow-hidden">
      {/* Animated background elements for error page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-red-200 to-pink-200 rounded-full opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-orange-200 to-red-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center relative transform animate-shake border border-white/20">
        {/* Error icon with animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping">
            <XCircle className="w-20 h-20 text-red-400 mx-auto opacity-30" />
          </div>
          <XCircle className="w-20 h-20 text-red-500 mx-auto relative z-10 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-slide-up">
          Lỗi thanh toán VNPay
        </h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-gray-700 text-lg">Không tìm thấy thông tin thanh toán. Vui lòng thử lại. 😔</p>
        </div>
        
        <Button
          onClick={() => {
            console.log("Navigating back to cart");
            navigate("/user/cart");
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          Quay lại giỏ hàng
        </Button>
        
        {/* Progress indicator for auto redirect */}
        <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-gray-500 mb-2">Tự động chuyển về giỏ hàng sau 7 giây...</p>
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 h-1 rounded-full animate-progress-error" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom styles để thêm vào CSS
const customStyles = `
@keyframes draw-circle {
  0% {
    stroke-dasharray: 0 283;
    transform: rotate(-90deg);
    transform-origin: center;
  }
  50% {
    stroke-dasharray: 283 283;
    transform: rotate(-90deg);
    transform-origin: center;
  }
  100% {
    stroke-dasharray: 283 283;
    transform: rotate(-90deg);
    transform-origin: center;
  }
}

@keyframes draw-check {
  0% {
    stroke-dasharray: 0 100;
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  51% {
    opacity: 1;
  }
  100% {
    stroke-dasharray: 100 100;
    opacity: 1;
  }
}

@keyframes scale-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce-once {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes scale-pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@keyframes slide-up {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes progress {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

@keyframes progress-error {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

.animate-draw-circle {
  animation: draw-circle 2s ease-out forwards;
  stroke-dasharray: 0 283;
}

.animate-draw-check {
  animation: draw-check 1.5s ease-out forwards;
  animation-delay: 1s;
  stroke-dasharray: 0 100;
}

.animate-scale-in {
  animation: scale-in 0.6s ease-out;
}

.animate-bounce-once {
  animation: bounce-once 1s ease-out;
}

.animate-scale-pulse {
  animation: scale-pulse 2s ease-out infinite;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out both;
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out both;
}

.animate-shake {
  animation: shake 0.5s ease-out, scale-in 0.6s ease-out;
}

.animate-progress {
  animation: progress 10s linear;
}

.animate-progress-error {
  animation: progress-error 7s linear;
}
`;

export default PaymentSuccess;