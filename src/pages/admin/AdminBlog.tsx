import { useState, useEffect, useMemo } from "react";
import { FaEye, FaTrashAlt, FaEdit, FaEllipsisV } from "react-icons/fa";
import { IoAddCircleOutline, IoSearch, IoFilter, IoGrid, IoList, IoClose } from "react-icons/io5";
import { MdUpload } from "react-icons/md";
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
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';

interface Blog {
  maBlog: string | number | null;
  maNguoiDung: string;
  hoTen?: string | null;
  ngayTao: string;
  ngayCapNhat?: string;
  tieuDe: string;
  noiDung: string;
  slug?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  hinhAnh?: string | null;
  moTaHinhAnh?: string;
  isPublished: boolean;
  tags?: string[];
}

const formatDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "Không xác định";
  }
};

const generateSlug = (title: string, existingSlugs: string[]): string => {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let newSlug = slug;
  let counter = 1;

  while (existingSlugs.includes(newSlug)) {
    newSlug = `${slug}-${counter}`;
    counter++;
  }

  return newSlug;
};

const generateMoTaHinhAnh = (title: string): string => {
  return `Hình ảnh cho bài viết: ${title}`;
};

const AdminBlog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"title-asc" | "title-desc" | "date-asc" | "date-desc" | "">("");
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
    ngayTao: new Date().toISOString().split("T")[0],
    slug: "",
    metaTitle: "",
    metaDescription: "",
    hinhAnh: "",
    moTaHinhAnh: "",
    isPublished: false,
    tags: [],
  });
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [isDraggingCreate, setIsDraggingCreate] = useState(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);
  const [maNguoiDung, setMaNguoiDung] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 8;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setMaNguoiDung(userId);
      setNewBlog((prev) => ({ ...prev, maNguoiDung: userId }));
    } else {
      setError("Không tìm thấy mã người dùng. Vui lòng đăng nhập lại.");
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy mã người dùng. Vui lòng đăng nhập lại.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Blog[] = await response.json();
      setBlogs(data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setError("Có lỗi xảy ra khi tải danh sách blog.");
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi tải danh sách blog.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Blog/${blogToDelete.maBlog}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.status === 204) {
        setBlogs(blogs.filter((blog) => blog.maBlog !== blogToDelete.maBlog));
        setOpenDeleteModal(false);
        setBlogToDelete(null);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Xóa blog thành công!",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          showCloseButton: true,
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi xóa blog.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const createBlog = async () => {
    if (!maNguoiDung) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy mã người dùng.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }
    if (!newBlog.tieuDe || !newBlog.noiDung) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng điền tiêu đề và nội dung!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    try {
      const existingSlugs = blogs.map((blog) => blog.slug || "");
      const newSlug = generateSlug(newBlog.tieuDe, existingSlugs);
      const newMoTaHinhAnh = generateMoTaHinhAnh(newBlog.tieuDe);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Blog/CreateBlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBlog,
          maNguoiDung,
          ngayTao: new Date(newBlog.ngayTao).toISOString(),
          hinhAnh: newBlog.hinhAnh || null,
          slug: newSlug,
          moTaHinhAnh: newMoTaHinhAnh,
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
        maNguoiDung: maNguoiDung || "",
        tieuDe: "",
        noiDung: "",
        ngayTao: new Date().toISOString().split("T")[0],
        slug: "",
        metaTitle: "",
        metaDescription: "",
        hinhAnh: "",
        moTaHinhAnh: "",
        isPublished: false,
        tags: [],
      });
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Thêm blog thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      console.error("Error creating blog:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi thêm blog.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const editBlogSubmit = async () => {
    if (!editBlog || !editBlog.tieuDe || !editBlog.noiDung) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng điền tiêu đề và nội dung!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    try {
      const existingSlugs = blogs
        .filter((blog) => blog.maBlog !== editBlog.maBlog)
        .map((blog) => blog.slug || "");
      const newSlug = generateSlug(editBlog.tieuDe, existingSlugs);
      const newMoTaHinhAnh = generateMoTaHinhAnh(editBlog.tieuDe);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Blog/${editBlog.maBlog}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editBlog,
            ngayTao: new Date(editBlog.ngayTao).toISOString(),
            hinhAnh: editBlog.hinhAnh || null,
            slug: newSlug,
            moTaHinhAnh: newMoTaHinhAnh,
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
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Sửa blog thành công!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      console.error("Error updating blog:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi sửa blog.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const sortedAndFilteredBlogs = useMemo(() => {
    const filtered = blogs.filter((item) =>
      item.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case "title-asc":
        return [...filtered].sort((a, b) => (a.tieuDe || "").localeCompare(b.tieuDe || ""));
      case "title-desc":
        return [...filtered].sort((a, b) => (b.tieuDe || "").localeCompare(a.tieuDe || ""));
      case "date-asc":
        return [...filtered].sort((a, b) => new Date(a.ngayTao).getTime() - new Date(b.ngayTao).getTime());
      case "date-desc":
        return [...filtered].sort((a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime());
      default:
        return filtered;
    }
  }, [blogs, searchTerm, sortBy]);

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = sortedAndFilteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(sortedAndFilteredBlogs.length / blogsPerPage);

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
      tags: blog.tags || [],
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

  const handleImageChange = (file: File, isEdit: boolean) => {
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng chọn một tệp hình ảnh!",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1];
        if (isEdit) {
          setEditBlog({ ...editBlog!, hinhAnh: base64String });
        } else {
          setNewBlog({ ...newBlog, hinhAnh: base64String });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, isEdit: boolean) => {
    e.preventDefault();
    if (isEdit) {
      setIsDraggingEdit(true);
    } else {
      setIsDraggingCreate(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, isEdit: boolean) => {
    e.preventDefault();
    if (isEdit) {
      setIsDraggingEdit(false);
    } else {
      setIsDraggingCreate(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isEdit: boolean) => {
    e.preventDefault();
    if (isEdit) {
      setIsDraggingEdit(false);
    } else {
      setIsDraggingCreate(false);
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageChange(file, isEdit);
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (file) handleImageChange(file, isEdit);
  };

  const getPageNumbers = () => {
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

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', 'normal', 'large', 'huge'] }], // Explicit font sizes
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">Quản lý bài viết</h1>
        </div>
        <Button
          className="bg-purple-400 hover:bg-purple-500 text-white"
          size="lg"
          onClick={() => setOpenCreateModal(true)}
        >
          <IoAddCircleOutline className="h-5 w-5 mr-2" /> Thêm Blog
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Danh sách bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm..."
                className="pl-10 w-full bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <IoFilter className="h-4 w-4 mr-2" />
                    {sortBy === ""
                      ? "Sắp xếp"
                      : sortBy === "title-asc"
                        ? "Tiêu đề: A - Z"
                        : sortBy === "title-desc"
                          ? "Tiêu đề: Z - A"
                          : sortBy === "date-asc"
                            ? "Cũ nhất"
                            : "Mới nhất"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-lg shadow-lg">
                  <DropdownMenuItem onClick={() => setSortBy("")}>Mặc định</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title-asc")}>
                    Tiêu đề: A - Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title-desc")}>
                    Tiêu đề: Z - A
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                    Cũ nhất
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                    Mới nhất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex border rounded-md">
                <Button
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-9 rounded-r-none"
                  onClick={() => setView("grid")}
                  aria-label="Chuyển sang chế độ lưới"
                >
                  <IoGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-9 rounded-l-none"
                  onClick={() => setView("list")}
                  aria-label="Chuyển sang chế độ danh sách"
                >
                  <IoList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center py-4 text-red-600 text-lg">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500 text-lg">Đang tải...</div>
          ) : currentBlogs.length > 0 ? (
            view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentBlogs.map((item) => (
                  <Card
                    key={item.maBlog}
                    className="hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden bg-white group"
                  >
                    <div className="aspect-square bg-purple-50 flex items-center justify-center">
                      {item.hinhAnh ? (
                        <img
                          src={`data:image/jpeg;base64,${item.hinhAnh}`}
                          alt={item.tieuDe}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">Không có hình</div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800 truncate">{item.tieuDe}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Người tạo: {item.maNguoiDung}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ngày tạo: {formatDateTime(item.ngayTao)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaEllipsisV className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                            <DropdownMenuItem
                              onClick={() => handleDetailClick(item)}
                              className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <FaEye className="mr-2 h-4 w-4 text-blue-500" />
                              Chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(item)}
                              className="flex items-center text-gray-700 hover:bg-green-50 hover:text-green-600"
                            >
                              <FaEdit className="mr-2 h-4 w-4 text-green-500" />
                              Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item)}
                              className="flex items-center text-gray-700 hover:bg-red-50 hover:text-red-600"
                            >
                              <FaTrashAlt className="mr-2 h-4 w-4 text-red-500" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border rounded-md divide-y">
                {currentBlogs.map((item) => (
                  <div
                    key={item.maBlog}
                    className="p-4 flex items-center gap-4 hover:bg-muted/50"
                  >
                    <div className="h-20 w-20 bg-purple-50 rounded-md flex items-center justify-center">
                      {item.hinhAnh ? (
                        <img
                          src={`data:image/jpeg;base64,${item.hinhAnh}`}
                          alt={item.tieuDe}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">Không có hình</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.tieuDe}</h3>
                      <p className="text-sm text-muted-foreground">
                        Người tạo: {item.maNguoiDung}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ngày tạo: {formatDateTime(item.ngayTao)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FaEllipsisV className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                        <DropdownMenuItem
                          onClick={() => handleDetailClick(item)}
                          className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <FaEye className="mr-2 h-4 w-4 text-blue-500" />
                          Chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(item)}
                          className="flex items-center text-gray-700 hover:bg-green-50 hover:text-green-600"
                        >
                          <FaEdit className="mr-2 h-4 w-4 text-green-500" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(item)}
                          className="flex items-center text-gray-700 hover:bg-red-50 hover:text-red-600"
                        >
                          <FaTrashAlt className="mr-2 h-4 w-4 text-red-500" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )
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
                aria-label="First page"
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Trước
              </Button>
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`${currentPage === page
                    ? "bg-purple-400 hover:bg-purple-500 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    } rounded-lg`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Sau
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                Cuối
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Xác nhận xóa blog
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa blog "{blogToDelete?.tieuDe}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenDeleteModal(false)}
              aria-label="Cancel delete blog"
            >
              <IoClose className="h-4 w-4 mr-2" /> Hủy
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
              onClick={deleteBlog}
              aria-label="Confirm delete blog"
            >
              <FaTrashAlt className="h-4 w-4 mr-2" /> Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="max-w-5xl rounded-lg shadow-xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Chi tiết blog {selectedBlog?.maBlog}
            </DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mã Blog</Label>
                  <Input
                    value={selectedBlog.maBlog ?? "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Tiêu đề</Label>
                  <Input
                    value={selectedBlog.tieuDe || "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Người tạo</Label>
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
                  <Label className="block text-sm font-semibold text-gray-700">Ngày tạo</Label>
                  <Input
                    value={selectedBlog.ngayTao ? formatDateTime(selectedBlog.ngayTao) : "Chưa cập nhật"}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Hình ảnh</Label>
                  {selectedBlog.hinhAnh ? (
                    <img
                      src={`data:image/jpeg;base64,${selectedBlog.hinhAnh}`}
                      alt={selectedBlog.moTaHinhAnh || selectedBlog.tieuDe}
                      className="w-64 h-32 object-cover rounded-lg mt-1 border border-gray-200"
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
                    className="h-5 w-5 text-purple-400 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="isPublishedDetail" className="text-sm font-semibold text-gray-700">
                    Công khai?
                  </Label>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Nội dung</Label>
                  <div
                    className="mt-1 w-full border border-gray-300 p-3"
                    dangerouslySetInnerHTML={{ __html: selectedBlog.noiDung || "Chưa cập nhật" }}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenDetailModal(false)}
              aria-label="Đóng chi tiết blog"
            >
              <IoClose className="h-4 w-4 mr-2" /> Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-5xl rounded-lg shadow-xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Thêm blog mới</DialogTitle>
          </DialogHeader>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Tiêu đề</Label>
                <Input
                  name="tieuDe"
                  placeholder="Tiêu đề"
                  value={newBlog.tieuDe}
                  onChange={handleInputChange}
                  required
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Meta Title</Label>
                <Input
                  name="metaTitle"
                  placeholder="Tiêu đề SEO"
                  value={newBlog.metaTitle}
                  onChange={handleInputChange}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Hình ảnh</Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${isDraggingCreate ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50"
                    }`}
                  onDragOver={(e) => handleDragOver(e, false)}
                  onDragLeave={(e) => handleDragLeave(e, false)}
                  onDrop={(e) => handleDrop(e, false)}
                >
                  {newBlog.hinhAnh ? (
                    <div className="relative inline-block">
                      <img
                        src={`data:image/jpeg;base64,${newBlog.hinhAnh}`}
                        alt="Preview"
                        className="h-24 w-48 mx-auto object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-white rounded-full p-1 shadow-md hover:bg-red-100"
                        onClick={() => setNewBlog({ ...newBlog, hinhAnh: "" })}
                      >
                        <IoClose className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <MdUpload className="h-10 w-10 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Kéo và thả hình ảnh vào đây hoặc nhấp để chọn
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="fileInputCreate"
                        onChange={(e) => handleFileInputChange(e, false)}
                      />
                      <label
                        htmlFor="fileInputCreate"
                        className="cursor-pointer text-purple-600 hover:text-purple-700 font-semibold"
                      >
                        Chọn tệp
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Meta Description</Label>
                <Input
                  name="metaDescription"
                  placeholder="Mô tả SEO"
                  value={newBlog.metaDescription}
                  onChange={handleInputChange}
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">
                  Tags (phân cách bằng dấu phẩy)
                </Label>
                <Input
                  name="tags"
                  placeholder="seo, marketing, tutorial"
                  value={newBlog.tags?.map((tag) => tag.replace(/^#/, "")).join(", ") || ""}
                  onChange={(e) =>
                    setNewBlog({
                      ...newBlog,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag)
                        .map((tag) => `#${tag}`),
                    })
                  }
                  className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={newBlog.isPublished}
                  onChange={(e) => setNewBlog({ ...newBlog, isPublished: e.target.checked })}
                  className="h-5 w-5 text-purple-400 border-gray-300 rounded focus:ring-purple-500"
                />
                <Label htmlFor="isPublished" className="text-sm font-semibold text-gray-700">
                  Công khai?
                </Label>
              </div>
              <div>
                <Label className="block text-sm font-semibold text-gray-700">Nội dung</Label>
                <ReactQuill
                  value={newBlog.noiDung}
                  onChange={(content) => setNewBlog({ ...newBlog, noiDung: content })}
                  modules={quillModules}
                  className="h-48 borde rounded-lg mb-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenCreateModal(false)}
              aria-label="Hủy thêm blog"
            >
              <IoClose className="h-4 w-4 mr-2" /> Hủy
            </Button>
            <Button
              className="bg-purple-400 hover:bg-purple-500 text-white rounded-lg"
              onClick={createBlog}
              aria-label="Thêm blog"
            >
              <IoAddCircleOutline className="h-4 w-4 mr-2" /> Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="max-w-5xl rounded-lg shadow-xl bg-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Sửa blog {editBlog?.maBlog}
            </DialogTitle>
          </DialogHeader>
          {editBlog && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mã người dùng</Label>
                  <Input
                    value={editBlog.maNguoiDung}
                    disabled
                    className="mt-1 bg-gray-100 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Tiêu đề</Label>
                  <Input
                    name="tieuDe"
                    placeholder="Tiêu đề"
                    value={editBlog.tieuDe}
                    onChange={handleEditInputChange}
                    required
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Slug</Label>
                  <Input
                    name="slug"
                    placeholder="slug-url"
                    value={editBlog.slug}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Hình ảnh</Label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${isDraggingEdit ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50"
                      }`}
                    onDragOver={(e) => handleDragOver(e, true)}
                    onDragLeave={(e) => handleDragLeave(e, true)}
                    onDrop={(e) => handleDrop(e, true)}
                  >
                    {editBlog.hinhAnh ? (
                      <div className="relative inline-block">
                        <img
                          src={`data:image/jpeg;base64,${editBlog.hinhAnh}`}
                          alt="Preview"
                          className="h-24 w-48 mx-auto object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md hover:bg-red-100"
                          onClick={() => setEditBlog({ ...editBlog, hinhAnh: "" })}
                        >
                          <IoClose className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <MdUpload className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Kéo và thả hình ảnh vào đây hoặc nhấp để chọn
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="fileInputEdit"
                          onChange={(e) => handleFileInputChange(e, true)}
                        />
                        <label
                          htmlFor="fileInputEdit"
                          className="cursor-pointer text-purple-600 hover:text-purple-700 font-semibold"
                        >
                          Chọn tệp
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Mô tả hình ảnh (ALT)</Label>
                  <Input
                    name="moTaHinhAnh"
                    placeholder="Mô tả hình ảnh"
                    value={editBlog.moTaHinhAnh}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Meta Title</Label>
                  <Input
                    name="metaTitle"
                    placeholder="Tiêu đề SEO"
                    value={editBlog.metaTitle}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Meta Description</Label>
                  <Input
                    name="metaDescription"
                    placeholder="Mô tả SEO"
                    value={editBlog.metaDescription}
                    onChange={handleEditInputChange}
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">
                    Tags (phân cách bằng dấu phẩy)
                  </Label>
                  <Input
                    name="tags"
                    placeholder="seo, marketing, tutorial"
                    value={editBlog.tags?.map((tag) => tag.replace(/^#/, "")).join(", ") || ""}
                    onChange={(e) =>
                      setEditBlog({
                        ...editBlog,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag)
                          .map((tag) => `#${tag}`),
                      })
                    }
                    className="mt-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublishedEdit"
                    checked={editBlog.isPublished}
                    onChange={(e) => setEditBlog({ ...editBlog, isPublished: e.target.checked })}
                    className="h-5 w-5 text-purple-400 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="isPublishedEdit" className="text-sm font-semibold text-gray-700">
                    Công khai?
                  </Label>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-700">Nội dung</Label>
                  <ReactQuill
                    value={editBlog.noiDung}
                    onChange={(content) => setEditBlog({ ...editBlog, noiDung: content })}
                    modules={quillModules}
                    className="h-48 borde rounded-lg mb-10"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setOpenEditModal(false)}
              aria-label="Hủy sửa blog"
            >
              <IoClose className="h-4 w-4 mr-2" /> Hủy
            </Button>
            <Button
              className="bg-purple-400 hover:bg-purple-500 text-white rounded-lg"
              onClick={editBlogSubmit}
              aria-label="Lưu blog"
            >
              <FaEdit className="h-4 w-4 mr-2" /> Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;