import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";


import OrderEmailPage from "@/components/user/OrderEmailPage";

const HoaDonPage = () => {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      axios.get(`http://localhost:5261/api/user/orders/bill/${orderId}`)
        .then((res) => setOrder(res.data))
        .catch(() => setOrder(null));
    }
  }, [orderId]);

  if (!order) return <p className="text-center mt-10">Đang tải dữ liệu...</p>;

  return <OrderEmailPage order={order} />;
};

export default HoaDonPage;