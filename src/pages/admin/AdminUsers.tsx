import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  MoreVertical,
  Edit,
  Trash,
  Eye,
  User,
  Search,
  Mail,
  Lock,
  UserPlus,
  Calendar,
  Phone,
  CreditCard,
  Home,
  X,
  Check,
  Plus,
  Loader,
  EyeOff,
  Save,
  BarChart,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  XCircle,
  CheckCircle,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Account {
  maNguoiDung: string;
  hoTen: string;
  email: string;
  taiKhoan: string;
  matKhau?: string;
  sdt?: string;
  cccd?: string;
  diaChi?: string;
  vaiTro: number;
  trangThai: number;
  ngayTao: string;
  ngaySinh?: string;
  lockoutEndDate?: string | null;
  cancelCount?: number;
  hinhAnh?: string;
  moTa?: string;
  gioiTinh?: number;
}

interface DiaChi {
  maDiaChi: string;
  maNguoiDung: string;
  hoTen?: string;
  sdt?: string;
  diaChi?: string;
  moTa?: string;
  tinh?: string;
  quanHuyen?: string;
  phuongXa?: string;
  trangThai: boolean;
  ngayTao: string;
}

interface GiaoDien {
  maGiaoDien?: number;
  tenGiaoDien?: string;
  logo?: string;
  slider1?: string;
  slider2?: string;
  slider3?: string;
  slider4?: string;
  avt?: string;
  ngayTao?: string;
  trangThai?: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const AdminUsers = () => {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("danhSachTaiKhoan");
  const pageSize = 10;
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [updateChiTietModalOpen, setUpdateChiTietModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<"hide" | "restore" | "delete" | null>(null);
  const [confirmationUser, setConfirmationUser] = useState<Account | null>(null);
  const [selectedUser, setSelectedUser] = useState<Account | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    hoTen: "",
    email: "",
    taiKhoan: "",
    matKhau: "",
    vaiTro: "0",
  });
  const [diaChiModalOpen, setDiaChiModalOpen] = useState(false);
  const [diaChiList, setDiaChiList] = useState<DiaChi[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chiTietHoTen, setChiTietHoTen] = useState("");
  const [chiTietNgaySinh, setChiTietNgaySinh] = useState("");
  const [chiTietSdt, setChiTietSdt] = useState("");
  const [chiTietCccd, setChiTietCccd] = useState("");
  const [chiTietEmail, setChiTietEmail] = useState("");
  const [chiTietTaiKhoan, setChiTietTaiKhoan] = useState("");
  const [chiTietDiaChi, setChiTietDiaChi] = useState("");
  const [chiTietVaiTro, setChiTietVaiTro] = useState(0);
  const [chiTietTrangThai, setChiTietTrangThai] = useState(0);
  const [chiTietHinhAnh, setChiTietHinhAnh] = useState<string | null>(null);
  const [chiTietMoTa, setChiTietMoTa] = useState("");
  const [chiTietGioiTinh, setChiTietGioiTinh] = useState(0);
  const [chiTietLockoutEndDate, setChiTietLockoutEndDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmStatusModalOpen, setConfirmStatusModalOpen] = useState(false);
  const [userToChangeStatus, setUserToChangeStatus] = useState<Account | null>(null);
  const [newStatus, setNewStatus] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    usersToday: 0,
    usersThisMonth: 0,
    usersThisYear: 0,
  });
  const [roleData, setRoleData] = useState({ admin: 0, nhanvien: 0, nguoidung: 0 });
  const [statusData, setStatusData] = useState({ active: 0, locked: 0 });
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const roleChartData = {
    labels: ["Admin", "Nhân viên", "Người dùng"],
    datasets: [
      {
        label: "Số lượng",
        data: [roleData.admin, roleData.nhanvien, roleData.nguoidung],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const statusChartData = {
    labels: ["Hoạt động", "Khóa"],
    datasets: [
      {
        data: [statusData.active, statusData.locked],
        backgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const monthlyChartData = {
    labels: [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ],
    datasets: [
      {
        label: "Người dùng mới",
        data: monthlyData,
        fill: false,
        borderColor: "#42A5F5",
        tension: 0.1,
      },
    ],
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/NguoiDung`);
      if (!response.ok) throw new Error("Lỗi khi tải danh sách người dùng");
      const data: Account[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchDefaultAvatar = async () => {
    try {
      const response = await fetch(`${API_URL}/api/GiaoDien`);
      if (!response.ok) throw new Error("Lỗi khi tải avatar mặc định");
      const data: GiaoDien[] = await response.json();
      const activeGiaoDien = data.find((item) => item.trangThai === 1);
      if (activeGiaoDien && activeGiaoDien.avt) {
        setDefaultAvatar(`data:image/png;base64,${activeGiaoDien.avt}`);
      } else {
        setDefaultAvatar(null);
      }
    } catch (err) {
      console.error("Lỗi khi lấy avatar mặc định:", (err as Error).message);
      setDefaultAvatar(null);
    }
  };

  const fetchDiaChiList = async (maNguoiDung: string) => {
    try {
      const response = await fetch(`${API_URL}/api/DanhSachDiaChi/maNguoiDung/${maNguoiDung}`);
      if (!response.ok) throw new Error("Lỗi khi tải danh sách địa chỉ");
      const data: DiaChi[] = await response.json();
      const sortedData = data.sort(
        (a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime()
      );
      setDiaChiList(sortedData);
    } catch (err) {
      setError((err as Error).message);
      setDiaChiList([]);
    }
  };

  const openDiaChiModal = async (user: Account) => {
    setSelectedUserId(user.maNguoiDung);
    setDiaChiModalOpen(true);
    await fetchDiaChiList(user.maNguoiDung);
  };

  const calculateStats = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    let activeUsers = 0;
    let lockedUsers = 0;
    let usersToday = 0;
    let usersThisMonth = 0;
    let usersThisYear = 0;

    users.forEach((user) => {
      if (user.trangThai === 0) activeUsers++;
      else if (user.trangThai === 1) lockedUsers++;

      const creationDate = new Date(user.ngayTao);
      if (creationDate >= startOfDay) usersToday++;
      if (creationDate >= startOfMonth) usersThisMonth++;
      if (creationDate >= startOfYear) usersThisYear++;
    });

    setStats({
      totalUsers: users.length,
      activeUsers,
      lockedUsers,
      usersToday,
      usersThisMonth,
      usersThisYear,
    });
  }, [users]);

  const calculateRoleData = useCallback(() => {
    const roleCounts = { admin: 0, nhanvien: 0, nguoidung: 0 };
    users.forEach((user) => {
      if (user.vaiTro === 1) roleCounts.admin++;
      else if (user.vaiTro === 2) roleCounts.nhanvien++;
      else roleCounts.nguoidung++;
    });
    setRoleData(roleCounts);
  }, [users]);

  const calculateStatusData = useCallback(() => {
    const statusCounts = { active: 0, locked: 0 };
    users.forEach((user) => {
      if (user.trangThai === 0) statusCounts.active++;
      else if (user.trangThai === 1) statusCounts.locked++;
    });
    setStatusData(statusCounts);
  }, [users]);

  const calculateMonthlyData = useCallback(() => {
    const monthlyCounts = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    users.forEach((user) => {
      const creationDate = new Date(user.ngayTao);
      if (creationDate.getFullYear() === currentYear) {
        const month = creationDate.getMonth();
        monthlyCounts[month]++;
      }
    });
    setMonthlyData(monthlyCounts);
  }, [users]);

  useEffect(() => {
    fetchDefaultAvatar();
  }, []);

  useEffect(() => {
    calculateStats();
    calculateRoleData();
    calculateStatusData();
    calculateMonthlyData();
  }, [users, calculateStats, calculateRoleData, calculateStatusData, calculateMonthlyData]);

  const getRoleString = (vaiTro: number) => {
    if (vaiTro === 1) return "admin";
    if (vaiTro === 2) return "nhanvien";
    return "nguoidung";
  };

  const getGioiTinhString = (gioiTinh: number) => {
    if (gioiTinh === 1) return "Nam";
    if (gioiTinh === 2) return "Nữ";
    return "Khác";
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      user.hoTen?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.taiKhoan?.toLowerCase().includes(searchLower);
    const matchesRole =
      roleFilter === "all" || getRoleString(user.vaiTro) === roleFilter;

    if (activeTab === "danhSachTaiKhoan") {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.trangThai === 0) ||
        (statusFilter === "locked" && user.trangThai === 1);
      return matchesSearch && matchesRole && matchesStatus && (user.trangThai === 0 || user.trangThai === 1);
    } else if (activeTab === "khoiPhuc") {
      return matchesSearch && matchesRole && user.trangThai === 2;
    }
    return false;
  });

  const sortedUsers = filteredUsers.sort(
    (a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime()
  );

  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const currentUsers = sortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const validateHoTen = (hoTen: string) => {
    if (hoTen.length <= 5) return "Họ tên phải dài hơn 5 ký tự";
    return "";
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    return "";
  };

  const validateMatKhau = (matKhau: string) => {
    if (matKhau.length <= 5) return "Mật khẩu phải dài hơn 5 ký tự";
    return "";
  };

  const validateTaiKhoan = (taiKhoan: string) => {
    if (!taiKhoan) return "Tài khoản không được để trống";
    if (taiKhoan.length <= 5) return "Tài khoản phải dài hơn 5 ký tự";
    return "";
  };

  const validateSdt = (sdt: string) => {
    if (sdt && !/^\d{10}$/.test(sdt)) return "Số điện thoại phải có đúng 10 chữ số";
    return "";
  };

  const validateCccd = (cccd: string) => {
    if (cccd && !/^\d{12}$/.test(cccd)) return "CCCD phải có đúng 12 chữ số";
    return "";
  };

  const validateNgaySinh = (ngaySinh: string) => {
    if (ngaySinh) {
      const birthDate = new Date(ngaySinh);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 15) return "Người dùng phải ít nhất 15 tuổi";
    }
    return "";
  };

  const validateLockoutEndDate = (lockoutEndDate: string | null, trangThai: number) => {
    if (trangThai === 1 && !lockoutEndDate) {
      return "Ngày kết thúc khóa là bắt buộc khi trạng thái là Khóa";
    }
    if (trangThai === 1 && lockoutEndDate) {
      const selectedDate = new Date(lockoutEndDate);
      const today = new Date();
      if (selectedDate <= today) return "Ngày kết thúc khóa phải là ngày trong tương lai";
    }
    return "";
  };

  const validateTaiKhoanUnique = (taiKhoan: string, currentMaNguoiDung?: string) => {
    const existingUser = users.find(
      (user) => user.taiKhoan === taiKhoan && user.maNguoiDung !== currentMaNguoiDung
    );
    if (existingUser) return "Tài khoản đã tồn tại";
    return "";
  };

  const validateEmailUnique = (email: string, currentMaNguoiDung?: string) => {
    const existingUser = users.find(
      (user) => user.email === email && user.maNguoiDung !== currentMaNguoiDung
    );
    if (existingUser) return "Email đã tồn tại";
    return "";
  };

  const validateSdtUnique = (sdt: string, currentMaNguoiDung?: string) => {
    if (!sdt) return "";
    const existingUser = users.find(
      (user) => user.sdt === sdt && user.maNguoiDung !== currentMaNguoiDung
    );
    if (existingUser) return "Số điện thoại đã tồn tại";
    return "";
  };

  const validateCccdUnique = (cccd: string, currentMaNguoiDung?: string) => {
    if (!cccd) return "";
    const existingUser = users.find(
      (user) => user.cccd === cccd && user.maNguoiDung !== currentMaNguoiDung
    );
    if (existingUser) return "CCCD đã tồn tại";
    return "";
  };

  const handleSdtInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (/^\d{0,10}$/.test(value)) setChiTietSdt(value);
  };

  const handleCccdInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (/^\d{0,12}$/.test(value)) setChiTietCccd(value);
  };

  const openAddModal = () => {
    setNewUser({
      hoTen: "",
      email: "",
      taiKhoan: "",
      matKhau: "",
      vaiTro: "0",
    });
    setErrors({});
    setOpenModal(true);
  };

  const openViewModal = (user: Account) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const openUpdateChiTietModal = (user: Account) => {
    if (!user || !user.maNguoiDung) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy mã người dùng",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }
    setSelectedUser(user);
    setChiTietHoTen(user.hoTen || "");
    setChiTietNgaySinh(user.ngaySinh ? new Date(user.ngaySinh).toISOString().split("T")[0] : "");
    setChiTietSdt(user.sdt || "");
    setChiTietCccd(user.cccd || "");
    setChiTietEmail(user.email || "");
    setChiTietTaiKhoan(user.taiKhoan || "");
    setChiTietDiaChi(user.diaChi || "");
    setChiTietVaiTro(user.vaiTro || 0);
    setChiTietTrangThai(user.trangThai || 0);
    setChiTietHinhAnh(
      user.hinhAnh
        ? user.hinhAnh.startsWith("data:image")
          ? user.hinhAnh
          : `data:image/png;base64,${user.hinhAnh}`
        : null
    );
    setChiTietMoTa(user.moTa || "");
    setChiTietGioiTinh(user.gioiTinh || 0);
    setChiTietLockoutEndDate(
      user.trangThai === 0 ? null : user.lockoutEndDate ? new Date(user.lockoutEndDate).toISOString().split("T")[0] : null
    );
    setErrors({});
    setUpdateChiTietModalOpen(true);
  };

  const openConfirmStatusModal = (user: Account, newStatus: number) => {
    setUserToChangeStatus(user);
    setNewStatus(newStatus);
    setConfirmStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!userToChangeStatus || newStatus === null) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể xác định người dùng hoặc trạng thái",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser: Partial<Account> = {
        maNguoiDung: userToChangeStatus.maNguoiDung,
        hoTen: userToChangeStatus.hoTen,
        email: userToChangeStatus.email,
        taiKhoan: userToChangeStatus.taiKhoan,
        sdt: userToChangeStatus.sdt,
        cccd: userToChangeStatus.cccd,
        diaChi: userToChangeStatus.diaChi,
        vaiTro: userToChangeStatus.vaiTro,
        trangThai: newStatus,
        ...(newStatus === 1
          ? {
              cancelCount: 4,
              lockoutEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : { cancelCount: 0, lockoutEndDate: null }),
      };

      const response = await fetch(`${API_URL}/api/NguoiDung/${userToChangeStatus.maNguoiDung}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật trạng thái");
      }

      await fetchUsers();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật trạng thái thành công",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: (err as Error).message || "Lỗi khi cập nhật trạng thái",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsSubmitting(false);
      setConfirmStatusModalOpen(false);
      setUserToChangeStatus(null);
      setNewStatus(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    newErrors.hoTen = validateHoTen(newUser.hoTen);
    newErrors.email = validateEmail(newUser.email);
    newErrors.taiKhoan = validateTaiKhoan(newUser.taiKhoan);
    newErrors.matKhau = validateMatKhau(newUser.matKhau);
    newErrors.taiKhoanUnique = validateTaiKhoanUnique(newUser.taiKhoan);
    newErrors.emailUnique = validateEmailUnique(newUser.email);

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) return;

    setLoading(true);
    try {
      const userData = {
        HoTen: newUser.hoTen,
        Email: newUser.email,
        TaiKhoan: newUser.taiKhoan,
        MatKhau: newUser.matKhau,
        VaiTro: parseInt(newUser.vaiTro),
        TrangThai: 0,
        NgayTao: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/api/NguoiDung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error("Lỗi khi thêm người dùng");
      await fetchUsers();
      setOpenModal(false);
      setNewUser({
        hoTen: "",
        email: "",
        taiKhoan: "",
        matKhau: "",
        vaiTro: "0",
      });
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Thêm người dùng thành công",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: (err as Error).message || "Lỗi khi thêm người dùng",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async () => {
    if (!confirmationUser) return;
    try {
      if (confirmationAction === "hide") {
        await fetch(`${API_URL}/api/NguoiDung/${confirmationUser.maNguoiDung}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...confirmationUser, trangThai: 2 }),
        });
      } else if (confirmationAction === "restore") {
        await fetch(`${API_URL}/api/NguoiDung/${confirmationUser.maNguoiDung}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...confirmationUser, trangThai: 0 }),
        });
      } else if (confirmationAction === "delete") {
        await fetch(`${API_URL}/api/NguoiDung/${confirmationUser.maNguoiDung}`, {
          method: "DELETE",
        });
      }
      await fetchUsers();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: `Đã ${confirmationAction === "hide" ? "xóa" : confirmationAction === "restore" ? "khôi phục" : "xóa vĩnh viễn"} người dùng thành công`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: (err as Error).message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setConfirmationOpen(false);
      setConfirmationUser(null);
      setConfirmationAction(null);
    }
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
      const imageUrl = URL.createObjectURL(file);
      setChiTietHinhAnh(imageUrl);
    } else {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn file hình ảnh",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleImageClick = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setChiTietHinhAnh(imageUrl);
    }
  };

  const handleUpdateChiTietSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    newErrors.chiTietHoTen = validateHoTen(chiTietHoTen);
    newErrors.chiTietEmail = validateEmail(chiTietEmail);
    newErrors.chiTietSdt = validateSdt(chiTietSdt);
    newErrors.chiTietCccd = validateCccd(chiTietCccd);
    newErrors.chiTietNgaySinh = validateNgaySinh(chiTietNgaySinh);
    newErrors.chiTietLockoutEndDate = validateLockoutEndDate(chiTietLockoutEndDate, chiTietTrangThai);

    const currentMaNguoiDung = selectedUser?.maNguoiDung;
    newErrors.chiTietTaiKhoanUnique = validateTaiKhoanUnique(chiTietTaiKhoan, currentMaNguoiDung);
    newErrors.chiTietEmailUnique = validateEmailUnique(chiTietEmail, currentMaNguoiDung);
    newErrors.chiTietSdtUnique = validateSdtUnique(chiTietSdt, currentMaNguoiDung);
    newErrors.chiTietCccdUnique = validateCccdUnique(chiTietCccd, currentMaNguoiDung);

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) return;

    if (!selectedUser || !selectedUser.maNguoiDung) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy mã người dùng để cập nhật",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("MaNguoiDung", selectedUser.maNguoiDung);
    formData.append("HoTen", chiTietHoTen);
    formData.append("NgaySinh", chiTietNgaySinh || "");
    formData.append("Sdt", chiTietSdt || "");
    formData.append("Cccd", chiTietCccd || "");
    formData.append("Email", chiTietEmail);
    formData.append("TaiKhoan", chiTietTaiKhoan);
    formData.append("DiaChi", chiTietDiaChi || "");
    formData.append("VaiTro", chiTietVaiTro.toString());
    formData.append("TrangThai", chiTietTrangThai.toString());
    formData.append("MoTa", chiTietMoTa || "");
    formData.append("GioiTinh", chiTietGioiTinh.toString());

    if (chiTietTrangThai === 1 && chiTietLockoutEndDate) {
      formData.append("LockoutEndDate", chiTietLockoutEndDate);
    } else {
      formData.append("LockoutEndDate", "");
    }

    if (chiTietHinhAnh && chiTietHinhAnh.startsWith("blob:")) {
      const response = await fetch(chiTietHinhAnh);
      const blob = await response.blob();
      formData.append("HinhAnhFile", blob, "avatar.jpg");
    } else if (chiTietHinhAnh && !chiTietHinhAnh.startsWith("http")) {
      const base64Data = chiTietHinhAnh.startsWith("data:image")
        ? chiTietHinhAnh.split(",")[1]
        : chiTietHinhAnh;
      formData.append("HinhAnh", base64Data || "");
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/NguoiDung/chitiet/${selectedUser.maNguoiDung}`, {
        method: "PUT",
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Lỗi khi cập nhật chi tiết người dùng");
      }

      await fetchUsers();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Cập nhật chi tiết người dùng thành công",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      setUpdateChiTietModalOpen(false);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: (err as Error).message || "Lỗi khi cập nhật chi tiết người dùng",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}, ${date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Quản Lý Người Dùng
          </h1>
        </div>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="bg-crocus-500 hover:bg-crocus-600" onClick={openAddModal}>
              <UserPlus className="h-4 w-4 mr-2" /> Thêm Người Dùng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label htmlFor="hoTen">Họ Tên</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hoTen"
                    placeholder="Nhập họ tên"
                    value={newUser.hoTen}
                    onChange={(e) => setNewUser({ ...newUser, hoTen: e.target.value })}
                    className="pl-8"
                    required
                  />
                </div>
                {errors.hoTen && <p className="text-red-500 text-sm mt-1">{errors.hoTen}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="pl-8"
                    required
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                {errors.emailUnique && <p className="text-red-500 text-sm mt-1">{errors.emailUnique}</p>}
              </div>
              <div>
                <Label htmlFor="taiKhoan">Tài Khoản</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="taiKhoan"
                    placeholder="Nhập tài khoản"
                    value={newUser.taiKhoan}
                    onChange={(e) => setNewUser({ ...newUser, taiKhoan: e.target.value })}
                    className="pl-8"
                    required
                  />
                </div>
                {errors.taiKhoan && <p className="text-red-500 text-sm mt-1">{errors.taiKhoan}</p>}
                {errors.taiKhoanUnique && <p className="text-red-500 text-sm mt-1">{errors.taiKhoanUnique}</p>}
              </div>
              <div>
                <Label htmlFor="matKhau">Mật Khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="matKhau"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={newUser.matKhau}
                    onChange={(e) => setNewUser({ ...newUser, matKhau: e.target.value })}
                    className="pl-8 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-2 h-4 w-4 text-muted-foreground"
                  >
                    {showPassword ? <Eye /> : <EyeOff />}
                  </button>
                </div>
                {errors.matKhau && <p className="text-red-500 text-sm mt-1">{errors.matKhau}</p>}
              </div>
              <div>
                <Label htmlFor="vaiTro">Vai Trò</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    id="vaiTro"
                    value={newUser.vaiTro}
                    onChange={(e) => setNewUser({ ...newUser, vaiTro: e.target.value })}
                    className="w-full border rounded-md p-2 pl-8"
                  >
                    <option value="0">Người dùng</option>
                    <option value="1">Admin</option>
                    <option value="2">Nhân viên</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" onClick={() => setOpenModal(false)} disabled={loading}>
                  <X className="h-4 w-4 mr-2" /> Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" /> Thêm
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="danhSachTaiKhoan" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-3 gap-1">
          <TabsTrigger value="danhSachTaiKhoan" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Danh sách tài khoản
          </TabsTrigger>
          <TabsTrigger value="khoiPhuc" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Khôi phục
          </TabsTrigger>
          <TabsTrigger value="danhSachThongKe" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" /> Danh sách thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="danhSachTaiKhoan">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                className="pl-8 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded-md p-2 pl-8"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="nhanvien">Nhân viên</option>
                <option value="nguoidung">Người dùng</option>
              </select>
            </div>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md p-2 pl-8"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Khóa</option>
              </select>
            </div>
          </div>

          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead className="w-[120px]">Hình Ảnh</TableHead>
                  <TableHead>Họ Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tài Khoản</TableHead>
                  <TableHead>Vai Trò</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead className="w-[120px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <TableRow key={user.maNguoiDung} className="hover:bg-muted/50">
                      <TableCell align="center">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell align="center">
                        <img
                          src={
                            user.hinhAnh
                              ? user.hinhAnh.startsWith("data:image")
                                ? user.hinhAnh
                                : `data:image/png;base64,${user.hinhAnh}`
                              : defaultAvatar || "https://gockienthuc.edu.vn/wp-content/uploads/2024/07/hinh-anh-avatar-trang-mac-dinh-doc-dao-khong-lao-nhao_6690f0076072b.webp"
                          }
                          alt="Avatar"
                          className="w-16 h-16 rounded-full mx-auto mt-4 object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => openViewModal(user)}
                        />
                      </TableCell>
                      <TableCell>{user.hoTen}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.taiKhoan || ""}</TableCell>
                      <TableCell>
                        {user.vaiTro === 1 ? "Admin" : user.vaiTro === 2 ? "Nhân viên" : "Người dùng"}
                      </TableCell>
                      <TableCell>
                        <label className="relative inline-block w-[60px] h-[34px]">
                          <input
                            type="checkbox"
                            className="opacity-0 w-0 h-0"
                            checked={user.trangThai === 0}
                            onChange={(e) => openConfirmStatusModal(user, e.target.checked ? 0 : 1)}
                            disabled={isSubmitting}
                          />
                          <span
                            className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ease-in-out
                              before:absolute before:h-[30px] before:w-[30px] before:left-[2px] before:bottom-[2px]
                              before:bg-white before:rounded-full before:shadow-md before:transition-all before:duration-300 before:ease-in-out
                              ${
                                user.trangThai === 0
                                  ? "bg-crocus-500 before:translate-x-[26px]"
                                  : "bg-gray-400"
                              } hover:scale-110 shadow-sm hover:shadow-md`}
                          ></span>
                          <span className="sr-only">
                            {user.trangThai === 0 ? "Hoạt động" : "Khóa"}
                          </span>
                        </label>
                      </TableCell>
                      <TableCell align="center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDiaChiModal(user)} className="text-gray-700">
                              <MapPin className="mr-2 h-4 w-4 text-gray-600" /> Địa chỉ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openViewModal(user)} className="text-green-700">
                              <Eye className="mr-2 h-4 w-4" /> Xem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openUpdateChiTietModal(user)} className="text-blue-700">
                              <Edit className="mr-2 h-4 w-4" /> Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setConfirmationUser(user);
                              setConfirmationAction("hide");
                              setConfirmationOpen(true);
                            }} className="text-red-700">
                              <Trash className="mr-2 h-4 w-4" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Không tìm thấy người dùng nào phù hợp với tìm kiếm của bạn.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {currentUsers.map((user) => (
              <Card key={user.maNguoiDung}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          user.hinhAnh
                            ? user.hinhAnh.startsWith("data:image")
                              ? user.hinhAnh
                              : `data:image/png;base64,${user.hinhAnh}`
                            : defaultAvatar || "https://gockienthuc.edu.vn/wp-content/uploads/2024/07/hinh-anh-avatar-trang-mac-dinh-doc-dao-khong-lao-nhao_6690f0076072b.webp"
                        }
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{user.hoTen}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDiaChiModal(user)}>
                          <MapPin className="mr-2 h-4 w-4" /> Địa chỉ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openViewModal(user)}>
                          <Eye className="mr-2 h-4 w-4" /> Chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openUpdateChiTietModal(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Sửa chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setConfirmationUser(user);
                            setConfirmationAction("hide");
                            setConfirmationOpen(true);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Ẩn
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="flex justify-between text-sm">
                    <span>{user.vaiTro === 1 ? "Admin" : user.vaiTro === 2 ? "Nhân viên" : "Người dùng"}</span>
                    <span>{new Date(user.ngayTao).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.trangThai === 0 ? "bg-crocus-100 text-crocus-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.trangThai === 0 ? "Hoạt động" : "Khóa"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </TabsContent>

        <TabsContent value="khoiPhuc">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                className="pl-8 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded-md p-2 pl-8"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="nhanvien">Nhân viên</option>
                <option value="nguoidung">Người dùng</option>
              </select>
            </div>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md p-2 pl-8"
              >
                <option value="all">Tất cả trạng thái</option>
              </select>
            </div>
          </div>

          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead className="w-[120px]">Hình Ảnh</TableHead>
                  <TableHead>Họ Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tài Khoản</TableHead>
                  <TableHead>Vai Trò</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead className="w-[120px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <TableRow key={user.maNguoiDung} className="hover:bg-muted/50">
                      <TableCell align="center">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell align="center">
                        <img
                          src={
                            user.hinhAnh
                              ? user.hinhAnh.startsWith("data:image")
                                ? user.hinhAnh
                                : `data:image/png;base64,${user.hinhAnh}`
                              : defaultAvatar || "https://gockienthuc.edu.vn/wp-content/uploads/2024/07/hinh-anh-avatar-trang-mac-dinh-doc-dao-khong-lao-nhao_6690f0076072b.webp"
                          }
                          alt="Avatar"
                          className="w-16 h-16 rounded-full mx-auto mt-4 object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => openViewModal(user)}
                        />
                      </TableCell>
                      <TableCell>{user.hoTen}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.taiKhoan || ""}</TableCell>
                      <TableCell>
                        {user.vaiTro === 1 ? "Admin" : user.vaiTro === 2 ? "Nhân viên" : "Người dùng"}
                      </TableCell>
                      <TableCell>
                        <label className="relative inline-block w-[60px] h-[34px]">
                          <input
                            type="checkbox"
                            className="opacity-0 w-0 h-0"
                            checked={user.trangThai === 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfirmationUser(user);
                                setConfirmationAction("restore");
                                setConfirmationOpen(true);
                              } else {
                                openConfirmStatusModal(user, 1);
                              }
                            }}
                            disabled={isSubmitting}
                          />
                          <span
                            className={`absolute cursor-pointer inset-0 rounded-full transition-all duration-300 ease-in-out
                              before:absolute before:h-[30px] before:w-[30px] before:left-[2px] before:bottom-[2px]
                              before:bg-white before:rounded-full before:shadow-md before:transition-all before:duration-300 before:ease-in-out
                              ${
                                user.trangThai === 0
                                  ? "bg-crocus-500 before:translate-x-[26px]"
                                  : "bg-gray-400"
                              } hover:scale-110 shadow-sm hover:shadow-md`}
                          ></span>
                          <span className="sr-only">
                            {user.trangThai === 0 ? "Hoạt động" : "Ẩn"}
                          </span>
                        </label>
                      </TableCell>
                      <TableCell align="center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewModal(user)} className="text-green-700">
                              <Eye className="mr-2 h-4 w-4" /> Chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setConfirmationUser(user);
                              setConfirmationAction("restore");
                              setConfirmationOpen(true);
                            }} className="text-blue-700">
                              <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setConfirmationUser(user);
                              setConfirmationAction("delete");
                              setConfirmationOpen(true);
                            }} className="text-red-700">
                              <Trash className="mr-2 h-4 w-4" /> Xóa vĩnh viễn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Không có người dùng ẩn nào để hiển thị.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {currentUsers.map((user) => (
              <Card key={user.maNguoiDung}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          user.hinhAnh
                            ? user.hinhAnh.startsWith("data:image")
                              ? user.hinhAnh
                              : `data:image/png;base64,${user.hinhAnh}`
                            : defaultAvatar || "https://gockienthuc.edu.vn/wp-content/uploads/2024/07/hinh-anh-avatar-trang-mac-dinh-doc-dao-khong-lao-nhao_6690f0076072b.webp"
                        }
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{user.hoTen}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openViewModal(user)}>
                          <Eye className="mr-2 h-4 w-4" /> Chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setConfirmationUser(user);
                          setConfirmationAction("restore");
                          setConfirmationOpen(true);
                        }}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setConfirmationUser(user);
                            setConfirmationAction("delete");
                            setConfirmationOpen(true);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Xóa vĩnh viễn
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="flex justify-between text-sm">
                    <span>{user.vaiTro === 1 ? "Admin" : user.vaiTro === 2 ? "Nhân viên" : "Người dùng"}</span>
                    <span>{new Date(user.ngayTao).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      Ẩn
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </TabsContent>

        <TabsContent value="danhSachThongKe">
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Thống kê người dùng</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Người dùng mới hôm nay</h3>
                <p className="text-2xl font-bold">{stats.usersToday}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Tổng số người dùng</h3>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Người dùng hoạt động</h3>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Người dùng bị khóa</h3>
                <p className="text-2xl font-bold">{stats.lockedUsers}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Người dùng mới tháng này</h3>
                <p className="text-2xl font-bold">{stats.usersThisMonth}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Người dùng mới năm nay</h3>
                <p className="text-2xl font-bold">{stats.usersThisYear}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Biểu đồ thống kê</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Số lượng người dùng theo vai trò</h3>
                <Bar data={roleChartData} options={{ responsive: true }} />
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Tỷ lệ người dùng hoạt động và bị khóa</h3>
                <div style={{ height: "300px", width: "300px" }}>
                  <Pie data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Người dùng mới theo tháng trong năm {new Date().getFullYear()}
                </h3>
                <Line data={monthlyChartData} options={{ responsive: true }} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="p-6 max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Chi Tiết Người Dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 space-y-4">
                <div>
                  <Label>Hình Ảnh</Label>
                  <img
                    src={
                      selectedUser.hinhAnh
                        ? selectedUser.hinhAnh.startsWith("data:image")
                          ? selectedUser.hinhAnh
                          : `data:image/png;base64,${selectedUser.hinhAnh}`
                        : defaultAvatar || "https://gockienthuc.edu.vn/wp-content/uploads/2024/07/hinh-anh-avatar-trang-mac-dinh-doc-dao-khong-lao-nhao_6690f0076072b.webp"
                    }
                    alt="Avatar"
                    className="mt-2 w-64 h-64 object-cover rounded-full border-2 border-crocus-500"
                  />
                </div>
                <div>
                  <Label>Mô Tả</Label>
                  <textarea
                    value={selectedUser.moTa || "Chưa cập nhật"}
                    readOnly
                    className="w-full p-2 border rounded cursor-not-allowed text-black border-2 border-crocus-300"
                    rows={4}
                  />
                </div>
              </div>
              <div className="col-span-1 space-y-4">
                <div>
                  <Label>Tài Khoản</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.taiKhoan || "Chưa cập nhật"}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Họ Tên</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.hoTen || "Chưa cập nhật"}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Vai Trò</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={
                        selectedUser.vaiTro === 1
                          ? "Admin"
                          : selectedUser.vaiTro === 2
                          ? "Nhân viên"
                          : "Người dùng"
                      }
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Ngày Tạo</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={
                        selectedUser.ngayTao
                          ? formatDateTime(selectedUser.ngayTao)
                          : "Chưa cập nhật"
                      }
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Giới Tính</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={getGioiTinhString(selectedUser.gioiTinh || 0)}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Trạng Thái</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.trangThai === 0 ? "Hoạt động" : selectedUser.trangThai === 1 ? "Khóa" : "Ẩn"}
                      disabled
                      className={`pl-8 font-semibold border-2 border-crocus-500 ${
                        selectedUser.trangThai === 0 ? "text-green-600" : selectedUser.trangThai === 1 ? "text-red-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-1 space-y-4">
                <div>
                  <Label>Ngày Sinh</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={
                        selectedUser.ngaySinh
                          ? new Date(selectedUser.ngaySinh).toLocaleDateString("vi-VN")
                          : "Chưa cập nhật"
                      }
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Số Điện Thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.sdt || "Chưa cập nhật"}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.email || "Chưa cập nhật"}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>CCCD</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.cccd || "Chưa cập nhật"}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Địa Chỉ</Label>
                  <div className="relative">
                    <Home className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={selectedUser.diaChi || "Chưa cập nhật"}
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Ngày Kết Thúc Khóa</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={
                        selectedUser.lockoutEndDate
                          ? formatDateTime(selectedUser.lockoutEndDate)
                          : "Chưa cập nhật"
                      }
                      disabled
                      className="pl-8 text-black border-2 border-crocus-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button type="button" onClick={() => setViewModalOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={updateChiTietModalOpen} onOpenChange={setUpdateChiTietModalOpen}>
        <DialogContent className="p-6 max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Cập Nhật Chi Tiết Người Dùng</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateChiTietSubmit} className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <div>
                <Label>Hình Ảnh</Label>
                <div
                  className={`mt-2 w-32 h-32 border-2 border-dashed rounded-lg relative flex items-center justify-center cursor-pointer ${
                    isDragging ? "border-crocus-500 bg-crocus-50" : "border-gray-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleImageClick}
                >
                  {chiTietHinhAnh ? (
                    <>
                      <img
                        src={chiTietHinhAnh}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChiTietHinhAnh(null);
                        }}
                      >
                        X
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm text-center">Nhấp để chọn hình ảnh</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="fileInput"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <Label>Mô Tả</Label>
                <textarea
                  value={chiTietMoTa}
                  onChange={(e) => setChiTietMoTa(e.target.value)}
                  className="w-full p-2 border rounded text-muted-foreground focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  rows={3}
                  placeholder="Nhập mô tả..."
                />
              </div>
              {chiTietTrangThai === 1 && (
                <div>
                  <Label>Ngày Kết Thúc Khóa</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={chiTietLockoutEndDate || ""}
                      onChange={(e) => setChiTietLockoutEndDate(e.target.value)}
                      min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]}
                      className="pl-8"
                      required={chiTietTrangThai === 1}
                    />
                  </div>
                  {errors.chiTietLockoutEndDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.chiTietLockoutEndDate}</p>
                  )}
                </div>
              )}
            </div>
            <div className="col-span-1 space-y-4">
              <div>
                <Label>Tài Khoản</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietTaiKhoan}
                    onChange={(e) => setChiTietTaiKhoan(e.target.value)}
                    disabled
                    className="pl-8"
                  />
                </div>
                {errors.chiTietTaiKhoanUnique && (
                  <p className="text-red-500 text-sm mt-1">{errors.chiTietTaiKhoanUnique}</p>
                )}
              </div>
              <div>
                <Label>Họ Tên</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietHoTen}
                    placeholder="Nhập họ tên"
                    onChange={(e) => setChiTietHoTen(e.target.value)}
                    required
                    className="pl-8"
                  />
                </div>
                {errors.chiTietHoTen && <p className="text-red-500 text-sm mt-1">{errors.chiTietHoTen}</p>}
              </div>
              <div>
                <Label>Vai Trò</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietVaiTro === 1 ? "Admin" : chiTietVaiTro === 2 ? "Nhân viên" : "Người dùng"}
                    disabled
                    className="text-black pl-8"
                  />
                </div>
              </div>
              <div>
                <Label>Trạng Thái</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    value={chiTietTrangThai}
                    onChange={(e) => {
                      const newStatus = parseInt(e.target.value);
                      setChiTietTrangThai(newStatus);
                      if (newStatus === 0) setChiTietLockoutEndDate(null);
                    }}
                    className="w-full border rounded-md p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value={0}>Hoạt động</option>
                    <option value={1}>Khóa</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Giới Tính</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    value={chiTietGioiTinh}
                    onChange={(e) => setChiTietGioiTinh(parseInt(e.target.value))}
                    className="w-full border rounded-md p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value={1}>Nam</option>
                    <option value={2}>Nữ</option>
                    <option value={0}>Khác</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="col-span-1 space-y-4">
              <div>
                <Label>Ngày Sinh</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={chiTietNgaySinh}
                    onChange={(e) => setChiTietNgaySinh(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {errors.chiTietNgaySinh && <p className="text-red-500 text-sm mt-1">{errors.chiTietNgaySinh}</p>}
              </div>
              <div>
                <Label>Số Điện Thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietSdt}
                    placeholder="Nhập số điện thoại"
                    onChange={(e) => setChiTietSdt(e.target.value)}
                    onInput={handleSdtInput}
                    maxLength={10}
                    className="pl-8"
                  />
                </div>
                {errors.chiTietSdt && <p className="text-red-500 text-sm mt-1">{errors.chiTietSdt}</p>}
                {errors.chiTietSdtUnique && <p className="text-red-500 text-sm mt-1">{errors.chiTietSdtUnique}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietEmail}
                    placeholder="Nhập email"
                    onChange={(e) => setChiTietEmail(e.target.value)}
                    required
                    className="pl-8"
                  />
                </div>
                {errors.chiTietEmail && <p className="text-red-500 text-sm mt-1">{errors.chiTietEmail}</p>}
                {errors.chiTietEmailUnique && (
                  <p className="text-red-500 text-sm mt-1">{errors.chiTietEmailUnique}</p>
                )}
              </div>
              <div>
                <Label>CCCD</Label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietCccd}
                    placeholder="Nhập CCCD"
                    onChange={(e) => setChiTietCccd(e.target.value)}
                    onInput={handleCccdInput}
                    maxLength={12}
                    className="pl-8"
                  />
                </div>
                {errors.chiTietCccd && <p className="text-red-500 text-sm mt-1">{errors.chiTietCccd}</p>}
                {errors.chiTietCccdUnique && <p className="text-red-500 text-sm mt-1">{errors.chiTietCccdUnique}</p>}
              </div>
              <div>
                <Label>Địa Chỉ</Label>
                <div className="relative">
                  <Home className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={chiTietDiaChi}
                    placeholder="Nhập địa chỉ"
                    onChange={(e) => setChiTietDiaChi(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-3 flex justify-end space-x-2 mt-6">
              <Button type="button" onClick={() => setUpdateChiTietModalOpen(false)} disabled={isSubmitting}>
                <X className="h-4 w-4 mr-2" /> Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" /> Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Cập nhật
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={diaChiModalOpen} onOpenChange={setDiaChiModalOpen}>
        <DialogContent className="p-6 max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>Danh Sách Địa Chỉ</DialogTitle>
          </DialogHeader>
          {diaChiList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Họ Tên</TableHead>
                  <TableHead>Số Điện Thoại</TableHead>
                  <TableHead>Mô Tả</TableHead>
                  <TableHead>Tỉnh</TableHead>
                  <TableHead>Huyện</TableHead>
                  <TableHead>Xã</TableHead>
                  <TableHead>Địa Chỉ</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diaChiList.map((diaChi, index) => (
                  <TableRow key={diaChi.maDiaChi}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{diaChi.hoTen || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.sdt || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.moTa || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.tinh || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.quanHuyen || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.phuongXa || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.diaChi || "Chưa cập nhật"}</TableCell>
                    <TableCell>{diaChi.trangThai ? "Hoạt động" : "Không hoạt động"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Không có địa chỉ nào cho người dùng này.</p>
          )}
          <div className="flex justify-end mt-6">
            <Button type="button" onClick={() => setDiaChiModalOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmStatusModalOpen} onOpenChange={setConfirmStatusModalOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Bạn có chắc chắn muốn {newStatus === 0 ? "mở khóa" : "khóa"} tài khoản{" "}
            <strong>{userToChangeStatus?.taiKhoan}</strong> không?
          </DialogDescription>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" onClick={() => setConfirmStatusModalOpen(false)} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2" /> Hủy
            </Button>
            <Button type="button" onClick={confirmStatusChange} disabled={isSubmitting}>
              <Check className="h-4 w-4 mr-2" /> {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="p-6">
          <DialogTitle>
            {confirmationAction === "hide" && "Xác nhận xóa người dùng"}
            {confirmationAction === "restore" && "Xác nhận khôi phục người dùng"}
            {confirmationAction === "delete" && "Xác nhận xóa vĩnh viễn người dùng"}
          </DialogTitle>
          <p>
            Bạn có chắc chắn muốn {confirmationAction === "hide" ? "xóa" : confirmationAction === "restore" ? "khôi phục" : "xóa vĩnh viễn"} người dùng {confirmationUser?.hoTen} không?
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setConfirmationOpen(false)} variant="outline">
              <XCircle className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={performAction} variant="destructive">
              <CheckCircle className="w-4 h-4 mr-2" />
              Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
