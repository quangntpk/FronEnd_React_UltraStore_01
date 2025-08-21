
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import toast, { Toaster } from "react-hot-toast";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface Comment {
  maBinhLuan: number;
  maSanPham?: number;
  maCombo?: number;
  tenSanPham?: string;
  tenCombo?: string;
  maNguoiDung?: number;
  hoTen?: string;
  noiDungBinhLuan?: string;
  soTimBinhLuan?: number;
  danhGia?: number;
  trangThai: number;
  ngayBinhLuan?: string;
  hinhAnh?: string;
  maBlog?: number;
}

const formatDateTime = (dateString?: string): string => {
  if (!dateString || isNaN(new Date(dateString).getTime())) return "Ngày không hợp lệ";
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
};

const Comments = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState<boolean>(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [currentPage, setCurrentPage] = useState<{ product: number; blog: number; combo: number }>({ product: 1, blog: 1, combo: 1 });
  const [activeTab, setActiveTab] = useState<string>("productComments");
  const commentsPerPage: number = 10;

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("https://localhost:7051/api/Comment/list", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) {
        throw new Error(`Không thể lấy dữ liệu bình luận: ${response.status} ${response.statusText}`);
      }
      const data: Comment[] = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bình luận:", error);
      toast.error("Không thể tải danh sách bình luận.");
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://localhost:7051/api/Comment/delete/${commentToDelete.maBinhLuan}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) {
        throw new Error("Không thể xóa bình luận");
      }
      setComments(comments.filter((comment) => comment.maBinhLuan !== commentToDelete.maBinhLuan));
      setOpenDeleteModal(false);
      setCommentToDelete(null);
      toast.success("Xóa bình luận thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      toast.error("Có lỗi xảy ra khi xóa bình luận.");
    }
  };

  const handleApproveComment = async (comment: Comment) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://localhost:7051/api/Comment/approve/${comment.maBinhLuan}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) {
        throw new Error("Không thể duyệt bình luận");
      }
      setComments(comments.map((c) => (c.maBinhLuan === comment.maBinhLuan ? { ...c, trangThai: 1 } : c)));
      toast.success("Duyệt bình luận thành công!");
    } catch (error) {
      console.error("Lỗi khi duyệt bình luận:", error);
      toast.error("Có lỗi xảy ra khi duyệt bình luận.");
    }
  };

  const handleUnapproveComment = async (comment: Comment) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://localhost:7051/api/Comment/unapprove/${comment.maBinhLuan}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) {
        throw new Error("Không thể hủy duyệt bình luận");
      }
      setComments(comments.map((c) => (c.maBinhLuan === comment.maBinhLuan ? { ...c, trangThai: 0 } : c)));
      toast.success("Hủy duyệt bình luận thành công!");
    } catch (error) {
      console.error("Lỗi khi hủy duyệt bình luận:", error);
      toast.error("Có lỗi xảy ra khi hủy duyệt bình luận.");
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    setCurrentPage({ product: 1, blog: 1, combo: 1 });
  }, [activeTab]);

  const filteredComments = (type: "product" | "blog" | "combo") => {
    return comments
      .filter((item) => {
        let matchesType = false;

        if (type === "product") {
          matchesType = item.maSanPham !== undefined && item.maSanPham !== null;
        } else if (type === "combo") {
          matchesType = item.maCombo !== undefined && item.maCombo !== null && (item.maSanPham === undefined || item.maSanPham === null);
        } else if (type === "blog") {
          matchesType = item.maBlog !== undefined && item.maBlog !== null && (item.maSanPham === undefined || item.maSanPham === null) && (item.maCombo === undefined || item.maCombo === null);
        }

        if (!matchesType) return false;

        const trangThaiText = item.trangThai === 0 ? "Chưa Duyệt" : item.trangThai === 1 ? "Đã Duyệt" : "";
        return (
          (item.noiDungBinhLuan?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
          (item.maBinhLuan.toString().includes(searchTerm.toLowerCase()) || "") ||
          (item.ngayBinhLuan?.toString().includes(searchTerm.toLowerCase()) || "") ||
          (trangThaiText.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
          (item.tenSanPham?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
          (item.tenCombo?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
          (item.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
          (item.maBlog?.toString().includes(searchTerm.toLowerCase()) || "") ||
          (item.maCombo?.toString().includes(searchTerm.toLowerCase()) || "")
        );
      })
      .sort((a, b) => new Date(b.ngayBinhLuan || "").getTime() - new Date(a.ngayBinhLuan || "").getTime());
  };

  const productComments = filteredComments("product");
  const blogComments = filteredComments("blog");
  const comboComments = filteredComments("combo");

  const indexOfLastComment = (type: "product" | "blog" | "combo") => currentPage[type] * commentsPerPage;
  const indexOfFirstComment = (type: "product" | "blog" | "combo") => indexOfLastComment(type) - commentsPerPage;
  const currentComments = (type: "product" | "blog" | "combo") => {
    const comments = type === "product" ? productComments : type === "blog" ? blogComments : comboComments;
    return comments.slice(indexOfFirstComment(type), indexOfLastComment(type));
  };
  const totalPages = (type: "product" | "blog" | "combo") => {
    const comments = type === "product" ? productComments : type === "blog" ? blogComments : comboComments;
    return Math.ceil(comments.length / commentsPerPage);
  };

  const handleDeleteClick = (comment: Comment) => {
    setCommentToDelete(comment);
    setOpenDeleteModal(true);
  };

  const handleDetailClick = (comment: Comment) => {
    setSelectedComment(comment);
    setOpenDetailModal(true);
  };

  const renderCommentTable = (comments: Comment[], type: "product" | "blog" | "combo") => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Hình Ảnh</TableHead>
            <TableHead>Họ Tên</TableHead>
            <TableHead>Nội Dung</TableHead>
            {type === "product" ? <TableHead>Tên Sản Phẩm</TableHead> : type === "combo" ? <TableHead>Tên Combo</TableHead> : <TableHead>Mã Blog</TableHead>}
            {(type === "product" || type === "combo") && <TableHead>Đánh Giá</TableHead>}
            <TableHead>Trạng Thái</TableHead>
            <TableHead>Ngày Bình Luận</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={type === "product" || type === "combo" ? 9 : 8} className="text-center py-6 text-muted-foreground">
                Đang tải...
              </TableCell>
            </TableRow>
          ) : comments.length > 0 ? (
            comments.map((item) => (
              <TableRow key={item.maBinhLuan} className="hover:bg-muted/50">
                <TableCell>{item.maBinhLuan}</TableCell>
                <TableCell>
                  <img
                    src={item.hinhAnh || "https://via.placeholder.com/50"}
                    alt={item.hoTen || "Avatar"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </TableCell>
                <TableCell>{item.hoTen}</TableCell>
                <TableCell>
                  <div
                    className="text-gray-800 line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(item.noiDungBinhLuan || "Chưa cập nhật", {
                        ADD_ATTR: ["style", "src"],
                      }),
                    }}
                  />
                </TableCell>
                <TableCell>{type === "product" ? item.tenSanPham ?? "Chưa cập nhật" : type === "combo" ? item.tenCombo ?? `Combo ${item.maCombo}` : item.maBlog ?? "Chưa cập nhật"}</TableCell>
                {(type === "product" || type === "combo") && <TableCell>{`${item.danhGia || 0} / 5`}</TableCell>}
                <TableCell>
                  <span
                    className={cn(
                      item.trangThai === 1
                        ? "bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-100"
                        : item.trangThai === 0
                          ? "bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-100"
                          : ""
                    )}
                  >
                    {item.trangThai === 0 ? "Chưa Duyệt" : item.trangThai === 1 ? "Đã Duyệt" : ""}
                  </span>
                </TableCell>
                <TableCell>{item.ngayBinhLuan ? formatDateTime(item.ngayBinhLuan) : "Ngày không hợp lệ"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.trangThai === 0 ? (
                        <DropdownMenuItem onClick={() => handleApproveComment(item)} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Duyệt
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnapproveComment(item)} className="flex items-center">
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Hủy Duyệt
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDetailClick(item)} className="flex items-center">
                        <Eye className="mr-2 h-4 w-4 text-blue-500" />
                        Chi Tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="flex items-center">
                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={type === "product" || type === "combo" ? 9 : 8} className="text-center py-6 text-muted-foreground">
                Không tìm thấy bình luận nào phù hợp với tìm kiếm của bạn.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 comments">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bình Luận</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Danh Sách Bình Luận</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm bình luận..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 self-end">
              <Button variant="outline" size="sm" className="h-9" onClick={fetchComments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm Mới
              </Button>
            </div>
          </div>

          <Tabs defaultValue="productComments" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3 gap-1">
              <TabsTrigger value="productComments" className="flex items-center gap-2">
                Bình Luận Sản Phẩm
              </TabsTrigger>
              <TabsTrigger value="comboComments" className="flex items-center gap-2">
                Bình Luận Combo
              </TabsTrigger>
              <TabsTrigger value="blogComments" className="flex items-center gap-2">
                Bình Luận Blog
              </TabsTrigger>
            </TabsList>

            <TabsContent value="productComments">
              {renderCommentTable(currentComments("product"), "product")}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage({ ...currentPage, product: Math.max(1, currentPage.product - 1) })}
                  disabled={currentPage.product === 1}
                >
                  Trang Trước
                </Button>
                <span>
                  Trang {currentPage.product} / {totalPages("product")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage({ ...currentPage, product: Math.min(totalPages("product"), currentPage.product + 1) })}
                  disabled={currentPage.product === totalPages("product")}
                >
                  Trang Sau
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="blogComments">
              {renderCommentTable(currentComments("blog"), "blog")}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage({ ...currentPage, blog: Math.max(1, currentPage.blog - 1) })}
                  disabled={currentPage.blog === 1}
                >
                  Trang Trước
                </Button>
                <span>
                  Trang {currentPage.blog} / {totalPages("blog")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage({ ...currentPage, blog: Math.min(totalPages("blog"), currentPage.blog + 1) })}
                  disabled={currentPage.blog === totalPages("blog")}
                >
                  Trang Sau
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="comboComments">
              {renderCommentTable(currentComments("combo"), "combo")}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage({ ...currentPage, combo: Math.max(1, currentPage.combo - 1) })}
                  disabled={currentPage.combo === 1}
                >
                  Trang Trước
                </Button>
                <span>
                  Trang {currentPage.combo} / {totalPages("combo")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage({ ...currentPage, combo: Math.min(totalPages("combo"), currentPage.combo + 1) })}
                  disabled={currentPage.combo === totalPages("combo")}
                >
                  Trang Sau
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bình luận</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={deleteComment}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="p-6 max-w-3xl w-full detail-dialog-content">
          <DialogHeader>
            <DialogTitle>Chi Tiết Bình Luận</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="col-span-2 flex items-center gap-4">
                <img
                  src={selectedComment.hinhAnh || "https://via.placeholder.com/50"}
                  alt={selectedComment.hoTen || "Avatar"}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <label className="block text-sm font-medium">Họ Tên</label>
                  <Input value={selectedComment.hoTen || "Chưa cập nhật"} disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">ID Bình Luận</label>
                <Input value={selectedComment.maBinhLuan || "Chưa cập nhật"} disabled />
              </div>
              {selectedComment.maSanPham !== undefined && selectedComment.maSanPham !== null ? (
                <>
                  <div>
                    <label className="block text-sm font-medium">Mã Sản Phẩm</label>
                    <Input value={selectedComment.maSanPham || "Chưa cập nhật"} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Tên Sản Phẩm</label>
                    <Input value={selectedComment.tenSanPham || "Chưa cập nhật"} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Đánh Giá</label>
                    <Input value={`${selectedComment.danhGia || 0} / 5`} disabled />
                  </div>
                </>
              ) : selectedComment.maCombo !== undefined && selectedComment.maCombo !== null ? (
                <>
                  <div>
                    <label className="block text-sm font-medium">Mã Combo</label>
                    <Input value={selectedComment.maCombo || "Chưa cập nhật"} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Tên Combo</label>
                    <Input value={selectedComment.tenCombo || `Combo ${selectedComment.maCombo}`} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Đánh Giá</label>
                    <Input value={`${selectedComment.danhGia || 0} / 5`} disabled />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium">Mã Blog</label>
                  <Input value={selectedComment.maBlog ?? "Chưa cập nhật"} disabled />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium">Mã Người Dùng</label>
                <Input value={selectedComment.maNguoiDung || "Chưa cập nhật"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium">Nội Dung</label>
                <div
                  className="text-gray-800 border border-input rounded-md p-2 bg-background"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedComment.noiDungBinhLuan || "Chưa cập nhật", {
                      ADD_ATTR: ["style", "src"],
                    }),
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Số Tim</label>
                <Input value={selectedComment.soTimBinhLuan ?? "0"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium">Trạng Thái</label>
                <Input value={selectedComment.trangThai === 0 ? "Chưa Duyệt" : "Đã Duyệt"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium">Ngày Bình Luận</label>
                <Input
                  value={selectedComment.ngayBinhLuan ? formatDateTime(selectedComment.ngayBinhLuan) : "Chưa cập nhật"}
                  disabled
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpenDetailModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .comments .line-clamp-3 {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow: hidden;
          -webkit-line-clamp: unset;
          -webkit-box-orient: vertical;
          white-space: pre-line;
        }

        .comments .line-clamp-3 img {
          display: block;
          transform: scale(1.5);
          transform-origin: top left;
          max-width: 225px;
          height: auto;
          margin-top: 0.5rem;
        }

        .detail-dialog-content {
          max-height: 600px;
          overflow-y: auto;
        }

        .detail-dialog-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default Comments;
