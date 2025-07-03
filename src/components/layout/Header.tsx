import { User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/components/auth/AuthContext';

type HeaderProps = {
  title: string;
};

const Header = ({ title }: HeaderProps) => {
  const navigate = useNavigate();
  const { isLoggedIn, userName, logout } = useAuth(); 
   const { toast } = useToast();
  const handleLogout = async () => {
    try {
      await logout(); 
       toast({
        title: "Đăng xuất thành công 🎉",
        description: "Bạn đã đăng xuất khỏi tài khoản.",
        duration: 3000,
        className: "bg-green-500 text-white border border-green-700 shadow-lg",
        action: (
          <Button variant="outline" className="bg-white text-green-500 hover:bg-green-100 border-green-500">
            Đóng
          </Button>
        ),
      });
      navigate('/auth/login?logout=true');
    } catch (error) {
      toast.error('Đăng xuất thất bại');
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-sm z-20">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        {isLoggedIn && (
          <span className="text-sm text-gray-700">
            Xin chào: {userName}
          </span>
        )}
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
