import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5261";

const Newsletter = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng nhập email.",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }
    if (!validateEmail(email)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Email không hợp lệ.",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Newsletter/Subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không thể đăng ký: ${errorText}`);
      }

      setEmail("");
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Bạn đã đăng ký nhận tin tức thành công! Kiểm tra email để nhận thông báo chào mừng.",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi khi đăng ký nhận tin tức.";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 bg-crocus-50 rounded-xl">
      <div className="text-center max-w-xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4">Đăng ký nhận tin tức</h2>
        <p className="text-gray-600 mb-6">
          Cập nhật các bộ sưu tập mới nhất và ưu đãi độc quyền
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            className="flex-grow px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-crocus-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            className="bg-crocus-500 hover:bg-crocus-600 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              "Đang xử lý..."
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span>Đăng ký</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
