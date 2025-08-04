import { useState } from "react";
import { Star } from "lucide-react";
import { IoAddCircleOutline, IoClose } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Swal from "sweetalert2";

interface Comment {
  maSanPham: string;
  maNguoiDung: string;
  noiDungBinhLuan: string;
  danhGia: number;
  ngayBinhLuan: string;
  trangThai: number;
  soTimBinhLuan: number;
  hinhAnh?: string;
  moTaHinhAnh?: string;
}

interface CmtFormProps {
  productId: string;
  orderId: string;
}

const CmtForm = ({ productId, orderId }: CmtFormProps) => {
  const [newComment, setNewComment] = useState({
    noiDungBinhLuan: "",
    danhGia: 0,
    hinhAnh: "",
    moTaHinhAnh: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const generateMoTaHinhAnh = (noiDung: string): string => {
    return `Hình ảnh cho đánh giá: ${noiDung.replace(/<[^>]+>/g, "").slice(0, 50)}...`;
  };

  const handleImageChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn một tệp hình ảnh!",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1];
        setNewComment({
          ...newComment,
          hinhAnh: base64String,
          moTaHinhAnh: generateMoTaHinhAnh(newComment.noiDungBinhLuan),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageChange(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageChange(file);
  };

  const handleSubmit = async () => {
    if (!newComment.noiDungBinhLuan || newComment.danhGia < 1 || newComment.danhGia > 5) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!",
      });
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const maNguoiDung = userData?.maNguoiDung;

    if (!maNguoiDung) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng đăng nhập trước khi thêm bình luận!",
      });
      return;
    }

    const commentData: Comment = {
      maSanPham: productId,
      maNguoiDung,
      noiDungBinhLuan: newComment.noiDungBinhLuan,
      danhGia: newComment.danhGia,
      ngayBinhLuan: new Date().toISOString(),
      trangThai: 0,
      soTimBinhLuan: 0,
      hinhAnh: newComment.hinhAnh || "",
      moTaHinhAnh: newComment.hinhAnh ? newComment.moTaHinhAnh : "",
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5261/api/Comment/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...commentData, maDonHang: orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể gửi bình luận!");
      }

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Bình luận của bạn đã được ghi lại và đang chờ duyệt!",
        timer: 3000,
        showConfirmButton: false,
      });

      // Reset form
      setNewComment({ noiDungBinhLuan: "", danhGia: 0, hinhAnh: "", moTaHinhAnh: "" });

      // Lưu thời gian bình luận và danh sách sản phẩm đã bình luận vào localStorage
      const commentKey = `${orderId}-${productId}`;
      const likedCommentsKey = `likedComments_${maNguoiDung}`;
      const storedCommentedProducts = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as string[];
      const updatedCommentedProducts = [...new Set([...storedCommentedProducts, commentKey])];
      localStorage.setItem(likedCommentsKey, JSON.stringify(updatedCommentedProducts));
      localStorage.setItem(`lastCommentTime_${maNguoiDung}`, Date.now().toString());
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      let errorMessage = "Có lỗi xảy ra khi gửi bình luận!";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!";
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMessage,
        }).then(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        });
      } else if (error.message) {
        errorMessage = error.message;
      }
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 shadow-lg rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Viết bình luận</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 font-roboto">
          <div>
            <Label className="block text-sm font-semibold text-gray-700">Đánh giá</Label>
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "w-6 h-6 cursor-pointer transition-colors",
                    index < newComment.danhGia ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                  )}
                  onClick={() => setNewComment({ ...newComment, danhGia: index + 1 })}
                />
              ))}
            </div>
          </div>
       
          <div>
            <Label className="block text-sm font-semibold text-gray-700">Nội dung bình luận</Label>
            <ReactQuill
              value={newComment.noiDungBinhLuan}
              onChange={(content) => setNewComment({ ...newComment, noiDungBinhLuan: content })}
              modules={quillModules}
              className="h-72 rounded-lg mb-10"
            />
          </div>
          <div className="flex justify-end">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <IoAddCircleOutline className="h-4 w-4 mr-2" />
              {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CmtForm;