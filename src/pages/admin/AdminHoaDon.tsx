import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, FileType, X } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderDetailProduct {
  maChiTietDh: number;
  tenSanPham: string;
  soLuong: number;
  gia: number;
  thanhTien: number;
  maSanPham?: string;
  mauSac?: string;
  kichThuoc?: string;
  colorHex?: string;
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
  chiTietSanPhams: OrderDetailProduct[];
  diaChi?: string;
}

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
}

const AdminHoaDon: React.FC<OrderDetailsModalProps> = ({ orderId, onClose }) => {
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const parseColorInfo = (productId: string) => {
    if (!productId) return { mauSac: '', kichThuoc: '', colorHex: '' };
    const parts = productId.split('_');
    if (parts.length >= 3) {
      const colorCode = parts[1];
      const size = parts[2];
      const colorMap: { [key: string]: string } = {
        'ff0000': 'Đỏ', '0000ff': 'Xanh dương', '00ff00': 'Xanh lá', 'ffffff': 'Trắng',
        '000000': 'Đen', 'ff00ff': 'Hồng', '0c06f5': 'Xanh navy', 'ffff00': 'Vàng',
        'ffa500': 'Cam', '800080': 'Tím', 'a52a2a': 'Nâu', '808080': 'Xám',
        'c0c0c0': 'Bạc', 'ffc0cb': 'Hồng nhạt'
      };
      const sizeMap: { [key: string]: string } = {
        'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL', 'XXXL': 'XXXL'
      };
      return {
        mauSac: colorMap[colorCode.toLowerCase()] || `#${colorCode}`,
        kichThuoc: sizeMap[size] || size,
        colorHex: `#${colorCode}`
      };
    }
    return { mauSac: '', kichThuoc: '', colorHex: '' };
  };

  const ColorDisplay: React.FC<{ colorName: string; colorHex: string; className?: string }> = ({
    colorName,
    colorHex,
    className = "text-xs"
  }) => (
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

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token is missing');
      const response = await axios.get(`https://bicacuatho.azurewebsites.net/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allOrders = response.data as any[];
      console.log('Fetched orders:', allOrders);
      const foundOrder = allOrders.find((order: any) => order.maDonHang === orderId);
      if (!foundOrder) throw new Error('Không tìm thấy đơn hàng');
      const processedProducts = foundOrder.chiTietSanPhams?.map((product: any) => {
        const singleProductInfo = product.maSanPham ? parseColorInfo(product.maSanPham) : { mauSac: '', kichThuoc: '', colorHex: '' };
        return {
          maChiTietDh: product.maChiTietDh,
          tenSanPham: product.tenSanPham,
          soLuong: product.soLuong,
          gia: product.thanhTien,
          thanhTien: product.thanhTien,
          maSanPham: product.maSanPham,
          mauSac: product.mauSac || singleProductInfo.mauSac,
          kichThuoc: product.kichThuoc || singleProductInfo.kichThuoc,
          colorHex: singleProductInfo.colorHex
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
        chiTietSanPhams: processedProducts,
        diaChi: foundOrder.diaChi
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải chi tiết đơn hàng';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: 'white',
          border: 'none',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (retryCount = 0, maxRetries = 2) => {
    setQrLoading(true);
    const qrLink = `https://fashionhub.name.vn/user/hoadon?orderId=${orderId}`;
    const encodedUrl = encodeURIComponent(qrLink);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodedUrl}`;

    try {
      await fetch(qrApiUrl, { method: 'HEAD' });
      setQrCodeDataUrl(qrApiUrl);
    } catch (err) {
      console.error('Error generating QR code URL:', err);
      if (retryCount < maxRetries) {
        setTimeout(() => generateQRCode(retryCount + 1, maxRetries), 1000);
      } else {
        setQrCodeDataUrl(null);
        toast.error('Không thể tạo mã QR', {
          duration: 3000,
          position: 'top-right',
          style: { background: '#EF4444', color: 'white', border: 'none' },
        });
      }
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
      generateQRCode();
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

  const getPaymentStatusLabel = (trangThaiThanhToan: number, trangThaiDonHang: number) =>
    trangThaiThanhToan === 1 && trangThaiDonHang === 3 ? 'Đã thanh toán' : 'Chưa thanh toán';

  const generateCode128Barcode = (canvas: HTMLCanvasElement, text: string, options: { width: number; height: number }) => {
    if (!canvas || !text) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CODE128 = {
      B: {
        ' ': 0, '!': 1, '"': 2, '#': 3, '$': 4, '%': 5, '&': 6, "'": 7, '(': 8, ')': 9,
        '*': 10, '+': 11, ',': 12, '-': 13, '.': 14, '/': 15, '0': 16, '1': 17, '2': 18, '3': 19,
        '4': 20, '5': 21, '6': 22, '7': 23, '8': 24, '9': 25, ':': 26, ';': 27, '<': 28, '=': 29,
        '>': 30, '?': 31, '@': 32, 'A': 33, 'B': 34, 'C': 35, 'D': 36, 'E': 37, 'F': 38, 'G': 39,
        'H': 40, 'I': 41, 'J': 42, 'K': 43, 'L': 44, 'M': 45, 'N': 46, 'O': 47, 'P': 48, 'Q': 49,
        'R': 50, 'S': 51, 'T': 52, 'U': 53, 'V': 54, 'W': 55, 'X': 56, 'Y': 57, 'Z': 58, '[': 59,
        '\\': 60, ']': 61, '^': 62, '_': 63, '`': 64, 'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69,
        'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79,
        'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89,
        'z': 90, '{': 91, '|': 92, '}': 93, '~': 94, 'FNC3': 95, 'FNC2': 96, 'SHIFT': 97, 'CODEC': 98,
        'FNC4': 99, 'FNC1': 100, 'STARTB': 104, 'STOP': 106,
      },
      PATTERNS: [
        '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100',
        '10011001000', '10011000100', '10001100100', '11001001000', '11001000100', '11000100100',
        '10110011100', '10011011100', '10011001110', '10111001100', '10011101100', '10011100110',
        '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
        '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
        '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', '10001001110',
        '10110001000', '10001101000', '10001100110', '11010001000', '11000101000', '11000100110',
        '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
        '11101110110', '11010001110', '11000101110', '11011101000', '11011100110', '11011100010',
        '11011011100', '11011001110', '11011000110', '11000110110', '11100010110', '11100010011',
        '11101011000', '11101000110', '11100101110', '11101101000', '11101100110', '11101100010',
        '11100111100', '11100110011', '11101111000', '11000010100', '10000101100', '10000100110',
        '10110010000', '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
        '11000010010', '10001001010', '10111010000', '10111000010', '10001010100', '10001010010',
        '11110111010', '11000001110', '11110001010', '10100111000', '10100001100', '10010111000',
        '10010001110', '10000101110', '10000100111', '10111100100', '10111100010', '10110011110',
        '10011110110', '10011110011', '11110100100', '11110100010', '11110010100', '11110010010',
        '11011010110', '11010110110', '11010110011', '11010010111', '11010010011', '11010000111',
      ],
    };

    const sanitizedText = text.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
    if (sanitizedText !== text) {
      console.warn(`Barcode text sanitized from "${text}" to "${sanitizedText}" due to invalid characters.`);
    }

    let sum = 104;
    let checksum = sum;
    const chars = ['STARTB'];

    for (let i = 0; i < sanitizedText.length; i++) {
      const char = sanitizedText[i];
      const value = CODE128.B[char as keyof typeof CODE128.B] ?? 0;
      chars.push(char);
      sum += value * (i + 1);
      checksum = sum % 103;
    }

    chars.push(Object.keys(CODE128.B)[checksum % 94]);
    chars.push('STOP');

    let pattern = '';
    for (const char of chars) {
      const value = CODE128.B[char as keyof typeof CODE128.B];
      pattern += CODE128.PATTERNS[value];
    }

    canvas.width = options.width;
    canvas.height = options.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barCount = pattern.length;
    const barWidth = canvas.width / barCount;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000000';
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        ctx.fillRect(i * barWidth, 0, Math.ceil(barWidth), canvas.height);
      }
    }
  };

  const handlePrint = () => {
    if (!orderDetail) return;

    const qrLink = `https://fashionhub.name.vn/user/hoadon?orderId=${orderId}`;
    const encodedUrl = encodeURIComponent(qrLink);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodedUrl}`;
    const barcodeText = `ORD-${orderDetail.maDonHang.toString().padStart(5, '0')}`;

    const productsList = orderDetail.chiTietSanPhams.map(product => `
      <div style="font-size: 8px; margin-bottom: 2mm;">
        ${product.tenSanPham} - SL: ${product.soLuong} - Size: ${product.kichThuoc} - Màu: ${product.mauSac} - Giá: ${product.gia.toLocaleString('vi-VN')}đ
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>In hóa đơn 4x6</title>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10px; }
          .invoice { width: 102mm; height: 152mm; padding: 5mm; box-sizing: border-box; background: white; border: 1px solid #000; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; border-bottom: 1px solid #000; }
          .barcode-container { text-align: center; margin-bottom: 3mm; }
          .qr-container { text-align: center; margin-top: 3mm; }
          @media print { body { width: 102mm; height: 152mm; } .invoice { border: none; } }
        </style>
      </head>
      <body onload="window.print()">
        <div class="invoice">
          <div class="header">
            <div style="font-weight: bold;">FashionHub</div>
            <div style="font-size: 8px;">Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <div style="margin-bottom: 3mm;">
            <div><strong>Mã đơn:</strong> ${orderDetail.maDonHang}</div>
            <div><strong>Ngày đặt:</strong> ${orderDetail.ngayDat}</div>
            <div><strong>Trạng thái:</strong> ${getStatusLabel(orderDetail.trangThaiDonHang)}</div>
            ${orderDetail.diaChi ? `<div><strong>Địa chỉ:</strong> ${orderDetail.diaChi}</div>` : ''}
          </div>
          <div class="barcode-container">
            <canvas id="barcode-canvas" style="width: 80mm; height: 15mm; display: block; margin: 0 auto;"></canvas>
            <div style="font-size: 8px; text-align: center;">${barcodeText}</div>
          </div>
          <div style="margin-bottom: 3mm;">
            <strong>Sản phẩm:</strong>
            ${productsList}
          </div>
          <div style="margin-bottom: 3mm; font-weight: bold;">
            Tổng thanh toán: ${(orderDetail.finalAmount || orderDetail.tongTien).toLocaleString('vi-VN')}đ
          </div>
          <div class="qr-container">
            <img src="${qrApiUrl}" alt="QR Code" style="width: 25mm; height: 25mm; display: block; margin: 0 auto;" />
            <div style="font-size: 8px; text-align: center;">Quét để xem chi tiết</div>
          </div>
        </div>
        <script>
          // Generate CODE128 barcode function
          function generateCode128Barcode(canvas, text, options) {
            const CODE128 = {
              B: {
                ' ': 0, '!': 1, '"': 2, '#': 3, '$': 4, '%': 5, '&': 6, "'": 7, '(': 8, ')': 9,
                '*': 10, '+': 11, ',': 12, '-': 13, '.': 14, '/': 15, '0': 16, '1': 17, '2': 18, '3': 19,
                '4': 20, '5': 21, '6': 22, '7': 23, '8': 24, '9': 25, ':': 26, ';': 27, '<': 28, '=': 29,
                '>': 30, '?': 31, '@': 32, 'A': 33, 'B': 34, 'C': 35, 'D': 36, 'E': 37, 'F': 38, 'G': 39,
                'H': 40, 'I': 41, 'J': 42, 'K': 43, 'L': 44, 'M': 45, 'N': 46, 'O': 47, 'P': 48, 'Q': 49,
                'R': 50, 'S': 51, 'T': 52, 'U': 53, 'V': 54, 'W': 55, 'X': 56, 'Y': 57, 'Z': 58, '[': 59,
                '\\\\': 60, ']': 61, '^': 62, '_': 63, '\`': 64, 'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69,
                'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79,
                'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89,
                'z': 90, '{': 91, '|': 92, '}': 93, '~': 94, 'FNC3': 95, 'FNC2': 96, 'SHIFT': 97, 'CODEC': 98,
                'FNC4': 99, 'FNC1': 100, 'STARTB': 104, 'STOP': 106,
              },
              PATTERNS: [
                '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100',
                '10011001000', '10011000100', '10001100100', '11001001000', '11001000100', '11000100100',
                '10110011100', '10011011100', '10011001110', '10111001100', '10011101100', '10011100110',
                '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
                '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
                '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', '10001001110',
                '10110001000', '10001101000', '10001100110', '11010001000', '11000101000', '11000100110',
                '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
                '11101110110', '11010001110', '11000101110', '11011101000', '11011100110', '11011100010',
                '11011011100', '11011001110', '11011000110', '11000110110', '11100010110', '11100010011',
                '11101011000', '11101000110', '11100101110', '11101101000', '11101100110', '11101100010',
                '11100111100', '11100110011', '11101111000', '11000010100', '10000101100', '10000100110',
                '10110010000', '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
                '11000010010', '10001001010', '10111010000', '10111000010', '10001010100', '10001010010',
                '11110111010', '11000001110', '11110001010', '10100111000', '10100001100', '10010111000',
                '10010001110', '10000101110', '10000100111', '10111100100', '10111100010', '10110011110',
                '10011110110', '10011110011', '11110100100', '11110100010', '11110010100', '11110010010',
                '11011010110', '11010110110', '11010110011', '11010010111', '11010010011', '11010000111',
              ],
            };

            const sanitizedText = text.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
            if (sanitizedText !== text) {
              console.warn(\`Barcode text sanitized from "\${text}" to "\${sanitizedText}" due to invalid characters.\`);
            }

            let sum = 104;
            let checksum = sum;
            const chars = ['STARTB'];

            for (let i = 0; i < sanitizedText.length; i++) {
              const char = sanitizedText[i];
              const value = CODE128.B[char] ?? 0;
              chars.push(char);
              sum += value * (i + 1);
              checksum = sum % 103;
            }

            chars.push(Object.keys(CODE128.B)[checksum % 94]);
            chars.push('STOP');

            let pattern = '';
            for (const char of chars) {
              const value = CODE128.B[char];
              pattern += CODE128.PATTERNS[value];
            }

            canvas.width = options.width;
            canvas.height = options.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barCount = pattern.length;
            const barWidth = canvas.width / barCount;

            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = '#000000';
            for (let i = 0; i < pattern.length; i++) {
              if (pattern[i] === '1') {
                ctx.fillRect(i * barWidth, 0, Math.ceil(barWidth), canvas.height);
              }
            }
          }

          const canvas = document.getElementById('barcode-canvas');
          if (canvas) {
            generateCode128Barcode(canvas, '${barcodeText}', { width: 200, height: 40 });
          }
        </script>
      </body>
      </html>
    `;

    const newWindow = window.open('');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const handleExportPDF = () => {
    if (!orderDetail) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Hóa đơn #${orderDetail.maDonHang}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Ngày đặt: ${orderDetail.ngayDat}`, 20, 30);
    doc.text(`Trạng thái: ${getStatusLabel(orderDetail.trangThaiDonHang)}`, 20, 40);

    const tableData = orderDetail.chiTietSanPhams.map(product => [
      product.tenSanPham,
      product.soLuong,
      product.gia.toLocaleString('vi-VN'),
      product.thanhTien.toLocaleString('vi-VN')
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.text(`Tổng tiền: ${orderDetail.tongTien.toLocaleString('vi-VN')}đ`, 20, finalY + 10);
    doc.text(`Tổng thanh toán: ${(orderDetail.finalAmount || orderDetail.tongTien).toLocaleString('vi-VN')}đ`, 20, finalY + 20);

    const barcodeCanvas = document.createElement('canvas');
    const barcodeText = `ORD-${orderDetail.maDonHang.toString().padStart(5, '0')}`;
    generateCode128Barcode(barcodeCanvas, barcodeText, { width: 200, height: 50 });
    const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
    doc.addImage(barcodeDataUrl, 'PNG', 20, finalY + 30, 50, 12.5);

    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', 140, finalY + 30, 40, 40);
    }

    doc.save(`hoa-don-${orderDetail.maDonHang}.pdf`);
  };

  const handleExportTXT = () => {
    if (!orderDetail) return;

    let text = `Hóa đơn #${orderDetail.maDonHang}\n\n`;
    text += `Thông tin đơn hàng:\n`;
    text += `Mã đơn hàng: ${orderDetail.maDonHang}\n`;
    text += `Ngày đặt: ${orderDetail.ngayDat}\n`;
    text += `Trạng thái: ${getStatusLabel(orderDetail.trangThaiDonHang)}\n`;
    if (orderDetail.lyDoHuy) {
      text += `Lý do hủy: ${orderDetail.lyDoHuy}\n`;
    }
    if (orderDetail.diaChi) {
      text += `Địa chỉ: ${orderDetail.diaChi}\n`;
    }

    text += `\nChi tiết sản phẩm:\n`;
    orderDetail.chiTietSanPhams.forEach((product, index) => {
      text += `Sản phẩm ${index + 1}:\n`;
      text += `Tên: ${product.tenSanPham}\n`;
      if (product.maSanPham) text += `Mã SP: ${product.maSanPham}\n`;
      if (product.mauSac) text += `Màu sắc: ${product.mauSac}\n`;
      if (product.kichThuoc) text += `Kích thước: ${product.kichThuoc}\n`;
      text += `Số lượng: ${product.soLuong}\n`;
      text += `Đơn giá: ${product.gia.toLocaleString('vi-VN')}đ\n`;
      text += `Thành tiền: ${product.thanhTien.toLocaleString('vi-VN')}đ\n\n`;
    });

    text += `Tổng tiền hàng: ${orderDetail.tongTien.toLocaleString('vi-VN')}đ\n`;
    text += `Tổng thanh toán: ${(orderDetail.finalAmount || orderDetail.tongTien).toLocaleString('vi-VN')}đ\n`;

    text += `\nLink hóa đơn: https://fashionhub.name.vn/user/hoadon?orderId=${orderId}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoa-don-${orderDetail.maDonHang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
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

  const qrLink = `https://fashionhub.name.vn/user/hoadon?orderId=${orderId}`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng {orderDetail.maDonHang}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-w-4xl max-h-[60vh] overflow-y-auto">
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
                {orderDetail.lyDoHuy && <p><strong>Lý do hủy:</strong> {orderDetail.lyDoHuy}</p>}
                {orderDetail.diaChi && <p><strong>Địa chỉ:</strong> {orderDetail.diaChi}</p>}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Chi tiết sản phẩm</h3>
            <div className="space-y-4">
              {orderDetail.chiTietSanPhams && orderDetail.chiTietSanPhams.length > 0 ? (
                orderDetail.chiTietSanPhams.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.tenSanPham}</h4>
                      {product.maSanPham && (
                        <p className="text-xs text-gray-500 mt-1">Mã SP: {product.maSanPham}</p>
                      )}
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
                      <p className="text-sm text-gray-600 mt-2">
                        Số lượng: {product.soLuong} × {product.gia?.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="font-semibold text-blue-600">
                        Thành tiền: {product.thanhTien?.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Không có thông tin chi tiết sản phẩm</p>
              )}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Chi tiết thanh toán</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span>{orderDetail.tongTien?.toLocaleString('vi-VN')}đ</span>
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
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Quét mã QR để xem hóa đơn trực tuyến</h3>
            <div className="flex justify-center mb-4">
              <div className="relative w-48 h-48 bg-white border-2 border-pink-300 rounded-lg flex items-center justify-center shadow-lg">
                {qrLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
                    <div className="text-sm text-gray-500">Đang tạo QR...</div>
                  </div>
                ) : qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code cho đơn hàng ORD-${orderDetail.maDonHang.toString().padStart(5, '0')}`}
                    className="w-44 h-44 object-contain rounded"
                    onError={() => {
                      console.error("QR image failed to load");
                      generateQRCode();
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2 text-gray-400">📱</div>
                    <div className="text-sm text-gray-500">QR Code không khả dụng</div>
                    <button
                      onClick={() => generateQRCode()}
                      className="mt-2 text-pink-600 hover:text-pink-700 text-sm underline"
                    >
                      Thử tạo lại
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Quét mã QR này để truy cập hóa đơn trực tuyến bất cứ lúc nào
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Hoặc truy cập trực tiếp:</p>
              <a
                href={qrLink}
                className="text-pink-600 hover:text-pink-700 text-sm font-medium underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {qrLink}
              </a>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            className="bg-green-500 hover:bg-green-600 text-white font-medium flex items-center gap-2"
            onClick={handlePrint}
          >
            <Printer size={18} /> In 4x6
          </Button>

          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileText size={18} /> Xuất PDF
          </Button>

          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium flex items-center gap-2"
            onClick={handleExportTXT}
          >
            <FileType size={18} /> Xuất TXT
          </Button>

          <Button
            className="bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2"
            onClick={onClose}
          >
            <X size={18} /> Đóng
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default AdminHoaDon;