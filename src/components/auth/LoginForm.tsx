import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Swal from "sweetalert2";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginResponse {
  message: string;
  user?: {
    maNguoiDung: string;
    hoTen: string;
    email: string;
    vaiTro: number;
  };
  token: string;
  redirectUrl?: string;
  loginUrl?: string;
}

export const LoginForm = () => {
  const [taiKhoan, setTaiKhoan] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTaiKhoan = localStorage.getItem("savedTaiKhoan");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedTaiKhoan && savedPassword) {
      setTaiKhoan(savedTaiKhoan);
      setPassword(savedPassword);
      setRememberPassword(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (rememberPassword) {
      localStorage.setItem("savedTaiKhoan", taiKhoan);
      localStorage.setItem("savedPassword", password);
    } else {
      localStorage.removeItem("savedTaiKhoan");
      localStorage.removeItem("savedPassword");
    }

    try {
      const response = await axios.post<LoginResponse>(
        `${import.meta.env.VITE_API_URL}/api/XacThuc/DangNhap`,
        {
          taiKhoan,
          matKhau: password,
        }
      );

      const { message, user, token, redirectUrl } = response.data;

      if (user) {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", user.maNguoiDung || "");
        localStorage.setItem("user", JSON.stringify({
          maNguoiDung: user.maNguoiDung || "",
          fullName: user.hoTen || "",
          email: user.email || "",
          vaiTro: user.vaiTro || "",
        }));
        window.dispatchEvent(new Event("storageChange"));

        let redirectPath = "/";
        switch (user.vaiTro) {
          case 0:
            redirectPath = "/";
            break;
          case 1:
            redirectPath = "/admin";
            break;
          case 2:
            redirectPath = "/staff";
            break;
          default:
            redirectPath = "/home";
        }

        Swal.fire({
          title: "Đăng nhập thành công!",
          text: message || "Chào mừng bạn quay trở lại!",
          icon: "success",
          confirmButtonColor: "#3085d6",
          timer: 3000,
          showConfirmButton: false,
        }).then(() => {
          if (redirectUrl && redirectUrl !== window.location.origin) {
            const userData = encodeURIComponent(JSON.stringify({
              fullName: user.hoTen || "",
              email: user.email || "",
              role: user.vaiTro || "",
            }));
            window.location.href = `${redirectUrl}?token=${token}&userId=${user.maNguoiDung || ""}&user=${userData}`;
          } else {
            navigate(redirectPath);
          }
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Đăng nhập thất bại!",
        text: error.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
        icon: "error",
        confirmButtonColor: "#d33",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await axios.get<LoginResponse>(
        `${import.meta.env.VITE_API_URL}/api/XacThuc/google-login`,
        {
          params: { returnUrl: "/api/XacThuc/google-callback" },
        }
      );
      const { loginUrl } = response.data;
      if (!loginUrl) throw new Error("Không thể lấy URL đăng nhập Google");
      window.location.href = loginUrl;
    } catch (error) {
      Swal.fire({
        title: "Đăng nhập Google thất bại!",
        text: error.message || "Đã có lỗi xảy ra khi đăng nhập với Google.",
        icon: "error",
        confirmButtonColor: "#d33",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setRememberPassword(checked);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
        <CardDescription className="text-center">
          Nhập thông tin đăng nhập của bạn để truy cập tài khoản
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="username">Tài khoản</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="username"
                placeholder="Nhập tài khoản"
                type="text"
                required
                value={taiKhoan}
                onChange={(e) => setTaiKhoan(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              <Link
                to="/auth/forgot-password"
                className="text-sm font-medium text-crocus-600 hover:text-crocus-700"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberPassword}
              onCheckedChange={handleCheckboxChange}
              disabled={isLoading}
            />
            <label
              htmlFor="rememberMe"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ghi nhớ
            </label>
          </div>

          <Button type="submit" className="w-full bg-crocus-500 hover:bg-crocus-600" disabled={isLoading}>
            <LogIn className="mr-2 h-4 w-4" /> Đăng nhập
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" type="button" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link to="/auth/register" className="font-medium text-crocus-600 hover:text-crocus-700">
            Đăng ký
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};