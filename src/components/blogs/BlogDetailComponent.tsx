import { useState, useEffect, memo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Heart, Trash2, MessageCircle, ChevronDown, Eye } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import 'react-quill/dist/quill.snow.css';

const defaultImageUrl = "https://via.placeholder.com/150";

export interface NguoiDung {
  maNguoiDung: string;
  hoTen: string;
  vaiTro: number;
  hinhAnh: string | null;
}

export interface Blog {
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
  likes: number;
  userLikes: string[] | null;
}

export interface Comment {
  maBinhLuan: number;
  maBlog?: number;
  maSanPham?: string;
  maCombo?: number;
  maNguoiDung: string;
  noiDungBinhLuan: string;
  soTimBinhLuan: number;
  trangThai: number;
  ngayBinhLuan: string;
  hinhAnh?: string;
  hoTen?: string;
}

interface CommentsProps {
  entityId: number;
  type: "product" | "blog" | "combo";
}

const Comments = memo(({ entityId, type }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState(new Set<number>());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [sortOption, setSortOption] = useState<"newest" | "mostLiked">("newest");
  const [showAllComments, setShowAllComments] = useState(false);

  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.maNguoiDung;

  const fetchComments = async () => {
    if (!entityId) {
      toast.error("Mã blog không hợp lệ!");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const commentResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Comment/list?${type}Id=${entityId}&status=1`
      );
      if (!commentResponse.ok) {
        if (commentResponse.status === 404) {
          throw new Error("Không tìm thấy bình luận cho bài viết này.");
        }
        throw new Error("Lỗi khi tải bình luận");
      }
      let commentData: Comment[] = await commentResponse.json();

      let pendingComments: Comment[] = [];
      if (currentUserId) {
        const pendingResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Comment/list?${type}Id=${entityId}&status=0&maNguoiDung=${currentUserId}`
        );
        if (pendingResponse.ok) {
          pendingComments = await pendingResponse.json();
        }
      }

      const allComments = [...commentData, ...pendingComments]
        .filter((comment, index, self) =>
          index === self.findIndex((c) => c.maBinhLuan === comment.maBinhLuan)
        )
        .filter((comment) => comment.maBlog === entityId)
        .map((comment) => ({
          ...comment,
          soTimBinhLuan: comment.soTimBinhLuan || 0,
        }))
        .sort((a, b) =>
          sortOption === "newest"
            ? new Date(b.ngayBinhLuan).getTime() - new Date(a.ngayBinhLuan).getTime()
            : b.soTimBinhLuan - a.soTimBinhLuan
        );

      if (currentUserId) {
        const likedCommentsKey = `likedComments_${currentUserId}_${type}_${entityId}`;
        const storedLikedComments = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as number[];
        setLikedComments(new Set(storedLikedComments));
      }

      setComments(allComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      toast.error(err.message || "Có lỗi xảy ra khi tải bình luận!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [entityId, type, sortOption]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận!");
      return;
    }

    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập trước khi thêm bình luận!");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const payload = {
      maBlog: entityId,
      maNguoiDung: currentUserId,
      noiDungBinhLuan: DOMPurify.sanitize(newComment),
      ngayBinhLuan: new Date().toISOString(),
      trangThai: 0,
      soTimBinhLuan: 0,
    };

    const tempComment = {
      ...payload,
      maBinhLuan: Date.now(), // Temporary ID for optimistic update
      hinhAnh: userData?.hinhAnh || defaultImageUrl,
      hoTen: userData?.hoTen,
    };

    setComments((prev) => [tempComment, ...prev.filter(c => c.maBinhLuan !== tempComment.maBinhLuan)]);
    setNewComment("");
    setIsActionLoading(true);

    try {
      console.log("Sending comment payload:", payload);
      console.log("Token:", localStorage.getItem("token"));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Comment/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.message || "Không thể thêm bình luận");
      }

      const addedComment = await response.json();
      toast.success("Bình luận đã được gửi và chờ duyệt!");
      await fetchComments();
    } catch (err) {
      console.error("Error adding comment:", err);
      setComments((prev) => prev.filter((c) => c.maBinhLuan !== tempComment.maBinhLuan));
      toast.error(err.message || "Có lỗi xảy ra khi thêm bình luận!");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteComment = async (maBinhLuan: number) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để xóa bình luận!");
      return;
    }

    setCommentToDelete(maBinhLuan);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Comment/delete/${commentToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Không thể xóa bình luận");
      toast.success("Xóa bình luận thành công!");
      await fetchComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Có lỗi xảy ra khi xóa bình luận!");
    } finally {
      setIsConfirmModalOpen(false);
      setCommentToDelete(null);
      setIsActionLoading(false);
    }
  };

  const handleLikeComment = async (maBinhLuan: number) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để thích bình luận!");
      return;
    }

    const isLiked = likedComments.has(maBinhLuan);
    const endpoint = isLiked
      ? `${import.meta.env.VITE_API_URL}/api/Comment/Unlike/${maBinhLuan}`
      : `${import.meta.env.VITE_API_URL}/api/Comment/Like/${maBinhLuan}`;

    setIsActionLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Không thể cập nhật trạng thái thích");

      setComments((prevComments) =>
        prevComments
          .map((comment) =>
            comment.maBinhLuan === maBinhLuan
              ? {
                  ...comment,
                  soTimBinhLuan: isLiked
                    ? Math.max(0, comment.soTimBinhLuan - 1)
                    : comment.soTimBinhLuan + 1,
                }
              : comment
          )
          .sort((a, b) =>
            sortOption === "newest"
              ? new Date(b.ngayBinhLuan).getTime() - new Date(a.ngayBinhLuan).getTime()
              : b.soTimBinhLuan - a.soTimBinhLuan
          )
      );

      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (isLiked) newSet.delete(maBinhLuan);
        else newSet.add(maBinhLuan);
        const likedCommentsKey = `likedComments_${currentUserId}_${type}_${entityId}`;
        localStorage.setItem(likedCommentsKey, JSON.stringify([...newSet]));
        return newSet;
      });

      toast.success(isLiked ? "Đã bỏ thích bình luận!" : "Đã thích bình luận!");
    } catch (err) {
      console.error("Error updating like status:", err);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái thích!");
    } finally {
      setIsActionLoading(false);
    }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="mt-12">
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteComment}
      />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium">Bình Luận ({comments.filter(c => c.trangThai === 1).length})</h2>
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as "newest" | "mostLiked")}
            className="appearance-none pl-4 pr-8 py-2 border border-purple-300 rounded-md bg-white text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Sắp xếp bình luận"
          >
            <option value="newest">Mới nhất</option>
            <option value="mostLiked">Nhiều thích nhất</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-700 w-5 h-5" />
        </div>
      </div>
      {comments.some((c) => c.trangThai === 0 && c.maNguoiDung === currentUserId) && (
        <p className="text-sm text-gray-500 mb-4">Bình luận của bạn đang chờ duyệt.</p>
      )}
      <div className="space-y-4 mb-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
            <p>Đang tải bình luận...</p>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bình luận nào.</p>
        ) : (
          displayedComments.map((comment) => (
            <div
              key={comment.maBinhLuan}
              className="bg-white p-4 rounded-lg shadow-md flex items-start gap-4"
            >
              <div className="flex-shrink-0">
                <img
                  src={comment.hinhAnh || defaultImageUrl}
                  alt={`Ảnh đại diện của ${comment.hoTen || comment.maNguoiDung}`}
                  className="w-12 h-12 rounded-full object-cover border border-purple-300"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.src = defaultImageUrl)}
                />
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="text-gray-800 line-clamp-3">{comment.noiDungBinhLuan}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bởi {comment.hoTen || comment.maNguoiDung} -{" "}
                    {new Date(comment.ngayBinhLuan).toLocaleDateString("vi-VN")}
                    {comment.trangThai === 0 && <span className="ml-2 text-yellow-500">(Chờ duyệt)</span>}
                  </p>
                  <div className="flex items-center mt-2">
                    <button
                      onClick={() => handleLikeComment(comment.maBinhLuan)}
                      className="flex items-center gap-1 text-purple-700 hover:text-purple-900 disabled:opacity-50"
                      aria-label={likedComments.has(comment.maBinhLuan) ? "Bỏ thích bình luận" : "Thích bình luận"}
                      disabled={isActionLoading || comment.trangThai === 0}
                    >
                      <Heart
                        className={cn(
                          "w-5 h-5",
                          likedComments.has(comment.maBinhLuan)
                            ? "fill-purple-500 text-purple-500"
                            : "text-purple-400"
                        )}
                      />
                      <span>{comment.soTimBinhLuan}</span>
                    </button>
                  </div>
                </div>
                {comment.maNguoiDung === currentUserId && (
                  <button
                    onClick={() => handleDeleteComment(comment.maBinhLuan)}
                    className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    aria-label="Xóa bình luận"
                    disabled={isActionLoading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {comments.filter(c => c.trangThai === 1).length > 3 && !showAllComments && (
        <button
          onClick={() => setShowAllComments(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          aria-label="Xem thêm bình luận"
        >
          <Eye className="w-5 h-5" />
          Xem thêm
        </button>
      )}
      <div className="mt-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận của bạn..."
          className="w-full p-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
          aria-label="Viết bình luận của bạn"
          disabled={isActionLoading}
          rows={4}
        />
        <button
          onClick={handleAddComment}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-purple-300"
          disabled={isActionLoading}
          aria-label="Gửi bình luận"
        >
          {isActionLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
          {isActionLoading ? "Đang gửi..." : "Gửi Bình Luận"}
        </button>
      </div>
    </div>
  );
});

const ConfirmModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" role="dialog" aria-labelledby="confirm-modal-title">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h3 id="confirm-modal-title" className="text-lg font-medium mb-4">Xác nhận xóa</h3>
        <p className="mb-6">Bạn có chắc muốn xóa bình luận này không?</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            aria-label="Hủy xóa bình luận"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            aria-label="Xác nhận xóa bình luận"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Có
          </button>
        </div>
      </div>
    </div>
  );
};

export const BlogDetailComponent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [nguoiDung, setNguoiDung] = useState<NguoiDung | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const isMobile = useIsMobile();
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.maNguoiDung;

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const blogResponse = await axios.get<Blog>(`${import.meta.env.VITE_API_URL}/api/Blog/slug/${slug}`);
      const fetchedBlog = blogResponse.data;
      setBlog(fetchedBlog);
      setLikesCount(fetchedBlog.likes || 0);
      setIsLiked(currentUserId && fetchedBlog.userLikes ? fetchedBlog.userLikes.includes(currentUserId) : false);

      let nguoiDungResponse = null;
      if (fetchedBlog.maNguoiDung) {
        nguoiDungResponse = await axios.get<NguoiDung>(`${import.meta.env.VITE_API_URL}/api/NguoiDung/${fetchedBlog.maNguoiDung}`).catch(() => null);
      }
      setNguoiDung(nguoiDungResponse?.data || null);
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
      toast.error("Không thể tải bài viết. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để thích bài viết!");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLiked
        ? `${import.meta.env.VITE_API_URL}/api/Blog/${blog?.maBlog}/unlike`
        : `${import.meta.env.VITE_API_URL}/api/Blog/${blog?.maBlog}/like`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(currentUserId),
      });

      if (!response.ok) throw new Error("Không thể cập nhật trạng thái thích");

      const updatedBlog = await response.json();
      setLikesCount(updatedBlog.likes);
      setIsLiked(!isLiked);
      toast.success(isLiked ? "Đã bỏ thích bài viết!" : "Đã thích bài viết!");
    } catch (error) {
      console.error("Error updating like status:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái thích!");
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
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
        <p className="mt-2 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-6 sm:py-12 border rounded-md bg-white">
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

  const roleMap: Record<number, { text: string; background: string }> = {
    1: { text: "Admin", background: "bg-green-500" },
    2: { text: "Nhân Viên", background: "bg-blue-500" },
    0: { text: "Khác", background: "bg-gray-500" },
  };
  const { text: roleText, background: roleBackground } = roleMap[nguoiDung?.vaiTro || 0];

  const tagMap: Record<string, string> = {
    "san-pham": "Giới Thiệu Sản Phẩm",
    "phoi-do": "Gợi Ý Phối Đồ",
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen blog-detail">
      <Helmet>
        <title>{blog.metaTitle || blog.tieuDe}</title>
        <meta name="description" content={blog.metaDescription || "Bài viết chi tiết"} />
        <meta property="og:title" content={blog.metaTitle || blog.tieuDe} />
        <meta property="og:description" content={blog.metaDescription || ""} />
        {blog.hinhAnh && <meta property="og:image" content={`data:image/jpeg;base64,${blog.hinhAnh}`} />}
      </Helmet>

      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-none">
            <CardHeader>
              <h1 className={isMobile ? "text-xl sm:text-2xl font-bold text-center" : "text-2xl sm:text-3xl font-bold text-center"}>
                {blog.tieuDe}
              </h1>
              <div className="flex items-center gap-4 justify-center">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md",
                    isLiked ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-purple-500 text-white hover:bg-purple-600"
                  )}
                  aria-label={isLiked ? "Bỏ thích bài viết" : "Thích bài viết"}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                  <span>{isLiked ? "Bỏ Thích" : "Thích"} ({likesCount})</span>
                </button>
              </div>
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
                className="prose prose-sm sm:prose lg:prose-lg max-w-none ql-editor"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.noiDung, { ADD_ATTR: ['style'] }) }}
              />
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <div>
                  <span>Người tạo: {nguoiDung?.hoTen || blog.maNguoiDung}</span>
                  {nguoiDung?.vaiTro && (
                    <span
                      className={`ml-2 px-2 py-1 rounded text-white ${roleBackground}`}
                      aria-label={`Vai trò người dùng: ${roleText}`}
                    >
                      {roleText}
                    </span>
                  )}
                </div>
                <span>Ngày tạo: {formattedDate}</span>
              </div>

              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {tagMap[tag] || tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <Comments entityId={blog.maBlog} type="blog" />
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        .blog-detail .ql-editor {
          font-size: inherit;
        }
        .blog-detail .ql-editor * {
          font-size: inherit !important;
        }
        .blog-detail .ql-size-small {
          font-size: 0.75rem !important;
        }
        .blog-detail .ql-size-normal {
          font-size: 1rem !important;
        }
        .blog-detail .ql-size-large {
          font-size: 1.5rem !important;
        }
        .blog-detail .ql-size-huge {
          font-size: 2.5rem !important;
        }
        .blog-detail textarea {
          resize: vertical;
          min-height: 100px;
        }
        .blog-detail .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default BlogDetailComponent;