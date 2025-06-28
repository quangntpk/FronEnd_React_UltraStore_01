import { Bell, Search, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type HeaderProps = {
  title: string;
};

// Định nghĩa interface cho dữ liệu trả về từ API DangXuat
interface LogoutResponse {
  redirectTo?: string; // redirectTo là optional để tránh lỗi nếu không tồn tại
}

const Header = ({ title }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const user = searchParams.get('user');

    if (token && !localStorage.getItem('token')) {
      localStorage.setItem('token', token);
      if (userId) localStorage.setItem('userId', userId);
      if (user) localStorage.setItem('user', decodeURIComponent(user));
      setIsLoggedIn(true);
      window.history.replaceState({}, document.title, location.pathname);
    }

    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storageChange', handleStorageChange);
    return () => window.removeEventListener('storageChange', handleStorageChange);
  }, [location]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await axios.post<LogoutResponse>(
        'http://localhost:5261/api/XacThuc/DangXuat',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');

      window.dispatchEvent(new Event('storageChange'));

      toast.success('Đăng xuất thành công 🎉', {
        position: 'top-right',
        duration: 3000,
      });

      // Sử dụng redirectTo nếu tồn tại, nếu không thì dùng mặc định
      navigate(response.data.redirectTo ?? '/auth/login?logout=true');
    } catch (error) {
      console.error('Đăng xuất thất bại:', error);
      toast.error('Đăng xuất thất bại. Vui lòng thử lại.');
      // Chuyển hướng mặc định nếu có lỗi
      navigate('/auth/login?logout=true');
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-sm z-20">
      <h1 className="text-xl font-semibold">{ }</h1>
      {/* title */}
      <div className="flex items-center gap-4">
        {/* <div className="relative max-w-xs w-72 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Tìm kiếm..." 
            className="pl-8 bg-gray-100 border-0 focus-visible:ring-1 focus-visible:ring-crocus-500" 
          />
        </div> */}
        <span className="text-sm text-gray-700">
          Xin chào: {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).fullName : 'admin@example.com'}
        </span>
        <DropdownMenu>
          {/* <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-crocus-500 text-[10px] text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger> */}
          {/* <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {[1, 2, 3].map(i => (
                <DropdownMenuItem key={i} className="cursor-pointer py-3">
                  <div className="flex gap-4">
                    <div className="h-9 w-9 rounded-full bg-crocus-50 flex items-center justify-center shrink-0">
                      <Bell className="h-4 w-4 text-crocus-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Đơn hàng mới #{1000 + i}</p>
                      <p className="text-gray-500 text-xs mt-1">Khách hàng đã đặt một đơn hàng trị giá $199</p>
                      <p className="text-xs text-gray-500 mt-1">10 phút trước</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent> */}
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-base font-medium">Tài khoản của tôi</p>
                <p className="text-xs text-gray-500">
                  {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'admin@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoggedIn && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/admin/settings" className="flex items-center w-full">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;