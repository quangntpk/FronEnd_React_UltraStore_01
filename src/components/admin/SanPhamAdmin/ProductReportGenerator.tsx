import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

interface ProductReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: Set<string>;
}

interface ReportItem {
  id: string;
  tenSanPham: string;
  thuongHieu: string;
  chatLieu: string;
  loaiSanPham: string;
  mauSac: string | null;
  kichThuoc: string | null;
  dvt: string;
  giaNhap: number;
  slNhap: number;
  giaXuat: number;
  slXuat: number;
  tonCuoi: number;
  giaTonCuoi: number;
}

const ProductReportGenerator = ({ isOpen, onClose, selectedProductIds }: ProductReportGeneratorProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const generateHtmlContent = (data: ReportItem[], fromDate: string, toDate: string) => {
    const tableRows = data.map((item, index) => {
      const [baseId, color, size] = item.id.split("_");
      const giaTriNhap = item.slNhap * item.giaNhap;
      const giaTriXuat = item.slXuat * item.giaXuat;
      const giaTriTonCuoi = item.tonCuoi * item.giaTonCuoi;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${baseId || "N/A"}</td>
          <td>${item.tenSanPham || "Không có tên"}</td>
          <td>${item.thuongHieu || "N/A"}</td>
          <td>${item.chatLieu || "N/A"}</td>
          <td>${item.loaiSanPham || "N/A"}</td>
          <td>${color || "N/A"}</td>
          <td>${size || "N/A"}</td>
          <td>${item.dvt || "N/A"}</td>
          <td style="text-align: right;">${item.slNhap.toLocaleString('vi-VN')}</td>
          <td style="text-align: right;">${giaTriNhap.toLocaleString('vi-VN')}</td>
          <td style="text-align: right;">${item.slXuat.toLocaleString('vi-VN')}</td>
          <td style="text-align: right;">${giaTriXuat.toLocaleString('vi-VN')}</td>
          <td style="text-align: right;">${item.tonCuoi.toLocaleString('vi-VN')}</td>
          <td style="text-align: right;">${giaTriTonCuoi.toLocaleString('vi-VN')}</td>
        </tr>
      `;
    }).join('');

    const totalNhap = data.reduce((sum, item) => sum + item.slNhap, 0);
    const totalGiaTriNhap = data.reduce((sum, item) => sum + item.slNhap * item.giaNhap, 0);
    const totalXuat = data.reduce((sum, item) => sum + item.slXuat, 0);
    const totalGiaTriXuat = data.reduce((sum, item) => sum + item.slXuat * item.giaXuat, 0);
    const totalTonCuoi = data.reduce((sum, item) => sum + item.tonCuoi, 0);
    const totalGiaTriTonCuoi = data.reduce((sum, item) => sum + item.tonCuoi * item.giaTonCuoi, 0);

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Báo cáo vật tư</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 20px;
            font-size: 12px;
            line-height: 1.2;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .header-left {
            text-align: left;
          }
          .header-right {
            text-align: right;
          }
          .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
          }
          .subtitle {
            text-align: center;
            font-size: 12px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .total-row {
            font-weight: bold;
            background-color: #f5f5f5;
          }
          .signature {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-block {
            text-align: center;
            width: 30%;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <strong>Cửa Hàng Bán Quần Áo Thời Trang UltraStore</strong><br>
            Buôn Ma Thuật, Đắk Lắk<br>
            www.ultrastore......
          </div>
          <div class="header-right">
            <strong>Mẫu số S11-DN</strong><br>
            (Ban hành theo Thông tư số<br>
            200/2014/TT-BTC ngày 22/12/2014<br>
            của Bộ Tài Chính)
          </div>
        </div>
        <h1 class="title">BẢNG TỔNG HỢP SẢN PHẨM</h1>
        <div class="subtitle">
          Từ ngày ${fromDate} đến ngày ${toDate}
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 5%;">Stt</th>
              <th rowspan="2" style="width: 8%;">Mã vật tư</th>
              <th rowspan="2" style="width: 15%;">Tên vật tư</th>
              <th rowspan="2" style="width: 8%;">Thương hiệu</th>
              <th rowspan="2" style="width: 8%;">Chất liệu</th>
              <th rowspan="2" style="width: 8%;">Loại sản phẩm</th>
              <th rowspan="2" style="width: 8%;">Màu sắc</th>
              <th rowspan="2" style="width: 8%;">Kích thước</th>
              <th rowspan="2" style="width: 5%;">Đvt</th>
              <th colspan="2" style="width: 12%;">Nhập</th>
              <th colspan="2" style="width: 12%;">Xuất</th>
              <th colspan="2" style="width: 12%;">Tồn cuối</th>
            </tr>
            <tr>
              <th>Số lượng</th>
              <th>Giá trị</th>
              <th>Số lượng</th>
              <th>Giá trị</th>
              <th>Số lượng</th>
              <th>Giá trị</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="9" style="text-align: center; font-weight: bold;">Tổng cộng</td>
              <td style="text-align: right; font-weight: bold;">${totalNhap.toLocaleString('vi-VN')}</td>
              <td style="text-align: right; font-weight: bold;">${totalGiaTriNhap.toLocaleString('vi-VN')}</td>
              <td style="text-align: right; font-weight: bold;">${totalXuat.toLocaleString('vi-VN')}</td>
              <td style="text-align: right; font-weight: bold;">${totalGiaTriXuat.toLocaleString('vi-VN')}</td>
              <td style="text-align: right; font-weight: bold;">${totalTonCuoi.toLocaleString('vi-VN')}</td>
              <td style="text-align: right; font-weight: bold;">${totalGiaTriTonCuoi.toLocaleString('vi-VN')}</td>
            </tr>
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px;">
          Buôn Ma Thuật, Ngày.......tháng.......năm...............
        </div>
        <div class="signature">
          <div class="signature-block">
            <strong>NGƯỜI GHI SỔ</strong><br>
            <em>(Ký, họ tên)</em>
          </div>
          <div class="signature-block">
            <strong hidden>NGƯỜI KIỂM KÊ</strong><br>
            <em hidden>(Ký, họ tên)</em>
          </div>
          <div class="signature-block">
            <strong>CHỦ CỬA HÀNG</strong><br>
            <em>(Ký, họ tên, đóng dấu)</em>
          </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            In báo cáo
          </button>
          <button onclick="window.close()" style="background-color: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Đóng
          </button>
        </div>
      </body>
      </html>
    `;
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        title: "Lỗi",
        text: "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc",
        icon: "error",
      });
      return;
    }

    if (selectedProductIds.size === 0) {
      Swal.fire({
        title: "Thông báo",
        text: "Vui lòng chọn ít nhất một sản phẩm để xuất báo cáo.",
        icon: "warning",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5261/api/SanPham/ReportByDate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batDau: startDate,
          ketThuc: endDate,
          id: Array.from(selectedProductIds),
        }),
      });

      if (response.ok) {
        const data: ReportItem[] = await response.json();
        const htmlContent = generateHtmlContent(data, startDate, endDate);

        // Open a new tab and write the HTML content
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        } else {
          throw new Error("Không thể mở tab mới. Vui lòng kiểm tra trình duyệt của bạn.");
        }

        Swal.fire({
          title: "Thành công!",
          text: "Báo cáo vật tư đã được mở trong tab mới!",
          icon: "success",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        onClose();
      } else {
        throw new Error("Lỗi khi tạo báo cáo từ server");
      }
    } catch (error) {
      Swal.fire({
        title: "Lỗi",
        text: `Không thể tạo báo cáo: ${error.message}`,
        icon: "error",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn khoảng thời gian báo cáo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Ngày bắt đầu</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Ngày kết thúc</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleGenerateReport}>Tạo báo cáo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductReportGenerator;