import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams, Link } from "react-router-dom";

/* ---------- Kiểu dữ liệu ---------- */
interface SanPham {
  maSanPhamNavigation?: {
    tenSanPham?: string;
    hinhAnhs?: { link: string }[];
  };
  soLuong: number;
  gia: number;
  thanhTien: number;
}

interface Order {
  maDonHang: number;
  tenNguoiNhan: string;
  sdt: string;
  diaChi: string;
  finalAmount: number;
  discountAmount: number;
  shippingFee: number;
  ngayDat: string;
  chiTietDonHangs: SanPham[];
}

/* ---------- Props ---------- */
interface Props {
  /** Có thể truyền order (từ API cha), hoặc không truyền thì chỉ hiển thị mã đơn */
  order?: Partial<Order>;
}

/* ---------- Component ---------- */
const OrderEmailPage: React.FC<Props> = ({ order = {} }) => {
  /* 1. Lấy orderId ngay từ path /user/hoadon/:orderId */
  const { orderId } = useParams<{ orderId?: string }>();

  /* 2. Ưu tiên orderId trên URL, fallback về order.maDonHang (nếu có) */
  const maDonHang = orderId ? Number(orderId) : order.maDonHang ?? 0;

  /* 3. Tách các trường khác từ prop order (nếu được truyền) */
  const {
    tenNguoiNhan = "",
    sdt = "",
    diaChi = "",
    finalAmount = 0,
    discountAmount = 0,
    shippingFee = 0,
    ngayDat = new Date().toISOString(),
    chiTietDonHangs = [],
  } = order;

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("vi-VN")}₫`;
  console.log(chiTietDonHangs)
  /* ---------- JSX ---------- */
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-pink-600 mb-2 text-center">
          Đơn hàng đã được xác nhận
        </h1>

        {tenNguoiNhan && (
          <p className="text-sm text-center text-gray-600 mb-6">
            Cảm ơn <strong>{tenNguoiNhan}</strong> đã đặt hàng tại UltraStore!
          </p>
        )}

        {/* Danh sách sản phẩm (chỉ hiện khi có) */}
        {chiTietDonHangs.length > 0 && (
          <div className="space-y-4">
            {chiTietDonHangs.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 border-b pb-3">
                <img
                  src={
                    item.maSanPhamNavigation?.hinhAnhs?.[0]?.link ||
                    "https://via.placeholder.com/64"
                  }
                  alt="product"
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1 text-sm">
                  <p className="font-semibold truncate">
                    {item.maSanPhamNavigation?.tenSanPham ||
                      "Sản phẩm không xác định"}
                  </p>
                  <p className="text-gray-500">
                    {item.soLuong} × {formatCurrency(item.gia)}
                  </p>
                  <p className="font-medium">
                    {formatCurrency(item.thanhTien)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tổng tiền */}
        <div className="mt-6 border-t pt-4 space-y-1 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Tổng phụ:</span>
            <span>
              {formatCurrency(
                chiTietDonHangs.reduce(
                  (sum, item) => sum + (item.thanhTien || 0),
                  0
                )
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Vận chuyển:</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Giảm giá:</span>
            <span>{formatCurrency(discountAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        {/* Địa chỉ giao hàng */}
        {diaChi && (
          <div className="mt-6 text-sm text-gray-700">
            <p className="mb-1">Địa chỉ giao hàng:</p>
            <p>{tenNguoiNhan}</p>
            <p>{sdt}</p>
            <p>{diaChi}</p>
          </div>
        )}

        {/* Thông tin đơn + QR */}
        <div className="mt-6 text-sm text-gray-600">
          <p>
            Mã đơn hàng:{" "}
            <strong>ORD-{maDonHang.toString().padStart(5, "0")}</strong>
          </p>
          <p>Ngày đặt: {new Date(ngayDat).toLocaleString("vi-VN")}</p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm mb-2 text-gray-700">
            Quét mã QR để xem hoá đơn trực tuyến:
          </p>
          <QRCodeCanvas
            value={`https://fashionhub.name.vn/user/hoadon/${maDonHang}`}
            size={128}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin
          />
        </div>
      </div>
    </div>
  );
};

export default OrderEmailPage;
