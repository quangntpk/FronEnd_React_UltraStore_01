import { useState, useEffect } from "react";
import { FaEye, FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  RefreshCw,
  Upload,
  Calendar
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast, { Toaster } from "react-hot-toast";

// Định nghĩa interface cho Voucher và Coupon
interface Coupon {
  id: number;
  maNhap: string;
  trangThai: number;
  maVoucher: number;
}

interface Voucher {
  maVoucher: number;
  tenVoucher: string;
  giaTri: number | null;
  moTa: string | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  hinhAnh: string | null;
  dieuKien: number;
  giaTriToiDa: number;
  loaiVoucher: number;
  trangThai: number;
  coupons: Coupon[];
}

// Hàm định dạng ngày giờ
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Hàm loại bỏ dấu tiếng Việt
const removeDiacritics = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const Vouchers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    tenVoucher: '',
    giaTri: '',
    moTa: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    dieuKien: '',
    giaTriToiDa: '',
    loaiVoucher: '0',
    hinhAnh: '',
    trangThai: 0,
  });
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [isDraggingCreate, setIsDraggingCreate] = useState(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 8;

  const fetchVouchers = async () => {
    try {
      setLoading(true);
         const token = localStorage.getItem("token");
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Voucher`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) throw new Error('Không thể lấy dữ liệu voucher');
      const data: Voucher[] = await response.json();
      const adjustedData = data.map((voucher) => ({
        ...voucher,
        giaTri: voucher.giaTri ?? (voucher.loaiVoucher === 2 ? 0 : 0),
        ngayBatDau: new Date(new Date(voucher.ngayBatDau).getTime() - new Date(voucher.ngayBatDau).getTimezoneOffset() * 60000).toISOString().split('T')[0],
        ngayKetThuc: new Date(new Date(voucher.ngayKetThuc).getTime() - new Date(voucher.ngayKetThuc).getTimezoneOffset() * 60000).toISOString().split('T')[0],
      }));
      setVouchers(adjustedData);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách voucher:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách voucher.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSearchTerm('');
    setFilterStatus('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
    fetchVouchers();
  };

  const deleteVoucher = async () => {
    if (!voucherToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Voucher/${voucherToDelete.maVoucher}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.status === 204) {
        setVouchers(vouchers.filter(voucher => voucher.maVoucher !== voucherToDelete.maVoucher));
        setOpenDeleteModal(false);
        setVoucherToDelete(null);
        toast.success("Xóa voucher thành công!");
      } else if (response.status === 404) {
        throw new Error('Voucher không tồn tại');
      } else {
        throw new Error('Không thể xóa voucher');
      }
    } catch (error: any) {
      console.error('Lỗi khi xóa voucher:', error);
      toast.error(error.message || "Có lỗi xảy ra khi xóa voucher.");
    }
  };

  const createVoucher = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (newVoucher.ngayBatDau < today) {
      toast.error("Ngày bắt đầu không được trước ngày hôm nay!");
      return;
    }
    if (newVoucher.ngayKetThuc < newVoucher.ngayBatDau) {
      toast.error("Ngày kết thúc không được trước ngày bắt đầu!");
      return;
    }
    if (newVoucher.loaiVoucher !== '2' && parseFloat(newVoucher.giaTriToiDa) <= parseFloat(newVoucher.dieuKien)) {
      toast.error("Giá trị tối đa phải lớn hơn điều kiện!");
      return;
    }
    if (!newVoucher.tenVoucher || !newVoucher.ngayBatDau || !newVoucher.ngayKetThuc || !newVoucher.dieuKien || (newVoucher.loaiVoucher !== '2' && !newVoucher.giaTriToiDa) || newVoucher.loaiVoucher === undefined || (newVoucher.loaiVoucher !== '2' && !newVoucher.giaTri)) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
         },
        body: JSON.stringify({
          tenVoucher: newVoucher.tenVoucher,
          giaTri: newVoucher.loaiVoucher === '2' ? 0 : parseInt(newVoucher.giaTri, 10),
          moTa: newVoucher.moTa || null,
          ngayBatDau: newVoucher.ngayBatDau,
          ngayKetThuc: newVoucher.ngayKetThuc,
          dieuKien: parseFloat(newVoucher.dieuKien),
          giaTriToiDa: newVoucher.loaiVoucher === '2' ? 0 : parseFloat(newVoucher.giaTriToiDa),
          loaiVoucher: parseInt(newVoucher.loaiVoucher, 10),
          hinhAnh: newVoucher.hinhAnh || null,
          trangThai: newVoucher.trangThai,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể thêm voucher');
      }

      await fetchVouchers();
      setOpenCreateModal(false);
      setNewVoucher({
        tenVoucher: '',
        giaTri: '',
        moTa: '',
        ngayBatDau: '',
        ngayKetThuc: '',
        dieuKien: '',
        giaTriToiDa: '',
        loaiVoucher: '0',
        hinhAnh: '',
        trangThai: 0,
      });
      toast.success("Thêm voucher thành công!");
    } catch (error: any) {
      console.error('Lỗi khi thêm voucher:', error);
      toast.error(error.message || "Có lỗi xảy ra khi thêm voucher.");
    }
  };

  const editVoucherSubmit = async () => {
    if (!editVoucher) {
      toast.error("Không có voucher để sửa!");
      return;
    }

    // Validation
    if (editVoucher.ngayKetThuc < editVoucher.ngayBatDau) {
      toast.error("Ngày kết thúc không được trước ngày bắt đầu!");
      return;
    }
    if (editVoucher.loaiVoucher !== 2 && editVoucher.giaTriToiDa <= editVoucher.dieuKien) {
      toast.error("Giá trị tối đa phải lớn hơn điều kiện!");
      return;
    }
    if (
      !editVoucher.tenVoucher ||
      !editVoucher.ngayBatDau ||
      !editVoucher.ngayKetThuc ||
      !editVoucher.dieuKien ||
      (editVoucher.loaiVoucher !== 2 && (!editVoucher.giaTri || !editVoucher.giaTriToiDa)) ||
      editVoucher.loaiVoucher === undefined
    ) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    // Prepare payload
    const payload = {
      maVoucher: editVoucher.maVoucher,
      tenVoucher: editVoucher.tenVoucher,
      giaTri: editVoucher.loaiVoucher === 2 ? 0 : editVoucher.giaTri ?? 0,
      moTa: editVoucher.moTa || null,
      ngayBatDau: editVoucher.ngayBatDau,
      ngayKetThuc: editVoucher.ngayKetThuc,
      dieuKien: editVoucher.dieuKien,
      giaTriToiDa: editVoucher.loaiVoucher === 2 ? 0 : editVoucher.giaTriToiDa ?? 0,
      loaiVoucher: editVoucher.loaiVoucher,
      trangThai: editVoucher.trangThai,
      hinhAnh: editVoucher.hinhAnh || null,
    };

    try {
      console.log("Sending payload to update voucher:", JSON.stringify(payload, null, 2)); // Debug payload

      const token = localStorage.getItem("token");
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Voucher`, {        
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
         },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Không thể sửa voucher";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const text = await response.text();
          console.error("Non-JSON response from server:", text);
          errorMessage = text || "Lỗi server không xác định";
        }
        throw new Error(errorMessage);
      }

      await fetchVouchers();
      setOpenEditModal(false);
      setEditVoucher(null);
      toast.success("Sửa voucher thành công!");
    } catch (error: any) {
      console.error('Lỗi khi sửa voucher:', error);
      toast.error(error.message || "Có lỗi xảy ra khi sửa voucher.");
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = vouchers.filter(item => {
    const normalizedSearchTerm = removeDiacritics(searchTerm.toLowerCase());
    const normalizedTenVoucher = removeDiacritics(item.tenVoucher?.toLowerCase() || '');
    const matchesSearchTerm =
      normalizedTenVoucher.includes(normalizedSearchTerm) ||
      item.maVoucher.toString().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === '0' && item.trangThai === 0) ||
      (filterStatus === '1' && item.trangThai === 1);

    const matchesDateRange =
      (!filterStartDate || new Date(item.ngayBatDau) >= new Date(filterStartDate)) &&
      (!filterEndDate || new Date(item.ngayKetThuc) <= new Date(filterEndDate));

    return matchesSearchTerm && matchesStatus && matchesDateRange;
  });

  const indexOfLastVoucher = currentPage * vouchersPerPage;
  const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirstVoucher, indexOfLastVoucher);
  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);

  const handleDeleteClick = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setOpenDeleteModal(true);
  };

  const handleDetailClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setOpenDetailModal(true);
  };

  const handleEditClick = (voucher: Voucher) => {
    setEditVoucher({
      ...voucher,
      ngayBatDau: new Date(voucher.ngayBatDau).toISOString().split('T')[0],
      ngayKetThuc: new Date(voucher.ngayKetThuc).toISOString().split('T')[0],
    });
    setOpenEditModal(true);
  };

  // Handlers for create modal
  const handleTenVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVoucher({ ...newVoucher, tenVoucher: e.target.value });
  };

  const handleGiaTriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (newVoucher.loaiVoucher === '0') {
      if (value === '') {
        setNewVoucher({ ...newVoucher, giaTri: value });
      } else {
        const parsedValue = parseInt(value, 10);
        if (parsedValue >= 1 && parsedValue <= 99) {
          setNewVoucher({ ...newVoucher, giaTri: value });
        } else {
          toast.error("Giá trị phần trăm phải từ 1 đến 99!");
        }
      }
    } else {
      setNewVoucher({ ...newVoucher, giaTri: value });
    }
  };

  const handleMoTaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVoucher({ ...newVoucher, moTa: e.target.value });
  };

  const handleNgayBatDauChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVoucher({ ...newVoucher, ngayBatDau: e.target.value });
  };

  const handleNgayKetThucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVoucher({ ...newVoucher, ngayKetThuc: e.target.value });
  };

  const handleDieuKienChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVoucher({ ...newVoucher, dieuKien: e.target.value });
  };

  const handleGiaTriToiDaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVoucher({ ...newVoucher, giaTriToiDa: e.target.value });
  };

  // Handlers for edit modal
  const handleEditTenVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      setEditVoucher({ ...editVoucher, tenVoucher: e.target.value });
    }
  };

  const handleEditGiaTriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      const value = e.target.value;
      if (editVoucher.loaiVoucher === 0) {
        if (value === '') {
          setEditVoucher({ ...editVoucher, giaTri: null });
        } else {
          const parsedValue = parseInt(value, 10);
          if (parsedValue >= 1 && parsedValue <= 99) {
            setEditVoucher({ ...editVoucher, giaTri: parsedValue });
          } else {
            toast.error("Giá trị phần trăm phải từ 1 đến 99!");
          }
        }
      } else {
        setEditVoucher({ ...editVoucher, giaTri: value === '' ? null : parseInt(value, 10) });
      }
    }
  };

  const handleEditMoTaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      setEditVoucher({ ...editVoucher, moTa: e.target.value || null });
    }
  };

  const handleEditNgayBatDauChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      setEditVoucher({ ...editVoucher, ngayBatDau: e.target.value });
    }
  };

  const handleEditNgayKetThucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      setEditVoucher({ ...editVoucher, ngayKetThuc: e.target.value });
    }
  };

  const handleEditDieuKienChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      setEditVoucher({ ...editVoucher, dieuKien: parseFloat(e.target.value) || 0 });
    }
  };

  const handleEditGiaTriToiDaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editVoucher) {
      setEditVoucher({ ...editVoucher, giaTriToiDa: parseFloat(e.target.value) || 0 });
    }
  };

  const handleDragOverCreate = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCreate(true);
  };

  const handleDragLeaveCreate = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCreate(false);
  };

  const handleDropCreate = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCreate(false);
    const file = e.dataTransfer.files[0];
    setTimeout(() => {
      if (file && file.type.startsWith("image/")) {
        handleImageChangeCreate(file);
      } else {
        toast.error("Vui lòng chọn một tệp hình ảnh!");
      }
    }, 0);
  };

  const handleImageChangeCreate = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        setNewVoucher({ ...newVoucher, hinhAnh: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChangeCreate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChangeCreate(file);
    } else {
      toast.error("Vui lòng chọn một tệp hình ảnh!");
    }
  };

  const handleDragOverEdit = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEdit(true);
  };

  const handleDragLeaveEdit = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEdit(false);
  };

  const handleDropEdit = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEdit(false);
    const file = e.dataTransfer.files[0];
    setTimeout(() => {
      if (file && file.type.startsWith("image/")) {
        handleImageChangeEdit(file);
      } else {
        toast.error("Vui lòng chọn một tệp hình ảnh!");
      }
    }, 0);
  };

  const handleImageChangeEdit = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        setEditVoucher({ ...editVoucher!, hinhAnh: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChangeEdit(file);
    } else {
      toast.error("Vui lòng chọn một tệp hình ảnh!");
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, currentPage + half);

    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const getVoucherTypeLabel = (loaiVoucher: number) => {
    switch (loaiVoucher) {
      case 0:
        return "Giảm giá theo phần trăm";
      case 1:
        return "Giảm giá theo số tiền";
      case 2:
        return "Miễn phí vận chuyển";
      default:
        return "Không xác định";
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voucher</h1>
        </div>
        <Button className="bg-purple-400 hover:bg-purple-500 text-white" variant="outline" size="sm" onClick={() => setOpenCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm Voucher
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Danh sách voucher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm voucher (tên, mã)..."
                  className="pl-8 w-full sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 self-end">
                <Button variant="outline" size="sm" className="h-9" onClick={handleRefresh} type="button">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm Mới
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-full sm:w-48 space-y-1">
                <Label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">Trạng Thái</Label>
                <Select
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger id="filterStatus">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="0">Đang Dùng</SelectItem>
                    <SelectItem value="1">Tạm Ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48 space-y-1">
                <Label htmlFor="filterStartDate" className="text-sm font-medium text-gray-700">Ngày Bắt Đầu</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filterStartDate"
                    type="date"
                    placeholder="Ngày bắt đầu"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    max={filterEndDate || undefined}
                    className="pl-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48 space-y-1">
                <Label htmlFor="filterEndDate" className="text-sm font-medium text-gray-700">Ngày Kết Thúc</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filterEndDate"
                    type="date"
                    placeholder="Ngày kết thúc"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    min={filterStartDate || undefined}
                    className="pl-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Đang tải...</div>
          ) : currentVouchers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentVouchers.map((item) => (
                <Card key={item.maVoucher} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg truncate">{item.tenVoucher}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {item.hinhAnh && (
                      <img
                        src={`data:image/jpeg;base64,${item.hinhAnh}`}
                        alt={item.tenVoucher}
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                    <div><strong>ID:</strong> {item.maVoucher}</div>
                    <div>
                      <strong>Giá trị: </strong>
                      {item.loaiVoucher === 0 ? `${item.giaTri ?? 0}%` :
                       item.loaiVoucher === 1 ? `${item.giaTri != null ? item.giaTri.toLocaleString('vi-VN') : '0'} VND` :
                       "Miễn phí vận chuyển"}
                    </div>
                    <div><strong>Hết hạn:</strong> {formatDateTime(item.ngayKetThuc)}</div>
                    <div>
                      <strong>Trạng thái:</strong>
                      <span
                        className={
                          item.trangThai === 1
                            ? "bg-red-100 text-red-800 px-2 py-1 rounded ml-2"
                            : "bg-green-100 text-green-800 px-2 py-1 rounded ml-2"
                        }
                      >
                        {item.trangThai === 0 ? "Đang Dùng" : "Tạm Ngưng"}
                      </span>
                    </div>
                    <div className="flex justify-end mt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FaEllipsisV />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDetailClick(item)}
                            className="flex items-center text-gray-700 hover:text-blue-600"
                          >
                            <FaEye className="mr-2 h-4 w-4" />
                            <span>Chi Tiết</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(item)}
                            className="flex items-center text-gray-700 hover:text-green-600"
                          >
                            <FaEdit className="mr-2 h-4 w-4 text-green-500" />
                            <span>Sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item)}
                            className="flex items-center text-gray-700 hover:text-red-600"
                          >
                            <FaTrashAlt className="mr-2 h-4 w-4 text-red-500" />
                            <span>Xóa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Không tìm thấy voucher nào phù hợp với bộ lọc của bạn.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Cuối
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal xác nhận xóa */}
      <Dialog open={openDeleteModal} onOpenChange={(open) => {
        if (!open) setOpenDeleteModal(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa voucher</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa voucher này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={deleteVoucher}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết voucher */}
      <Dialog open={openDetailModal} onOpenChange={(open) => {
        if (!open) setOpenDetailModal(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Voucher</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Voucher</label>
                  <Input value={selectedVoucher.maVoucher || "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên Voucher</label>
                  <Input value={selectedVoucher.tenVoucher || "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá Trị</label>
                  <Input
                    value={selectedVoucher.loaiVoucher === 0 ? `${selectedVoucher.giaTri ?? 0}%` :
                           selectedVoucher.loaiVoucher === 1 ? `${selectedVoucher.giaTri != null ? selectedVoucher.giaTri.toLocaleString('vi-VN') : '0'} VND` :
                           "Miễn phí vận chuyển"}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Bắt Đầu</label>
                  <Input value={selectedVoucher.ngayBatDau ? formatDateTime(selectedVoucher.ngayBatDau) : "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Kết Thúc</label>
                  <Input value={selectedVoucher.ngayKetThuc ? formatDateTime(selectedVoucher.ngayKetThuc) : "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Điều Kiện Trên</label>
                  <Input value={selectedVoucher.dieuKien ? `${selectedVoucher.dieuKien.toLocaleString('vi-VN')} VND` : "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại Voucher</label>
                  <Input value={getVoucherTypeLabel(selectedVoucher.loaiVoucher)} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá Trị Tối Đa</label>
                  <Input value={selectedVoucher.giaTriToiDa ? `${selectedVoucher.giaTriToiDa.toLocaleString('vi-VN')} VND` : "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng Thái</label>
                  <Input value={selectedVoucher.trangThai === 0 ? "Đang Dùng" : "Tạm Ngưng"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                  {selectedVoucher.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${selectedVoucher.hinhAnh}`}
                      alt={selectedVoucher.tenVoucher}
                      className="w-24 h-24 object-cover rounded mt-1 border"
                    />
                  ) : (
                    <Input value="Chưa có hình ảnh" disabled className="mt-1 bg-gray-50" />
                  )}
                </div>
              </div>
              <div className="md:col-span-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô Tả</label>
                  <Input value={selectedVoucher.moTa || "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Coupon</label>
                  {selectedVoucher.coupons && selectedVoucher.coupons.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1 space-y-1 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                      {selectedVoucher.coupons.map((coupon) => (
                        <li key={coupon.id} className={coupon.trangThai === 1 ? "line-through text-gray-500" : "text-gray-800"}>
                          {coupon.maNhap}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Input value="Không có mã" disabled className="mt-1 bg-gray-50" />
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenDetailModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal thêm voucher */}
      <Dialog open={openCreateModal} onOpenChange={(open) => {
        if (!open) setOpenCreateModal(false);
      }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Thêm Voucher Mới</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên Voucher</label>
                <Input
                  placeholder="Tên Voucher"
                  value={newVoucher.tenVoucher}
                  onChange={handleTenVoucherChange}
                  required
                />
              </div>
              {newVoucher.loaiVoucher !== '2' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Giá trị {newVoucher.loaiVoucher === '0' ? '(%)' : '(VND)'}
                  </label>
                  <Input
                    type="number"
                    placeholder={`Giá trị ${newVoucher.loaiVoucher === '0' ? '(%)' : '(VND)'}`}
                    value={newVoucher.giaTri}
                    onChange={handleGiaTriChange}
                    required
                    {...(newVoucher.loaiVoucher === '0' ? { min: 1, max: 99 } : {})}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <Input
                  placeholder="Mô tả"
                  value={newVoucher.moTa}
                  onChange={handleMoTaChange}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày Bắt Đầu</label>
                <Input
                  type="date"
                  placeholder="Ngày bắt đầu"
                  value={newVoucher.ngayBatDau}
                  onChange={handleNgayBatDauChange}
                  min={today}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày Kết Thúc</label>
                <Input
                  type="date"
                  placeholder="Ngày kết thúc"
                  value={newVoucher.ngayKetThuc}
                  onChange={handleNgayKetThucChange}
                  min={newVoucher.ngayBatDau || today}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Điều Kiện (VND)</label>
                <Input
                  type="number"
                  placeholder="Điều kiện (VND)"
                  value={newVoucher.dieuKien}
                  onChange={handleDieuKienChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Loại Voucher</Label>
                <Select
                  value={newVoucher.loaiVoucher}
                  onValueChange={(value) => setNewVoucher({ ...newVoucher, loaiVoucher: value, giaTri: value === '2' ? '' : newVoucher.giaTri, giaTriToiDa: value === '2' ? '' : newVoucher.giaTriToiDa })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Loại voucher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Giảm giá theo phần trăm</SelectItem>
                    <SelectItem value="1">Giảm giá theo số tiền</SelectItem>
                    <SelectItem value="2">Miễn phí vận chuyển</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newVoucher.loaiVoucher !== '2' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá Trị Tối Đa (VND)</label>
                  <Input
                    type="number"
                    placeholder="Giá trị tối đa (VND)"
                    value={newVoucher.giaTriToiDa}
                    onChange={handleGiaTriToiDaChange}
                    required
                  />
                </div>
              )}
              <div>
                <Label>Trạng Thái</Label>
                <RadioGroup
                  value={newVoucher.trangThai.toString()}
                  onValueChange={(value) => setNewVoucher({ ...newVoucher, trangThai: parseInt(value, 10) })}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="dang-dung" />
                    <Label htmlFor="dang-dung">Đang Dùng</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="tam-ngung" />
                    <Label htmlFor="tam-ngung">Tạm Ngưng</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    isDraggingCreate ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                  onDragOver={handleDragOverCreate}
                  onDragLeave={handleDragLeaveCreate}
                  onDrop={handleDropCreate}
                >
                  {newVoucher.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${newVoucher.hinhAnh}`}
                      alt="Preview"
                      className="h-20 w-20 mx-auto object-cover rounded"
                    />
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Kéo và thả hình ảnh vào đây hoặc nhấp để chọn
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="fileInputCreate"
                        onChange={handleFileInputChangeCreate}
                      />
                      <label htmlFor="fileInputCreate" className="cursor-pointer text-blue-500 hover:underline">
                        Chọn tệp
                      </label>
                    </div>
                  )}
                </div>
                {newVoucher.hinhAnh && (
                  <Button
                    variant="outline"
                    onClick={() => setNewVoucher({ ...newVoucher, hinhAnh: '' })}
                    className="w-full mt-2"
                  >
                    Xóa hình ảnh
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>Hủy</Button>
            <Button onClick={createVoucher}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal sửa voucher */}
      <Dialog open={openEditModal} onOpenChange={(open) => {
        if (!open) setOpenEditModal(false);
      }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Sửa Voucher</DialogTitle>
          </DialogHeader>
          {editVoucher && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên Voucher</label>
                  <Input
                    placeholder="Tên Voucher"
                    value={editVoucher.tenVoucher}
                    onChange={handleEditTenVoucherChange}
                    required
                  />
                </div>
                {editVoucher.loaiVoucher !== 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giá trị {editVoucher.loaiVoucher === 0 ? '(%)' : '(VND)'}
                    </label>
                    <Input
                      type="number"
                      placeholder={`Giá trị ${editVoucher.loaiVoucher === 0 ? '(%)' : '(VND)'}`}
                      value={editVoucher.giaTri ?? ''}
                      onChange={handleEditGiaTriChange}
                      required
                      {...(editVoucher.loaiVoucher === 0 ? { min: 1, max: 99 } : {})}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <Input
                    placeholder="Mô tả"
                    value={editVoucher.moTa || ''}
                    onChange={handleEditMoTaChange}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Bắt Đầu</label>
                  <Input
                    type="date"
                    placeholder="Ngày bắt đầu"
                    value={editVoucher.ngayBatDau}
                    onChange={handleEditNgayBatDauChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Kết Thúc</label>
                  <Input
                    type="date"
                    placeholder="Ngày kết thúc"
                    value={editVoucher.ngayKetThuc}
                    onChange={handleEditNgayKetThucChange}
                    min={editVoucher.ngayBatDau}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Điều Kiện (VND)</label>
                  <Input
                    type="number"
                    placeholder="Điều kiện (VND)"
                    value={editVoucher.dieuKien}
                    onChange={handleEditDieuKienChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Loại Voucher</Label>
                  <Select
                    value={editVoucher.loaiVoucher.toString()}
                    onValueChange={(value) => setEditVoucher({ ...editVoucher, loaiVoucher: parseInt(value, 10), giaTri: value === '2' ? 0 : editVoucher.giaTri, giaTriToiDa: value === '2' ? 0 : editVoucher.giaTriToiDa })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Loại voucher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Giảm giá theo phần trăm</SelectItem>
                      <SelectItem value="1">Giảm giá theo số tiền</SelectItem>
                      <SelectItem value="2">Miễn phí vận chuyển</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editVoucher.loaiVoucher !== 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giá Trị Tối Đa (VND)</label>
                    <Input
                      type="number"
                      placeholder="Giá trị tối đa (VND)"
                      value={editVoucher.giaTriToiDa}
                      onChange={handleEditGiaTriToiDaChange}
                      required
                    />
                  </div>
                )}
                <div>
                  <Label>Trạng Thái</Label>
                  <RadioGroup
                    value={editVoucher.trangThai.toString()}
                    onValueChange={(value) => setEditVoucher({ ...editVoucher, trangThai: parseInt(value, 10) })}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" id="dang-dung-edit" />
                      <Label htmlFor="dang-dung-edit">Đang Dùng</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="tam-ngung-edit" />
                      <Label htmlFor="tam-ngung-edit">Tạm Ngưng</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      isDraggingEdit ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                    onDragOver={handleDragOverEdit}
                    onDragLeave={handleDragLeaveEdit}
                    onDrop={handleDropEdit}
                  >
                    {editVoucher.hinhAnh ? (
                      <img
                        src={`data:image/jpeg;base64,${editVoucher.hinhAnh}`}
                        alt="Preview"
                        className="h-20 w-20 mx-auto object-cover rounded"
                      />
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Kéo và thả hình ảnh vào đây hoặc nhấp để chọn
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="fileInputEdit"
                          onChange={handleFileInputChangeEdit}
                        />
                        <label htmlFor="fileInputEdit" className="cursor-pointer text-blue-500 hover:underline">
                          Chọn tệp
                        </label>
                      </div>
                    )}
                  </div>
                  {editVoucher.hinhAnh && (
                    <Button
                      variant="outline"
                      onClick={() => setEditVoucher({ ...editVoucher, hinhAnh: '' })}
                      className="w-full mt-2"
                    >
                      Xóa hình ảnh
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenEditModal(false)}>Hủy</Button>
            <Button onClick={editVoucherSubmit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vouchers;