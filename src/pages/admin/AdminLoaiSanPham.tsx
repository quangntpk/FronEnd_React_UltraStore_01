import { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaEdit, FaTrashAlt, FaEye, FaUndo, FaTrash } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Search, MoreVertical, Upload, X, Plus, EyeOff, Loader2, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import Swal from "sweetalert2";

interface LoaiSanPham {
  maLoaiSanPham: number;
  tenLoaiSanPham: string;
  kiHieu: string;
  kichThuoc?: string[] | null; // Updated to List<string>?
  hinhAnh?: string | null;
  trangThai: number;
}

interface GroupedLoaiSanPham {
  tenLoaiSanPham: string;
  kiHieu: string;
  hinhAnh?: string | null;
  entries: LoaiSanPham[];
}

const ITEMS_PER_PAGE = 10;
const API_URL = "http://localhost:5261";

const formatBase64Image = (base64String: string | null | undefined): string => {
  if (!base64String) return "/placeholder-image.jpg";
  if (base64String.startsWith("data:image")) return base64String;
  return `data:image/png;base64,${base64String}`;
};

const getBase64 = (base64String: string | null | undefined): string | null => {
  if (!base64String) return null;
  if (base64String.startsWith("data:")) {
    return base64String.split(",")[1];
  }
  return base64String;
};

