import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const VnpayReturn: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    const vnp_TxnRef = searchParams.get("vnp_TxnRef"); // Mã tham chiếu giao dịch (thường là cartId hoặc orderId)
    const vnp_Amount = searchParams.get("vnp_Amount"); // Số tiền thanh toán

    if (vnp_ResponseCode === "00") {
      // Thanh toán thành công
      toast.success(`Thanh toán VNPay thành công! Mã đơn hàng: ${vnp_TxnRef}`, {
        description: "Cảm ơn bạn đã mua sắm. Vui lòng kiểm tra đơn hàng trong mục Lịch sử mua hàng.",
        duration: 5000,
        action: {
          label: "Xem chi tiết",
          onClick: () => navigate("/user/orders", { state: { orderId: vnp_TxnRef } }),
        },
      });

      // Reset giỏ hàng và các trạng thái (nếu cần)
      localStorage.removeItem("checkoutForm");
      localStorage.removeItem("showAddressModal");
      localStorage.removeItem("scrollY");
      navigate("/", { state: { orderId: vnp_TxnRef } });
    } else {
      // Thanh toán thất bại
      toast.error(`Thanh toán VNPay thất bại. Mã lỗi: ${vnp_ResponseCode}`);
      navigate("/cart");
    }
  }, [location, navigate]);

  return <div>Đang xử lý phản hồi từ VNPay...</div>; // Có thể thêm spinner nếu muốn
};

export default VnpayReturn;