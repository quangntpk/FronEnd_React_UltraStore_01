import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get("status");
    const orderId = query.get("orderId") || location.state?.orderId;
    const transactionId = query.get("transactionId");
    const message = query.get("message");

    console.log("Query params and state:", { status, orderId, transactionId, message, state: location.state });


    const isSuccessfulPayment = (status === "success" || status === "00") && orderId; 
    const isCODSuccess = location.state?.orderId && orderId;

    console.log("Payment conditions:", { isSuccessfulPayment, isCODSuccess });

    if (isSuccessfulPayment || isCODSuccess) {
      console.log("Showing toast for payment success");
      const toastId: string | number = toast.success("Thanh toán thành công!", {
        description: `Mã đơn hàng: ${orderId}${transactionId ? `, Mã giao dịch: ${transactionId}` : ""}`,
        action: {
          label: "Xem chi tiết",
          onClick: () => {
            console.log("Navigating to order-history with orderId:", orderId);
            navigate("/order-history", { state: { orderId } });
          },
        },
      });
      
      console.log("Scheduling navigation to home after 7 seconds");
      const timeoutId = setTimeout(() => {
        console.log("Navigating to home with orderId:", orderId);
        navigate("/", { state: { orderId } });
      }, 7000);

      return () => {
        clearTimeout(timeoutId);
        toast.dismiss(toastId);
      };
    } else {
      console.log("Redirect to order-history, condition failed:", { status, orderId });
      navigate("/order-history");
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Đang xử lý...</p>
    </div>
  );
};

export default PaymentSuccess;