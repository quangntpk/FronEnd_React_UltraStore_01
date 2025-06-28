import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { User, Lock, Save, Camera, CheckCircle, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

interface AdminData {
    maNguoiDung: string | number;
    hoTen: string;
    email: string;
    sdt: string;
    diaChi: string;
    cccd: string;
    ngaySinh: string;
    hinhAnh?: string | null;
}

const Profile = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | number | null>(null);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    Phone: "",
    Address: "",
    Cccd: "",
    Born: "",
    image: null as File | null,
    imagePreview: null as string | null,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("Token:", token);
      try {
        const response = await axios.get<AdminData>("http://localhost:5261/api/UpdateProfile/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData: AdminData = response.data;
        setUserId(userData.maNguoiDung);
        setPersonalInfo({
          fullName: userData.hoTen || "",
          email: userData.email || "",
          Phone: userData.sdt || "",
          Address: userData.diaChi || "",
          Cccd: userData.cccd || "",
          Born: userData.ngaySinh || "",
          image: null,
          imagePreview: userData.hinhAnh
            ? `data:image/jpg;base64,${userData.hinhAnh}`
            : null,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể lấy thông tin người dùng.",
        });
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token, toast]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 5MB.",
        });
        return;
      }
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Chỉ chấp nhận file ảnh .jpg, .jpeg, .png.",
        });
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setPersonalInfo((prev) => ({
        ...prev,
        image: file,
        imagePreview: imageUrl,
      }));
    }
  };

  // Validation functions
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
  const isValidCCCD = (cccd) => /^[0-9]{12}$/.test(cccd);

  // Update profile with validation
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!personalInfo.fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Họ và tên không được để trống.",
      });
      setIsLoading(false);
      return;
    }
    if (personalInfo.email && !isValidEmail(personalInfo.email)) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Email không hợp lệ.",
      });
      setIsLoading(false);
      return;
    }
    if (personalInfo.Phone && !isValidPhone(personalInfo.Phone)) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Số điện thoại phải là 10 chữ số.",
      });
      setIsLoading(false);
      return;
    }
    if (personalInfo.Cccd && !isValidCCCD(personalInfo.Cccd)) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "CCCD phải là 12 chữ số.",
      });
      setIsLoading(false);
      return;
    }
    if (personalInfo.Born && new Date(personalInfo.Born) > new Date()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Ngày sinh không được lớn hơn ngày hiện tại.",
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("HoTen", personalInfo.fullName);
    formData.append("Email", personalInfo.email);
    formData.append("Sdt", personalInfo.Phone);
    formData.append("DiaChi", personalInfo.Address);
    formData.append("CCCD", personalInfo.Cccd);
    formData.append("NgaySinh", personalInfo.Born);
    if (personalInfo.image) {
      formData.append("HinhAnh", personalInfo.image);
    }

    try {
      await axios.put(
        `http://localhost:5261/api/UpdateProfile/update-profile/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Lấy lại dữ liệu mới từ API sau khi cập nhật
      const response = await axios.get<AdminData>("http://localhost:5261/api/UpdateProfile/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedUserData: AdminData = response.data;
      setPersonalInfo((prev) => ({
        ...prev,
        imagePreview: updatedUserData.hinhAnh
          ? `data:image/jpg;base64,${updatedUserData.hinhAnh}`
          : null,
      }));

      toast({
        title: "Cập nhật thành công", // Sửa thành string thay vì JSX
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Thông tin cá nhân của bạn đã được cập nhật thành công!</span>
          </div>
        ),
        className: "bg-green-100 border-green-500 text-green-800",
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật thông tin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update password with validation
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentPassword) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu hiện tại không được để trống.",
      });
      setIsLoading(false);
      return;
    }
    if (!newPassword) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu mới không được để trống.",
      });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("MatKhauCu", currentPassword);
    formData.append("MatKhauMoi", newPassword);

    try {
      await axios.put(
        `http://localhost:5261/api/UpdateProfile/update-password/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast({
        title: "Cập nhật thành công", // Sửa thành string thay vì JSX
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Mật khẩu của bạn đã được thay đổi thành công!</span>
          </div>
        ),
        className: "bg-green-100 border-green-500 text-green-800",
        duration: 3000,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể đổi mật khẩu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-4xl mx-auto my-[50px]">
          <div className="colorful-card p-8 rounded-lg shadow-lg">
            <Tabs defaultValue="personal-info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="personal-info">
                  <User className="mr-2 h-4 w-4" /> Thông tin cá nhân
                </TabsTrigger>
                <TabsTrigger value="change-password">
                  <Lock className="mr-2 h-4 w-4" /> Đổi mật khẩu
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal-info">
                <div className="flex flex-col sm:flex-row gap-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-secondary">
                      {personalInfo.imagePreview ? (
                        <img
                          src={personalInfo.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera size={64} />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="mr-2 h-4 w-4" /> Thay đổi ảnh
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      hidden
                      onChange={handleImageChange}
                    />
                  </div>

                  <div className="flex-1">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName">Họ và tên</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={personalInfo.fullName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={personalInfo.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="Phone">Số điện thoại</Label>
                          <Input
                            id="Phone"
                            name="Phone"
                            type="tel"
                            value={personalInfo.Phone}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="Address">Địa chỉ</Label>
                          <Input
                            id="Address"
                            name="Address"
                            value={personalInfo.Address}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="Cccd">Căn cước công dân</Label>
                          <Input
                            id="Cccd"
                            name="Cccd"
                            value={personalInfo.Cccd}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="Born">Ngày sinh</Label>
                          <Input
                            id="Born"
                            name="Born"
                            type="date"
                            value={personalInfo.Born}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full sm:w-auto gradient-bg" disabled={isLoading}>
                        {isLoading ? "Đang cập nhật..." : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="change-password">
                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Separator />
                    <div>
                      <Label htmlFor="new-password">Mật khẩu mới</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto gradient-bg" disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> Đổi mật khẩu
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;