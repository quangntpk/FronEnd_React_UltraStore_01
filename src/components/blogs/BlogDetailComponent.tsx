import { useState, useEffect, useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Heart, MessageCircle, ChevronDown, Eye, Calendar, User, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { BlogCard, NguoiDung, Blog } from "./BlogList";

// Interfaces (reused from BlogList)
interface Comment {
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

const defaultImageUrl = "https://via.placeholder.com/150";

// Hàm tách nội dung chữ và hình ảnh
const extractTextAndImages = (htmlContent: string): { textContent: string; images: string[] } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(DOMPurify.sanitize(htmlContent, { ADD_TAGS: ["img"], ADD_ATTR: ["src"] }), "text/html");
  
  const textNodes: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      const text = node.textContent?.trim();
      if (text) textNodes.push(text);
    } else if (node.nodeType === 1 && node.nodeName !== "IMG") {
      node.childNodes.forEach(walk);
    }
  };
  walk(doc.body);
  const textContent = textNodes.join(" ").trim();
  const images = Array.from(doc.querySelectorAll("img")).map((img) => img.src);

  return { textContent, images };
};

// Comments Component
const Comments = memo(({ entityId, type }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [sortOption, setSortOption] = useState<"newest" | "mostLiked">("newest");
  const [showAllComments, setShowAllComments] = useState(false);

  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.maNguoiDung;

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      ["image"],
      ["clean"],
    ],
  };

  const handleImageUpload = useCallback((quill: any) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const range = quill.getSelection() || quill.getSelection(true);
          quill.insertEmbed(range.index, "image", reader.result);
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  useEffect(() => {
    const quill = (document.querySelector(".quill") as any)?.quill;
    if (quill) {
      quill.getModule("toolbar").addHandler("image", () => handleImageUpload(quill));
    }
  }, [handleImageUpload]);

  const fetchComments = useCallback(async () => {
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
        throw new Error(
          commentResponse.status === 404
            ? "Không tìm thấy bình luận cho bài viết này."
            : "Lỗi khi tải bình luận"
        );
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
      console.error("Lỗi khi tải bình luận:", err);
      toast.error((err as Error).message || "Có lỗi xảy ra khi tải bình luận!");
    } finally {
      setIsLoading(false);
    }
  }, [entityId, type, sortOption, currentUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = useCallback(async () => {
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
      noiDungBinhLuan: DOMPurify.sanitize(newComment, { ADD_TAGS: ["img"], ADD_ATTR: ["src"] }),
      ngayBinhLuan: new Date().toISOString(),
      trangThai: 0,
      soTimBinhLuan: 0,
    };

    const tempComment = {
      ...payload,
      maBinhLuan: Date.now(),
      hinhAnh: userData?.hinhAnh || defaultImageUrl,
      hoTen: userData?.hoTen,
    };

    setComments((prev) => [tempComment, ...prev.filter((c) => c.maBinhLuan !== tempComment.maBinhLuan)]);
    setNewComment("");
    setIsActionLoading(true);

    try {
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
        throw new Error(errorData.message || "Không thể thêm bình luận");
      }

      toast.success("Bình luận đã được gửi và chờ duyệt!");
      await fetchComments();
    } catch (err) {
      console.error("Lỗi khi thêm bình luận:", err);
      setComments((prev) => prev.filter((c) => c.maBinhLuan !== tempComment.maBinhLuan));
      toast.error((err as Error).message || "Có lỗi xảy ra khi thêm bình luận!");
    } finally {
      setIsActionLoading(false);
    }
  }, [currentUserId, entityId, newComment, fetchComments]);

  const handleDeleteComment = useCallback(async (maBinhLuan: number) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để xóa bình luận!");
      return;
    }

    setCommentToDelete(maBinhLuan);
    setIsConfirmModalOpen(true);
  }, [currentUserId]);

  const confirmDeleteComment = useCallback(async () => {
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
      console.error("Lỗi khi xóa bình luận:", err);
      toast.error((err as Error).message || "Có lỗi xảy ra khi xóa bình luận!");
    } finally {
      setIsConfirmModalOpen(false);
      setCommentToDelete(null);
      setIsActionLoading(false);
    }
  }, [commentToDelete, fetchComments]);

  const handleLikeComment = useCallback(async (maBinhLuan: number) => {
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
      console.error("Lỗi khi cập nhật trạng thái thích:", err);
      toast.error((err as Error).message || "Có lỗi xảy ra khi cập nhật trạng thái thích!");
    } finally {
      setIsActionLoading(false);
    }
  }, [currentUserId, likedComments, sortOption, type, entityId]);

  // Lọc chỉ các bình luận đã được duyệt (trangThai === 1) để hiển thị
  const displayedComments = showAllComments
    ? comments.filter((c) => c.trangThai === 1)
    : comments.filter((c) => c.trangThai === 1).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Toaster position="top-right" />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteComment}
      />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          Bình Luận ({comments.filter((c) => c.trangThai === 1).length})
        </h2>
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as "newest" | "mostLiked")}
            className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            aria-label="Sắp xếp bình luận"
          >
            <option value="newest">Mới nhất</option>
            <option value="mostLiked">Nhiều thích nhất</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      {comments.some((c) => c.trangThai === 0 && c.maNguoiDung === currentUserId) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-700">⏳ Bình luận của bạn đang chờ duyệt.</p>
        </div>
      )}

      <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
            <p className="mt-2 text-gray-600">Đang tải bình luận...</p>
          </div>
        ) : displayedComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Chưa có bình luận nào.</p>
            <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          displayedComments.map((comment) => {
            const { textContent, images } = extractTextAndImages(comment.noiDungBinhLuan || "Chưa cập nhật");
            return (
              <div
                key={comment.maBinhLuan}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <img
                      src={comment.hinhAnh || defaultImageUrl}
                      alt={`Ảnh đại diện của ${comment.hoTen || comment.maNguoiDung}`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.src = defaultImageUrl)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {comment.hoTen || comment.maNguoiDung}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(comment.ngayBinhLuan).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      {comment.maNguoiDung === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.maBinhLuan)}
                          className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 p-1 rounded-md hover:bg-red-50"
                          aria-label="Xóa bình luận"
                          disabled={isActionLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed mb-3" style={{ whiteSpace: "pre-line" }}>
                      {textContent || "Chưa cập nhật"}
                    </div>
                    {images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((src, index) => (
                          <img
                            key={index}
                            src={src}
                            alt={`Hình ảnh bình luận ${index + 1}`}
                            className="w-48 h-auto object-contain rounded"
                            style={{ maxWidth: "225px" }}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              console.warn(`Không thể tải hình ảnh bình luận ${index + 1}`);
                              e.currentTarget.src = defaultImageUrl;
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleLikeComment(comment.maBinhLuan)}
                        className="flex items-center gap-2 text-gray-500 hover:text-purple-600 disabled:opacity-50 transition-colors duration-200"
                        aria-label={likedComments.has(comment.maBinhLuan) ? "Bỏ thích bình luận" : "Thích bình luận"}
                        disabled={isActionLoading}
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4 transition-colors duration-200",
                            likedComments.has(comment.maBinhLuan)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400 hover:text-red-400"
                          )}
                        />
                        <span className="text-sm font-medium">{comment.soTimBinhLuan}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {comments.filter((c) => c.trangThai === 1).length > 3 && !showAllComments && (
        <button
          onClick={() => setShowAllComments(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
          aria-label="Xem thêm bình luận"
        >
          <Eye className="w-4 h-4" />
          Xem thêm bình luận
        </button>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <ReactQuill
            value={newComment}
            onChange={setNewComment}
            modules={quillModules}
            placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
            className="bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-500"
            readOnly={isActionLoading}
          />
          <button
            onClick={handleAddComment}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            disabled={isActionLoading || !newComment.trim()}
            aria-label="Gửi bình luận"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            {isActionLoading ? "Đang gửi..." : "Gửi Bình Luận"}
          </button>
        </div>
      </div>
    </div>
  );
});

// Confirm Modal Component
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm" role="dialog" aria-labelledby="confirm-modal-title">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-96 transform transition-all duration-200">
        <h3 id="confirm-modal-title" className="text-lg font-semibold mb-4 text-gray-800">Xác nhận xóa</h3>
        <p className="mb-6 text-gray-600">Bạn có chắc muốn xóa bình luận này không? Hành động này không thể hoàn tác.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            aria-label="Hủy xóa bình luận"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            aria-label="Xác nhận xóa bình luận"
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

// Blog Detail Component
export const BlogDetailComponent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [nguoiDung, setNguoiDung] = useState<NguoiDung | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [nguoiDungs, setNguoiDungs] = useState<{ [key: string]: NguoiDung | null }>({});
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const isMobile = useIsMobile();
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.maNguoiDung;

  const fetchBlogAndRelated = useCallback(async () => {
    if (!slug) {
      toast.error("Slug không hợp lệ!");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Lấy bài viết chính
      const blogResponse = await axios.get<Blog>(`${import.meta.env.VITE_API_URL}/api/Blog/slug/${slug}`);
      const fetchedBlog = blogResponse.data;
      setBlog(fetchedBlog);
      setLikesCount(fetchedBlog.likes || 0);
      setIsLiked(currentUserId && fetchedBlog.userLikes ? fetchedBlog.userLikes.includes(currentUserId) : false);

      // Lấy thông tin người dùng cho bài viết chính
      let nguoiDungResponse = null;
      if (fetchedBlog.maNguoiDung) {
        nguoiDungResponse = await axios.get<NguoiDung>(`${import.meta.env.VITE_API_URL}/api/NguoiDung/${fetchedBlog.maNguoiDung}`).catch(() => null);
      }
      setNguoiDung(nguoiDungResponse?.data || null);

      // Lấy tất cả bài viết để tìm bài viết liên quan
      const allBlogsResponse = await axios.get<Blog[]>(`${import.meta.env.VITE_API_URL}/api/Blog`);
      const allBlogs = allBlogsResponse.data.filter(b => b.isPublished && b.maBlog !== fetchedBlog.maBlog && b.chuDe === fetchedBlog.chuDe);
      setRelatedBlogs(allBlogs.slice(0, 5)); // Giới hạn 5 bài viết liên quan

      // Lấy thông tin người dùng cho bài viết liên quan
      const uniqueMaNguoiDungs = [...new Set(allBlogs.map(blog => blog.maNguoiDung))];
      const nguoiDungPromises = uniqueMaNguoiDungs.map(maNguoiDung =>
        axios.get<NguoiDung>(`${import.meta.env.VITE_API_URL}/api/NguoiDung/${maNguoiDung}`).catch(() => null)
      );
      const nguoiDungResponses = await Promise.all(nguoiDungPromises);
      const nguoiDungMap = uniqueMaNguoiDungs.reduce((acc, maNguoiDung, index) => {
        acc[maNguoiDung] = nguoiDungResponses[index]?.data || null;
        return acc;
      }, {} as { [key: string]: NguoiDung | null });
      setNguoiDungs(nguoiDungMap);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error("Không thể tải bài viết hoặc bài viết liên quan. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [slug, currentUserId]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để thích bài viết!");
      return;
    }

    setIsLikeLoading(true);
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
      console.error("Lỗi khi cập nhật trạng thái thích:", error);
      toast.error((error as Error).message || "Có lỗi xảy ra khi cập nhật trạng thái thích!");
    } finally {
      setIsLikeLoading(false);
    }
  }, [currentUserId, isLiked, blog]);

  useEffect(() => {
    fetchBlogAndRelated();
  }, [fetchBlogAndRelated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500 mb-4" />
          <p className="text-gray-600 text-lg">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Không tìm thấy bài viết</h3>
          <p className="text-gray-600">Bài viết không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(blog.ngayTao).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roleMap: Record<number, { text: string; background: string; textColor: string }> = {
    1: { text: "Admin", background: "bg-emerald-100", textColor: "text-emerald-700" },
    2: { text: "Nhân Viên", background: "bg-blue-100", textColor: "text-blue-700" },
    0: { text: "Khách", background: "bg-gray-100", textColor: "text-gray-700" },
  };
  const { text: roleText, background: roleBackground, textColor: roleTextColor } = roleMap[nguoiDung?.vaiTro || 0];

  const tagMap: Record<string, string> = {
    "san-pham": "Giới Thiệu Sản Phẩm",
    "phoi-do": "Gợi Ý Phối Đồ",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Helmet>
        <meta name="description" content={blog.metaDescription || "Bài viết chi tiết"} />
        <meta property="og:title" content={blog.metaTitle || blog.tieuDe} />
        <meta property="og:description" content={blog.metaDescription || ""} />
        {blog.hinhAnh && <meta property="og:image" content={`data:image/jpeg;base64,${blog.hinhAnh}`} />}
      </Helmet>

      <Toaster position="top-right" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Blog Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              {/* Blog Title */}
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
                  {blog.tieuDe}
                </h1>
              </div>

              {/* Featured Image */}
              {blog.hinhAnh && (
                <div className="relative">
                  <img
                    src={`data:image/jpeg;base64,${blog.hinhAnh}`}
                    alt={blog.moTaHinhAnh || blog.tieuDe}
                    className="w-full h-auto max-h-96 object-contain"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.src = defaultImageUrl)}
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8">
                <div
                  className="prose prose-sm sm:prose lg:prose-lg max-w-none blog-content w-full"
                  dangerouslySetInnerHTML={{ 
                    __html: blog.noiDung ? DOMPurify.sanitize(blog.noiDung, { ADD_TAGS: ["img"], ADD_ATTR: ["style", "src"] }) : "Chưa cập nhật"
                  }}
                  aria-label="Nội dung bài viết"
                />
              </div>

              {/* Blog Info (Author, Date, Tags, Like Button) */}
              <div className="p-6 sm:p-8 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {nguoiDung?.hoTen || blog.maNguoiDung}
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{formattedDate}</span>
                        </div>
                      </div>
                    </div>
                    {nguoiDung?.vaiTro !== undefined && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleBackground} ${roleTextColor}`}>
                        {roleText}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleLike}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md",
                      isLiked 
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600" 
                        : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                    )}
                    aria-label={isLiked ? "Bỏ thích bài viết" : "Thích bài viết"}
                    disabled={isLikeLoading}
                  >
                    {isLikeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Heart className={cn("w-5 h-5", isLiked ? "fill-current" : "")} />
                    )}
                    <span>{isLiked ? "Đã thích" : "Thích"}</span>
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                      {likesCount}
                    </span>
                  </button>
                </div>

                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {tagMap[tag] || tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <Comments entityId={blog.maBlog} type="blog" />
          </div>

          {/* Related Blogs Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Bài viết liên quan</h2>
              {relatedBlogs.length === 0 ? (
                <p className="text-gray-500 text-sm">Không có bài viết liên quan.</p>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {relatedBlogs.map((relatedBlog) => (
                    <BlogCard
                      key={relatedBlog.maBlog}
                      post={relatedBlog}
                      nguoiDung={nguoiDungs[relatedBlog.maNguoiDung] || null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .blog-content {
          color: #374151;
          line-height: 1.7;
        }
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
          color: #1f2937;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .blog-content p {
          margin-bottom: 1.5rem;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 2rem auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .blog-content blockquote {
          border-left: 4px solid #8b5cf6;
          padding-left: 1rem;
          margin: 1.5rem 0;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          font-style: italic;
        }
        .blog-content ul, .blog-content ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        .blog-content a {
          color: #8b5cf6;
          text-decoration: underline;
          transition: color 0.2s;
        }
        .blog-content a:hover {
          color: #7c3aed;
        }
        .blog-content code {
          background: #f1f5f9;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #e11d48;
        }
        .blog-content pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .blog-content pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .blog-content th, .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        .blog-content th {
          background: #f9fafb;
          font-weight: 600;
        }
        .ql-size-small {
          font-size: 0.75rem !important;
        }
        .ql-size-normal {
          font-size: 1rem !important;
        }
        .ql-size-large {
          font-size: 1.5rem !important;
        }
        .ql-size-huge {
          font-size: 2.5rem !important;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .quill {
          background: white;
          border-radius: 0.5rem;
        }
        .ql-toolbar.ql-snow {
          border: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
        }
        .ql-container.ql-snow {
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .ql-editor {
          min-height: auto;
          max-height: none;
          overflow-y: visible;
          color: #374151;
        }
        .ql-editor::before {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default BlogDetailComponent;