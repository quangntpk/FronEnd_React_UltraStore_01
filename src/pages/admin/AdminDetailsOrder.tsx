import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ComboProduct {
  tenSanPham: string | null;
  soLuong: number;
  gia: number | null;
  thanhTien: number | null;
  loaiSanPham: string | null;
  thuongHieu: string | null;
  maSanPham: string | null;
  hinhAnh?: string | null;
}

interface Combo {
  tenCombo: string;
  giaCombo: number;
  sanPhamsTrongCombo: ComboProduct[];
}

interface OrderDetail {
  maChiTietDh: number;
  laCombo: boolean;
  tenSanPham: string | null;
  soLuong: number;
  gia: number | null;
  thanhTien: number | null;
  combo: Combo | null;
  loaiSanPham: string | null;
  thuongHieu: string | null;
  hinhAnh?: string | null;
}

interface UserInfo {
  tenNguoiNhan: string;
  diaChi: string;
  sdt: string;
  tenNguoiDat: string;
}

interface OrderInfo {
  ngayDat: string;
  trangThai: number;
  thanhToan: number;
  hinhThucThanhToan: string;
}

interface OrderDetailsResponse {
  maDonHang: number;
  tenNguoiNhan: string;
  sanPhams: OrderDetail[];
  thongTinNguoiDung: UserInfo;
  thongTinDonHang: OrderInfo;
}

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, onClose }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching order details for orderId:', orderId);
        const response = await axios.get<OrderDetailsResponse>(`http://localhost:5261/api/orders/detail/${orderId}`);
        console.log('API Response:', response.data);

        const data = response.data;

        if (!data) {
          throw new Error('Không tìm thấy chi tiết đơn hàng trong phản hồi');
        }

        const orderData: OrderDetailsResponse = {
          maDonHang: data.maDonHang,
          tenNguoiNhan: data.tenNguoiNhan,
          sanPhams: data.sanPhams || [],
          thongTinNguoiDung: data.thongTinNguoiDung || {
            tenNguoiNhan: '',
            diaChi: '',
            sdt: '',
            tenNguoiDat: '',
          },
          thongTinDonHang: data.thongTinDonHang || {
            ngayDat: '',
            trangThai: 0,
            thanhToan: 0,
            hinhThucThanhToan: '',
          },
        };

        setOrderDetails(orderData);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError(error.response?.data?.message || 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">Chi tiết đơn hàng</DialogTitle>
            <DialogDescription>Đang tải dữ liệu chi tiết đơn hàng...</DialogDescription>
          </DialogHeader>
          <div>Đang tải...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">Chi tiết đơn hàng</DialogTitle>
            <DialogDescription>Lỗi khi tải chi tiết đơn hàng</DialogDescription>
          </DialogHeader>
          <div className="text-red-500">{error}</div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!orderDetails) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Chi tiết đơn hàng {orderDetails.maDonHang}</DialogTitle>
          <DialogDescription>Thông tin chi tiết về đơn hàng của {orderDetails.thongTinNguoiDung.tenNguoiDat}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead>ID</TableHead>
                  <TableHead>Hình ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderDetails.sanPhams.length > 0 ? (
                  orderDetails.sanPhams.map(item => (
                    <TableRow key={item.maChiTietDh}>
                      <TableCell>{item.maChiTietDh}</TableCell>
                      <TableCell>
                        {item.hinhAnh ? (
                          <img src={item.hinhAnh} alt={item.tenSanPham || 'Sản phẩm'} className="w-16 h-16 object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500">
                            Không có hình
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.laCombo ? (
                          <div>
                            <strong>{item.combo?.tenCombo || "Không có tên combo"}</strong>
                            {item.combo?.sanPhamsTrongCombo?.length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {item.combo.sanPhamsTrongCombo.map((sp, index) => (
                                  <li key={index}>
                                    <strong>{index + 1}.</strong> {sp.tenSanPham || "Không có tên sản phẩm"} <br />
                                    Loại Sản Phẩm: {sp.loaiSanPham || "Không xác định"} <br />
                                    Thương Hiệu: {sp.thuongHieu || "Không xác định"} <br />
                                    (Số lượng: {sp.soLuong})
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ margin: 0, paddingLeft: 20 }}>Không có sản phẩm trong combo</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <strong>{item.tenSanPham || "Không có tên sản phẩm"}</strong><br />
                            <strong>Loại Sản Phẩm:</strong> {item.loaiSanPham || "Không xác định"}<br />
                            <strong>Thương Hiệu:</strong> {item.thuongHieu || "Không xác định"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.soLuong}</TableCell>
                      <TableCell>
                        {item.gia != null ? `${item.gia.toLocaleString('vi-VN')} VNĐ` : "Không xác định"}
                      </TableCell>
                      <TableCell>
                        {item.thanhTien != null ? `${item.thanhTien.toLocaleString('vi-VN')} VNĐ` : "Không xác định"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Không có sản phẩm trong đơn hàng này.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Thông tin người dùng</h3>
              <p><span className="font-semibold">Tên người nhận:</span> {orderDetails.thongTinNguoiDung.tenNguoiNhan}</p>
              <p><span className="font-semibold">Địa chỉ:</span> {orderDetails.thongTinNguoiDung.diaChi}</p>
              <p><span className="font-semibold">Số điện thoại:</span> {orderDetails.thongTinNguoiDung.sdt}</p>
              <p><span className="font-semibold">Tên người đặt:</span> {orderDetails.thongTinNguoiDung.tenNguoiDat}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Thông tin đơn hàng</h3>
              <p><span className="font-semibold">Ngày đặt:</span> {orderDetails.thongTinDonHang.ngayDat}</p>
              <p><span className="font-semibold">Trạng thái:</span> {
                orderDetails.thongTinDonHang.trangThai === 0 ? 'Chưa xác nhận' :
                orderDetails.thongTinDonHang.trangThai === 1 ? 'Đang xử lý' :
                orderDetails.thongTinDonHang.trangThai === 2 ? 'Đang giao hàng' :
                orderDetails.thongTinDonHang.trangThai === 3 ? 'Hoàn thành' :
                orderDetails.thongTinDonHang.trangThai === 4 ? 'Đã hủy' : 'Không xác định'
              }</p>
              <p><span className="font-semibold">Thanh toán:</span> {orderDetails.thongTinDonHang.thanhToan === 1 ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
              <p><span className="font-semibold">Hình thức thanh toán:</span> {orderDetails.thongTinDonHang.hinhThucThanhToan || 'Không xác định'}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;