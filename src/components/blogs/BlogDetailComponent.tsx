import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Helmet } from "react-helmet";

export interface NguoiDung {
  maNguoiDung: string;
  hoTen: string;
  vaiTro: number;
}

interface Blog {
  maBlog: number;
  maNguoiDung: string;
  ngayTao: string;
  tieuDe: string;
  noiDung: string;
  slug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  hinhAnh: string | null;
  moTaHinhAnh: string | null;
  isPublished: boolean;
  tags: string[] | null;
}

export const BlogDetailComponent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [nguoiDung, setNguoiDung] = useState<NguoiDung | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const blogResponse = await axios.get<Blog>(`${import.meta.env.VITE_API_URL}/api/Blog/slug/${slug}`);
      setBlog(blogResponse.data);

      try {
        const nguoiDungResponse = await axios.get<NguoiDung>(
          `${import.meta.env.VITE_API_URL}/api/NguoiDung/${blogResponse.data.maNguoiDung}`
        );
        setNguoiDung(nguoiDungResponse.data);
      } catch {
        setNguoiDung(null);
      }
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
      toast.error("Không thể tải bài viết. Vui lòng kiểm tra slug hoặc liên hệ admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
        <p className="mt-2 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-6 sm:py-12 border rounded-md bg-gray-50">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Không tìm thấy bài viết</h3>
        <p className="text-gray-600 mb-4 px-4">Bài viết không tồn tại hoặc đã bị xóa.</p>
      </div>
    );
  }

  const formattedDate = new Date(blog.ngayTao).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const roleBackground = "bg-green-500";
  const roleText = nguoiDung?.vaiTro === 1 ? "Admin" : nguoiDung?.vaiTro === 2 ? "Nhân Viên" : "Khác";

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      <Helmet>
        <title>{blog.metaTitle || blog.tieuDe}</title>
        <meta name="description" content={blog.metaDescription || "Bài viết chi tiết"} />
        <meta property="og:title" content={blog.metaTitle || blog.tieuDe} />
        <meta property="og:description" content={blog.metaDescription || ""} />
        {blog.hinhAnh && <meta property="og:image" content={`data:image/jpeg;base64,${blog.hinhAnh}`} />}
      </Helmet>

      <Toaster position="top-right" />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <h1 className={`${isMobile ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"} font-bold text-center`}>
            {blog.tieuDe}
          </h1>
        </CardHeader>
        {blog.hinhAnh && (
          <div className="w-full h-64 sm:h-96">
            <img
              src={`data:image/jpeg;base64,${blog.hinhAnh}`}
              alt={blog.moTaHinhAnh || blog.tieuDe}
              className="w-full h-full object-cover rounded-t-md"
            />
          </div>
        )}
        <CardContent>
          <div
            className="prose prose-sm sm:prose lg:prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.noiDung }}
          />

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div>
              <span>Người tạo: {nguoiDung?.hoTen || blog.maNguoiDung}</span>
              {nguoiDung?.vaiTro && (
                <span className={`ml-2 px-2 py-1 rounded text-white ${roleBackground}`}>
                  {roleText}
                </span>
              )}
            </div>
            <span>Ngày tạo: {formattedDate}</span>
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {blog.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {tag === "san-pham" ? "Giới Thiệu Sản Phẩm" : tag === "phoi-do" ? "Gợi Ý Phối Đồ" : tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};