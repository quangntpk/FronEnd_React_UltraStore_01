import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";



export const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  const handleRecaptchaChange = useCallback((value: string | null) => {
    setRecaptchaToken(value);
    console.log("reCAPTCHA value:", value);
  }, []);

  const validateForm = () => {
    if (!fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi ⚠️",
        description: "Họ và tên không được để trống.",
        duration: 3000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-red-500 hover:bg-red-100 border-red-500"
          >
            Đóng
          </Button>
        ),
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        variant: "destructive",
        title: "Lỗi ⚠️",
        description: "Email không hợp lệ.",
        duration: 3000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-red-500 hover:bg-red-100 border-red-500"
          >
            Đóng
          </Button>
        ),
      });
      return false;
    }
    if (password.length < 8 || password.length > 40) {
      toast({
        variant: "destructive",
        title: "Lỗi ⚠️",
        description: "Mật khẩu phải có ít nhất 8 ký tự và ít hơn 40 ký tự.",
        duration: 3000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-red-500 hover:bg-red-100 border-red-500"
          >
            Đóng
          </Button>
        ),
      });
      return false;
    }
    return true;
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    // Kiểm tra mật khẩu
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Mật khẩu không khớp",
        description: "Vui lòng kiểm tra lại mật khẩu xác nhận."
      });
      setIsLoading(false);
      return;
    }

    if (!recaptchaToken) {
      toast({
        variant: "destructive",
        title: "Vui lòng xác minh reCAPTCHA ⚠️",
        description: "Bạn cần xác minh rằng bạn không phải là bot.",
        duration: 3000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-red-500 hover:bg-red-100 border-red-500"
          >
            Đóng
          </Button>
        ),
      });
      setIsLoading(false);
      return;
    }


    try {
      const response = await axios.post("http://localhost:5261/api/XacThuc/DangKy", {
        hoTen: fullName,
        email,
        taiKhoan: account,
        matKhau: password,
      });

      toast({
        title: "Vui lòng kiểm tra email 🎉",
        description: "Để kích hoạt tài khoản của bạn",
        duration: 5000,
        className: "bg-green-500 text-white border border-green-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-green-500 hover:bg-green-100 border-green-500"
          >
            Đóng
          </Button>
        ),
      });

      // Hiển thị form nhập OTP
      setShowOtpForm(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại ⚠️",
        description: error.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
        duration: 3000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-red-500 hover:bg-red-100 border-red-500"
          >
            Đóng
          </Button>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5261/api/XacThuc/VerifyOtpActivate", {
        email,
        otp,
      });

      toast({
        title: "Kích hoạt tài khoản thành công 🎉",
        description: response.data.message,
        duration: 5000,
        className: "bg-green-500 text-white border border-green-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-green-500 hover:bg-green-100 border-green-500"
          >
            Đóng
          </Button>
        ),
      });

      navigate("/auth/login ");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Xác minh thất bại ⚠️",
        description: error.response?.data?.message || "Vui lòng kiểm tra lại mã OTP.",
        duration: 3000,
        className: "bg-red-500 text-white border border-red-700 shadow-lg p-4 rounded-md",
        action: (
          <Button
            variant="outline"
            className="bg-white text-red-500 hover:bg-red-100 border-red-500"
          >
            Đóng
          </Button>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Đăng ký</CardTitle>
        <CardDescription className="text-center">
          Tạo tài khoản mới của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showOtpForm ? (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Nhập họ và tên"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  placeholder="Nhập email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Tài khoản</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="username"
                  name="username"
                  placeholder="Nhập tài khoản"
                  type="text"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <ReCAPTCHA
                sitekey="6LdnYnMqAAAAAIqMXz4csz5Zw_kR3ARtWht9wjY2"
                onChange={handleRecaptchaChange}
              />
            </div>

         <Button
              type="submit"
              className="w-full bg-crocus-500 hover:bg-crocus-600"
              disabled={isLoading}
            >
              {isLoading ? (
                "Đang xử lý..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Đăng ký
                </>
              )}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <Label htmlFor="otp">Nhập mã OTP</Label>
              <Input
                id="otp"
                placeholder="Nhập mã OTP từ email"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-crocus-500 hover:bg-crocus-600"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Xác minh OTP"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-center text-sm">
          Đã có tài khoản?{" "}
          <Link to="/auth/login" className="font-medium text-crocus-600 hover:text-crocus-700">
            Đăng nhập
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};