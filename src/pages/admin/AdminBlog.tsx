
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
  maBlog: number;
  maNguoiDung: string;
  hoTen: string | null;
  ngayTao: string;
  noiDung: string;
  tieuDe: string;
  hinhAnh: string | null;
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
  const [newBlog, setNewBlog] = useState({
    maNguoiDung: "",
    tieuDe: "",
    noiDung: "",
    ngayTao: "",
    hinhAnh: "",
  });
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [isDraggingCreate, setIsDraggingCreate] = useState(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 8;

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5261/api/Blog`);
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
        `http://localhost:5261/api/Blog/${blogToDelete.maBlog}`,
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
      const response = await fetch(`http://localhost:5261/api/Blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maNguoiDung: newBlog.maNguoiDung, // Send as string
          tieuDe: newBlog.tieuDe,
          noiDung: newBlog.noiDung,
          ngayTao: newBlog.ngayTao
            ? new Date(newBlog.ngayTao).toISOString()
            : new Date().toISOString(),
          hinhAnh: newBlog.hinhAnh || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể thêm blog");
      }

      await fetchBlogs();
      setOpenCreateModal(false);
      setNewBlog({
        maNguoiDung: "",
        tieuDe: "",
        noiDung: "",
        ngayTao: "",
        hinhAnh: "",
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
      const response = await fetch(
        `http://localhost:5261/api/Blog/${editBlog.maBlog}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maBlog: editBlog.maBlog,
            maNguoiDung: editBlog.maNguoiDung, // Send as string
            tieuDe: editBlog.tieuDe,
            noiDung: editBlog.noiDung,
            ngayTao: new Date(editBlog.ngayTao).toISOString(),
            hinhAnh: editBlog.hinhAnh || null,
          }),
        }
      );

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
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        </div>
        <Button
          className="bg-purple hover:bg-purple-medium"
          variant="outline"
          size="sm"
          onClick={() => setOpenCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm Blog
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Danh Sách Blog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm blog theo tiêu đề..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 self-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={fetchBlogs}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm Mới
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Đang tải...</div>
          ) : currentBlogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentBlogs.map((item) => (
                <Card
                  key={item.maBlog}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg truncate">
                      {item.tieuDe}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {item.hinhAnh && (
                      <img
                        src={`data:image/jpeg;base64,${item.hinhAnh}`}
                        alt={item.tieuDe}
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                    <div>
                      <strong>ID:</strong> {item.maBlog}
                    </div>
                    <div>
                      <strong>Người tạo:</strong> {item.maNguoiDung}
                    </div>
                    <div>
                      <strong>Ngày tạo:</strong> {formatDateTime(item.ngayTao)}
                    </div>
                    <div className="flex justify-end mt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FaEllipsisV />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDetailClick(item)}
                            className="flex items-center text-gray-700 hover:text-blue-600"
                          >
                            <FaEye className="mr-2 h-4 w-4" />
                            <span>Chi Tiết</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(item)}
                            className="flex items-center text-gray-700 hover:text-green-600"
                          >
                            <FaEdit className="mr-2 h-4 w-4 text-green-500" />
                            <span>Sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item)}
                            className="flex items-center text-gray-700 hover:text-red-600"
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
            <div className="text-center py-6 text-muted-foreground">
              Không tìm thấy blog nào phù hợp với tìm kiếm của bạn.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
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
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
              <Button
                variant="outline"
                size="sm"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa blog</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa blog này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={deleteBlog}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết blog */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Blog</DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Blog</label>
                  <Input
                    value={selectedBlog.maBlog || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu Đề</label>
                  <Input
                    value={selectedBlog.tieuDe || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Người Tạo</label>
                  <Input
                    value={selectedBlog.maNguoiDung || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Tạo</label>
                  <Input
                    value={
                      selectedBlog.ngayTao
                        ? formatDateTime(selectedBlog.ngayTao)
                        : "Chưa cập nhật"
                    }
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                  {selectedBlog.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${selectedBlog.hinhAnh}`}
                      alt={selectedBlog.tieuDe}
                      className="w-24 h-24 object-cover rounded mt-1 border"
                    />
                  ) : (
                    <Input
                      value="Chưa có hình ảnh"
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  )}
                </div>
              </div>
              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nội Dung</label>
                  <textarea
                    value={selectedBlog.noiDung || "Chưa cập nhật"}
                    disabled
                    className="mt-1 w-full h-32 bg-gray-50 border rounded p-2"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenDetailModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal thêm blog */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Thêm Blog Mới</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã Người Dùng</label>
                <Input
                  name="maNguoiDung"
                  type="text"
                  placeholder="Mã người dùng"
                  value={newBlog.maNguoiDung}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu Đề</label>
                <Input
                  name="tieuDe"
                  placeholder="Tiêu đề"
                  value={newBlog.tieuDe}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày Tạo</label>
                <Input
                  name="ngayTao"
                  type="date"
                  placeholder="Ngày tạo"
                  value={newBlog.ngayTao}
                  onChange={handleInputChange}
                  min={today}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    isDraggingCreate ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                  onDragOver={handleDragOverCreate}
                  onDragLeave={handleDragLeaveCreate}
                  onDrop={handleDropCreate}
                >
                  {newBlog.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${newBlog.hinhAnh}`}
                      alt="Preview"
                      className="h-20 w-20 mx-auto object-cover rounded"
                    />
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
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
                        className="cursor-pointer text-blue-500 hover:underline"
                      >
                        Chọn tệp
                      </label>
                    </div>
                  )}
                </div>
                {newBlog.hinhAnh && (
                  <Button
                    variant="outline"
                    onClick={() => setNewBlog({ ...newBlog, hinhAnh: "" })}
                    className="w-full mt-2"
                  >
                    Xóa hình ảnh
                  </Button>
                )}
              </div>
            </div>
            <div className="md:col-span-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nội Dung</label>
                <textarea
                  name="noiDung"
                  placeholder="Nội dung"
                  value={newBlog.noiDung}
                  onChange={handleInputChange}
                  className="w-full h-32 border rounded p-2"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Hủy
            </Button>
            <Button onClick={createBlog}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal sửa blog */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Sửa Blog</DialogTitle>
          </DialogHeader>
          {editBlog && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Người Dùng</label>
                  <Input
                    name="maNguoiDung"
                    type="text"
                    placeholder="Mã người dùng"
                    value={editBlog.maNguoiDung}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu Đề</label>
                  <Input
                    name="tieuDe"
                    placeholder="Tiêu đề"
                    value={editBlog.tieuDe}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Tạo</label>
                  <Input
                    name="ngayTao"
                    type="date"
                    placeholder="Ngày tạo"
                    value={editBlog.ngayTao}
                    onChange={handleEditInputChange}
                    min={today}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hình Ảnh</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      isDraggingEdit ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                    onDragOver={handleDragOverEdit}
                    onDragLeave={handleDragLeaveEdit}
                    onDrop={handleDropEdit}
                  >
                    {editBlog.hinhAnh ? (
                      <img
                        src={`data:image/jpeg;base64,${editBlog.hinhAnh}`}
                        alt="Preview"
                        className="h-20 w-20 mx-auto object-cover rounded"
                      />
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
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
                          className="cursor-pointer text-blue-500 hover:underline"
                        >
                          Chọn tệp
                        </label>
                      </div>
                    )}
                  </div>
                  {editBlog.hinhAnh && (
                    <Button
                      variant="outline"
                      onClick={() => setEditBlog({ ...editBlog, hinhAnh: "" })}
                      className="w-full mt-2"
                    >
                      Xóa hình ảnh
                    </Button>
                  )}
                </div>
              </div>
              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nội Dung</label>
                  <textarea
                    name="noiDung"
                    placeholder="Nội dung"
                    value={editBlog.noiDung}
                    onChange={handleEditInputChange}
                    className="w-full h-32 border rounded p-2"
                    required
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenEditModal(false)}>
              Hủy
            </Button>
            <Button onClick={editBlogSubmit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Blogs;