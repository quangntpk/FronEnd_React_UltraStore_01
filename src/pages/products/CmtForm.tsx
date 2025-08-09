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

interface CmtFormProps {
  productId: string;
  orderId: string;
  onAddComment: (
    orderId: string,
    productId: string,
    content: string,
    rating: number,
    image?: string,
    imageDescription?: string
  ) => Promise<boolean>;
}

const CmtForm = ({ productId, orderId, onAddComment }: CmtFormProps) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.noiDungBinhLuan || newComment.danhGia < 1 || newComment.danhGia > 5) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng nhập nội dung bình luận và chọn đánh giá từ 1 đến 5 sao!",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onAddComment(
        orderId,
        productId,
        newComment.noiDungBinhLuan,
        newComment.danhGia,
        newComment.hinhAnh || undefined,
        newComment.hinhAnh ? newComment.moTaHinhAnh : undefined
      );

      if (success) {
        setNewComment({ noiDungBinhLuan: "", danhGia: 0, hinhAnh: "", moTaHinhAnh: "" });
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Bình luận của bạn đã được ghi lại và đang chờ duyệt!",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Có lỗi xảy ra khi gửi bình luận!",
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
        <form onSubmit={handleSubmit} className="space-y-4 font-roboto">
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
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Label htmlFor="file-upload" className="cursor-pointer">
              {newComment.hinhAnh ? (
                <div className="relative w-32 h-32 mx-auto">
                  <img
                    src={`data:image/jpeg;base64,${newComment.hinhAnh}`}
                    alt="Uploaded"
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    onClick={() => setNewComment({ ...newComment, hinhAnh: "", moTaHinhAnh: "" })}
                  >
                    <IoClose className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">Kéo và thả hình ảnh vào đây hoặc nhấp để chọn</p>
                  <p className="text-xs text-gray-400 mt-1">Hỗ trợ: JPG, PNG</p>
                </div>
              )}
            </Label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              <IoAddCircleOutline className="h-4 w-4 mr-2" />
              {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CmtForm;