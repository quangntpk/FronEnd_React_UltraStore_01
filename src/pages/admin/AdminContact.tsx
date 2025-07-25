import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Trash,
  Eye,
  Mail,
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Palette,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import Swal from "sweetalert2";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const ITEMS_PER_PAGE = 10;

interface LienHe {
  maLienHe: number;
  hoTen: string;
  email: string;
  sdt: string;
  noiDung: string;
  trangThai: number;
  ngayTao: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const AdminContact = () => {
  const [lienHeList, setLienHeList] = useState<LienHe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedContact, setSelectedContact] = useState<LienHe | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [deleteContact, setDeleteContact] = useState<LienHe | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [selectedLienHeIds, setSelectedLienHeIds] = useState<number[]>([]);
  const [statusLoading, setStatusLoading] = useState<{ [key: number]: boolean }>({});
  const [confirmStatusChange, setConfirmStatusChange] = useState<{ contact: LienHe; newStatus: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLienHe();

    const searchTimeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(searchTimeout);
    };
  }, [searchTerm]);

  const fetchLienHe = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/LienHe`);
      if (!response.ok) throw new Error("Lỗi khi tải danh sách liên hệ");
      const data = await response.json();
      setLienHeList(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi tải danh sách liên hệ: " + (err instanceof Error ? err.message : "Lỗi không xác định"),
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredLienHe = useMemo(() => {
    let filtered = [...lienHeList]
      .sort((a, b) => b.maLienHe - a.maLienHe)
      .filter(
        (l) =>
          l.hoTen?.toLowerCase().includes(debouncedSearchTerm) ||
          l.email?.toLowerCase().includes(debouncedSearchTerm) ||
          l.sdt?.toLowerCase().includes(debouncedSearchTerm)
      );
    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => String(l.trangThai) === statusFilter);
    }
    return filtered;
  }, [lienHeList, debouncedSearchTerm, statusFilter]);

  const totalPages = Math.ceil(sortedAndFilteredLienHe.length / ITEMS_PER_PAGE);
  const paginatedLienHe = sortedAndFilteredLienHe.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isAllSelected = paginatedLienHe.every((lienHe) =>
    selectedLienHeIds.includes(lienHe.maLienHe)
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const openConfirmStatusChange = (contact: LienHe, newStatus: string) => {
    setConfirmStatusChange({ contact, newStatus });
  };

  const closeConfirmStatusChange = () => {
    setConfirmStatusChange(null);
    setIsConfirming(false);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmStatusChange) return;
    const { contact, newStatus } = confirmStatusChange;
    setIsConfirming(true);
    setStatusLoading((prev) => ({ ...prev, [contact.maLienHe]: true }));
    try {
      const response = await fetch(`${API_URL}/api/LienHe/${contact.maLienHe}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, trangThai: Number(newStatus) }),
      });
      if (!response.ok) throw new Error("Lỗi khi cập nhật trạng thái");
      setLienHeList((prev) =>
        prev.map((lh) => (lh.maLienHe === contact.maLienHe ? { ...lh, trangThai: Number(newStatus) } : lh))
      );
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật trạng thái thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi cập nhật trạng thái: " + (err instanceof Error ? err.message : "Lỗi không xác định"),
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [contact.maLienHe]: false }));
      setIsConfirming(false);
      closeConfirmStatusChange();
    }
  };

  const handleSelectLienHe = (id: number) => {
    setSelectedLienHeIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLienHeIds((prev) =>
        prev.filter((id) => !paginatedLienHe.some((l) => l.maLienHe === id))
      );
    } else {
      const newSelectedIds = paginatedLienHe.map((l) => l.maLienHe);
      setSelectedLienHeIds((prev) => [...new Set([...prev, ...newSelectedIds])]);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (!deleteContact && selectedLienHeIds.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn ít nhất một liên hệ để xóa.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      setDeleteContact(null);
      setIsDeleting(false);
      return;
    }

    try {
      if (selectedLienHeIds.length > 0) {
        const response = await fetch(`${API_URL}/api/LienHe/DeleteMultiple`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedLienHeIds),
        });
        if (!response.ok) throw new Error("Lỗi khi xóa nhiều liên hệ");
        setLienHeList((prev) => prev.filter((lh) => !selectedLienHeIds.includes(lh.maLienHe)));
        setSelectedLienHeIds([]);
      } else if (deleteContact) {
        const response = await fetch(`${API_URL}/api/LienHe/${deleteContact.maLienHe}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Lỗi khi xóa liên hệ");
        setLienHeList((prev) => prev.filter((lh) => lh.maLienHe !== deleteContact.maLienHe));
      }
      setDeleteContact(null);
      setCurrentPage(1);
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Xóa liên hệ thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi xóa liên hệ: " + (err instanceof Error ? err.message : "Lỗi không xác định"),
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
    setIsDeleting(false);
  };

  const openSupportModal = (contact: LienHe) => {
    setSelectedContact(contact);
    setSupportModalOpen(true);
    setSupportMessage("");
  };

  const closeSupportModal = () => {
    setSupportModalOpen(false);
    setSelectedContact(null);
    setSupportMessage("");
    setError("");
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      setError("Nội dung hỗ trợ không được để trống.");
      return;
    }
    setIsSending(true);
    try {
      const payload = {
        toEmail: selectedContact?.email,
        message: supportMessage,
        hoTen: selectedContact?.hoTen,
        sdt: selectedContact?.sdt,
      };
      const response = await fetch(`${API_URL}/api/LienHe/SupportEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Lỗi khi gửi email hỗ trợ");

      if (selectedContact) {
        const updateResponse = await fetch(`${API_URL}/api/LienHe/${selectedContact.maLienHe}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...selectedContact, trangThai: 1 }),
        });
        if (!updateResponse.ok) throw new Error("Lỗi khi cập nhật trạng thái");
        setLienHeList((prev) =>
          prev.map((lh) => (lh.maLienHe === selectedContact.maLienHe ? { ...lh, trangThai: 1 } : lh))
        );
      }

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Gửi hỗ trợ thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      closeSupportModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi gửi email hỗ trợ: " + (err instanceof Error ? err.message : "Lỗi không xác định"),
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalLienHeChartData = {
    labels: ["Tổng số liên hệ"],
    datasets: [
      {
        label: "Số lượng",
        data: [lienHeList.length],
        backgroundColor: ["#9b87f5"],
      },
    ],
  };

  const totalLienHeChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Tổng số lượng liên hệ" },
    },
  };

  const totalLienHeTangGiamData = useMemo(() => {
    const countsByDate: { [key: string]: number } = {};
    lienHeList.forEach((lienHe) => {
      const date = new Date(lienHe.ngayTao).toISOString().split("T")[0];
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });

    return {
      labels: Object.keys(countsByDate).sort(),
      datasets: [
        {
          label: "Tổng số liên hệ",
          data: Object.keys(countsByDate)
            .sort()
            .map((date) => countsByDate[date]),
          borderColor: "#9b87f5",
          backgroundColor: "#9b87f5",
          fill: false,
        },
      ],
    };
  }, [lienHeList]);

  const totalLienHeTangGiamOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Tăng giảm tổng số lượng liên hệ theo thời gian" },
    },
    scales: {
      x: { title: { display: true, text: "Ngày" } },
      y: { title: { display: true, text: "Số lượng liên hệ" }, beginAtZero: true },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Quản Lý Liên Hệ</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-2 gap-1">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Danh sách liên hệ
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Danh sách thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Tìm kiếm liên hệ..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full md:w-[820px] pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="0">Chưa xử lý</SelectItem>
                <SelectItem value="1">Đã xử lý</SelectItem>
              </SelectContent>
            </Select>
            {selectedLienHeIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteContact({} as LienHe)}
                className="bg-[#9b87f5] text-white hover:bg-[#8a76e3]"
              >
                <Trash className="h-4 w-4 mr-2" /> Xóa nhiều
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
            </div>
          ) : error && !supportModalOpen ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách liên hệ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Họ Tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Số Điện Thoại</TableHead>
                        <TableHead>Nội Dung</TableHead>
                        <TableHead>Ngày Tạo</TableHead>
                        <TableHead>Trạng Thái</TableHead>
                        <TableHead>Hành Động</TableHead>
                        <TableHead>
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLienHe.map((lienHe, index) => (
                        <TableRow key={lienHe.maLienHe}>
                          <TableCell>
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>{lienHe.hoTen}</TableCell>
                          <TableCell>{lienHe.email}</TableCell>
                          <TableCell>{lienHe.sdt}</TableCell>
                          <TableCell>{lienHe.noiDung}</TableCell>
                          <TableCell>
                            {new Date(lienHe.ngayTao).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 relative">
                              {statusLoading[lienHe.maLienHe] && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              <label className="relative inline-block w-[60px] h-[34px]">
                                <input
                                  type="checkbox"
                                  className="opacity-0 w-0 h-0"
                                  checked={lienHe.trangThai === 1}
                                  onChange={(e) =>
                                    openConfirmStatusChange(lienHe, e.target.checked ? "1" : "0")
                                  }
                                  disabled={statusLoading[lienHe.maLienHe]}
                                />
                                <span
                                  className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ease-in-out
                                    before:absolute before:h-[30px] before:w-[30px] before:left-[2px] before:bottom-[2px]
                                    before:bg-white before:rounded-full before:shadow-md before:transition-all before:duration-300 before:ease-in-out
                                    ${
                                      lienHe.trangThai === 1
                                        ? "bg-[#9b87f5] before:translate-x-[26px]"
                                        : "bg-[#9E9E9E]"
                                    } hover:scale-110 shadow-sm hover:shadow-md`}
                                ></span>
                                <span className="sr-only">
                                  {lienHe.trangThai === 0 ? "Chưa xử lý" : "Đã xử lý"}
                                </span>
                              </label>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openSupportModal(lienHe)} className="text-green-700">
                                  <Eye className="mr-2 h-4 w-4" /> Chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteContact(lienHe)} className="text-red-700">
                                  <Trash className="mr-2 h-4 w-4" /> Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedLienHeIds.includes(lienHe.maLienHe)}
                              onChange={() => handleSelectLienHe(lienHe.maLienHe)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Trước
                  </Button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      className={currentPage === page ? "bg-purple-400 text-white hover:bg-purple-300" : ""}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="flex items-center"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tổng số lượng liên hệ</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Đang tải dữ liệu thống kê...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <Bar data={totalLienHeChartData} options={totalLienHeChartOptions} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tăng giảm tổng số lượng liên hệ theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Đang tải dữ liệu thống kê...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <Line data={totalLienHeTangGiamData} options={totalLienHeTangGiamOptions} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {supportModalOpen && selectedContact && (
        <Dialog open={true} onOpenChange={closeSupportModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết liên hệ & Gửi hỗ trợ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p><strong>Họ Tên:</strong> {selectedContact.hoTen}</p>
              <p><strong>Email:</strong> {selectedContact.email}</p>
              <p><strong>Số điện thoại:</strong> {selectedContact.sdt}</p>
              <p><strong>Nội dung:</strong> {selectedContact.noiDung}</p>
              <p><strong>Ngày tạo:</strong> {new Date(selectedContact.ngayTao).toLocaleString()}</p>
              <p><strong>Trạng thái:</strong> {selectedContact.trangThai === 0 ? "Chưa xử lý" : "Đã xử lý"}</p>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Nhập nội dung hỗ trợ..."
                className="w-full rounded-md border border-gray-300 p-2"
                rows={5}
              />
              {error && <p className="text-red-500">{error}</p>}
            </div>
            <DialogFooter className="flex justify-between items-center mt-4">
              <Button variant="ghost" onClick={closeSupportModal} className="flex items-center gap-2 bg-[#e7e4f5]">
                <X className="h-4 w-4" /> Đóng
              </Button>
              <Button onClick={handleSendSupport} disabled={isSending} className="bg-[#9b87f5] text-white hover:bg-[#8a76e3]">
                {isSending ? "Đang gửi..." : "Gửi hỗ trợ"}
                <Mail className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deleteContact && (
        <Dialog open={true} onOpenChange={() => setDeleteContact(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedLienHeIds.length > 0 ? (
                <p>Bạn có chắc chắn muốn xóa {selectedLienHeIds.length} liên hệ đã chọn không?</p>
              ) : (
                <p>Bạn có chắc chắn muốn xóa liên hệ của <strong>{deleteContact.hoTen}</strong> không?</p>
              )}
            </div>
            <DialogFooter className="flex justify-end space-x-2 mt-4">
              <Button variant="ghost" onClick={() => setDeleteContact(null)} className="flex items-center gap-2 bg-[#e7e4f5]">
                <XCircle className="h-4 w-4" /> Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2"
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
                <Trash className="h-4 w-4 mr-2" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmStatusChange && (
        <Dialog open={true} onOpenChange={closeConfirmStatusChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Bạn có chắc chắn muốn thay đổi trạng thái của liên hệ <strong>{confirmStatusChange.contact.hoTen}</strong> không?</p>
            </div>
            <DialogFooter className="flex justify-end space-x-2 mt-4">
              <Button variant="ghost" onClick={closeConfirmStatusChange} className="flex items-center gap-2 bg-[#e7e4f5]">
                <XCircle className="h-4 w-4" /> Hủy
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                disabled={isConfirming}
                className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2"
              >
                {isConfirming ? "Đang xử lý..." : "Xác nhận"}
                <CheckCircle className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminContact;