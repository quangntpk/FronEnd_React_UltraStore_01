import { useState, useEffect } from "react";
import { FaFilePdf, FaPlus, FaEdit, FaTrashAlt, FaEye, FaDoorOpen, FaFileExcel, FaCheck } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Grid2X2, List, MoreVertical, Tag, Download, CheckSquare, Square } from "lucide-react";
import EditProductModal from "@/components/admin/SanPhamAdmin/EditProductModal";
import CreateSanPhamModal from "@/components/admin/SanPhamAdmin/CreateSanPhamModal";
import DetailSanPhamModal from "@/components/admin/SanPhamAdmin/DetailSanPhamModal";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { previewProductCards, printToPDF } from "@/components/admin/SanPhamAdmin/ProductPrintUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ProductReportGenerator from "@/components/admin/SanPhamAdmin/ProductReportGenerator"
const DateRangeModal = ({ isOpen, onClose, onSubmit, selectedProductIds }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      Swal.fire({
        title: "Lỗi",
        text: "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc",
        icon: "error",
      });
      return;
    }

    const dateObject = {
      batDau: startDate, // Directly use the string in YYYY-MM-DD format
      ketThuc: endDate,  // Directly use the string in YYYY-MM-DD format
      id: Array.from(selectedProductIds)
    };

    onSubmit(dateObject);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn khoảng thời gian báo cáo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Ngày bắt đầu</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Ngày kết thúc</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            Tạo báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productEdit, setProductEdit] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [sortBy, setSortBy] = useState(""); // Sắp xếp: "" | "price-asc" | "price-desc" | "name-asc" | "name-desc"
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState(new Set()); // Danh sách sản phẩm đã chọn
  const [selectMode, setSelectMode] = useState(false); // Chế độ chọn sản phẩm
  const productsPerPage = 12;

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5261/api/SanPham/ListSanPham", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      } else {
        console.error("Lỗi khi lấy danh sách sản phẩm:", response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error("Lỗi kết nối API danh sách sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductLoadInfo = async (id) => {
    try {
      const response = await fetch(`http://localhost:5261/api/SanPham/SanPhamByIDSorted?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setProductEdit(data || null);
      } else {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", response.status);
        setProductEdit(null);
      }
    } catch (error) {
      console.error("Lỗi kết nối API chi tiết sản phẩm:", error);
      setProductEdit(null);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getSortedProducts = () => {
    let filtered = [...products].filter(
      (product) =>
        (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (product.loaiSanPham?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case "price-asc":
        return filtered.sort((a, b) => (a.donGia || 0) - (b.donGia || 0));
      case "price-desc":
        return filtered.sort((a, b) => (b.donGia || 0) - (a.donGia || 0));
      case "name-asc":
        return filtered.sort((a, b) => 
          (a.name || "").localeCompare(b.name || ""));
      case "name-desc":
        return filtered.sort((a, b) => 
          (b.name || "").localeCompare(a.name || ""));
      default:
        return filtered;
    }
  };

  const sortedProducts = getSortedProducts();
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Xử lý chọn sản phẩm
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Xử lý chọn tất cả sản phẩm
  const handleSelectAll = () => {
    if (selectedProducts.size === currentProducts.length) {
      // Nếu đã chọn tất cả, bỏ chọn tất cả
      setSelectedProducts(new Set());
    } else {
      // Chọn tất cả sản phẩm hiện tại
      const allCurrentIds = new Set(currentProducts.map(product => product.id));
      setSelectedProducts(allCurrentIds);
    }
  };

  // Bật/tắt chế độ chọn
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedProducts(new Set()); // Reset selection khi đổi chế độ
  };

  // Xử lý báo cáo vật tư với khoảng thời gian
  const handleGenerateReport = async (dateRange) => {
    if (dateRange.id.length === 0) {
      Swal.fire({
        title: "Thông báo",
        text: "Vui lòng chọn ít nhất một sản phẩm để xuất báo cáo.",
        icon: "warning",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5261/api/SanPham/ReportByDate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batDau: dateRange.batDau,
          ketThuc: dateRange.ketThuc,
          id: dateRange.id
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BaoCaoVatTu_${dateRange.batDau}_to_${dateRange.ketThuc}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          title: "Thành công!",
          text: "Đã tạo báo cáo vật tư thành công!",
          icon: "success",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        throw new Error("Lỗi khi tạo báo cáo từ server");
      }
    } catch (error) {
      Swal.fire({
        title: "Lỗi",
        text: `Không thể tạo báo cáo: ${error.message}`,
        icon: "error",
      });
    }
  };

  // Xuất Excel
  const exportToExcel = async () => {
    if (selectedProducts.size === 0) {
      Swal.fire({
        title: "Thông báo",
        text: "Vui lòng chọn ít nhất một sản phẩm để xuất Excel.",
        icon: "warning",
      });
      return;
    }

    try {
      // Fetch data từ API
      const selectedProductsData = [];
      for (const productId of selectedProducts) {
        const response = await fetch(`http://localhost:5261/api/SanPham/SanPhamByID?id=${productId}`);
        if (!response.ok) {
          throw new Error(`Không thể lấy dữ liệu cho sản phẩm ${productId}`);
        }
        const data = await response.json();
        selectedProductsData.push(...data);
      }
      const excelData = selectedProductsData.map((product, index) => {
        const [baseId, color, size] = product.maSanPham.split("_");
        const productRemain = product.soLuongDaBan != null 
          ? product.soLuong - product.soLuongDaBan 
          : product.soLuong;
        return {
          "STT": index + 1,
          "Mã sản phẩm": baseId || "N/A",
          "Tên sản phẩm": product.tenSanPham || "Không có tên",
          "Loại sản phẩm": product.thuongHieu,
          "Thương hiệu": product.loaiSanPham,
          "Chất liệu": product.chatLieu || "N/A",
          "Màu Sắc": color || "N/A",
          "Kích Thước": size?.trim() || "N/A",
          "Đơn giá nhập (VND)": product.giaNhap || 0,
          "Đơn giá bán (VND)": product.gia || 0,
          "Số lượng Còn lại": productRemain,
          "Số Lượng Đã bán": product.soLuongDaBan || 0,
          "Trạng thái": product.trangThai === 0 ? "Tạm ngừng bán" : "Đang bán",
          "Mô tả": product.moTa || "Không có mô tả",
        };
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [];
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map((row) => String(row[header] || "").length)
        );
        colWidths[index] = { width: Math.min(maxLength + 2, 50) };
      });
      ws["!cols"] = colWidths;

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách sản phẩm");

      // Xuất file với tên theo định dạng mẫu
      const fileName = `SanPham_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // Hiển thị thông báo thành công
      Swal.fire({
        title: "Thành công!",
        text: `Đã xuất ${selectedProducts.size} sản phẩm ra file Excel thành công!`,
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: "Lỗi",
        text: `Không thể xuất Excel: ${error.message}`,
        icon: "error",
      });
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
    fetchProductLoadInfo(product.id);
  };

  const handleViewDetails = (productId) => {
    setSelectedProductId(productId);
    setIsDetailModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    Swal.fire({
      title: "Bạn có chắc chắn?",
      text: `Sản phẩm ${product.name} mang mã ${product.id} sẽ chuyển sang trạng thái ngừng bán!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ngưng Bán",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5261/api/SanPham/DeleteSanPham?id=${product.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            Swal.fire({
              title: "Thành công!",
              text: "Ngưng Bán sản phẩm thành công!",
              icon: "success",
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
            }).then(() => {
              fetchProducts();
            });
          } else {
            Swal.fire({
              title: "Lỗi!",
              text: "Có lỗi xảy ra khi ngưng bán sản phẩm.",
              icon: "error",
            });
          }
        } catch (error) {
          Swal.fire({
            title: "Lỗi!",
            text: "Có lỗi hệ thống khi ngưng bán.",
            icon: "error",
          });
        }
      }
    });
  };

  const handleActiveProduct = async (product) => {
    Swal.fire({
      title: "Bạn có chắc chắn?",
      text: `Sản phẩm ${product.name} mang mã ${product.id} sẽ chuyển sang trạng thái đang bán!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đang bán",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5261/api/SanPham/ActiveSanPham?id=${product.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            Swal.fire({
              title: "Thành công!",
              text: "Mở bán lại sản phẩm thành công!",
              icon: "success",
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
            }).then(() => {
              fetchProducts();
            });
          } else {
            Swal.fire({
              title: "Lỗi!",
              text: "Có lỗi xảy ra khi mở bán lại sản phẩm.",
              icon: "error",
            });
          }
        } catch (error) {
          Swal.fire({
            title: "Lỗi!",
            text: "Có lỗi hệ thống khi mở bán lại.",
            icon: "error",
          });
        }
      }
    });
  };

  const handleAddProductSuccess = () => {
    fetchProducts();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải sản phẩm...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sản phẩm</h1>
          
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectMode ? "secondary" : "outline"}
            onClick={toggleSelectMode}
            className="flex items-center gap-2"
          >
            {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {selectMode ? "Thoát chế độ chọn" : "Chọn sản phẩm"}
          </Button>
          {selectMode && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                    disabled={selectedProducts.size === 0}
                  >
                    <FaFilePdf className="h-4 w-4" />
                    Tùy Chọn ({selectedProducts.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsDateRangeModalOpen(true)}>
                    <FaFilePdf className="mr-2 h-4 w-4" />
                    Báo cáo vật tư
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} disabled={selectedProducts.size === 0}>
                    <FaFileExcel className="mr-2 h-4 w-4" />
                    Xuất Excel 
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => previewProductCards(selectedProducts)}>
                    <FaEye className="mr-2 h-4 w-4" />
                    Xem trước File PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => printToPDF(selectedProducts)}>
                    <FaFilePdf className="mr-2 h-4 w-4" />
                    In Thành PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button
            className="bg-purple-400 hover:bg-purple-500 text-white"
            onClick={() => {
              console.log("Nút Thêm Sản Phẩm Mới được nhấn");
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm Sản Phẩm Mới
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tất cả sản phẩm</CardTitle>
            {selectMode && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {selectedProducts.size === currentProducts.length ? (
                    <><FaCheck className="h-3 w-3" /> Bỏ chọn tất cả</>
                  ) : (
                    <><CheckSquare className="h-3 w-3" /> Chọn tất cả</>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Đã chọn: {selectedProducts.size} sản phẩm
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Gõ tên sản phẩm cần tìm"
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    {sortBy === "" ? "Sắp xếp" : 
                      sortBy === "price-asc" ? "Giá thấp - cao" :
                      sortBy === "price-desc" ? "Giá cao - thấp" :
                      sortBy === "name-asc" ? "A - Z" : "Z - A"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("")}>
                    Mặc định
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-asc")}>
                    Giá: Thấp đến Cao
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-desc")}>
                    Giá: Cao đến Thấp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                    Tên: A - Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name-desc")}>
                    Tên: Z - A
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex border rounded-md">
                <Button
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-9 rounded-r-none"
                  onClick={() => setView("grid")}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-9 rounded-l-none"
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentProducts.map((product) => (
                <Card key={product.id} className="hover-scale overflow-hidden group relative">
                  {selectMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                        className="bg-white border-2 border-gray-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                    </div>
                  )}
                  <div className="aspect-square bg-purple-light flex items-center justify-center">
                    <img
                      src={
                        product.hinh && product.hinh[0]
                          ? `data:image/jpeg;base64,${product.hinh[0]}`
                          : "/placeholder-image.jpg"
                      }
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{product.name || "Không có tên"}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          Thương hiệu: {product.thuongHieu || "Không xác định"}
                        </p>
                      </div>
                      {!selectMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <FaEdit className="mr-2 h-4 w-4 text-blue-500" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                              <FaEye className="mr-2 h-4 w-4 text-green-500" /> Chi tiết
                            </DropdownMenuItem>
                            {product.trangThai === 0 ? (
                              <DropdownMenuItem onClick={() => handleActiveProduct(product)} className="text-green-600">
                                <FaDoorOpen className="mr-2 h-4 w-4 text-green-500" /> Mở bán
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
                                <FaTrashAlt className="mr-2 h-4 w-4 text-red-500" /> Ngừng Bán
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-secondary text-white border-0">
                        <Tag className="h-3 w-3 mr-1" /> {product.loaiSanPham || "N/A"}
                      </Badge>
                      <Badge variant="outline" className="bg-secondary text-white border-0">
                        <Tag className="h-3 w-3 mr-1" /> {product.chatLieu || "N/A"}
                      </Badge>
                      <Badge
                        variant={product.soLuong > 0 ? "default" : "destructive"}
                        className="flex flex-col justify-center items-center text-center h-full px-2"
                      >
                        {product.trangThai === 0 ? "Tạm Ngưng Bán" : "Đang Bán"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-purple">
                        {(product.donGia/1000)?.toFixed(3) || "0"} VND
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Còn lại: {product.soLuong || 0} sản phẩm
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50"
                >
                  {selectMode && (
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                      className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                    />
                  )}
                  <div className="h-20 w-20 bg-purple-light rounded-md flex items-center justify-center">
                    <img
                      src={
                        product.hinh && product.hinh[0]
                          ? `data:image/jpeg;base64,${product.hinh[0]}`
                          : "/placeholder-image.jpg"
                      }
                      alt={product.name}
                      className="w-full h-full object-contain rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name || "Không có tên"}</h3>
                    <p className="text-sm text-white line-clamp-1">
                      Thương hiệu: {product.thuongHieu || "Không xác định"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-secondary text-white border-0">
                      {product.loaiSanPham || "N/A"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple">
                      {(product.donGia / 1000)?.toFixed(3) || "0"} VND
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Số lượng: {product.soLuong || 0}
                    </div>
                  </div>
                  {!selectMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                          Chỉnh Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                          Chi Tiết
                        </DropdownMenuItem>
                        {product.trangThai === 0 ? (
                          <DropdownMenuItem onClick={() => handleActiveProduct(product)} className="text-green-600">
                            Mở Bán
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
                            Ngừng Bán
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentProducts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EditProductModal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        selectedProduct={selectedProduct}
        productData={productEdit}
      />
      <CreateSanPhamModal
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        onSuccess={handleAddProductSuccess}
      />
      <DetailSanPhamModal
        productId={selectedProductId}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
      <ProductReportGenerator
        isOpen={isDateRangeModalOpen}
        onClose={() => setIsDateRangeModalOpen(false)}
        selectedProductIds={selectedProducts}
      />
    </div>
  );
};

export default Products;