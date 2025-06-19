import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Camera, User, Mail as MailIcon, Phone as PhoneIcon, Lock, Save, Key, EyeOff, Eye, MapPin, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";

interface UserData {
  maNguoiDung: string;
  hoTen: string;
  taiKhoan: string;
  gioiTinh: number | null;
  email: string;
  sdt: string;
  diaChi: string;
  cccd: string;
  ngaySinh: string;
  hinhAnh?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5261";
const APP_TITLE = import.meta.env.VITE_TITLE || "FashionHub";

export const ProfileForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date(1990, 0, 1));
  const [formData, setFormData] = useState({
    fullName: "",
    taikhoan: "",
    gioiTinh: null as number | null,
    email: "",
    phone: "",
    address: "",
    CCCD: "",
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get<UserData>(`${API_URL}/api/UpdateProfile/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data;
        setUserId(userData.maNguoiDung);
        setFormData({
          fullName: userData.hoTen || "",
          taikhoan: userData.taiKhoan || "",
          gioiTinh: userData.gioiTinh,
          email: userData.email || "",
          phone: userData.sdt || "",
          address: userData.diaChi || "",
          CCCD: userData.cccd || "",
        });
        setDate(userData.ngaySinh ? new Date(userData.ngaySinh) : new Date(1990, 0, 1));
        setAvatar(userData.hinhAnh ? `data:image/jpg;base64,${userData.hinhAnh}` : null);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể lấy thông tin người dùng.",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (avatar && avatar.startsWith("blob:")) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [avatar]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    const genderValue = value === "Nam" ? null : value === "Nữ" ? 2 : 1;
    setFormData((prev) => ({ ...prev, gioiTinh: genderValue }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Kích thước ảnh không được vượt quá 5MB.",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Chỉ chấp nhận file ảnh .jpg, .jpeg, .png.",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^[0-9]{10}$/.test(phone);
  const isValidCCCD = (cccd: string) => /^[0-9]{12}$/.test(cccd);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.fullName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Họ và tên không được để trống.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (!formData.taikhoan.trim()) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Tài khoản không được để trống.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (formData.gioiTinh === undefined) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Giới tính không được để trống.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Email không hợp lệ.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Số điện thoại phải là 10 chữ số.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (formData.CCCD && !isValidCCCD(formData.CCCD)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "CCCD phải là 12 chữ số.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (date && date > new Date()) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Ngày sinh không được lớn hơn ngày hiện tại.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("HoTen", formData.fullName);
    formDataToSubmit.append("TaiKhoan", formData.taikhoan);
    formDataToSubmit.append("GioiTinh", formData.gioiTinh === null ? "" : formData.gioiTinh.toString());
    formDataToSubmit.append("Email", formData.email);
    formDataToSubmit.append("Sdt", formData.phone);
    formDataToSubmit.append("DiaChi", formData.address);
    formDataToSubmit.append("CCCD", formData.CCCD);
    formDataToSubmit.append("NgaySinh", date ? format(date, "yyyy-MM-dd") : "");
    if (fileInputRef.current?.files?.[0]) {
      formDataToSubmit.append("HinhAnh", fileInputRef.current.files[0]);
    }

    try {
      await axios.put(
        `${API_URL}/api/UpdateProfile/update-profile/${userId}`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const response = await axios.get<UserData>(`${API_URL}/api/UpdateProfile/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedUserData = response.data;
      setAvatar(
        updatedUserData.hinhAnh ? `data:image/jpg;base64,${updatedUserData.hinhAnh}` : null
      );

      Swal.fire({
        icon: "success",
        title: "Cập nhật thành công",
        text: "Thông tin cá nhân của bạn đã được cập nhật thành công!",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể cập nhật thông tin.",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentPassword) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu hiện tại không được để trống.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (!newPassword) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu mới không được để trống.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }

    const passwordData = new FormData();
    passwordData.append("MatKhauCu", currentPassword);
    passwordData.append("MatKhauMoi", newPassword);

    try {
      await axios.put(
        `${API_URL}/api/UpdateProfile/update-password/${userId}`,
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Cập nhật thành công",
        text: "Mật khẩu của bạn đã được thay đổi thành công!",
        timer: 3000,
        showConfirmButton: false,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể đổi mật khẩu.",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="personal" className="w-full max-w-3xl mx-auto">
      <TabsList className="grid grid-cols-2 mb-8">
        <TabsTrigger value="personal">
          <User className="mr-2 h-4 w-4" />
          Thông tin cá nhân
        </TabsTrigger>
        <TabsTrigger value="security">
          <Lock className="mr-2 h-4 w-4" />
          Bảo mật
        </TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật thông tin chi tiết của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-crocus-100 bg-gray-100 flex items-center justify-center">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Ảnh đại diện"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatarUpload"
                    className="absolute bottom-0 right-0 bg-crocus-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-crocus-600 transition-colors"
                  >
                    <Camera size={16} />
                    <span className="sr-only">Tải ảnh đại diện</span>
                  </label>
                  <input
                    id="avatarUpload"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Nhập họ tên"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taikhoan">Tài khoản</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="taikhoan"
                      name="taikhoan"
                      placeholder="Nhập tài khoản"
                      value={formData.taikhoan}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="email"
                      name="email"
                      placeholder="Nhập email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Nhập số điện thoại"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="CCCD">Căn cước công dân</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="CCCD"
                      name="CCCD"
                      placeholder="Nhập số CCCD"
                      value={formData.CCCD}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="address"
                      name="address"
                      placeholder="Nhập địa chỉ"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Giới tính</Label>
                  <Select
                    value={
                      formData.gioiTinh === null
                        ? "Nam"
                        : formData.gioiTinh === 2
                        ? "Nữ"
                        : formData.gioiTinh === 1
                        ? "Khác"
                        : ""
                    }
                    onValueChange={handleGenderChange}
                  >
                    <SelectTrigger className="w-full">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <SelectValue placeholder="Chọn giới tính" className="pl-10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngày sinh</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1940}
                        toYear={new Date().getFullYear() - 13}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-crocus-500 hover:bg-crocus-600" disabled={isLoading}>
                  {isLoading ? "Đang lưu..." : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Thay đổi mật khẩu</CardTitle>
            <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    placeholder="Mật khẩu hiện tại"
                    type={showCurrentPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    placeholder="Mật khẩu mới"
                    type={showNewPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-crocus-500 hover:bg-crocus-600" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Thay đổi mật khẩu
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};