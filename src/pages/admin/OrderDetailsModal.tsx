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
  maSanPham?: string;
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
      maSanPham: string;
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
  // Thêm các thuộc tính mới
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
  maNguoiDung: number;
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
  chiTietSanPhams?: Array<{
    maChiTietDh: number;
    laCombo: boolean;
    tenSanPham: string;
    soLuong: number;
    gia: number;
    thanhTien: number;
    maCombo?: number;
    maSanPham?: string;
    hinhAnh?: string;
    mauSac?: string;    // Thêm vào interface API
    kichThuoc?: string; // Thêm vào interface API
    combo?: {
      tenCombo: string;
      giaCombo: number;
      sanPhamsTrongCombo: Array<{
        tenSanPham: string;
        soLuong: number;
        gia: number;
        thanhTien: number;
        maSanPham: string;
        hinhAnh?: string;
        mauSac?: string;    // Thêm vào interface API
        kichThuoc?: string; // Thêm vào interface API
      }>;
    };
  }>;
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
    console.log('Parsing product ID:', productId);
    
    if (!productId) {
      console.log('Product ID is empty');
      return { mauSac: '', kichThuoc: '' };
    }
      
    // Ví dụ: A00001_ff0000_S hoặc A00001_ff0000_XL
    const parts = productId.split('_');
    console.log('Product ID parts:', parts);

    if (parts.length >= 3) {
      const colorCode = parts[1];
      const size = parts[2];
      console.log('Color code:', colorCode, 'Size:', size);
        
      // Chuyển đổi mã màu hex thành tên màu
      const getColorName = (hex: string) => {
        const colorMap: { [key: string]: string } = {
          'ff0000': 'Đỏ',
          '0000ff': 'Xanh dương',
          '00ff00': 'Xanh lá',
          'ffffff': 'Trắng',
          '000000': 'Đen',
          'ff00ff': 'Hồng',
          '0c06f5': 'Xanh navy',
          // Thêm các màu khác khi cần
        };
        const colorName = colorMap[hex.toLowerCase()] || `#${hex}`;
        console.log('Color name:', colorName);
        return colorName;
      };

      // Chuyển đổi size code thành tên size
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
        const sizeName = sizeMap[sizeCode] || sizeCode;
        console.log('Size name:', sizeName);
        return sizeName;
      };

      const result = {
        mauSac: getColorName(colorCode),
        kichThuoc: getSizeName(size)
      };
      console.log('Parse result:', result);
      return result;
    }
    console.log('Product ID format not recognized');
    return { mauSac: '', kichThuoc: '' };
  };

  // Hàm lấy chi tiết đơn hàng
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Gọi API lấy tất cả đơn hàng từ admin endpoint
      const response = await axios.get(`http://localhost:5261/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allOrders = response.data as ApiOrderResponse[];
      const foundOrder = allOrders.find((order: ApiOrderResponse) => order.maDonHang === orderId);
      
      if (!foundOrder) {
        throw new Error('Không tìm thấy đơn hàng');
      }
      console.log('Found order:', foundOrder);
      console.log('Chi tiết sản phẩm:', foundOrder.chiTietSanPhams);

      // Xử lý dữ liệu sản phẩm với parse màu sắc và kích thước
      if (foundOrder.chiTietSanPhams) {
        const sanPhams = foundOrder.chiTietSanPhams.map(product => {
          // Parse màu sắc và kích thước từ mã sản phẩm nếu API chưa trả về
          const parsedInfo = product.maSanPham ? parseProductInfo(product.maSanPham) : { mauSac: '', kichThuoc: '' };
          
          return {
            maChiTietDh: product.maChiTietDh,
            laCombo: product.laCombo,
            tenSanPham: product.tenSanPham,
            soLuong: product.soLuong,
            gia: product.gia,
            thanhTien: product.thanhTien,
            maSanPham: product.maSanPham,
            hinhAnh: product.hinhAnh,
            // Ưu tiên dữ liệu từ API, nếu không có thì parse từ mã sản phẩm
            mauSac: product.mauSac || parsedInfo.mauSac,
            kichThuoc: product.kichThuoc || parsedInfo.kichThuoc,
            combo: product.combo ? {
              tenCombo: product.combo.tenCombo,
              giaCombo: product.combo.giaCombo,
              sanPhamsTrongCombo: product.combo.sanPhamsTrongCombo.map(item => {
                const itemParsedInfo = item.maSanPham ? parseProductInfo(item.maSanPham) : { mauSac: '', kichThuoc: '' };
                
                return {
                  tenSanPham: item.tenSanPham,
                  soLuong: item.soLuong,
                  gia: item.gia,
                  thanhTien: item.thanhTien,
                  maSanPham: item.maSanPham,
                  hinhAnh: item.hinhAnh,
                  // Ưu tiên dữ liệu từ API, nếu không có thì parse từ mã sản phẩm
                  mauSac: item.mauSac || itemParsedInfo.mauSac,
                  kichThuoc: item.kichThuoc || itemParsedInfo.kichThuoc
                };
              })
            } : undefined
          };
        });

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
          sanPhams: sanPhams,
          thongTinNguoiDung: {
            tenNguoiNhan: foundOrder.tenNguoiNhan,
            diaChi: '', // Cần thêm vào API nếu cần
            sdt: '', // Cần thêm vào API nếu cần
            tenNguoiDat: foundOrder.hoTenKhachHang || ''
          },
          thongTinDonHang: {
            ngayDat: foundOrder.ngayDat,
            trangThai: foundOrder.trangThaiDonHang,
            thanhToan: foundOrder.trangThaiThanhToan,
            hinhThucThanhToan: foundOrder.hinhThucThanhToan
          }
        });
      }
      
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
                <p><strong>Mã đ hàng:</strong> {orderDetail.maDonHang}</p>
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
                        <h4 className="font-medium">{product.tenSanPham}</h4>
                        
                        {/* Hiển thị mã sản phẩm để debug */}
                        {product.maSanPham && (
                          <p className="text-xs text-gray-500 mt-1">Mã SP: {product.maSanPham}</p>
                        )}
                        
                        {/* Thông tin màu sắc và kích thước chỉ hiển thị cho sản phẩm đơn lẻ */}
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
                                <div key={itemIndex} className="flex items-center space-x-3 text-sm bg-blue-50 p-2 rounded">
                                  {item.hinhAnh && (
                                    <img 
                                      src={item.hinhAnh} 
                                      alt={item.tenSanPham}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium">{item.tenSanPham}</div>
                                    <div className="text-xs text-gray-500 mb-1">Mã SP: {item.maSanPham}</div>
                                    <div className="flex gap-2 mt-1">
                                      {item.mauSac && <Badge variant="outline" className="text-xs">{item.mauSac}</Badge>}
                                      {item.kichThuoc && <Badge variant="outline" className="text-xs">Size: {item.kichThuoc}</Badge>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      SL: {item.soLuong} × {item.gia?.toLocaleString('vi-VN')}đ = {item.thanhTien?.toLocaleString('vi-VN')}đ
                                    </div>
                                  </div>
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
              
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span>{(orderDetail.shippingFee || 0).toLocaleString('vi-VN')}đ</span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span>
                <span>-{(orderDetail.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
              </div>
              
              <hr className="my-2" />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Tổng thanh toán:</span>
                <span className="text-blue-600">
                  {(orderDetail.finalAmount || orderDetail.tongTien || 0).toLocaleString('vi-VN')}đ
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