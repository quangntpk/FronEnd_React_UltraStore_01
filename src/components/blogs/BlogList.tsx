import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
  const isMobile = useIsMobile();
  // Sử dụng metaDescription nếu có, nếu không thì dùng noiDung
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
  const roleBackground = nguoiDung?.vaiTro === "Admin" ? "bg-red-500" : nguoiDung?.vaiTro === "NhanVien" ? "bg-green-500" : "bg-gray-300";

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      {post.hinhAnh && post.slug && (
        <Link to={`/blogs/${post.slug}`}>
          <img
            src={`data:image/jpeg;base64,${post.hinhAnh}`}
            alt={post.moTaHinhAnh || post.tieuDe}
            className="w-full h-48 object-cover rounded-t-md"
          />
        </Link>
      )}
      <CardHeader>
        <CardTitle className="text-lg font-semibold truncate">
          {post.slug ? (
            <Link to={`/blogs/${post.slug}`}>{post.tieuDe}</Link>
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
            {nguoiDung?.vaiTro && (
              <span
                className={`ml-2 px-2 py-1 rounded 
                    ${nguoiDung.vaiTro === "1"
                    ? 'bg-red-500 text-white'
                    : 'border-green-500 text-green-500 bg-white'
                  }`}
              >
                {nguoiDung.vaiTro === "1" ? 'Nhân Viên' : 'Admin'}
              </span>
            )}
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
      </CardContent>
    </Card>
  );
};

export const BlogList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [nguoiDungs, setNguoiDungs] = useState<{ [key: string]: NguoiDung | null }>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 6;
  const isMobile = useIsMobile();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Blog[]>(`${import.meta.env.VITE_API_URL}/api/Blog`);
      setBlogs(response.data);

      const uniqueMaNguoiDungs = [...new Set(response.data.map(blog => blog.maNguoiDung))];
      const nguoiDungPromises = uniqueMaNguoiDungs.map(maNguoiDung =>
        axios.get<NguoiDung>(`${import.meta.env.VITE_API_URL}/api/NguoiDung/${maNguoiDung}`).catch(() => null)
      );
      const nguoiDungResponses = await Promise.all(nguoiDungPromises);
      const nguoiDungMap = uniqueMaNguoiDungs.reduce((acc, maNguoiDung, index) => {
        const response = nguoiDungResponses[index];
        acc[maNguoiDung] = response ? response.data : null;
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

  const filteredBlogs = useMemo(() => {
    let filtered = blogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.noiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    switch (sortBy) {
      case "newest":
        return [...filtered].sort(
          (a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime()
        );
      case "oldest":
        return [...filtered].sort(
          (a, b) => new Date(a.ngayTao).getTime() - new Date(b.ngayTao).getTime()
        );
      case "title_asc":
        return [...filtered].sort((a, b) => a.tieuDe.localeCompare(b.tieuDe));
      case "title_desc":
        return [...filtered].sort((a, b) => b.tieuDe.localeCompare(b.tieuDe));
      default:
        return filtered;
    }
  }, [searchTerm, sortBy, blogs]);

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, currentPage + half);

    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
        Danh Sách Bài Viết
      </h1>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            aria-label="Tìm kiếm bài viết"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger
            className={isMobile ? "w-full" : "w-[180px]"}
            aria-label="Sắp xếp bài viết"
          >
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="title_asc">Tiêu đề (A-Z)</SelectItem>
            <SelectItem value="title_desc">Tiêu đề (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-6 sm:py-12 border rounded-md bg-gray-50">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">
            Không tìm thấy bài viết
          </h3>
          <p className="text-gray-600 mb-4 px-4">
            Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
          </p>
          <Button
            size={isMobile ? "sm" : "default"}
            onClick={resetFilters}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {currentBlogs.map((post) => (
              <BlogCard
                key={post.maBlog}
                post={post}
                nguoiDung={nguoiDungs[post.maNguoiDung] || null}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="border-gray-300 hover:bg-gray-100"
                aria-label="Trang đầu"
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gray-300 hover:bg-gray-100"
                aria-label="Trang trước"
              >
                Trước
              </Button>
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`${currentPage === page
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-gray-300 hover:bg-gray-100"
                    }`}
                  aria-label={`Trang ${page}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="border-gray-300 hover:bg-gray-100"
                aria-label="Trang sau"
              >
                Sau
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="border-gray-300 hover:bg-gray-100"
                aria-label="Trang cuối"
              >
                Cuối
              </Button>
            </div>
          )}
        </>
      )}
      <div className="text-sm text-gray-500">
        {filteredBlogs.length} bài viết được tìm thấy
      </div>
    </div>
  );
};