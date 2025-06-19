import { useState, useEffect } from "react";
import { FaEye, FaTrashAlt, FaEdit, FaEllipsisV } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, RefreshCw, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from "react-hot-toast";

// Định nghĩa interface cho Blog
interface Blog {
  maBlog: number | null;
  maNguoiDung: string;
  hoTen?: string | null;
  ngayTao: string;
  ngayCapNhat?: string;
  tieuDe: string;
  noiDung: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  hinhAnh?: string | null;
  moTaHinhAnh?: string;
  isPublished: boolean;
  tags?: string[];
}

// Hàm định dạng ngày giờ
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const Blogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [newBlog, setNewBlog] = useState<Blog>({
    maBlog: null,
    maNguoiDung: "",
    tieuDe: "",
    noiDung: "",
    ngayTao: new Date().toISOString().split("T")[0], // Đặt ngày tạo mặc định là hôm nay
    slug: "",
    metaTitle: "",
    metaDescription: "",
    hinhAnh: "",
    moTaHinhAnh: "",
    isPublished: false,
    tags: []
  });
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [isDraggingCreate, setIsDraggingCreate] = useState(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 8;

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog`);
      if (!response.ok) throw new Error("Không thể lấy dữ liệu blog");
      const data: Blog[] = await response.json();
      setBlogs(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách blog:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách blog.");
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Blog/${blogToDelete.maBlog}`,
        {
          method: "DELETE",
        }
      );
      if (response.status === 204) {
        setBlogs(blogs.filter((blog) => blog.maBlog !== blogToDelete.maBlog));
        setOpenDeleteModal(false);
        setBlogToDelete(null);
        toast.success("Xóa blog thành công!");
      } else if (response.status === 404) {
        throw new Error("Blog không tồn tại");
      } else {
        throw new Error("Không thể xóa blog");
      }
    } catch (error) {
      console.error("Lỗi khi xóa blog:", error);
      toast.error("Có lỗi xảy ra khi xóa blog.");
    }
  };

  const createBlog = async () => {
    if (!newBlog.tieuDe || !newBlog.noiDung || !newBlog.maNguoiDung) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog/CreateBlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maNguoiDung: newBlog.maNguoiDung,
          tieuDe: newBlog.tieuDe,
          noiDung: newBlog.noiDung,
          ngayTao: newBlog.ngayTao ? new Date(newBlog.ngayTao).toISOString() : new Date().toISOString(),
          slug: newBlog.slug,
          metaTitle: newBlog.metaTitle,
          metaDescription: newBlog.metaDescription,
          hinhAnh: newBlog.hinhAnh || null,
          moTaHinhAnh: newBlog.moTaHinhAnh,
          isPublished: newBlog.isPublished,
          tags: newBlog.tags
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể thêm blog");
      }

      await fetchBlogs();
      setOpenCreateModal(false);
      setNewBlog({
        maBlog: null,
        maNguoiDung: "",
        tieuDe: "",
        noiDung: "",
        ngayTao: new Date().toISOString().split("T")[0], // Reset về ngày hôm nay
        slug: "",
        metaTitle: "",
        metaDescription: "",
        hinhAnh: "",
        moTaHinhAnh: "",
        isPublished: false,
        tags: []
      });
      toast.success("Thêm blog thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm blog:", error);
      toast.error("Có lỗi xảy ra khi thêm blog.");
    }
  };

  const editBlogSubmit = async () => {
    if (!editBlog) return;

    if (!editBlog.tieuDe || !editBlog.noiDung || !editBlog.maNguoiDung) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog/CreateBlog${editBlog.maBlog}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maBlog: editBlog.maBlog,
          maNguoiDung: editBlog.maNguoiDung,
          tieuDe: editBlog.tieuDe,
          noiDung: editBlog.noiDung,
          ngayTao: new Date(editBlog.ngayTao).toISOString(),
          slug: editBlog.slug,
          metaTitle: editBlog.metaTitle,
          metaDescription: editBlog.metaDescription,
          hinhAnh: editBlog.hinhAnh || null,
          moTaHinhAnh: editBlog.moTaHinhAnh,
          isPublished: editBlog.isPublished,
          tags: editBlog.tags
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể sửa blog");
      }

      await fetchBlogs();
      setOpenEditModal(false);
      setEditBlog(null);
      toast.success("Sửa blog thành công!");
    } catch (error) {
      console.error("Lỗi khi sửa blog:", error);
      toast.error("Có lỗi xảy ra khi sửa blog.");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter((item) =>
    item.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const handleDeleteClick = (blog: Blog) => {
    setBlogToDelete(blog);
    setOpenDeleteModal(true);
  };

  const handleDetailClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setOpenDetailModal(true);
  };

  const handleEditClick = (blog: Blog) => {
    setEditBlog({
      ...blog,
      ngayTao: new Date(blog.ngayTao).toISOString().split("T")[0],
      slug: blog.slug || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      moTaHinhAnh: blog.moTaHinhAnh || "",
      tags: blog.tags || []
    });
    setOpenEditModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewBlog({ ...newBlog, [name]: value });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditBlog({ ...editBlog!, [name]: value });
  };

  // Xử lý kéo thả cho modal thêm
  const handleDragOverCreate = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCreate(true);
  };

  const handleDragLeaveCreate = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCreate(false);
  };

  const handleDropCreate = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCreate(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChangeCreate(file);
    } else {
      toast.error("Vui lòng chọn một tệp hình ảnh!");
    }
  };

  const handleImageChangeCreate = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1];
        setNewBlog({ ...newBlog, hinhAnh: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChangeCreate = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChangeCreate(file);
    } else {
      toast.error("Vui lòng chọn một tệp hình ảnh!");
    }
  };

  // Xử lý kéo thả cho modal sửa
  const handleDragOverEdit = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEdit(true);
  };

  const handleDragLeaveEdit = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEdit(false);
  };

  const handleDropEdit = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEdit(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChangeEdit(file);
    } else {
      toast.error("Vui lòng chọn một tệp hình ảnh!");
    }
  };

  const handleImageChangeEdit = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1];
        setEditBlog({ ...editBlog!, hinhAnh: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChangeEdit(file);
    } else {
      toast.error("Vui lòng chọn một tệp hình ảnh!");
    }
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

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          Quản lý bài viết
        </h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
          size="lg"
          onClick={() => setOpenCreateModal(true)}
        >
          <Plus className="h-5 w-5 mr-2" /> Thêm Blog
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Danh Sách Blog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm blog theo tiêu đề..."
                className="pl-10 w-full bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              onClick={fetchBlogs}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Làm Mới
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 text-lg">Đang tải...</div>
          ) : currentBlogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentBlogs.map((item) => (
                <Card
                  key={item.maBlog}
                  className="hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden bg-white"
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 truncate">
                      {item.tieuDe}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {item.hinhAnh && (
                      <img
                        src={`data:image/jpeg;base64,${item.hinhAnh}`}
                        alt={item.tieuDe}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="text-sm text-gray-600">
                      <strong>ID:</strong> {item.maBlog}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Người tạo:</strong> {item.maNguoiDung}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Ngày tạo:</strong> {formatDateTime(item.ngayTao)}
                    </div>
                    <div className="flex justify-end mt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-gray-320 rounded-lg">
                            <FaEllipsisV className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                          <DropdownMenuItem
                            onClick={() => handleDetailClick(item)}
                            className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
                          >
                            <FaEye className="mr-2 h-4 w-4" />
                            <span>Chi Tiết</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(item)}
                            className="flex items-center text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md"
                          >
                            <FaEdit className="mr-2 h-4 w-4 text-green-500" />
                            <span>Sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item)}
                            className="flex items-center text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md"
                          >
                            <FaTrashAlt className="mr-2 h-4 w-4 text-red-500" />
                            <span>Xóa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-lg">
              Không tìm thấy blog nào phù hợp với tìm kiếm của bạn.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`${
                    currentPage === page
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  } rounded-lg`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Cuối
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal xác nhận xóa */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Xác nhận xóa blog</DialogTitle>
            <DialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa blog này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenDeleteModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
              onClick={deleteBlog}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết blog */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="max-w-5xl rounded-lg shadow-xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Chi Tiết Blog</DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mã Blog</Label>
                  <Input
                    value={selectedBlog.maBlog || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Tiêu Đề</Label>
                  <Input
                    value={selectedBlog.tieuDe || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Người Tạo</Label>
                  <Input
                    value={selectedBlog.maNguoiDung || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Slug</Label>
                  <Input
                    value={selectedBlog.slug || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Ngày Tạo</Label>
                  <Input
                    value={
                      selectedBlog.ngayTao
                        ? formatDateTime(selectedBlog.ngayTao)
                        : "Chưa cập nhật"
                    }
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Hình Ảnh</Label>
                  {selectedBlog.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${selectedBlog.hinhAnh}`}
                      alt={selectedBlog.tieuDe}
                      className="w-32 h-32 object-cover rounded-lg mt-1 border border-gray-200"
                    />
                  ) : (
                    <Input
                      value="Chưa có hình ảnh"
                      disabled
                      className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mô tả hình ảnh (ALT)</Label>
                  <Input
                    value={selectedBlog.moTaHinhAnh || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Nội Dung</Label>
                  <textarea
                    value={selectedBlog.noiDung || "Chưa cập nhật"}
                    disabled
                    className="mt-1 w-full h-40 bg-gray-100 border-gray-300 rounded-lg p-3"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Meta Title</Label>
                  <Input
                    value={selectedBlog.metaTitle || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Meta Description</Label>
                  <Input
                    value={selectedBlog.metaDescription || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Tags</Label>
                  <Input
                    value={selectedBlog.tags?.join(", ") || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublishedDetail"
                    checked={selectedBlog.isPublished}
                    disabled
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded"
                  />
                  <Label htmlFor="isPublishedDetail" className="text-sm font-semibold text-gray-700">
                    Công khai?
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenDetailModal(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal thêm blog */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-5xl rounded-lg shadow-xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Thêm Blog Mới</DialogTitle>
          </DialogHeader>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Mã Người Dùng</Label>
                <Input
                  name="maNguoiDung"
                  type="text"
                  placeholder="Mã người dùng"
                  value={newBlog.maNguoiDung}
                  onChange={handleInputChange}
                  required
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Tiêu Đề</Label>
                <Input
                  name="tieuDe"
                  placeholder="Tiêu đề"
                  value={newBlog.tieuDe}
                  onChange={handleInputChange}
                  required
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Slug</Label>
                <Input
                  name="slug"
                  placeholder="slug-url"
                  value={newBlog.slug}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-4">
              {/* <div>
                <Label className="block text-sm font-semibold text-gray-700">Ngày Tạo</Label>
                <Input
                  name="ngayTao"
                  type="date"
                  placeholder="Ngày tạo"
                  value={newBlog.ngayTao}
                  onChange={handleInputChange}
                  min={today}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div> */}
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Hình Ảnh</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    isDraggingCreate ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
                  }`}
                  onDragOver={handleDragOverCreate}
                  onDragLeave={handleDragLeaveCreate}
                  onDrop={handleDropCreate}
                >
                  {newBlog.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${newBlog.hinhAnh}`}
                      alt="Preview"
                      className="h-24 w-24 mx-auto object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Kéo và thả hình ảnh vào đây hoặc nhấp để chọn
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="fileInputCreate"
                        onChange={handleFileInputChangeCreate}
                      />
                      <label
                        htmlFor="fileInputCreate"
                        className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Chọn tệp
                      </label>
                    </div>
                  )}
                </div>
                {newBlog.hinhAnh && (
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setNewBlog({ ...newBlog, hinhAnh: "" })}
                  >
                    Xóa hình ảnh
                  </Button>
                )}
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Mô tả hình ảnh (ALT)</Label>
                <Input
                  name="moTaHinhAnh"
                  placeholder="Mô tả hình ảnh"
                  value={newBlog.moTaHinhAnh}
                  onChange={handleInputChange}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Nội Dung</Label>
                <textarea
                  name="noiDung"
                  placeholder="Nội dung"
                  value={newBlog.noiDung}
                  onChange={handleInputChange}
                  className="w-full h-48 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Meta Title</Label>
                <Input
                  name="metaTitle"
                  placeholder="Tiêu đề SEO"
                  value={newBlog.metaTitle}
                  onChange={handleInputChange}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Meta Description</Label>
                <Input
                  name="metaDescription"
                  placeholder="Mô tả SEO"
                  value={newBlog.metaDescription}
                  onChange={handleInputChange}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Tags (phân cách bằng dấu phẩy)</Label>
                <Input
                  name="tags"
                  placeholder="seo, marketing, tutorial"
                  value={newBlog.tags?.join(',')}
                  onChange={(e) => setNewBlog({ ...newBlog, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={newBlog.isPublished}
                  onChange={(e) => setNewBlog({ ...newBlog, isPublished: e.target.checked })}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isPublished" className="text-sm font-semibold text-gray-700">
                  Công khai?
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenCreateModal(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={createBlog}
            >
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal sửa blog */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="max-w-5xl rounded-lg shadow-xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Sửa Blog #{editBlog?.maBlog}</DialogTitle>
          </DialogHeader>
          {editBlog && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mã Người Dùng</Label>
                  <Input
                    name="maNguoiDung"
                    type="text"
                    placeholder="Mã người dùng"
                    value={editBlog.maNguoiDung}
                    onChange={handleEditInputChange}
                    required
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Tiêu Đề</Label>
                  <Input
                    name="tieuDe"
                    placeholder="Tiêu đề"
                    value={editBlog.tieuDe}
                    onChange={handleEditInputChange}
                    required
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Slug</Label>
                  <Input
                    name="slug"
                    placeholder="slug-url"
                    value={editBlog.slug}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Ngày Tạo</Label>
                  <Input
                    name="ngayTao"
                    type="date"
                    placeholder="Ngày tạo"
                    value={editBlog.ngayTao}
                    onChange={handleEditInputChange}
                    min={today}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Hình Ảnh</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                      isDraggingEdit ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
                    }`}
                    onDragOver={handleDragOverEdit}
                    onDragLeave={handleDragLeaveEdit}
                    onDrop={handleDropEdit}
                  >
                    {editBlog.hinhAnh ? (
                      <img
                        src={`data:image/jpeg;base64,${editBlog.hinhAnh}`}
                        alt="Preview"
                        className="h-24 w-24 mx-auto object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div>
                        <Upload className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Kéo và thả hình ảnh vào đây hoặc nhấp để chọn
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="fileInputEdit"
                          onChange={handleFileInputChangeEdit}
                        />
                        <label
                          htmlFor="fileInputEdit"
                          className="cursor-pointer text-green-600 hover:text-green-700 font-semibold"
                        >
                          Chọn tệp
                        </label>
                      </div>
                    )}
                  </div>
                  {editBlog.hinhAnh && (
                    <Button
                      variant="outline"
                      className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setEditBlog({ ...editBlog, hinhAnh: "" })}
                    >
                      Xóa hình ảnh
                    </Button>
                  )}
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mô tả hình ảnh (ALT)</Label>
                  <Input
                    name="moTaHinhAnh"
                    placeholder="Mô tả hình ảnh"
                    value={editBlog.moTaHinhAnh}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Nội Dung</Label>
                  <textarea
                    name="noiDung"
                    placeholder="Nội dung"
                    value={editBlog.noiDung}
                    onChange={handleEditInputChange}
                    className="w-full h-48 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Meta Title</Label>
                  <Input
                    name="metaTitle"
                    placeholder="Tiêu đề SEO"
                    value={editBlog.metaTitle}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Meta Description</Label>
                  <Input
                    name="metaDescription"
                    placeholder="Mô tả SEO"
                    value={editBlog.metaDescription}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Tags (phân cách bằng dấu phẩy)</Label>
                  <Input
                    name="tags"
                    placeholder="seo, marketing, tutorial"
                    value={editBlog.tags?.join(",")}
                    onChange={(e) => setEditBlog({ ...editBlog, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublishedEdit"
                    checked={editBlog.isPublished}
                    onChange={(e) => setEditBlog({ ...editBlog, isPublished: e.target.checked })}
                    className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="isPublishedEdit" className="text-sm font-semibold text-gray-700">
                    Công khai?
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenEditModal(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
              onClick={editBlogSubmit}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Blogs;