const AdminLoaiSanPham = () => {
  const [loaiSanPhams, setLoaiSanPhams] = useState<LoaiSanPham[]>([]);
  const [groupedLoaiSanPhams, setGroupedLoaiSanPhams] = useState<GroupedLoaiSanPham[]>([]);
  const [filteredGroupedLoaiSanPhams, setFilteredGroupedLoaiSanPhams] = useState<GroupedLoaiSanPham[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [moModalThem, setMoModalThem] = useState(false);
  const [moModalSua, setMoModalSua] = useState(false);
  const [moModalXoa, setMoModalXoa] = useState(false);
  const [moModalXoaVinhVien, setMoModalXoaVinhVien] = useState(false);
  const [moModalKhoiPhuc, setMoModalKhoiPhuc] = useState(false);
  const [moModalChiTiet, setMoModalChiTiet] = useState(false);
  const [loaiSanPhamCanXoa, setLoaiSanPhamCanXoa] = useState<GroupedLoaiSanPham | null>(null);
  const [loaiSanPhamCanXoaVinhVien, setLoaiSanPhamCanXoaVinhVien] = useState<GroupedLoaiSanPham | null>(null);
  const [loaiSanPhamCanKhoiPhuc, setLoaiSanPhamCanKhoiPhuc] = useState<GroupedLoaiSanPham | null>(null);
  const [tenLoaiSanPhamMoi, setTenLoaiSanPhamMoi] = useState("");
  const [kiHieuMoi, setKiHieuMoi] = useState("");
  const [kichThuocMoi, setKichThuocMoi] = useState<string[]>([""]);
  const [hinhAnhMoi, setHinhAnhMoi] = useState<string | null>(null);
  const [loaiSanPhamDangSua, setLoaiSanPhamDangSua] = useState<GroupedLoaiSanPham | null>(null);
  const [loaiSanPhamChiTiet, setLoaiSanPhamChiTiet] = useState<GroupedLoaiSanPham | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [errorsThem, setErrorsThem] = useState({ ten: "", kiHieu: "", kichThuoc: "", hinhAnh: "" });
  const [errorsSua, setErrorsSua] = useState({ ten: "", kichThuoc: "", hinhAnh: "" });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const groupLoaiSanPhams = (data: LoaiSanPham[]): GroupedLoaiSanPham[] => {
    const grouped = new Map<string, GroupedLoaiSanPham>();
    const targetStatus = activeTab === "active" ? 1 : 0;

    data.forEach((lsp) => {
      if (lsp.trangThai !== targetStatus) return;
      const key = `${lsp.tenLoaiSanPham}_${lsp.kiHieu}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          tenLoaiSanPham: lsp.tenLoaiSanPham,
          kiHieu: lsp.kiHieu,
          hinhAnh: lsp.hinhAnh,
          entries: [],
        });
      }

      grouped.get(key)!.entries.push(lsp);
    });

    return Array.from(grouped.values()).sort((a, b) => a.tenLoaiSanPham.localeCompare(b.tenLoaiSanPham));
  };

  const fetchLoaiSanPham = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/LoaiSanPham?trangThai=${activeTab === "active" ? 1 : 0}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
        } else if (response.status === 500) {
          throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
        }
        throw new Error(errorText || "Không thể lấy danh sách loại sản phẩm.");
      }

      const data: LoaiSanPham[] = await response.json();
      setLoaiSanPhams(data);
      const groupedData = groupLoaiSanPhams(data);
      setGroupedLoaiSanPhams(groupedData);
      setFilteredGroupedLoaiSanPhams(groupedData);
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi tải danh sách loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const searchLoaiSanPham = useCallback(async () => {
    if (!searchTerm.trim()) {
      setFilteredGroupedLoaiSanPhams(groupedLoaiSanPhams);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenLoai: searchTerm,
        trangThai: activeTab === "active" ? "1" : "0",
      });
      const response = await fetch(`${API_URL}/api/LoaiSanPham/Search?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
        } else if (response.status === 500) {
          throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
        }
        throw new Error(errorText || "Không thể tìm kiếm loại sản phẩm.");
      }

      const data: LoaiSanPham[] = await response.json();
      const groupedData = groupLoaiSanPhams(data);
      setFilteredGroupedLoaiSanPhams(groupedData);
      setCurrentPage(1);
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi tìm kiếm loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, groupedLoaiSanPhams, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchLoaiSanPham();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, searchLoaiSanPham]);

  useEffect(() => {
    fetchLoaiSanPham();
  }, [fetchLoaiSanPham]);

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Kích thước hình ảnh không được vượt quá 2MB!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (moModalThem) {
        setHinhAnhMoi(base64String);
        setErrorsThem((prev) => ({ ...prev, hinhAnh: "" }));
      } else if (moModalSua && loaiSanPhamDangSua) {
        setLoaiSanPhamDangSua({ ...loaiSanPhamDangSua, hinhAnh: base64String });
        setErrorsSua((prev) => ({ ...prev, hinhAnh: "" }));
      }
    };
    reader.onerror = () => {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể đọc tệp hình ảnh!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn một tệp hình ảnh!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn một tệp hình ảnh!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const addKichThuocField = () => {
    setKichThuocMoi([...kichThuocMoi, ""]);
  };

  const removeKichThuocField = (index: number) => {
    setKichThuocMoi(kichThuocMoi.filter((_, i) => i !== index));
  };

  const updateKichThuocField = (index: number, value: string) => {
    const updatedKichThuoc = [...kichThuocMoi];
    updatedKichThuoc[index] = value;
    setKichThuocMoi(updatedKichThuoc);
  };

  const validateThem = () => {
    let valid = true;
    const newErrors = { ten: "", kiHieu: "", kichThuoc: "", hinhAnh: "" };
    const kiHieuUpper = kiHieuMoi.trim().toUpperCase();

    if (!tenLoaiSanPhamMoi.trim()) {
      newErrors.ten = "Tên loại sản phẩm không được để trống!";
      valid = false;
    } else if (tenLoaiSanPhamMoi.length > 100) {
      newErrors.ten = "Tên loại sản phẩm không được dài quá 100 ký tự!";
      valid = false;
    }

    if (!kiHieuMoi.trim()) {
      newErrors.kiHieu = "Ký hiệu không được để trống!";
      valid = false;
    } else if (kiHieuUpper.length !== 1) {
      newErrors.kiHieu = "Ký hiệu phải đúng 1 ký tự!";
      valid = false;
    } else if (!/^[A-Z]$/.test(kiHieuUpper)) {
      newErrors.kiHieu = "Ký hiệu phải là chữ cái in hoa (A-Z)!";
      valid = false;
    } else if (groupedLoaiSanPhams.some(group => group.kiHieu.toUpperCase() === kiHieuUpper && group.entries.some(entry => entry.trangThai === 1))) {
      newErrors.kiHieu = "Ký hiệu đã tồn tại! Vui lòng chọn ký hiệu khác.";
      valid = false;
    }

    const trimmedSizes = kichThuocMoi.map(size => size.trim().toUpperCase()).filter(size => size);
    if (trimmedSizes.length === 0) {
      newErrors.kichThuoc = "Phải nhập ít nhất một kích thước!";
      valid = false;
    } else {
      const uniqueSizes = new Set(trimmedSizes);
      if (uniqueSizes.size !== trimmedSizes.length) {
        newErrors.kichThuoc = "Các kích thước không được trùng lặp!";
        valid = false;
      }
      if (trimmedSizes.some(size => !/^[A-Z0-9]{1,3}$/.test(size))) {
        newErrors.kichThuoc = "Kích thước phải là chữ cái in hoa hoặc số (1-3 ký tự, ví dụ: S, M, XL, 2XL)!";
        valid = false;
      }
    }

    if (!hinhAnhMoi) {
      newErrors.hinhAnh = "Hình ảnh không được để trống!";
      valid = false;
    }

    setErrorsThem(newErrors);
    return valid;
  };

  const validateSua = () => {
    let valid = true;
    const newErrors = { ten: "", kichThuoc: "", hinhAnh: "" };

    if (!loaiSanPhamDangSua?.tenLoaiSanPham?.trim()) {
      newErrors.ten = "Tên loại sản phẩm không được để trống!";
      valid = false;
    } else if (loaiSanPhamDangSua.tenLoaiSanPham.length > 100) {
      newErrors.ten = "Tên loại sản phẩm không được dài quá 100 ký tự!";
      valid = false;
    }

    const trimmedSizes = kichThuocMoi.map(size => size.trim().toUpperCase()).filter(size => size);
    if (trimmedSizes.length > 0) {
      const uniqueSizes = new Set(trimmedSizes);
      if (uniqueSizes.size !== trimmedSizes.length) {
        newErrors.kichThuoc = "Các kích thước mới không được trùng lặp!";
        valid = false;
      }
      if (trimmedSizes.some(size => !/^[A-Z0-9]{1,3}$/.test(size))) {
        newErrors.kichThuoc = "Kích thước phải là chữ cái in hoa hoặc số (1-3 ký tự, ví dụ: S, M, XL, 2XL)!";
        valid = false;
      }
      const existingSizes = loaiSanPhamDangSua?.entries
        .filter(entry => entry.trangThai === 1)
        .flatMap(entry => entry.kichThuoc || []).map(size => size.toUpperCase()) || [];
      if (trimmedSizes.some(size => existingSizes.includes(size))) {
        newErrors.kichThuoc = "Kích thước mới không được trùng với kích thước hiện tại!";
        valid = false;
      }
    }

    if (!loaiSanPhamDangSua?.hinhAnh) {
      newErrors.hinhAnh = "Hình ảnh không được để trống!";
      valid = false;
    }

    setErrorsSua(newErrors);
    return valid;
  };

  const themLoaiSanPham = async () => {
    if (!validateThem()) return;

    setIsProcessing(true);
    try {
      const base64Image = getBase64(hinhAnhMoi);
      const kiHieuUpper = kiHieuMoi.trim().toUpperCase();
      const trimmedSizes = kichThuocMoi.map(size => size.trim().toUpperCase()).filter(size => size);

      const response = await fetch(`${API_URL}/api/LoaiSanPham`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          tenLoaiSanPham: tenLoaiSanPhamMoi.trim(),
          kiHieu: kiHieuUpper,
          kichThuoc: trimmedSizes.length > 0 ? trimmedSizes : null, // Send null if no sizes
          hinhAnh: base64Image,
          trangThai: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          throw new Error(errorData.error || "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.");
        } else if (response.status === 401) {
          throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
        } else if (response.status === 409) {
          throw new Error(errorData.error || `Ký hiệu ${kiHieuUpper} đã tồn tại trong cơ sở dữ liệu.`);
        } else if (response.status === 500) {
          throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
        }
        throw new Error("Không thể thêm loại sản phẩm.");
      }

      setTenLoaiSanPhamMoi("");
      setKiHieuMoi("");
      setKichThuocMoi([""]);
      setHinhAnhMoi(null);
      setErrorsThem({ ten: "", kiHieu: "", kichThuoc: "", hinhAnh: "" });
      setMoModalThem(false);
      await fetchLoaiSanPham();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Thêm loại sản phẩm thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi thêm loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const suaLoaiSanPham = async () => {
    if (!loaiSanPhamDangSua || !validateSua()) return;

    setIsProcessing(true);
    try {
      const base64Image = getBase64(loaiSanPhamDangSua.hinhAnh);
      const kiHieuUpper = loaiSanPhamDangSua.kiHieu.toUpperCase();
      const trimmedSizes = kichThuocMoi.map(size => size.trim().toUpperCase()).filter(size => size);

      const updatePromises = loaiSanPhamDangSua.entries
        .filter(entry => entry.trangThai === 1)
        .map(entry => {
          const updatedKichThuoc = [...(entry.kichThuoc || []), ...trimmedSizes].filter((size, index, self) =>
            size && self.indexOf(size) === index
          ); // Ensure uniqueness
          return fetch(`${API_URL}/api/LoaiSanPham/${entry.maLoaiSanPham}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              maLoaiSanPham: entry.maLoaiSanPham,
              tenLoaiSanPham: loaiSanPhamDangSua.tenLoaiSanPham.trim(),
              kiHieu: kiHieuUpper,
              kichThuoc: updatedKichThuoc.length > 0 ? updatedKichThuoc : null, // Send null if no sizes
              hinhAnh: base64Image,
              trangThai: 1,
            }),
          });
        });

      const updateResponses = await Promise.all(updatePromises);
      for (const response of updateResponses) {
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400) {
            throw new Error(errorData.error || "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.");
          } else if (response.status === 401) {
            throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          } else if (response.status === 404) {
            throw new Error(errorData.error || "Loại sản phẩm không tồn tại.");
          } else if (response.status === 500) {
            throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
          }
          throw new Error("Không thể cập nhật loại sản phẩm.");
        }
      }

      setMoModalSua(false);
      setLoaiSanPhamDangSua(null);
      setKichThuocMoi([""]);
      setErrorsSua({ ten: "", kichThuoc: "", hinhAnh: "" });
      await fetchLoaiSanPham();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật loại sản phẩm thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi cập nhật loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const anLoaiSanPham = async () => {
    if (!loaiSanPhamCanXoa) return;

    setIsProcessing(true);
    try {
      const updatePromises = loaiSanPhamCanXoa.entries
        .filter(entry => entry.trangThai === 1)
        .map(entry =>
          fetch(`${API_URL}/api/LoaiSanPham/${entry.maLoaiSanPham}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              maLoaiSanPham: entry.maLoaiSanPham,
              tenLoaiSanPham: entry.tenLoaiSanPham,
              kiHieu: entry.kiHieu,
              kichThuoc: entry.kichThuoc || null, // Handle null case
              hinhAnh: getBase64(entry.hinhAnh),
              trangThai: 0,
            }),
          })
        );

      const responses = await Promise.all(updatePromises);
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400) {
            throw new Error(errorData.error || "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.");
          } else if (response.status === 401) {
            throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          } else if (response.status === 404) {
            throw new Error(errorData.error || "Loại sản phẩm không tồn tại.");
          } else if (response.status === 500) {
            throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
          }
          throw new Error("Không thể ẩn loại sản phẩm.");
        }
      }

      setMoModalXoa(false);
      setLoaiSanPhamCanXoa(null);
      await fetchLoaiSanPham();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã ẩn loại sản phẩm!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi ẩn loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const khoiPhucLoaiSanPham = async () => {
    if (!loaiSanPhamCanKhoiPhuc) return;

    setIsProcessing(true);
    try {
      const updatePromises = loaiSanPhamCanKhoiPhuc.entries
        .filter(entry => entry.trangThai === 0)
        .map(entry =>
          fetch(`${API_URL}/api/LoaiSanPham/${entry.maLoaiSanPham}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              maLoaiSanPham: entry.maLoaiSanPham,
              tenLoaiSanPham: entry.tenLoaiSanPham,
              kiHieu: entry.kiHieu,
              kichThuoc: entry.kichThuoc || null, // Handle null case
              hinhAnh: getBase64(entry.hinhAnh),
              trangThai: 1,
            }),
          })
        );

      const responses = await Promise.all(updatePromises);
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400) {
            throw new Error(errorData.error || "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.");
          } else if (response.status === 401) {
            throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          } else if (response.status === 404) {
            throw new Error(errorData.error || "Loại sản phẩm không tồn tại.");
          } else if (response.status === 500) {
            throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
          }
          throw new Error("Không thể khôi phục loại sản phẩm.");
        }
      }

      setMoModalKhoiPhuc(false);
      setLoaiSanPhamCanKhoiPhuc(null);
      await fetchLoaiSanPham();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã khôi phục loại sản phẩm!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi khôi phục loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const xoaVinhVienLoaiSanPham = async () => {
    if (!loaiSanPhamCanXoaVinhVien) return;

    setIsProcessing(true);
    try {
      const deletePromises = loaiSanPhamCanXoaVinhVien.entries.map(entry =>
        fetch(`${API_URL}/api/LoaiSanPham/${entry.maLoaiSanPham}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          } else if (response.status === 404) {
            throw new Error(errorData.error || "Loại sản phẩm không tồn tại.");
          } else if (response.status === 409) {
            throw new Error(errorData.error || "Không thể xóa vì có dữ liệu liên quan.");
          } else if (response.status === 500) {
            throw new Error("Lỗi máy chủ, vui lòng thử lại sau.");
          }
          throw new Error("Không thể xóa vĩnh viễn loại sản phẩm.");
        }
      }

      setMoModalXoaVinhVien(false);
      setLoaiSanPhamCanXoaVinhVien(null);
      setCurrentPage(1);
      await fetchLoaiSanPham();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã xóa vĩnh viễn loại sản phẩm!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      setError((error as Error).message);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi khi xóa vĩnh viễn loại sản phẩm: " + (error as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const sortedAndFilteredLoaiSanPham = useMemo(() => {
    return [...filteredGroupedLoaiSanPhams].sort((a, b) =>
      a.tenLoaiSanPham.localeCompare(b.tenLoaiSanPham)
    );
  }, [filteredGroupedLoaiSanPhams]);

  const totalPages = Math.ceil(sortedAndFilteredLoaiSanPham.length / ITEMS_PER_PAGE);
  const paginatedLoaiSanPham = sortedAndFilteredLoaiSanPham.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">
          Quản lý loại sản phẩm
        </h1>
        <Button
          className="bg-[#9b87f5] text-white hover:bg-[#8a76e3]"
          onClick={() => setMoModalThem(true)}
          disabled={loading || isProcessing}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Thêm loại sản phẩm
        </Button>
      </div>

      <Tabs
        defaultValue="active"
        className="w-full"
        onValueChange={(value) => {
          setActiveTab(value as "active" | "inactive");
          setCurrentPage(1);
        }}
      >
        <TabsList className="grid w-full md:w-auto grid-cols-2 gap-1">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Danh sách loại sản phẩm
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Khôi phục loại sản phẩm
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative w-full md:w-[820px]">
              <Input
                type="search"
                placeholder="Tìm kiếm loại sản phẩm..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
                disabled={loading || isProcessing}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách loại sản phẩm</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Hình Ảnh</TableHead>
                        <TableHead>Tên Loại Sản Phẩm</TableHead>
                        <TableHead>Ký Hiệu</TableHead>
                        <TableHead>Kích Thước</TableHead>
                        <TableHead>Hành Động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLoaiSanPham.length > 0 ? (
                        paginatedLoaiSanPham.map((group, index) => (
                          <TableRow key={`${group.kiHieu}_${group.tenLoaiSanPham}`} className="hover:bg-muted/50">
                            <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                            <TableCell>
                              {group.hinhAnh ? (
                                <img
                                  src={formatBase64Image(group.hinhAnh)}
                                  alt={group.tenLoaiSanPham}
                                  className="h-12 w-12 object-cover rounded"
                                  onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                                />
                              ) : (
                                "Không có hình"
                              )}
                            </TableCell>
                            <TableCell>{group.tenLoaiSanPham}</TableCell>
                            <TableCell>{group.kiHieu}</TableCell>
                            <TableCell>
                              {group.entries.map(entry => (entry.kichThuoc || []).join(", ") || "Không có").join("; ")}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLoaiSanPhamChiTiet(group);
                                      setMoModalChiTiet(true);
                                    }}
                                    className="text-green-700"
                                  >
                                    <FaEye className="mr-2 h-4 w-4" /> Xem
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLoaiSanPhamDangSua({
                                        ...group,
                                        hinhAnh: group.hinhAnh || null,
                                      });
                                      setKichThuocMoi([""]);
                                      setErrorsSua({ ten: "", kichThuoc: "", hinhAnh: "" });
                                      setMoModalSua(true);
                                    }}
                                    className="text-blue-700"
                                  >
                                    <FaEdit className="mr-2 h-4 w-4" /> Sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLoaiSanPhamCanXoa(group);
                                      setMoModalXoa(true);
                                    }}
                                    className="text-red-700"
                                  >
                                    <FaTrashAlt className="mr-2 h-4 w-4" /> Ẩn
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            Không tìm thấy loại sản phẩm nào.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading || isProcessing}
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
                      className={currentPage === page ? "bg-[#9b87f5] text-white hover:bg-[#8a76e3]" : ""}
                      disabled={loading || isProcessing}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading || isProcessing}
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

        <TabsContent value="inactive">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative w-full md:w-[820px]">
              <Input
                type="search"
                placeholder="Tìm kiếm loại sản phẩm..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
                disabled={loading || isProcessing}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách loại sản phẩm đã ẩn</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Hình Ảnh</TableHead>
                        <TableHead>Tên Loại Sản Phẩm</TableHead>
                        <TableHead>Ký Hiệu</TableHead>
                        <TableHead>Kích Thước</TableHead>
                        <TableHead>Hành Động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLoaiSanPham.length > 0 ? (
                        paginatedLoaiSanPham.map((group, index) => (
                          <TableRow key={`${group.kiHieu}_${group.tenLoaiSanPham}`} className="hover:bg-muted/50">
                            <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                            <TableCell>
                              {group.hinhAnh ? (
                                <img
                                  src={formatBase64Image(group.hinhAnh)}
                                  alt={group.tenLoaiSanPham}
                                  className="h-12 w-12 object-cover rounded"
                                  onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                                />
                              ) : (
                                "Không có hình"
                              )}
                            </TableCell>
                            <TableCell>{group.tenLoaiSanPham}</TableCell>
                            <TableCell>{group.kiHieu}</TableCell>
                            <TableCell>
                              {group.entries.map(entry => (entry.kichThuoc || []).join(", ") || "Không có").join("; ")}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLoaiSanPhamChiTiet(group);
                                      setMoModalChiTiet(true);
                                    }}
                                    className="text-green-700"
                                  >
                                    <FaEye className="mr-2 h-4 w-4" /> Chi tiết
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLoaiSanPhamCanKhoiPhuc(group);
                                      setMoModalKhoiPhuc(true);
                                    }}
                                    className="text-blue-700"
                                  >
                                    <FaUndo className="mr-2 h-4 w-4" /> Khôi phục
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLoaiSanPhamCanXoaVinhVien(group);
                                      setMoModalXoaVinhVien(true);
                                    }}
                                    className="text-red-700"
                                  >
                                    <FaTrash className="mr-2 h-4 w-4" /> Xóa vĩnh viễn
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            Không có loại sản phẩm nào để khôi phục.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading || isProcessing}
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
                      className={currentPage === page ? "bg-[#9b87f5] text-white hover:bg-[#8a76e3]" : ""}
                      disabled={loading || isProcessing}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading || isProcessing}
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
      </Tabs>

      <Dialog open={moModalThem} onOpenChange={(open) => {
        setMoModalThem(open);
        if (!open) {
          setTenLoaiSanPhamMoi("");
          setKiHieuMoi("");
          setKichThuocMoi([""]);
          setHinhAnhMoi(null);
          setErrorsThem({ ten: "", kiHieu: "", kichThuoc: "", hinhAnh: "" });
        }
      }}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Thêm Loại Sản Phẩm</DialogTitle>
            <DialogDescription>Nhập thông tin loại sản phẩm mới.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Loại Sản Phẩm</label>
                <Input
                  value={tenLoaiSanPhamMoi}
                  onChange={(e) => {
                    setTenLoaiSanPhamMoi(e.target.value);
                    setErrorsThem((prev) => ({ ...prev, ten: "" }));
                  }}
                  placeholder="Tên loại sản phẩm"
                  maxLength={100}
                  disabled={isProcessing}
                />
                {errorsThem.ten && <p className="text-red-500 text-sm mt-1">{errorsThem.ten}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ký Hiệu</label>
                <Input
                  value={kiHieuMoi}
                  onChange={(e) => {
                    setKiHieuMoi(e.target.value.toUpperCase());
                    setErrorsThem((prev) => ({ ...prev, kiHieu: "" }));
                  }}
                  placeholder="Ký hiệu (1 chữ cái in hoa)"
                  maxLength={1}
                  disabled={isProcessing}
                />
                {errorsThem.kiHieu && <p className="text-red-500 text-sm mt-1">{errorsThem.kiHieu}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {hinhAnhMoi ? (
                    <div className="relative">
                      <img
                        src={hinhAnhMoi}
                        alt="Preview"
                        className="h-32 w-64 mx-auto object-cover rounded"
                      />
                      <button
                        onClick={() => setHinhAnhMoi(null)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        disabled={isProcessing}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Kéo và thả hình ảnh vào đây hoặc nhấp để chọn (Tối đa 2MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="fileInputThem"
                        onChange={handleFileInputChange}
                        disabled={isProcessing}
                      />
                      <label htmlFor="fileInputThem" className="cursor-pointer text-blue-500 hover:underline">
                        Chọn tệp
                      </label>
                    </div>
                  )}
                </div>
                {errorsThem.hinhAnh && <p className="text-red-500 text-sm mt-1">{errorsThem.hinhAnh}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kích Thước</label>
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {kichThuocMoi.map((size, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        value={size}
                        onChange={(e) => {
                          updateKichThuocField(index, e.target.value.toUpperCase());
                          setErrorsThem((prev) => ({ ...prev, kichThuoc: "" }));
                        }}
                        placeholder="Kích thước (ví dụ: S, M, XL)"
                        maxLength={3}
                        disabled={isProcessing}
                      />
                      {kichThuocMoi.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeKichThuocField(index)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addKichThuocField}
                    className="mt-2 w-full"
                    disabled={isProcessing}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm Kích Thước
                  </Button>
                  {errorsThem.kichThuoc && <p className="text-red-500 text-sm mt-1">{errorsThem.kichThuoc}</p>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setMoModalThem(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#e7e4f5]"
            >
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button
              onClick={themLoaiSanPham}
              disabled={isProcessing}
              className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
              <Plus className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moModalSua} onOpenChange={(open) => {
        setMoModalSua(open);
        if (!open) {
          setLoaiSanPhamDangSua(null);
          setKichThuocMoi([""]);
          setErrorsSua({ ten: "", kichThuoc: "", hinhAnh: "" });
        }
      }}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Sửa Loại Sản Phẩm</DialogTitle>
            <DialogDescription>Cập nhật thông tin loại sản phẩm.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Loại Sản Phẩm</label>
                <Input
                  value={loaiSanPhamDangSua?.tenLoaiSanPham || ""}
                  onChange={(e) => {
                    setLoaiSanPhamDangSua({ ...loaiSanPhamDangSua!, tenLoaiSanPham: e.target.value });
                    setErrorsSua((prev) => ({ ...prev, ten: "" }));
                  }}
                  placeholder="Tên loại sản phẩm"
                  maxLength={100}
                  disabled={isProcessing}
                />
                {errorsSua.ten && <p className="text-red-500 text-sm mt-1">{errorsSua.ten}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ký Hiệu</label>
                <Input
                  value={loaiSanPhamDangSua?.kiHieu || ""}
                  onChange={() => {}}
                  placeholder="Ký hiệu"
                  maxLength={1}
                  disabled={true}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kích Thước Hiện Tại</label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {loaiSanPhamDangSua?.entries
                    .filter(entry => entry.trangThai === 1)
                    .map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <Input
                          value={(entry.kichThuoc || []).join(", ") || "Không có"}
                          disabled={true}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLoaiSanPhamCanXoa({ ...loaiSanPhamDangSua!, entries: [entry] });
                            setMoModalXoa(true);
                          }}
                          disabled={isProcessing}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  {loaiSanPhamDangSua?.entries.filter(entry => entry.trangThai === 1).length === 0 && (
                    <p className="text-gray-500 text-sm">Không có kích thước hoạt động.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {loaiSanPhamDangSua?.hinhAnh ? (
                    <div className="relative">
                      <img
                        src={formatBase64Image(loaiSanPhamDangSua.hinhAnh)}
                        alt="Preview"
                        className="h-32 w-64 mx-auto object-cover rounded"
                      />
                      <button
                        onClick={() => setLoaiSanPhamDangSua({ ...loaiSanPhamDangSua!, hinhAnh: null })}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        disabled={isProcessing}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Kéo và thả hình ảnh vào đây hoặc nhấp để chọn (Tối đa 2MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="fileInputSua"
                        onChange={handleFileInputChange}
                        disabled={isProcessing}
                      />
                      <label htmlFor="fileInputSua" className="cursor-pointer text-blue-500 hover:underline">
                        Chọn tệp
                      </label>
                    </div>
                  )}
                </div>
                {errorsSua.hinhAnh && <p className="text-red-500 text-sm mt-1">{errorsSua.hinhAnh}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thêm Kích Thước Mới</label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {kichThuocMoi.map((size, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        value={size}
                        onChange={(e) => {
                          updateKichThuocField(index, e.target.value.toUpperCase());
                          setErrorsSua((prev) => ({ ...prev, kichThuoc: "" }));
                        }}
                        placeholder="Kích thước (ví dụ: S, M, XL)"
                        maxLength={3}
                        disabled={isProcessing}
                      />
                      {kichThuocMoi.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeKichThuocField(index)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addKichThuocField}
                    className="mt-2 w-full"
                    disabled={isProcessing}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm Kích Thước
                  </Button>
                  {errorsSua.kichThuoc && <p className="text-red-500 text-sm mt-1">{errorsSua.kichThuoc}</p>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setMoModalSua(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#e7e4f5]"
            >
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button
              onClick={suaLoaiSanPham}
              disabled={isProcessing}
              className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
              <FaEdit className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moModalChiTiet} onOpenChange={setMoModalChiTiet}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Chi Tiết Loại Sản Phẩm</DialogTitle>
          </DialogHeader>
          {loaiSanPhamChiTiet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên Loại Sản Phẩm</label>
                  <Input value={loaiSanPhamChiTiet.tenLoaiSanPham} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ký Hiệu</label>
                  <Input value={loaiSanPhamChiTiet.kiHieu} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                  {loaiSanPhamChiTiet.hinhAnh ? (
                    <img
                      src={formatBase64Image(loaiSanPhamChiTiet.hinhAnh)}
                      alt={loaiSanPhamChiTiet.tenLoaiSanPham}
                      className="h-32 w-64 object-cover rounded"
                      onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                    />
                  ) : (
                    <p>Không có hình ảnh</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kích Thước</label>
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {loaiSanPhamChiTiet.entries.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <Input
                          value={(entry.kichThuoc || []).join(", ") || "Không có"}
                          disabled
                        />
                      </div>
                    ))}
                    {loaiSanPhamChiTiet.entries.length === 0 && (
                      <p className="text-gray-500 text-sm">Không có kích thước.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setMoModalChiTiet(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#e7e4f5]"
            >
              <X className="h-4 w-4" /> Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moModalXoa} onOpenChange={setMoModalXoa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận ẩn loại sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn ẩn loại sản phẩm này không? Bạn có thể khôi phục lại sau.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setMoModalXoa(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#e7e4f5]"
            >
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button
              onClick={anLoaiSanPham}
              disabled={isProcessing}
              className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ẩn"}
              <FaTrashAlt className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moModalKhoiPhuc} onOpenChange={setMoModalKhoiPhuc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận khôi phục loại sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn khôi phục loại sản phẩm này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setMoModalKhoiPhuc(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#e7e4f5]"
            >
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button
              onClick={khoiPhucLoaiSanPham}
              disabled={isProcessing}
              className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Khôi phục"}
              <FaUndo className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moModalXoaVinhVien} onOpenChange={setMoModalXoaVinhVien}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa vĩnh viễn loại sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vĩnh viễn loại sản phẩm này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setMoModalXoaVinhVien(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#e7e4f5]"
            >
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button
              onClick={xoaVinhVienLoaiSanPham}
              disabled={isProcessing}
              className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa vĩnh viễn"}
              <FaTrash className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoaiSanPham;