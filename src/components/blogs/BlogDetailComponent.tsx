import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Heart, Trash2, Copy, Facebook, Twitter, MessageCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

const defaultImageUrl = "https://via.placeholder.com/150";

export interface NguoiDung {
  maNguoiDung: string;
  hoTen: string;
  vaiTro: number;
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
  entityId: string | number;
  type: "product" | "blog" | "combo";
}

// Notification Component
const Notification = ({ message, type, onClose }: { message: string; type: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 font-roboto",
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      )}
    >
      <p>{message}</p>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="absolute top-1 right-1 text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  );
};

// ConfirmModal Component
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-roboto" role="dialog" aria-label="Confirm delete comment">
      <div className="bg-white p-6 rounded-lg shadow-lg w-64">
        <h3 className="text-lg font-medium mb-4">Xác nhận xóa</h3>
        <p className="mb-6">Bạn có chắc muốn xóa bình luận này không?</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            aria-label="Cancel deletion"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            aria-label="Confirm deletion"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Có
          </button>
        </div>
      </div>
    </div>
  );
};

// Comments Component
const Comments = ({ entityId, type }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState(new Set<number>());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = (message: string, type: string) => setNotification({ message, type });
  const closeNotification = () => setNotification(null);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const commentResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Comment/list?${type}Id=${entityId}&status=1`
        );
        if (!commentResponse.ok) throw new Error("Failed to fetch comments");
        const commentData: Comment[] = await commentResponse.json();
        const entityComments = commentData
          .map((comment) => ({
            ...comment,
            soTimBinhLuan: comment.soTimBinhLuan || 0,
          }))
          .sort((a, b) => b.soTimBinhLuan - a.soTimBinhLuan);

        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const currentUserId = userData?.maNguoiDung;
        if (currentUserId) {
          const likedCommentsKey = `likedComments_${currentUserId}_${type}_${entityId}`;
          const storedLikedComments = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as number[];
          setLikedComments(new Set(storedLikedComments));
        }

        setComments(entityComments);
      } catch (err) {
        console.error("Error fetching comments:", err);
        showNotification("Có lỗi xảy ra khi tải bình luận!", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
    const interval = setInterval(fetchComments, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [entityId, type]);

  const handleAddComment = async () => {
    if (!newComment) {
      showNotification("Vui lòng nhập nội dung bình luận!", "error");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;
    const hoTen = userData?.hoTen;
    const hinhAnh = userData?.hinhAnh;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập trước khi thêm bình luận!", "error");
      return;
    }

    const sanitizedComment = DOMPurify.sanitize(newComment);
    const commentData = {
      [type === "product" ? "maSanPham" : type === "blog" ? "maBlog" : "maCombo"]: entityId,
      maNguoiDung,
      noiDungBinhLuan: sanitizedComment,
      ngayBinhLuan: new Date().toISOString(),
      trangThai: 0,
      soTimBinhLuan: 0,
      hinhAnh: hinhAnh || defaultImageUrl,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Comment/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      setNewComment("");
      showNotification("Bình luận của bạn đã được ghi lại và chờ duyệt!", "success");
    } catch (err) {
      console.error("Error adding comment:", err);
      showNotification("Có lỗi xảy ra khi thêm bình luận!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = (maBinhLuan: number) => {
    setCommentToDelete(maBinhLuan);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Comment/delete/${commentToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      setComments((prevComments) => prevComments.filter((comment) => comment.maBinhLuan !== commentToDelete));
      showNotification("Xóa bình luận thành công!", "success");
    } catch (err) {
      console.error("Error deleting comment:", err);
      showNotification("Có lỗi xảy ra khi xóa bình luận!", "error");
    } finally {
      setIsConfirmModalOpen(false);
      setCommentToDelete(null);
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (maBinhLuan: number) => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập để thích bình luận!", "error");
      return;
    }

    const isLiked = likedComments.has(maBinhLuan);
    const endpoint = isLiked
      ? `${import.meta.env.VITE_API_URL}/api/Comment/Unlike/${maBinhLuan}`
      : `${import.meta.env.VITE_API_URL}/api/Comment/Like/${maBinhLuan}`;

    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to update like status");

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
          .sort((a, b) => b.soTimBinhLuan - a.soTimBinhLuan)
      );

      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (isLiked) newSet.delete(maBinhLuan);
        else newSet.add(maBinhLuan);
        const likedCommentsKey = `likedComments_${maNguoiDung}_${type}_${entityId}`;
        localStorage.setItem(likedCommentsKey, JSON.stringify([...newSet]));
        return newSet;
      });

      showNotification(isLiked ? "Đã bỏ thích bình luận!" : "Đã thích bình luận!", "success");
    } catch (err) {
      console.error("Error updating like status:", err);
      showNotification("Có lỗi xảy ra khi cập nhật số tim!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.maNguoiDung;

  return (
    <div className="mt-12">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteComment}
      />
      <h2 className="text-2xl font-medium mb-6">Bình Luận</h2>
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận của bạn..."
          className="w-full p-2 border rounded-md"
          aria-label="Comment input"
          disabled={isLoading}
        />
        <button
          onClick={handleAddComment}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? "Đang gửi..." : "Gửi Bình Luận"}
        </button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-center text-gray-600">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bình luận nào.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.maBinhLuan}
              className="bg-white p-4 rounded-lg shadow-md flex items-start gap-4"
            >
              <div className="flex-shrink-0">
                <img
                  src={comment.hinhAnh || defaultImageUrl}
                  alt={`Ảnh của ${comment.hoTen || comment.maNguoiDung}`}
                  className="w-12 h-12 rounded-full object-cover border border-border"
                  onError={(e) => (e.target as HTMLImageElement).src = defaultImageUrl}
                />
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="text-gray-800">{comment.noiDungBinhLuan}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bởi {comment.hoTen || comment.maNguoiDung} -{" "}
                    {new Date(comment.ngayBinhLuan).toLocaleDateString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <button
                      onClick={() => handleLikeComment(comment.maBinhLuan)}
                      className="flex items-center gap-1"
                      aria-label={likedComments.has(comment.maBinhLuan) ? "Unlike comment" : "Like comment"}
                      disabled={isLoading}
                    >
                      <Heart
                        className={cn(
                          "w-5 h-5",
                          likedComments.has(comment.maBinhLuan)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        )}
                      />
                      <span>{comment.soTimBinhLuan}</span>
                    </button>
                  </div>
                </div>
                {comment.maNguoiDung === currentUserId && (
                  <button
                    onClick={() => handleDeleteComment(comment.maBinhLuan)}
                    className="text-red-500 hover:text-red-700 transition colors"
                    aria-label="Delete comment"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ShareIcon Component
const ShareIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <circle cx="12" cy="12" r="10" fill="#000000" />
    <path
      d="M9 8L11 10L9 12"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 16L13 14L15 12"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// BlogDetailComponent
export const BlogDetailComponent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [nguoiDung, setNguoiDung] = useState<NguoiDung | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const isMobile = useIsMobile();
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.maNguoiDung;

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const [blogResponse, nguoiDungResponse] = await Promise.all([
        axios.get<Blog>(`${import.meta.env.VITE_API_URL}/api/Blog/slug/${slug}`),
        axios.get<NguoiDung>(`${import.meta.env.VITE_API_URL}/api/NguoiDung/${blog?.maNguoiDung || ""}`).catch(() => null),
      ]);
      const fetchedBlog = blogResponse.data;
      setBlog(fetchedBlog);
      setNguoiDung(nguoiDungResponse?.data || null);
      setLikesCount(fetchedBlog.likes || 0);
      setIsLiked(currentUserId && fetchedBlog.userLikes ? fetchedBlog.userLikes.includes(currentUserId) : false);
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
    if (isLiked) {
      setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog/${blog?.maBlog}/unlike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(currentUserId),
      });

      if (!response.ok) throw new Error("Failed to like blog");

      const updatedBlog = await response.json();
      
      setLikesCount(updatedBlog.likes);
      setIsLiked(true);
      toast.success("Đã bỏ thích bài viết!");
      window.location.reload();
    } catch (error) {
      console.error("Error liking blog:", error);
      toast.error("Có lỗi xảy ra khi thích bài viết!");
    } finally {
      setLoading(false);
    }
    }
    else
    {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog/${blog?.maBlog}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(currentUserId),
        });

        if (!response.ok) throw new Error("Failed to like blog");

        const updatedBlog = await response.json();
        
        setLikesCount(updatedBlog.likes);
        console.log(likesCount)
        setIsLiked(true);
        toast.success("Đã thích bài viết!");
      } catch (error) {
        console.error("Error liking blog:", error);
        toast.error("Có lỗi xảy ra khi thích bài viết!");
      } finally {
        setLoading(false);
      }
    }   
  };

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}/blog/${slug}`;
    const shareText = blog?.tieuDe || "Xem bài viết này!";

    switch (platform) {
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        toast.success("Đã sao chép liên kết!");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "_blank");
        break;
      case "messenger":
        window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID`, "_blank");
        break;
      case "telegram":
        window.open(`https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
        break;
      default:
        break;
    }
    setIsShareOpen(false);
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
          <div className="flex items-center gap-4">
      <button
        onClick={handleLike}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          isLiked ? "bg-red-600 text-white hover:bg-green-400" : "bg-blue-500 text-white hover:bg-blue-600"
        )}
        aria-label="Like this blog"
      >
        <Heart className="w-5 h-5" />
        <span>{loading || isLiked ? "Bỏ Thích" : "Thích"}</span>
      </button>
            <button
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300"
              aria-label="Share this blog"
            >
              <ShareIcon />
              <span>Chia Sẻ</span>
            </button>
            <span>Số Lượt Thích: ({likesCount})</span>
            {isShareOpen && (
              <div className="absolute right-4 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleShare("copy")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Facebook className="w-4 h-4" /> Facebook
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" /> Twitter
                </button>
                <button
                  onClick={() => handleShare("telegram")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Telegram
                </button>
              </div>
            )}
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
            className="prose prose-sm sm:prose lg:prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.noiDung) }}
          />

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div>
              <span>Người tạo: {nguoiDung?.hoTen || blog.maNguoiDung}</span>
              {nguoiDung?.vaiTro && (
                <span
                  className={`ml-2 px-2 py-1 rounded text-white ${roleBackground}`}
                  aria-label={`User role: ${roleText}`}
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
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {tagMap[tag] || tag}
                </span>
              ))}
            </div>
          )}

          <Comments entityId={blog.maBlog} type="blog" />
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogDetailComponent;