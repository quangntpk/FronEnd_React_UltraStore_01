import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Loader2, ArrowRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";

export interface NguoiDung {
  maNguoiDung: string | number;
  hoTen: string;
  vaiTro: string;
}

interface Blog {
  maBlog: number;
  maNguoiDung: string;
  ngayTao: string;
  ngayCapNhat: string | null;
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

interface BlogCardProps {
  post: Blog;
  nguoiDung: NguoiDung | null;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, nguoiDung }) => {
  const excerpt = post.metaDescription
    ? post.metaDescription.length > 100
      ? post.metaDescription.slice(0, 100) + "..."
      : post.metaDescription
    : post.noiDung.length > 100
      ? post.noiDung.slice(0, 100) + "..."
      : post.noiDung;
  const formattedDate = new Date(post.ngayTao).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 w-full max-w-md mx-auto">
      {post.hinhAnh && post.slug && (
        <Link to={`/blogs/${post.slug}`} aria-label={`Xem chi tiết bài viết ${post.tieuDe}`}>
          <img
            src={`data:image/jpeg;base64,${post.hinhAnh}`}
            alt={post.moTaHinhAnh || post.tieuDe}
            className="w-full h-48 object-cover rounded-t-md"
            onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          />
        </Link>
      )}
      <CardHeader>
        <CardTitle className="text-lg font-semibold truncate">
          {post.slug ? (
            <Link to={`/blogs/${post.slug}`} aria-label={`Xem chi tiết bài viết ${post.tieuDe}`}>
              {post.tieuDe}
            </Link>
          ) : (
            post.tieuDe
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600">{excerpt}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            <span>Người tạo: {nguoiDung?.hoTen || post.maNguoiDung}</span>
          </div>
          <span>Ngày tạo: {formattedDate}</span>
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {post.slug && (
          <Link
            to={`/blogs/${post.slug}`}
            className="mt-4 flex items-center justify-center w-full text-white py-2 rounded-md transition-colors duration-200"
            style={{
              backgroundColor: "#9b87f5",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#8a75f0")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#9b87f5")}
            aria-label={`Đọc thêm bài viết ${post.tieuDe}`}
          >
            <span>Đọc thêm</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export const BlogList = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [nguoiDungs, setNguoiDungs] = useState<{ [key: string]: NguoiDung | null }>({});
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Blog[]>(`${import.meta.env.VITE_API_URL}/api/Blog`);
      const publishedBlogs = response.data.filter((post) => post.isPublished);
      setBlogs(publishedBlogs);

      const uniqueMaNguoiDungs = [...new Set(publishedBlogs.map((blog) => blog.maNguoiDung))];
      const nguoiDungPromises = uniqueMaNguoiDungs.map((maNguoiDung) =>
        axios.get<NguoiDung>(`${import.meta.env.VITE_API_URL}/api/NguoiDung/${maNguoiDung}`).catch(() => null)
      );
      const nguoiDungResponses = await Promise.all(nguoiDungPromises);
      const nguoiDungMap = uniqueMaNguoiDungs.reduce((acc, maNguoiDung, index) => {
        acc[maNguoiDung] = nguoiDungResponses[index]?.data || null;
        return acc;
      }, {} as { [key: string]: NguoiDung | null });
      setNguoiDungs(nguoiDungMap);
    } catch (error) {
      toast.error("Không thể tải danh sách blog hoặc thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <section>
      <div>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#9b87f5]" />
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-6 sm:py-12 border rounded-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              Không tìm thấy bài viết
            </h3>
            <p className="text-gray-600 mb-4 px-4">
              Hiện tại không có bài viết nào được công khai
            </p>
          </div>
        ) : (
          <Carousel
            className="w-full max-w-[1400px] mx-auto"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="gap-4">
              {blogs.map((post) => (
                <CarouselItem
                  key={post.maBlog}
                  className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <BlogCard post={post} nguoiDung={nguoiDungs[post.maNguoiDung] || null} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white text-[#9b87f5] p-2 rounded-full hover:bg-[#9b87f5]/20 transition-colors z-20"
              aria-label="Bài viết trước"
            />
            <CarouselNext
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white text-[#9b87f5] p-2 rounded-full hover:bg-[#9b87f5]/20 transition-colors z-20"
              aria-label="Bài viết tiếp theo"
            />
          </Carousel>
        )}
      </div>
    </section>
  );
};