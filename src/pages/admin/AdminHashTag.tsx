import { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaEdit, FaTrashAlt, FaEye, FaUndo, FaTrash } from "react-icons/fa";
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
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Search, MoreVertical, Upload, X, Loader2, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import Swal from "sweetalert2";

interface HashTag {
    maHashTag: number;
    tenHashTag: string;
    hinhAnh?: string;
    trangThai?: number;
}

const ITEMS_PER_PAGE = 10;
const API_URL = import.meta.env.VITE_API_URL;

const AdminHashTag = () => {
    const [hashTags, setHashTags] = useState<HashTag[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
    const [loading, setLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [moModalThem, setMoModalThem] = useState(false);
    const [moModalSua, setMoModalSua] = useState(false);
    const [moModalXoa, setMoModalXoa] = useState(false);
    const [moModalXoaVinhVien, setMoModalXoaVinhVien] = useState(false);
    const [moModalKhoiPhuc, setMoModalKhoiPhuc] = useState(false);
    const [moModalChiTiet, setMoModalChiTiet] = useState(false);
    const [hashTagCanXoa, setHashTagCanXoa] = useState<HashTag | null>(null);
    const [hashTagCanXoaVinhVien, setHashTagCanXoaVinhVien] = useState<HashTag | null>(null);
    const [hashTagCanKhoiPhuc, setHashTagCanKhoiPhuc] = useState<HashTag | null>(null);
    const [hashTagChiTiet, setHashTagChiTiet] = useState<HashTag | null>(null);
    const [tenHashTagMoi, setTenHashTagMoi] = useState("");
    const [hinhAnhMoi, setHinhAnhMoi] = useState("");
    const [hashTagDangSua, setHashTagDangSua] = useState<HashTag | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [errorsThem, setErrorsThem] = useState({ ten: "", hinhAnh: "" });
    const [errorsSua, setErrorsSua] = useState({ ten: "", hinhAnh: "" });
    const [errorMessage, setErrorMessage] = useState<string>("");

    const formatBase64Image = (base64String: string) => {
        if (!base64String) return "";
        if (base64String.startsWith("data:image")) return base64String;
        return `data:image/png;base64,${base64String}`;
    };

    const getBase64 = (imageString: string) => {
        if (!imageString) return "";
        if (imageString.startsWith("data:")) {
            return imageString.split(",")[1];
        }
        return imageString;
    };

    const fetchHashTags = useCallback(async () => {
        try {
            setLoading(true);
            const targetStatus = activeTab === "active" ? 1 : 0;
            const response = await fetch(`${API_URL}/api/HashTag?trangThai=${targetStatus}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể lấy danh sách hashtag");
            }
            const data = await response.json();
            setHashTags(data);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi khi tải danh sách hashtag: " + (error as Error).message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const sortedAndFilteredHashTags = useMemo(() => {
        const targetStatus = activeTab === "active" ? 1 : 0;
        const filtered = hashTags
            .filter(
                (ht) =>
                    ht.trangThai === targetStatus &&
                    (ht.tenHashTag.toLowerCase().includes(searchTerm) ||
                        ht.maHashTag.toString().includes(searchTerm))
            )
            .sort((a, b) => b.maHashTag - a.maHashTag);
        return filtered;
    }, [hashTags, searchTerm, activeTab]);

    const totalPages = Math.ceil(sortedAndFilteredHashTags.length / ITEMS_PER_PAGE);
    const paginatedHashTags = sortedAndFilteredHashTags.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.size <= 2 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onloadend = () => setHinhAnhMoi(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Hình ảnh phải nhỏ hơn 2MB!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size <= 2 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onloadend = () => setHinhAnhMoi(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Hình ảnh phải nhỏ hơn 2MB!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        }
    };

    const validateThem = () => {
        let valid = true;
        const newErrors = { ten: "", hinhAnh: "" };
        if (!tenHashTagMoi.trim()) {
            newErrors.ten = "Tên hashtag không được để trống!";
            valid = false;
        }
        if (!hinhAnhMoi) {
            newErrors.hinhAnh = "Hình ảnh không được để trống!";
            valid = false;
        }
        setErrorsThem(newErrors);
        return valid;
    };

    const validateSua = () => {
        let valid = true;
        const newErrors = { ten: "", hinhAnh: "" };
        if (!hashTagDangSua?.tenHashTag?.trim()) {
            newErrors.ten = "Tên hashtag không được để trống!";
            valid = false;
        }
        if (!hashTagDangSua?.hinhAnh) {
            newErrors.hinhAnh = "Hình ảnh không được để trống!";
            valid = false;
        }
        setErrorsSua(newErrors);
        return valid;
    };

    const themHashTag = async () => {
        if (!validateThem()) return;
        try {
            setIsProcessing(true);
            const base64Image = getBase64(hinhAnhMoi);
            const response = await fetch(`${API_URL}/api/HashTag`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    TenHashTag: tenHashTagMoi,
                    HinhAnh: base64Image,
                    TrangThai: 1,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể thêm hashtag");
            }
            setTenHashTagMoi("");
            setHinhAnhMoi("");
            setErrorsThem({ ten: "", hinhAnh: "" });
            setMoModalThem(false);
            await fetchHashTags();
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Thêm hashtag thành công!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi khi thêm hashtag: " + (error as Error).message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const suaHashTag = async () => {
        if (!validateSua() || !hashTagDangSua) return;
        try {
            setIsProcessing(true);
            setErrorMessage("");
            const base64Image = getBase64(hashTagDangSua.hinhAnh || "");
            const response = await fetch(`${API_URL}/api/HashTag/${hashTagDangSua.maHashTag}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    MaHashTag: hashTagDangSua.maHashTag,
                    TenHashTag: hashTagDangSua.tenHashTag,
                    HinhAnh: base64Image,
                    TrangThai: hashTagDangSua.trangThai,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                    throw new Error("Hashtag không tồn tại");
                } else if (response.status === 409) {
                    setErrorMessage("Tên hashtag đã tồn tại");
                    return;
                } else if (response.status === 500) {
                    throw new Error("Lỗi máy chủ, vui lòng thử lại sau");
                }
                throw new Error(errorText || "Không thể sửa hashtag");
            }
            setMoModalSua(false);
            setHashTagDangSua(null);
            setErrorMessage("");
            await fetchHashTags();
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Sửa hashtag thành công!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi khi sửa hashtag: " + (error as Error).message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const anHashTag = async () => {
        if (!hashTagCanXoa) return;
        try {
            setIsProcessing(true);
            const response = await fetch(`${API_URL}/api/HashTag/${hashTagCanXoa.maHashTag}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    MaHashTag: hashTagCanXoa.maHashTag,
                    TenHashTag: hashTagCanXoa.tenHashTag,
                    HinhAnh: hashTagCanXoa.hinhAnh,
                    TrangThai: hashTagCanXoa.trangThai === 1 ? 0 : 1,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                    throw new Error("Hashtag không tồn tại");
                } else if (response.status === 409) {
                    throw new Error("Tên hashtag đã tồn tại");
                } else if (response.status === 500) {
                    throw new Error("Lỗi máy chủ, vui lòng thử lại sau");
                }
                throw new Error(errorText || "Không thể xóa hashtag");
            }
            setMoModalXoa(false);
            setHashTagCanXoa(null);
            setCurrentPage(1);
            await fetchHashTags();
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Xóa hashtag thành công!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi khi xóa hashtag: " + (error as Error).message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const khoiPhucHashTag = async () => {
        if (!hashTagCanKhoiPhuc) return;
        try {
            setIsProcessing(true);
            const response = await fetch(`${API_URL}/api/HashTag/${hashTagCanKhoiPhuc.maHashTag}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    MaHashTag: hashTagCanKhoiPhuc.maHashTag,
                    TenHashTag: hashTagCanKhoiPhuc.tenHashTag,
                    HinhAnh: hashTagCanKhoiPhuc.hinhAnh,
                    TrangThai: 1,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                    throw new Error("Hashtag không tồn tại");
                } else if (response.status === 409) {
                    throw new Error("Tên hashtag đã tồn tại");
                } else if (response.status === 500) {
                    throw new Error("Lỗi máy chủ, vui lòng thử lại sau");
                }
                throw new Error(errorText || "Không thể khôi phục hashtag");
            }
            setMoModalKhoiPhuc(false);
            setHashTagCanKhoiPhuc(null);
            setCurrentPage(1);
            await fetchHashTags();
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Khôi phục hashtag thành công!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi khi khôi phục hashtag: " + (error as Error).message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const xoaVinhVienHashTag = async () => {
        if (!hashTagCanXoaVinhVien) return;
        try {
            setIsProcessing(true);
            const response = await fetch(`${API_URL}/api/HashTag/${hashTagCanXoaVinhVien.maHashTag}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                    throw new Error("Hashtag không tồn tại");
                } else if (response.status === 409) {
                    throw new Error("Không thể xóa vì có dữ liệu liên quan");
                } else if (response.status === 500) {
                    throw new Error("Lỗi máy chủ, vui lòng thử lại sau");
                }
                throw new Error(errorText || "Không thể xóa hashtag");
            }
            setMoModalXoaVinhVien(false);
            setHashTagCanXoaVinhVien(null);
            setCurrentPage(1);
            await fetchHashTags();
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Xóa vĩnh viễn hashtag thành công!",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi khi xóa hashtag: " + (error as Error).message,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        fetchHashTags();
    }, [fetchHashTags]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">
                    Quản lý hashtag
                </h1>
                {activeTab === "active" && (
                    <Button
                        className="bg-[#9b87f5] text-white hover:bg-[#8a76e3]"
                        onClick={() => setMoModalThem(true)}
                        disabled={loading || isProcessing}
                    >
                        <FaPlus className="mr-2 h-4 w-4" /> Thêm Hashtag
                    </Button>
                )}
            </div>

            <Tabs defaultValue="active" className="w-full" onValueChange={(value) => setActiveTab(value as "active" | "inactive")}>
                <TabsList className="grid w-full md:w-auto grid-cols-2 gap-1">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Danh sách hashtag
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Khôi phục hashtag
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative">
                            <Input
                                type="search"
                                placeholder="Tìm kiếm hashtag..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full md:w-[820px] pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
                        </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Danh sách hashtag</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>STT</TableHead>
                                                <TableHead>Hình Ảnh</TableHead>
                                                <TableHead>Tên Hashtag</TableHead>
                                                <TableHead>Hành Động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedHashTags.length > 0 ? (
                                                paginatedHashTags.map((ht, index) => (
                                                    <TableRow key={ht.maHashTag} className="hover:bg-muted/50">
                                                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                                        <TableCell>
                                                            {ht.hinhAnh ? (
                                                                <img
                                                                    src={formatBase64Image(ht.hinhAnh)}
                                                                    alt={ht.tenHashTag}
                                                                    className="h-12 w-12 object-cover rounded"
                                                                    onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                                                                />
                                                            ) : (
                                                                "Không có hình"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{ht.tenHashTag}</TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setHashTagChiTiet(ht);
                                                                            setMoModalChiTiet(true);
                                                                        }}
                                                                        className="text-green-700"
                                                                    >
                                                                        <FaEye className="mr-2 h-4 w-4" /> Xem
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setHashTagDangSua({ ...ht });
                                                                            setMoModalSua(true);
                                                                        }}
                                                                        className="text-blue-700"
                                                                    >
                                                                        <FaEdit className="mr-2 h-4 w-4" /> Sửa
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setHashTagCanXoa(ht);
                                                                            setMoModalXoa(true);
                                                                        }}
                                                                        className="text-red-700"
                                                                    >
                                                                        <FaTrashAlt className="mr-2 h-4 w-4" /> Xóa
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                        Không tìm thấy hashtag nào.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-2 mt-6">
                                    <Button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        className="flex items-center"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Trước
                                    </Button>

                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                        <Button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            variant={currentPage === page ? "default" : "outline"}
                                            className={currentPage === page ? "bg-[#9b87f5] text-white hover:bg-[#8a76e3]" : ""}
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                    <Button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        variant="outline"
                                        className="flex items-center"
                                    >
                                        Sau
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="inactive">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative">
                            <Input
                                type="search"
                                placeholder="Tìm kiếm hashtag đã xóa..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full md:w-[820px] pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
                        </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Danh Sách Hashtag Đã Xóa</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>STT</TableHead>
                                                <TableHead>Hình Ảnh</TableHead>
                                                <TableHead>Tên Hashtag</TableHead>
                                                <TableHead>Hành Động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedHashTags.length > 0 ? (
                                                paginatedHashTags.map((ht, index) => (
                                                    <TableRow key={ht.maHashTag} className="hover:bg-muted/50">
                                                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                                        <TableCell>
                                                            {ht.hinhAnh ? (
                                                                <img
                                                                    src={formatBase64Image(ht.hinhAnh)}
                                                                    alt={ht.tenHashTag}
                                                                    className="h-12 w-12 object-cover rounded"
                                                                    onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                                                                />
                                                            ) : (
                                                                "Không có hình"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{ht.tenHashTag}</TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setHashTagChiTiet(ht);
                                                                            setMoModalChiTiet(true);
                                                                        }}
                                                                        className="text-green-700"
                                                                    >
                                                                        <FaEye className="mr-2 h-4 w-4" /> Chi tiết
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setHashTagCanKhoiPhuc(ht);
                                                                            setMoModalKhoiPhuc(true);
                                                                        }}
                                                                        className="text-blue-700"
                                                                    >
                                                                        <FaUndo className="mr-2 h-4 w-4" /> Khôi phục
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setHashTagCanXoaVinhVien(ht);
                                                                            setMoModalXoaVinhVien(true);
                                                                        }}
                                                                        className="text-red-700"
                                                                    >
                                                                        <FaTrash className="mr-2 h-4 w-4" /> Xóa vĩnh viễn
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                        Không tìm thấy hashtag nào.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-2 mt-6">
                                    <Button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        className="flex items-center"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Trước
                                    </Button>

                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                        <Button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            variant={currentPage === page ? "default" : "outline"}
                                            className={currentPage === page ? "bg-[#9b87f5] text-white hover:bg-[#8a76e3]" : ""}
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                    <Button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        variant="outline"
                                        className="flex items-center"
                                    >
                                        Sau
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={moModalThem} onOpenChange={setMoModalThem}>
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>Thêm Hashtag</DialogTitle>
                        <DialogDescription>Nhập thông tin hashtag mới.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hashtag</label>
                            <Input
                                value={tenHashTagMoi}
                                onChange={(e) => {
                                    setTenHashTagMoi(e.target.value);
                                    setErrorsThem((prev) => ({ ...prev, ten: "" }));
                                }}
                                placeholder="Tên hashtag"
                                disabled={isProcessing}
                            />
                            {errorsThem.ten && <p className="text-red-500 text-sm mt-1">{errorsThem.ten}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh</label>
                            <div
                                className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {hinhAnhMoi ? (
                                    <div className="relative">
                                        <img
                                            src={hinhAnhMoi}
                                            alt="Preview"
                                            className="h-20 w-20 mx-auto object-cover rounded"
                                        />
                                        <button
                                            onClick={() => setHinhAnhMoi("")}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                            disabled={isProcessing}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">
                                            Kéo và thả hình ảnh vào đây hoặc nhấp để chọn (Tối đa 2MB)
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="fileInputThem"
                                            onChange={handleFileInputChange}
                                            disabled={isProcessing}
                                        />
                                        <label htmlFor="fileInputThem" className="cursor-pointer text-blue-500 hover:underline">
                                            Chọn tệp
                                        </label>
                                    </div>
                                )}
                            </div>
                            {errorsThem.hinhAnh && <p className="text-red-500 text-sm mt-1">{errorsThem.hinhAnh}</p>}
                        </div>
                    </div>
                    <DialogFooter className="flex justify-end space-x-2 mt-4">
                        <Button variant="ghost" onClick={() => setMoModalThem(false)} disabled={isProcessing} className="flex items-center gap-2 bg-[#e7e4f5]">
                            <X className="h-4 w-4" /> Hủy
                        </Button>
                        <Button onClick={themHashTag} disabled={isProcessing} className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2">
                            {isProcessing ? "Đang xử lý..." : "Thêm"}
                            <FaPlus className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={moModalSua} onOpenChange={setMoModalSua}>
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>Sửa Hashtag</DialogTitle>
                        <DialogDescription>Cập nhật thông tin hashtag.</DialogDescription>
                    </DialogHeader>
                    {hashTagDangSua && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hashtag</label>
                                <Input
                                    value={hashTagDangSua.tenHashTag}
                                    onChange={(e) => {
                                        setHashTagDangSua({ ...hashTagDangSua, tenHashTag: e.target.value });
                                        setErrorsSua((prev) => ({ ...prev, ten: "" }));
                                        setErrorMessage("");
                                    }}
                                    placeholder="Tên hashtag"
                                    disabled={isProcessing}
                                />
                                {errorsSua.ten && <p className="text-red-500 text-sm mt-1">{errorsSua.ten}</p>}
                                {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh</label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {hashTagDangSua.hinhAnh ? (
                                        <div className="relative">
                                            <img
                                                src={formatBase64Image(hashTagDangSua.hinhAnh)}
                                                alt="Preview"
                                                className="h-20 w-20 mx-auto object-cover rounded"
                                            />
                                            <button
                                                onClick={() => setHashTagDangSua({ ...hashTagDangSua, hinhAnh: "" })}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                                disabled={isProcessing}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Kéo và thả hình ảnh vào đây hoặc nhấp để chọn (Tối đa 2MB)
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="fileInputSua"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && file.size <= 2 * 1024 * 1024) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setHashTagDangSua({ ...hashTagDangSua, hinhAnh: reader.result as string });
                                                        reader.readAsDataURL(file);
                                                    } else {
                                                        Swal.fire({
                                                            icon: "error",
                                                            title: "Lỗi",
                                                            text: "Hình ảnh phải nhỏ hơn 2MB!",
                                                            timer: 3000,
                                                            timerProgressBar: true,
                                                            showConfirmButton: false,
                                                            showCloseButton: true,
                                                        });
                                                    }
                                                }}
                                                disabled={isProcessing}
                                            />
                                            <label htmlFor="fileInputSua" className="cursor-pointer text-blue-500 hover:underline">
                                                Chọn tệp
                                            </label>
                                        </div>
                                    )}
                                </div>
                                {errorsSua.hinhAnh && <p className="text-red-500 text-sm mt-1">{errorsSua.hinhAnh}</p>}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-end space-x-2 mt-4">
                        <Button variant="ghost" onClick={() => setMoModalSua(false)} disabled={isProcessing} className="flex items-center gap-2 bg-[#e7e4f5]">
                            <X className="h-4 w-4" /> Hủy
                        </Button>
                        <Button onClick={suaHashTag} disabled={isProcessing} className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2">
                            {isProcessing ? "Đang xử lý..." : "Lưu"}
                            <FaEdit className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={moModalChiTiet} onOpenChange={setMoModalChiTiet}>
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>Chi Tiết Hashtag</DialogTitle>
                        <DialogDescription>Thông tin chi tiết của hashtag.</DialogDescription>
                    </DialogHeader>
                    {hashTagChiTiet && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hashtag</label>
                                <Input value={hashTagChiTiet.tenHashTag} disabled />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh</label>
                                {hashTagChiTiet.hinhAnh ? (
                                    <img
                                        src={formatBase64Image(hashTagChiTiet.hinhAnh)}
                                        alt={hashTagChiTiet.tenHashTag}
                                        className="h-20 w-20 object-cover rounded"
                                    />
                                ) : (
                                    <p>Không có hình ảnh</p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-end mt-4">
                        <Button variant="ghost" onClick={() => setMoModalChiTiet(false)} className="flex items-center gap-2 bg-[#e7e4f5]">
                            <X className="h-4 w-4" /> Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={moModalXoa} onOpenChange={setMoModalXoa}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác Nhận Xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa hashtag "{hashTagCanXoa?.tenHashTag}" không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setMoModalXoa(false)} disabled={isProcessing} className="flex items-center gap-2 bg-[#e7e4f5]">
                            <X className="h-4 w-4" /> Hủy
                        </Button>
                        <Button onClick={anHashTag} disabled={isProcessing} className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2">
                            {isProcessing ? "Đang xử lý..." : "Xóa"}
                            <FaTrashAlt className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={moModalKhoiPhuc} onOpenChange={setMoModalKhoiPhuc}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác Nhận Khôi Phục</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn khôi phục hashtag "{hashTagCanKhoiPhuc?.tenHashTag}" không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setMoModalKhoiPhuc(false)} disabled={isProcessing} className="flex items-center gap-2 bg-[#e7e4f5]">
                            <X className="h-4 w-4" /> Hủy
                        </Button>
                        <Button onClick={khoiPhucHashTag} disabled={isProcessing} className="bg-[#9b87f5] text-white hover:bg-[#8a76e3] flex items-center gap-2">
                            {isProcessing ? "Đang xử lý..." : "Khôi phục"}
                            <FaUndo className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={moModalXoaVinhVien} onOpenChange={setMoModalXoaVinhVien}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác Nhận Xóa Vĩnh Viễn</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa vĩnh viễn hashtag "{hashTagCanXoaVinhVien?.tenHashTag}" không? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setMoModalXoaVinhVien(false)} disabled={isProcessing} className="flex items-center gap-2 bg-[#e7e4f5]">
                            <X className="h-4 w-4" /> Hủy
                        </Button>
                        <Button onClick={xoaVinhVienHashTag} disabled={isProcessing} className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2">
                            {isProcessing ? "Đang xử lý..." : "Xóa"}
                            <FaTrash className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminHashTag;