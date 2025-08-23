import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderDetailProduct {
  maChiTietDh: number;
  laCombo: boolean;
  tenSanPham: string;
  soLuong: number;
  gia: number;
  thanhTien: number;
  hinhAnh?: string;
  mauSac?: string;
  kichThuoc?: string;
  combo?: {
    tenCombo: string;
    giaCombo: number;
    sanPhamsTrongCombo: Array<{
      tenSanPham: string;
      soLuong: number;
      gia: number;
      thanhTien: number;
      hinhAnh?: string;
      mauSac?: string;
      kichThuoc?: string;
    }>;
  };
}

interface OrderDetail {
  maDonHang: number;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  lyDoHuy?: string;
  tongTien: number;
  finalAmount: number;
  shippingFee?: number;
  discountAmount?: number;
  sanPhams: OrderDetailProduct[];
  thongTinNguoiDung: {
    tenNguoiNhan: string;
    diaChi: string;
    sdt: string;
    tenNguoiDat: string;
  };
  thongTinDonHang: {
    ngayDat: string;
    trangThai: number;
    thanhToan: number;
    hinhThucThanhToan: string;
  };
}

interface ApiOrderResponse {
  maDonHang: number;
  maNguoiDung: string;
  tenNguoiNhan: string;
  ngayDat: string;
  trangThaiDonHang: number;
  trangThaiThanhToan: number;
  hinhThucThanhToan: string;
  lyDoHuy?: string;
  tongTien?: number;
  finalAmount?: number;
  shippingFee?: number;
  discountAmount?: number;
  hoTenKhachHang?: string;
  diaChi?: string;
  sdt?: string;
  sanPhams?: OrderDetailProduct[];
  [key: string]: any;
}

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, onClose }) => {
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm parse thông tin từ ID sản phẩm
  const parseProductInfo = (productId: string) => {
    const parts = productId.split('_');
    if (parts.length >= 3) {
      const colorCode = parts[1];
      const size = parts[2];

      const getColorName = (hex: string) => {
        const colorMap: { [key: string]: string } = {
          'ff0000': 'Đỏ',
          '0000ff': 'Xanh dương',
          '00ff00': 'Xanh lá',
          'ffffff': 'Trắng',
          '000000': 'Đen',
          'ff00ff': 'Hồng',
          '0C06F5': 'Xanh navy',
        };
        return colorMap[hex.toLowerCase()] || `#${hex}`;
      };

      const getSizeName = (sizeCode: string) => {
        const sizeMap: { [key: string]: string } = {
          'S': 'S',
          'M': 'M',
          'L': 'L',
          'XL': 'XL',
          'XXL': 'XXL',
          'SA': 'S',
          'MA': 'M',
          'XLA': 'XL',
          'XXLA': 'XXL',
        };
        return sizeMap[sizeCode] || sizeCode;
      };

      return {
        mauSac: getColorName(colorCode),
        kichThuoc: getSizeName(size)
      };
    }
    return { mauSac: '', kichThuoc: '' };
  };

  // Hàm lấy chi tiết đơn hàng
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      // Gọi API lấy chi tiết đơn hàng
      const response = await axios.get(`https://bicacuatho.azurewebsites.net/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data as ApiOrderResponse[];
      const foundOrder = allOrders.find((order: ApiOrderResponse) => order.maDonHang === orderId);
      if (!foundOrder) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Parse thông tin màu sắc và kích thước cho sản phẩm và combo
      const updatedSanPhams = foundOrder.sanPhams?.map(product => ({
        ...product,
        mauSac: product.mauSac ? parseProductInfo(product.mauSac).mauSac : undefined,
        kichThuoc: product.kichThuoc || (product.mauSac ? parseProductInfo(product.mauSac).kichThuoc : undefined),
        combo: product.combo ? {
          ...product.combo,
          sanPhamsTrongCombo: product.combo.sanPhamsTrongCombo.map(comboProduct => ({
            ...comboProduct,
            mauSac: comboProduct.mauSac ? parseProductInfo(comboProduct.mauSac).mauSac : undefined,
            kichThuoc: comboProduct.kichThuoc || (comboProduct.mauSac ? parseProductInfo(comboProduct.mauSac).kichThuoc : undefined)
          }))
        } : undefined
      })) || [];
      setOrderDetail({
        maDonHang: foundOrder.maDonHang,
        tenNguoiNhan: foundOrder.tenNguoiNhan,
        ngayDat: foundOrder.ngayDat,
        trangThaiDonHang: foundOrder.trangThaiDonHang,
        trangThaiThanhToan: foundOrder.trangThaiThanhToan,
        hinhThucThanhToan: foundOrder.hinhThucThanhToan,
        lyDoHuy: foundOrder.lyDoHuy,
        tongTien: foundOrder.tongTien || 0,
        finalAmount: foundOrder.finalAmount || 0,
        shippingFee: foundOrder.shippingFee || 0,
        discountAmount: foundOrder.discountAmount || 0,
        sanPhams: updatedSanPhams,
        thongTinNguoiDung: {
          tenNguoiNhan: foundOrder.tenNguoiNhan,
          diaChi: foundOrder.diaChi || '',
          sdt: foundOrder.sdt || '',
          tenNguoiDat: foundOrder.hoTenKhachHang || ''
        },
        thongTinDonHang: {
          ngayDat: foundOrder.ngayDat,
          trangThai: foundOrder.trangThaiDonHang,
          thanhToan: foundOrder.trangThaiThanhToan,
          hinhThucThanhToan: foundOrder.hinhThucThanhToan
        }
      });
      console.log(orderDetail)
    } catch (error) {
      console.error('Error fetching order detail:', error);
      setError('Không thể tải chi tiết đơn hàng');
      toast.error('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Chưa xác nhận';
      case 1: return 'Đang xử lý';
      case 2: return 'Đang giao hàng';
      case 3: return 'Hoàn thành';
      case 4: return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-green-100 text-green-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusLabel = (trangThaiThanhToan: number, trangThaiDonHang: number) => {
    return trangThaiThanhToan === 1 && trangThaiDonHang === 3 ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Đang tải chi tiết đơn hàng...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !orderDetail) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <p className="text-red-600">{error || 'Không thể tải chi tiết đơn hàng'}</p>
              <Button variant="outline" onClick={fetchOrderDetail} className="mt-4">
                Thử lại
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng #{orderDetail.maDonHang}</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Thông tin đơn hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Mã đơn hàng:</strong> {orderDetail.maDonHang}</p>
                <p><strong>Ngày đặt:</strong> {orderDetail.ngayDat}</p>
                <p><strong>Trạng thái:</strong> 
                  <Badge className={`ml-2 ${getStatusColor(orderDetail.trangThaiDonHang)}`}>
                    {getStatusLabel(orderDetail.trangThaiDonHang)}
                  </Badge>
                </p>
              </div>
              <div>
                <p><strong>Thanh toán:</strong> {getPaymentStatusLabel(orderDetail.trangThaiThanhToan, orderDetail.trangThaiDonHang)}</p>
                <p><strong>Hình thức:</strong> {orderDetail.hinhThucThanhToan}</p>
                {orderDetail.lyDoHuy && (
                  <p><strong>Lý do hủy:</strong> <span className="text-red-600">{orderDetail.lyDoHuy}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin người nhận */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Thông tin người nhận</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Tên người nhận:</strong> {orderDetail.thongTinNguoiDung.tenNguoiNhan}</p>
                <p><strong>Tên người đặt:</strong> {orderDetail.thongTinNguoiDung.tenNguoiDat}</p>
              </div>
              <div>
                <p><strong>Số điện thoại:</strong> {orderDetail.thongTinNguoiDung.sdt}</p>
                <p><strong>Địa chỉ:</strong> {orderDetail.thongTinNguoiDung.diaChi}</p>
              </div>
            </div>
          </div>

          {/* Chi tiết sản phẩm */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Chi tiết sản phẩm</h3>
            <div className="space-y-4">
              {orderDetail.sanPhams && orderDetail.sanPhams.length > 0 ? (
                orderDetail.sanPhams.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start space-x-4">
                      {product.hinhAnh && (
                        <img 
                          src={product.hinhAnh} 
                          alt={product.tenSanPham}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{product.laCombo ? product.tenSanPham : product.tenSanPham.split('_')[0]}</h4>
                        
                        {/* Thông tin màu sắc và kích thước */}
                        {!product.laCombo && (
                          <div className="flex gap-4 mt-2">
                            {product.mauSac && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Màu:</span>
                                <Badge variant="outline" className="text-xs">{product.mauSac}</Badge>
                              </div>
                            )}
                            {product.kichThuoc && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Size:</span>
                                <Badge variant="outline" className="text-xs">{product.kichThuoc}</Badge>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600 mt-2">
                          Số lượng: {product.soLuong} × {product.gia?.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="font-semibold text-blue-600">
                          Thành tiền: {product.thanhTien?.toLocaleString('vi-VN')}đ
                        </p>
                        
                        {product.combo && (
                          <div className="mt-3 pl-4 border-l-2 border-blue-200">
                            <h5 className="font-medium text-blue-700">Sản phẩm trong combo:</h5>
                            <div className="space-y-2 mt-2">
                              {product.combo.sanPhamsTrongCombo.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center space-x-2 text-sm">
                                  {item.hinhAnh && (
                                    <img 
                                      src={item.hinhAnh} 
                                      alt={item.tenSanPham}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <span>{item.tenSanPham.split('_')[0]}</span>
                                  {item.mauSac && <Badge variant="outline" className="text-xs">{item.mauSac}</Badge>}
                                  {item.kichThuoc && <Badge variant="outline" className="text-xs">{item.kichThuoc}</Badge>}
                                  <span className="text-gray-500">x{item.soLuong}</span>
                                  <span className="text-gray-500">{item.gia?.toLocaleString('vi-VN')}đ</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Không có thông tin chi tiết sản phẩm</p>
              )}
            </div>
          </div>

          {/* Tính toán chi phí */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Chi tiết thanh toán</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span>{orderDetail.tongTien?.toLocaleString('vi-VN')}đ</span>
              </div>
              
              {orderDetail.shippingFee && orderDetail.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>{orderDetail.shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              
              {orderDetail.discountAmount && orderDetail.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá (Voucher):</span>
                  <span>-{orderDetail.discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              
              <hr className="my-2" />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Tổng thanh toán:</span>
                <span className="text-blue-600">
                  {orderDetail.finalAmount?.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;