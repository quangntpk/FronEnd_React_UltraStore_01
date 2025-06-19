import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "Lỗi 404: Người dùng truy cập đường dẫn không tồn tại:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br p-4">
      <Card className="max-w-lg w-full shadow-2xl rounded-2xl">
        <CardContent className="text-center py-16 px-6">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="h-16 w-16 text-crocus-500" />
          </div>
          <h1 className="text-7xl font-extrabold text-gray-800 mb-2">404</h1>
          <p className="text-xl text-gray-600 mb-4">
            Rất tiếc! Không tìm thấy trang bạn yêu cầu.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Có thể link bạn đang truy cập đã bị hỏng hoặc trang đã bị chuyển.
          </p>
          <Button asChild size="lg" className="flex items-center justify-center space-x-2 mx-auto">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span>Quay về trang chủ</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
