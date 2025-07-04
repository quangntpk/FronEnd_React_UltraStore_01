import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  tenSanPham: string;
  maThuongHieu: string;
  loaiSanPham: string;
  mauSac: string;
  moTa: string | null;
  chatLieu: string;
  details: { kichThuoc: string; soLuong: number; gia: number }[];
  hinhAnhs: string[];
}

interface ComboView {
  maCombo: number;
  name: string;
  hinhAnh: string;
  moTa: string;
  gia: number;
  trangThai: boolean;
  soLuong: number;
  ngayTao: string;
}

const parseMaSanPham = (ma: string | null | undefined) => {
  if (!ma || !ma.includes('_')) return null;
  const parts = ma.split('_');
  if (parts.length !== 3) return null;
  return {
    maSanPham: parts[0],
    maMau: parts[1],
    kichThuoc: parts[2]
  };
};

const getFirstValidImage = (hinhAnhs: string[]): string | null => {
  for (const hinhAnh of hinhAnhs) {
    if (hinhAnh && hinhAnh.trim() && !hinhAnh.includes('MÃ HÓA H')) {
      return hinhAnh;
    }
  }
  return null;
};

interface ComboProduct {
  tenSanPham: string | null;
  soLuong: number;
  gia: number | null;
  thanhTien: number | null;
  loaiSanPham: string | null;
  thuongHieu: string | null;
  maSanPham: string | null;
  maSanPham1?: string | null;
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
  maSanPham?: string | null;
  maCombo?: number | null;
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

interface ApiOrder {
  maDonHang: number;
  tenNguoiNhan: string;
  sanPhams: OrderDetail[];
  thongTinNguoiDung: UserInfo;
  thongTinDonHang?: OrderInfo;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  finalAmount: number;
  tongTien: number;
}

interface OrderDetailsResponse {
  maDonHang: number;
  tenNguoiNhan: string;
  sanPhams: OrderDetail[];
  thongTinNguoiDung: UserInfo;
  thongTinDonHang: OrderInfo;
  tongTien: number;
  finalAmount: number;
}

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, onClose }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
  const [productDetails, setProductDetails] = useState<Map<string, Product>>(new Map());
  const [comboDetails, setComboDetails] = useState<Map<number, ComboView>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderRes = await axios.get<ApiOrder[]>(
          `http://localhost:5261/api/orders/${orderId}`
        );

        const raw = orderRes.data[0];
        if (!raw) throw new Error("Không có dữ liệu đơn hàng");

        const orderMapped: OrderDetailsResponse = {
          maDonHang: raw.maDonHang,
          tenNguoiNhan: raw.tenNguoiNhan,
          sanPhams: raw.sanPhams ?? [],
          thongTinNguoiDung: raw.thongTinNguoiDung ?? {
            tenNguoiNhan: "",
            diaChi: "",
            sdt: "",
            tenNguoiDat: "",
          },
          thongTinDonHang: {
            ngayDat: raw.thongTinDonHang?.ngayDat ?? raw.ngayDat,
            trangThai: raw.thongTinDonHang?.trangThai ?? raw.trangThaiDonHang ?? 0,
            thanhToan: raw.thongTinDonHang?.thanhToan ?? raw.trangThaiThanhToan ?? 0,
            hinhThucThanhToan: raw.thongTinDonHang?.hinhThucThanhToan ?? raw.hinhThucThanhToan ?? "",
          },
          tongTien: raw.tongTien,
          finalAmount: raw.finalAmount,
        };
        setOrderDetails(orderMapped);

        // Lấy thông tin sản phẩm đơn lẻ
        const productPromises = orderMapped.sanPhams
          .filter(item => !item.laCombo && item.maSanPham)
          .map(async (item) => {
            try {
              const productRes = await axios.get<Product[]>(
                `http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${item.maSanPham}`
              );
              const product = productRes.data[0];
              if (product) {
                return [item.maSanPham!, product] as [string, Product];
              }
            } catch (err) {
              console.error(`Lỗi khi lấy sản phẩm ${item.maSanPham}:`, err);
            }
            return null;
          });

        // Lấy thông tin sản phẩm trong combo
        const comboProductPromises = orderMapped.sanPhams
          .filter(item => item.laCombo && item.combo?.sanPhamsTrongCombo)
          .flatMap(item => item.combo!.sanPhamsTrongCombo)
          .filter(sp => sp.maSanPham || sp.maSanPham1)
          .map(async (sp) => {
            try {
              const productId = sp.maSanPham1 || sp.maSanPham;
              const productRes = await axios.get<Product[]>(
                `http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${productId}`
              );
              const product = productRes.data[0];
              if (product) {
                return [productId!, product] as [string, Product];
              }
            } catch (err) {
              console.error(`Lỗi khi lấy sản phẩm combo ${sp.maSanPham1 || sp.maSanPham}:`, err);
            }
            return null;
          });

        const allProductDetails = await Promise.all([...productPromises, ...comboProductPromises]);
        const productMap = new Map<string, Product>(
          allProductDetails.filter((p): p is [string, Product] => p !== null)
        );
        setProductDetails(productMap);

        // Lấy thông tin combo
        const comboPromises = orderMapped.sanPhams
          .filter(item => item.laCombo && item.maCombo)
          .map(async (item) => {
            try {
              const comboRes = await axios.get<ComboView[]>(
                `http://localhost:5261/api/Combo/ComboSanPhamView?id=${item.maCombo}`
              );
              const combo = comboRes.data[0];
              if (combo) {
                return [item.maCombo!, combo] as [number, ComboView];
              }
            } catch (err) {
              console.error(`Lỗi khi lấy combo ${item.maCombo}:`, err);
            }
            return null;
          });

        const allComboDetails = await Promise.all(comboPromises);
        const comboMap = new Map<number, ComboView>(
          allComboDetails.filter((c): c is [number, ComboView] => c !== null)
        );
        setComboDetails(comboMap);

        // Debug log
        console.log('Product Map:', productMap);
        console.log('Combo Map:', comboMap);
        console.log('Order Details:', orderMapped);

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        setError(message);
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading || !orderDetails) {
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
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Chi tiết đơn hàng {orderDetails.maDonHang}</DialogTitle>
          <DialogDescription>Thông tin đơn hàng của {orderDetails.thongTinNguoiDung.tenNguoiDat}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead>ID</TableHead>
                  <TableHead>Hình ảnh</TableHead>
                  <TableHead>Tên Sản Phẩm / Combo</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderDetails.sanPhams.length > 0 ? (
                  orderDetails.sanPhams.map(item => {
                    const parsedSingle = parseMaSanPham(item.maSanPham);
                    const product = item.maSanPham ? productDetails.get(item.maSanPham) : null;
                    const combo = item.maCombo ? comboDetails.get(item.maCombo) : null;
                    
                    return (
                      <TableRow key={item.maChiTietDh}>
                        <TableCell>{item.maChiTietDh}</TableCell>
                        <TableCell>
                          {item.laCombo && combo && combo.hinhAnh ? (
                            <img
                              src={`data:image/jpeg;base64,${combo.hinhAnh}`}
                              alt={combo.name}
                              className="w-16 h-16 object-cover"
                            />
                          ) : !item.laCombo && product && product.hinhAnhs && getFirstValidImage(product.hinhAnhs) ? (
                            <img
                              src={`data:image/jpeg;base64,${getFirstValidImage(product.hinhAnhs)}`}
                              alt={product.tenSanPham}
                              className="w-16 h-16 object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500">
                              Không có hình
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.laCombo ? (
                            <div>
                              <strong>{combo?.name || item.combo?.tenCombo || "Combo không xác định"}</strong>
                              {item.combo?.sanPhamsTrongCombo && item.combo.sanPhamsTrongCombo.length > 0 && (
                                <ul className="pl-4 mt-1 space-y-1">
                                  {item.combo.sanPhamsTrongCombo.map((sp, index) => {
                                    const productId = sp.maSanPham1 || sp.maSanPham;
                                    const parsedCombo = parseMaSanPham(productId);
                                    const comboProduct = productId ? productDetails.get(productId) : null;
                                    
                                    return (
                                      <li key={index} className="text-sm">
                                        <strong>{index + 1}. {comboProduct?.tenSanPham || sp.tenSanPham || "Sản phẩm không xác định"}</strong><br />
                                        {parsedCombo && (
                                          <span>
                                            ➤ Màu: <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: `#${parsedCombo.maMau}` }}></span> ({parsedCombo.maMau})<br />
                                            ➤ Kích thước: {parsedCombo.kichThuoc}<br />
                                          </span>
                                        )}
                                        Loại Sản Phẩm: {comboProduct?.loaiSanPham || sp.loaiSanPham || "Chưa xác định"}<br />
                                        Thương hiệu: {comboProduct?.maThuongHieu || sp.thuongHieu || "Chưa xác định"}<br />
                                        Số lượng: {sp.soLuong}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <div>
                              <strong>{product?.tenSanPham || item.tenSanPham || "Sản phẩm không xác định"}</strong><br />
                              {parsedSingle && (
                                <span>
                                  ➤ Màu: <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: `#${parsedSingle.maMau}` }}></span> ({parsedSingle.maMau})<br />
                                  ➤ Kích thước: {parsedSingle.kichThuoc}<br />
                                </span>
                              )}
                              Loại Sản Phẩm: {product?.loaiSanPham || item.loaiSanPham || "Chưa xác định"}<br />
                              Thương hiệu: {product?.maThuongHieu || item.thuongHieu || "Chưa xác định"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.soLuong}</TableCell>
                        <TableCell>
                          {item.gia != null ? `${item.gia.toLocaleString('vi-VN')} VNĐ` : "Chưa xác định"}
                        </TableCell>
                        <TableCell>
                          {item.thanhTien != null ? `${item.thanhTien.toLocaleString('vi-VN')} VNĐ` : "Chưa xác định"}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
              <p><strong>Tên người nhận:</strong> {orderDetails.thongTinNguoiDung.tenNguoiNhan}</p>
              <p><strong>Địa chỉ:</strong> {orderDetails.thongTinNguoiDung.diaChi}</p>
              <p><strong>Số điện thoại:</strong> {orderDetails.thongTinNguoiDung.sdt}</p>
              <p><strong>Tên người đặt:</strong> {orderDetails.thongTinNguoiDung.tenNguoiDat}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Thông tin đơn hàng</h3>
              <p><strong>Ngày đặt:</strong> {orderDetails.thongTinDonHang.ngayDat}</p>
              <p><strong>Trạng thái:</strong> {
                orderDetails.thongTinDonHang.trangThai === 0 ? 'Chưa xác nhận' :
                orderDetails.thongTinDonHang.trangThai === 1 ? 'Đang xử lý' :
                orderDetails.thongTinDonHang.trangThai === 2 ? 'Đang giao hàng' :
                orderDetails.thongTinDonHang.trangThai === 3 ? 'Hoàn thành' :
                orderDetails.thongTinDonHang.trangThai === 4 ? 'Đã hủy' : 'Không xác định'
              }</p>
              <p><strong>Thanh toán:</strong> {orderDetails.thongTinDonHang.thanhToan === 1 ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
              <p><strong>Hình thức thanh toán:</strong> {orderDetails.thongTinDonHang.hinhThucThanhToan || 'Không xác định'}</p>
            </div>
          </div>

          <div className="text-right border-t pt-4">
            <p><strong>Tổng tiền hàng:</strong> {orderDetails.tongTien.toLocaleString('vi-VN')} VNĐ</p>
            <p><strong>Thành tiền cuối cùng:</strong> {orderDetails.finalAmount.toLocaleString('vi-VN')} VNĐ</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;