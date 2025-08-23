import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Heart, Star, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";

// Default image URL
const defaultImageUrl = "https://via.placeholder.com/150";

const Notification = ({ message, type, onClose }) => {
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
        className="absolute top-1 right-1 text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-roboto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-64">
        <h3 className="text-lg font-medium mb-4">Xác nhận xóa</h3>
        <p className="mb-6">Bạn có chắc muốn xóa bình luận này không?</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Có
          </button>
        </div>
      </div>
    </div>
  );
};

// Hàm tách nội dung chữ và hình ảnh
const extractTextAndImages = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(DOMPurify.sanitize(htmlContent, { ADD_TAGS: ["img"], ADD_ATTR: ["src"] }), "text/html");
  
  // Lấy tất cả nội dung chữ
  const textNodes = [];
  const walk = (node) => {
    if (node.nodeType === 3) { // Text node
      textNodes.push(node.textContent.trim());
    } else if (node.nodeType === 1 && node.tagName !== "IMG") {
      node.childNodes.forEach(walk);
    }
  };
  walk(doc.body);
  const textContent = textNodes.join(" ").trim();

  // Lấy tất cả hình ảnh
  const images = Array.from(doc.querySelectorAll("img")).map((img) => img.src);

  return { textContent, images };
};

const Comments = ({ productId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [likedComments, setLikedComments] = useState(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  const showNotification = (message, type) => setNotification({ message, type });
  const closeNotification = () => setNotification(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const baseProductId = productId.length >= 6 ? productId.substring(0, 6) : null;
        const commentResponse = await fetch("https://bicacuatho.azurewebsites.net/api/Comment/list");
        if (!commentResponse.ok) throw new Error("Failed to fetch comments");
        const commentData = await commentResponse.json();
        const productComments = commentData
          .filter((comment) => 
            (baseProductId && comment.maSanPham && comment.maSanPham !== "string" && comment.maSanPham.substring(0, 6) === baseProductId && comment.trangThai === 1) ||
            ((comment.maSanPham === null || comment.maSanPham === "string") && comment.maCombo !== null && comment.trangThai === 1)
          )
          .map((comment) => ({
            ...comment,
            soTimBinhLuan: comment.soTimBinhLuan || 0,
            tenSanPham: comment.maSanPham && comment.maSanPham !== "string" ? comment.tenSanPham : comment.tenCombo || `Combo ${comment.maCombo}`,
          }))
          .sort((a, b) => b.soTimBinhLuan - a.soTimBinhLuan);

        if (productComments.length > 0) {
          const totalRating = productComments.reduce((sum, comment) => sum + (comment.danhGia || 0), 0);
          setAverageRating(totalRating / productComments.length);
        } else {
          setAverageRating(0);
        }

        const userData = JSON.parse(localStorage.getItem("user"));
        const currentUserId = userData?.maNguoiDung;
        if (currentUserId) {
          const likedCommentsKey = `likedComments_${currentUserId}`;
          const storedLikedComments = JSON.parse(localStorage.getItem(likedCommentsKey)) || [];
          setLikedComments(new Set(storedLikedComments));
        }

        setComments(productComments);
      } catch (err) {
        console.error("Error fetching comments:", err);
        showNotification("Có lỗi xảy ra khi tải bình luận!", "error");
        setAverageRating(0);
      }
    };

    fetchComments();
  }, [productId]);

  const handleAddComment = async () => {
    if (!newComment || rating < 1 || rating > 5) {
      showNotification("Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!", "error");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user"));
    const maNguoiDung = userData?.maNguoiDung;
    const hoTen = userData?.hoTen;
    const hinhAnh = userData?.hinhAnh;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập trước khi thêm bình luận!", "error");
      return;
    }

    const commentData = {
      maSanPham: productId.length >= 6 ? productId.substring(0, 6) : null,
      maCombo: productId.length === 4 ? parseInt(productId, 10) : null,
      maNguoiDung: maNguoiDung,
      noiDungBinhLuan: newComment,
      danhGia: rating,
      ngayBinhLuan: new Date().toISOString(),
      trangThai: 0,
      soTimBinhLuan: 0,
      hinhAnh: hinhAnh || defaultImageUrl,
    };

    try {
      const response = await fetch("https://bicacuatho.azurewebsites.net/api/Comment/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      setNewComment("");
      setRating(0);
      showNotification("Bình luận của bạn đã được ghi lại và chờ duyệt!", "success");
    } catch (err) {
      console.error("Error adding comment:", err);
      showNotification("Có lỗi xảy ra khi thêm bình luận!", "error");
    }
  };

  const handleDeleteComment = (maBinhLuan) => {
    setCommentToDelete(maBinhLuan);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/Comment/delete/${commentToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      setComments((prevComments) => {
        const updatedComments = prevComments.filter((comment) => comment.maBinhLuan !== commentToDelete);
        if (updatedComments.length > 0) {
          const totalRating = updatedComments.reduce((sum, comment) => sum + (comment.danhGia || 0), 0);
          setAverageRating(totalRating / updatedComments.length);
        } else {
          setAverageRating(0);
        }
        return updatedComments;
      });
      showNotification("Xóa bình luận thành công!", "success");
    } catch (err) {
      console.error("Error deleting comment:", err);
      showNotification("Có lỗi xảy ra khi xóa bình luận!", "error");
    } finally {
      setIsConfirmModalOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleLikeComment = async (maBinhLuan) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const maNguoiDung = userData?.maNguoiDung;

    if (!maNguoiDung) {
      showNotification("Vui lòng đăng nhập để thích bình luận!", "error");
      return;
    }

    const isLiked = likedComments.has(maBinhLuan);
    const endpoint = isLiked
      ? `https://bicacuatho.azurewebsites.net/api/Comment/Unlike/${maBinhLuan}`
      : `https://bicacuatho.azurewebsites.net/api/Comment/Like/${maBinhLuan}`;

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
        const likedCommentsKey = `likedComments_${maNguoiDung}`;
        localStorage.setItem(likedCommentsKey, JSON.stringify([...newSet]));
        return newSet;
      });

      showNotification(isLiked ? "Đã bỏ thích bình luận!" : "Đã thích bình luận!", "success");
    } catch (err) {
      console.error("Error updating like status:", err);
      showNotification("Có lỗi xảy ra khi cập nhật số tim!", "error");
    }
  };

  const currentUserId = JSON.parse(localStorage.getItem("user"))?.maNguoiDung;

  return (
    <div className="mt-12 comments">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteComment}
      />
      <h2 className="text-2xl font-medium mb-6">Đánh Giá</h2>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">Đánh giá trung bình:</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "w-5 h-5",
                  index < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-lg font-medium">{averageRating.toFixed(1)} / 5</span>
        </div>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bình luận nào.</p>
        ) : (
          comments.map((comment) => {
            const { textContent, images } = extractTextAndImages(comment.noiDungBinhLuan || "Chưa cập nhật");
            return (
              <div
                key={comment.maBinhLuan}
                className="bg-white p-4 rounded-lg shadow-md flex items-start gap-4"
              >
                <div className="flex-shrink-0">
                  <img
                    src={comment.hinhAnh || defaultImageUrl}
                    alt={`Ảnh của ${comment.hoTen || comment.maNguoiDung}`}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                    onError={(e) => {
                      console.warn(`Failed to load image for comment ${comment.maBinhLuan}, using default`);
                      (e.target as HTMLImageElement).src = defaultImageUrl;
                    }}
                  />
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            "w-4 h-4",
                            index < comment.danhGia ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    {/* Hiển thị nội dung chữ */}
                    <div className="text-gray-800 line-clamp-3 mb-2" style={{ whiteSpace: "pre-line" }}>
                      {textContent || "Chưa cập nhật"}
                    </div>
                    {/* Hiển thị hình ảnh (nếu có) */}
                    {images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((src, index) => (
                          <img
                            key={index}
                            src={src}
                            alt={`Hình ảnh bình luận ${index + 1}`}
                            className="w-48 h-auto object-contain rounded"
                            style={{ maxWidth: "225px" }}
                            onError={(e) => {
                              console.warn(`Failed to load comment image ${index + 1}`);
                              (e.target as HTMLImageElement).src = defaultImageUrl;
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Bởi {comment.hoTen || comment.maNguoiDung} -{" "}
                      {new Date(comment.ngayBinhLuan).toLocaleDateString()} -{" "}
                      {comment.maSanPham && comment.maSanPham !== "string" ? `Sản phẩm: ${comment.tenSanPham}` : `Combo: ${comment.tenCombo || comment.maCombo}`}
                    </p>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => handleLikeComment(comment.maBinhLuan)}
                        className="flex items-center gap-1"
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
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* <div className="mt-6">
        <div className="flex items-center mb-4">
          <span className="mr-2">Đánh giá:</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "w-6 h-6 cursor-pointer",
                  index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
                onClick={() => setRating(index + 1)}
              />
            ))}
          </div>
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận của bạn..."
          className="w-full p-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-roboto"
          rows={4}
        />
        <button
          onClick={handleAddComment}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-roboto"
        >
          Gửi Bình Luận
        </button>
      </div> */}
      <style>{`
        .comments .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          whiteSpace: pre-line;
        }
      `}</style>
    </div>
  );
};

export default Comments;