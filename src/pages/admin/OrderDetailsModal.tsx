import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';


interface ComboItem {
  tenSanPham: string;
  soLuong: number;
  gia: number;
  thanhTien: number;
  maSanPham: string;
  hinhAnh?: string;
  mauSac?: string;
  kichThuoc?: string;
  colorHex?: string; 
}

interface ComboDetails {
  tenCombo: string;
  giaCombo: number;
  sanPhamsTrongCombo: ComboItem[];
}


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
  combo?: ComboDetails;
  colorHex?: string; // ✅ ADD: Missing property
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
  chiTietSanPhams: OrderDetailProduct[];
  diaChi?: string;
  sdt?: string;

  thongTinNguoiDung?: {
    tenNguoiNhan: string;
    diaChi?: string;
    sdt?: string;
    tenNguoiDat?: string;
  };

  
}

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, onClose }) => {
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ ENHANCED: Color parsing with hex support
  const parseColorInfo = (productId: string) => {
    if (!productId) return { mauSac: '', kichThuoc: '', colorHex: '' };
      
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
          '0c06f5': 'Xanh navy',
          'ffff00': 'Vàng',
          'ffa500': 'Cam',
          '800080': 'Tím',
          'a52a2a': 'Nâu',
          '808080': 'Xám',
          'c0c0c0': 'Bạc',
          'ffc0cb': 'Hồng nhạt'
        };
        return colorMap[hex.toLowerCase()] || `#${hex}`;
      };

      const getSizeName = (sizeCode: string) => {
        const sizeMap: { [key: string]: string } = {
          'S': 'S', 'M': 'M', 'L': 'L',
          'XL': 'XL', 'XXL': 'XXL', 'XXXL': 'XXXL'
        };
        return sizeMap[sizeCode] || sizeCode;
      };

      return {
        mauSac: getColorName(colorCode),
        kichThuoc: getSizeName(size),
        colorHex: `#${colorCode}`
      };
    }
    return { mauSac: '', kichThuoc: '', colorHex: '' };
  };

  // ✅ NEW: Color component with visual indicator
  const ColorDisplay: React.FC<{ colorName: string; colorHex: string; className?: string }> = ({ 
    colorName, 
    colorHex, 
    className = "text-xs" 
  }) => {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm font-medium">Màu:</span>
        <div className="flex items-center gap-1">
          <div 
            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
            style={{ backgroundColor: colorHex }}
            title={colorName}
          ></div>
          <Badge variant="outline" className="text-xs">{colorName}</Badge>
        </div>
      </div>
    );
  };

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log(`[DEBUG] Fetching order details for order ${orderId}`);
      
      // Call admin orders endpoint
      const response = await axios.get(`https://localhost:7051/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] API Response:', response.data);
      
      const allOrders = response.data as any[];
      const foundOrder = allOrders.find((order: any) => order.maDonHang === orderId);
      
      if (!foundOrder) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      console.log('[DEBUG] Found order:', foundOrder);

      // Process order data with enhanced parsing
      const processedProducts = foundOrder.chiTietSanPhams?.map((product: any) => {
        console.log('[DEBUG] Processing product:', product);
        
        // Parse color/size info for single products  
        const singleProductInfo = !product.laCombo && product.maSanPham 
          ? parseColorInfo(product.maSanPham) 
          : { mauSac: '', kichThuoc: '', colorHex: '' };

        // Process combo items if present
        let processedCombo = null;
        if (product.combo && product.combo.sanPhamsTrongCombo) {
          console.log('[DEBUG] Processing combo items:', product.combo.sanPhamsTrongCombo);
          
          processedCombo = {
            tenCombo: product.combo.tenCombo,
            giaCombo: product.combo.giaCombo,
            sanPhamsTrongCombo: product.combo.sanPhamsTrongCombo.map((item: any) => {
              const itemInfo = parseColorInfo(item.maSanPham);
              console.log(`[DEBUG] Combo item ${item.maSanPham}:`, itemInfo);
              
              return {
                tenSanPham: item.tenSanPham,
                soLuong: item.soLuong,
                gia: item.gia,
                thanhTien: item.thanhTien,
                maSanPham: item.maSanPham,
                hinhAnh: item.hinhAnh,
                mauSac: item.mauSac || itemInfo.mauSac,
                kichThuoc: item.kichThuoc || itemInfo.kichThuoc,
                colorHex: itemInfo.colorHex // ✅ Now properly typed
              };
            })
          };
        }

        return {
          maChiTietDh: product.maChiTietDh,
          laCombo: product.laCombo,
          tenSanPham: product.tenSanPham,
          soLuong: product.soLuong,
          gia: product.gia,
          thanhTien: product.thanhTien,
          maSanPham: product.maSanPham,
          hinhAnh: product.hinhAnh,
          mauSac: product.mauSac || singleProductInfo.mauSac,
          kichThuoc: product.kichThuoc || singleProductInfo.kichThuoc,
          colorHex: singleProductInfo.colorHex, // ✅ Now properly typed
          combo: processedCombo
        };
      }) || [];

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
        chiTietSanPhams: processedProducts,
        diaChi: foundOrder.diaChi,
        sdt: foundOrder.sdt,

        thongTinNguoiDung: {
    tenNguoiNhan: foundOrder.tenNguoiNhan,
    diaChi: foundOrder.diaChi || foundOrder.thongTinNguoiDung?.diaChi || '',
    sdt: foundOrder.sdt || foundOrder.thongTinNguoiDung?.sdt || '',
    tenNguoiDat: foundOrder.hoTenKhachHang || ''
  }
});
      
    } catch (error) {
      console.error('[ERROR] Error fetching order detail:', error);
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
          {/* Order Information */}
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

          {/* ✅ FIXED: Customer Information with proper data display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Thông tin người nhận</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Tên người nhận:</strong> {orderDetail.tenNguoiNhan || 'Chưa có thông tin'}</p>
                <p><strong>Tên người đặt:</strong> {orderDetail.thongTinNguoiDung?.tenNguoiDat || 'Chưa có thông tin'}</p>
              </div>
              <div>
                <p><strong>Số điện thoại:</strong> {orderDetail.sdt || orderDetail.thongTinNguoiDung?.sdt || 'Chưa có thông tin'}</p>
                <p><strong>Địa chỉ:</strong> {orderDetail.diaChi || orderDetail.thongTinNguoiDung?.diaChi || 'Chưa có thông tin'}</p>
              </div>
            </div>
          </div>

          {/* ✅ ENHANCED: Product Details with color display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Chi tiết sản phẩm</h3>
            <div className="space-y-4">
              {orderDetail.chiTietSanPhams && orderDetail.chiTietSanPhams.length > 0 ? (
                orderDetail.chiTietSanPhams.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start space-x-4">
                      {product.hinhAnh && (
                        <img 
                          src={product.hinhAnh} 
                          alt={product.tenSanPham}
                          className="w-20 h-20 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{product.tenSanPham}</h4>
                        
                        {/* Product code for debugging */}
                        {product.maSanPham && (
                          <p className="text-xs text-gray-500 mt-1">Mã SP: {product.maSanPham}</p>
                        )}
                        
                        {/* ✅ ENHANCED: Color and size for single products */}
                        {!product.laCombo && (
                          <div className="flex gap-4 mt-2">
                            {product.mauSac && product.colorHex && (
                              <ColorDisplay 
                                colorName={product.mauSac} 
                                colorHex={product.colorHex} 
                              />
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
                        
                        {/* ✅ ENHANCED: Combo Details with color display */}
                        {product.combo && (
                          <div className="mt-3 pl-4 border-l-2 border-blue-200">
                            <h5 className="font-medium text-blue-700">Sản phẩm trong combo:</h5>
                            <div className="space-y-2 mt-2">
                              {product.combo.sanPhamsTrongCombo.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center space-x-3 text-sm bg-blue-50 p-3 rounded">
                                  {item.hinhAnh && (
                                    <img 
                                      src={item.hinhAnh}
                                      alt={item.tenSanPham}
                                      className="w-12 h-12 object-cover rounded"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder.svg';
                                      }}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium">{item.tenSanPham}</div>
                                    <div className="text-xs text-gray-500 mb-1">Mã SP: {item.maSanPham}</div>
                                    <div className="flex gap-3 mt-1">
                                      {item.mauSac && item.colorHex && (
                                        <ColorDisplay 
                                          colorName={item.mauSac} 
                                          colorHex={item.colorHex}
                                          className="text-xs"
                                        />
                                      )}
                                      {item.kichThuoc && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs font-medium">Size:</span>
                                          <Badge variant="outline" className="text-xs">
                                            {item.kichThuoc}
                                          </Badge>
                                        </div>
                                      )}
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

          {/* Payment Summary */}
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