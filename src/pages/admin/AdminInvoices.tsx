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
  giaTri: number;
  moTa: string | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  hinhAnh: string | null;
  dieuKien: number;
  soLuong: number;
  trangThai: number;
  coupons: Coupon[];
}

// Hàm định dạng ngày giờ
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  // Bù múi giờ để hiển thị đúng ngày địa phương
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
    soLuong: '',
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
      const response = await fetch(`http://localhost:5261/api/Voucher`);
      if (!response.ok) throw new Error('Không thể lấy dữ liệu voucher');
      const data: Voucher[] = await response.json();
      // Chuyển đổi ngày từ API về định dạng ngày địa phương
      const adjustedData = data.map((voucher) => ({
        ...voucher,
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

  // Hàm xử lý làm mới
  const handleRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định (reload trang)
    console.log('Refresh clicked'); // Log để debug
    setSearchTerm(''); // Reset bộ lọc tìm kiếm
    setFilterStatus('all'); // Reset bộ lọc trạng thái
    setFilterStartDate(''); // Reset ngày bắt đầu
    setFilterEndDate(''); // Reset ngày kết thúc
    setCurrentPage(1); // Reset về trang đầu
    fetchVouchers(); // Gọi lại API để lấy danh sách voucher
  };

  const deleteVoucher = async () => {
    if (!voucherToDelete) return;

    try {
      const response = await fetch(`http://localhost:5261/api/Voucher/${voucherToDelete.maVoucher}`, {
        method: 'DELETE',
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
    } catch (error) {
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

    if (!newVoucher.tenVoucher || !newVoucher.giaTri || !newVoucher.ngayBatDau || !newVoucher.ngayKetThuc || !newVoucher.dieuKien || !newVoucher.soLuong) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5261/api/Voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenVoucher: newVoucher.tenVoucher,
          giaTri: parseInt(newVoucher.giaTri),
          moTa: newVoucher.moTa || null,
          ngayBatDau: newVoucher.ngayBatDau, // Gửi trực tiếp chuỗi YYYY-MM-DD
          ngayKetThuc: newVoucher.ngayKetThuc, // Gửi trực tiếp chuỗi YYYY-MM-DD
          dieuKien: parseFloat(newVoucher.dieuKien),
          soLuong: parseInt(newVoucher.soLuong),
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
        soLuong: '',
        hinhAnh: '',
        trangThai: 0,
      });
      toast.success("Thêm voucher thành công!");
    } catch (error) {
      console.error('Lỗi khi thêm voucher:', error);
      toast.error(error.message || "Có lỗi xảy ra khi thêm voucher.");
    }
  };

  const editVoucherSubmit = async () => {
    if (!editVoucher) return;

    const today = new Date().toISOString().split('T')[0];
    if (editVoucher.ngayBatDau < today && editVoucher.ngayBatDau !== today) {
      toast.error("Ngày bắt đầu không được trước ngày hôm nay!");
      return;
    }
    if (editVoucher.ngayKetThuc < editVoucher.ngayBatDau) {
      toast.error("Ngày kết thúc không được trước ngày bắt đầu!");
      return;
    }

    if (!editVoucher.tenVoucher || !editVoucher.giaTri || !editVoucher.ngayBatDau || !editVoucher.ngayKetThuc || !editVoucher.dieuKien || !editVoucher.soLuong) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5261/api/Voucher`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maVoucher: editVoucher.maVoucher,
          tenVoucher: editVoucher.tenVoucher,
          giaTri: parseInt(editVoucher.giaTri.toString()),
          moTa: editVoucher.moTa || null,
          ngayBatDau: editVoucher.ngayBatDau, // Gửi trực tiếp chuỗi YYYY-MM-DD
          ngayKetThuc: editVoucher.ngayKetThuc, // Gửi trực tiếp chuỗi YYYY-MM-DD
          dieuKien: parseFloat(editVoucher.dieuKien.toString()),
          soLuong: parseInt(editVoucher.soLuong.toString()),
          trangThai: editVoucher.trangThai,
          hinhAnh: editVoucher.hinhAnh || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể sửa voucher');
      }

      await fetchVouchers();
      setOpenEditModal(false);
      setEditVoucher(null);
      toast.success("Sửa voucher thành công!");
    } catch (error) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVoucher({ ...newVoucher, [name]: value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditVoucher({ ...editVoucher!, [name]: value });
  };

  // Xử lý kéo thả cho modal thêm
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

  // Xử lý kéo thả cho modal sửa
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
          <CardTitle>Danh Sách Voucher</CardTitle>
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
                    <div><strong>Giá trị:</strong> {item.giaTri} %</div>
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
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
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
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Voucher</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
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
                  <Input value={selectedVoucher.giaTri ? `${selectedVoucher.giaTri} %` : "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
              </div>
              <div className="space-y-4">
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số Lượng</label>
                  <Input value={selectedVoucher.soLuong || "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
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
              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô Tả</label>
                  <Input value={selectedVoucher.moTa || "Chưa cập nhật"} disabled className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Coupon</label>
                  {selectedVoucher.coupons && selectedVoucher.coupons.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1 space-y-1 max-h-26 overflow-y-auto border rounded p-2 bg-gray-50">
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
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Thêm Voucher Mới</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên Voucher</label>
                <Input name="tenVoucher" placeholder="Tên Voucher" value={newVoucher.tenVoucher} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giá trị (%)</label>
                <Input name="giaTri" type="number" placeholder="Giá trị (%)" value={newVoucher.giaTri} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <Input name="moTa" placeholder="Mô tả" value={newVoucher.moTa} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày Bắt Đầu</label>
                <Input name="ngayBatDau" type="date" placeholder="Ngày bắt đầu" value={newVoucher.ngayBatDau} onChange={handleInputChange} min={today} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày Kết Thúc</label>
                <Input name="ngayKetThuc" type="date" placeholder="Ngày kết thúc" value={newVoucher.ngayKetThuc} onChange={handleInputChange} min={newVoucher.ngayBatDau || today} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Điều Kiện (VND)</label>
                <Input name="dieuKien" type="number" placeholder="Điều kiện (VND)" value={newVoucher.dieuKien} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số Lượng</label>
                <Input name="soLuong" type="number" placeholder="Số lượng" value={newVoucher.soLuong} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Trạng Thái</Label>
                <RadioGroup
                  value={newVoucher.trangThai.toString()}
                  onValueChange={(value) => setNewVoucher({ ...newVoucher, trangThai: parseInt(value) })}
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
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Sửa Voucher</DialogTitle>
          </DialogHeader>
          {editVoucher && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên Voucher</label>
                  <Input name="tenVoucher" placeholder="Tên Voucher" value={editVoucher.tenVoucher} onChange={handleEditInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá trị (%)</label>
                  <Input name="giaTri" type="number" placeholder="Giá trị (%)" value={editVoucher.giaTri} onChange={handleEditInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <Input name="moTa" placeholder="Mô tả" value={editVoucher.moTa || ''} onChange={handleEditInputChange} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Bắt Đầu</label>
                  <Input name="ngayBatDau" type="date" placeholder="Ngày bắt đầu" value={editVoucher.ngayBatDau} onChange={handleEditInputChange} min={today} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Kết Thúc</label>
                  <Input name="ngayKetThuc" type="date" placeholder="Ngày kết thúc" value={editVoucher.ngayKetThuc} onChange={handleEditInputChange} min={editVoucher.ngayBatDau || today} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Điều Kiện (VND)</label>
                  <Input name="dieuKien" type="number" placeholder="Điều kiện (VND)" value={editVoucher.dieuKien} onChange={handleEditInputChange} required />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số Lượng</label>
                  <Input name="soLuong" type="number" placeholder="Số lượng" value={editVoucher.soLuong} onChange={handleEditInputChange} required />
                </div>
                <div>
                  <Label>Trạng Thái</Label>
                  <RadioGroup
                    value={editVoucher.trangThai.toString()}
                    onValueChange={(value) => setEditVoucher({ ...editVoucher, trangThai: parseInt(value) })}
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