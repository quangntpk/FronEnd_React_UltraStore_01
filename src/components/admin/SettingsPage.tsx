import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Settings2, Moon, Sun, Eye, Plus, Edit, Trash, ChevronLeft, ChevronRight, Calendar, Search, X, Save, Check, Upload, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";

const apiUrl = import.meta.env.VITE_API_URL;

interface GiaoDien {
  maGiaoDien: number;
  tenGiaoDien: string;
  logo: string;
  slider1: string;
  slider2: string;
  slider3: string;
  slider4: string;
  avt: string;
  ngayTao: string;
  trangThai: number;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg relative w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-black hover:text-gray-700"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}> = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold">Xác nhận</h2>
        <p className="mt-4">{message}</p>
        <div className="flex justify-end space-x-4 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="h-5 w-5" /> Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-purple-400 text-white hover:bg-purple-300 flex items-center gap-2"
          >
            <Check className="h-5 w-5" /> Đồng ý
          </Button>
        </div>
      </div>
    </div>
  );
};

const ImageUpload: React.FC<{
  id: string;
  label: string;
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  error?: string;
}> = ({ id, label, currentImage, onImageChange, error }) => {
  const [preview, setPreview] = useState<string | null>(
    currentImage ? `data:image/png;base64,${currentImage}` : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      onImageChange(file);
    } else {
      onImageChange(null);
      setPreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      onImageChange(file);
    } else {
      onImageChange(null);
      setPreview(null);
    }
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center cursor-pointer"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Label htmlFor={id} className="flex items-center justify-center gap-2">
          <Upload className="h-4 w-4" /> {label}
        </Label>
        {preview ? (
          <div className="relative mt-2">
            <img
              src={preview}
              alt="Preview"
              className={
                id === "logo"
                  ? "w-32 h-16 object-cover rounded-md"
                  : id === "avt"
                  ? "w-16 h-16 object-cover rounded-full"
                  : "w-32 h-16 object-cover rounded-md"
              }
            />
            <button
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              onClick={handleRemoveImage}
              aria-label="Xóa ảnh"
            >
              X
            </button>
          </div>
        ) : (
          <p className="text-gray-500">Kéo thả hình ảnh hoặc nhấp để chọn tệp</p>
        )}
        <Input
          type="file"
          id={id}
          name={id}
          accept="image/png,image/jpeg"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const CreateForm: React.FC<{ onSubmit: (formData: FormData) => void; onCancel: () => void }> = ({
  onSubmit,
  onCancel,
}) => {
  const [tenGiaoDien, setTenGiaoDien] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [avt, setAvt] = useState<File | null>(null);
  const [slider1, setSlider1] = useState<File | null>(null);
  const [slider2, setSlider2] = useState<File | null>(null);
  const [slider3, setSlider3] = useState<File | null>(null);
  const [slider4, setSlider4] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tenGiaoDien) newErrors.tenGiaoDien = "Vui lòng nhập tên giao diện";
    else if (tenGiaoDien.length <= 5) newErrors.tenGiaoDien = "Tên giao diện phải trên 5 ký tự";
    if (!logo) newErrors.logo = "Vui lòng chọn ảnh logo";
    if (!avt) newErrors.avt = "Vui lòng chọn ảnh avt";
    if (!slider1) newErrors.slider1 = "Vui lòng chọn ảnh slider1";
    if (!slider2) newErrors.slider2 = "Vui lòng chọn ảnh slider2";
    if (!slider3) newErrors.slider3 = "Vui lòng chọn ảnh slider3";
    if (!slider4) newErrors.slider4 = "Vui lòng chọn ảnh slider4";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append("TenGiaoDien", tenGiaoDien);
    if (logo) formData.append("Logo", logo);
    if (avt) formData.append("Avt", avt);
    if (slider1) formData.append("Slider1", slider1);
    if (slider2) formData.append("Slider2", slider2);
    if (slider3) formData.append("Slider3", slider3);
    if (slider4) formData.append("Slider4", slider4);
    formData.append("TrangThai", "0");

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Thêm Mới Giao Diện</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="tenGiaoDien" className="flex items-center gap-2">
            <Settings2 className="h-6 w-6" /> Tên Giao Diện
          </Label>
          <Input
            id="tenGiaoDien"
            value={tenGiaoDien}
            onChange={(e) => setTenGiaoDien(e.target.value)}
            placeholder="Nhập tên giao diện"
          />
          {errors.tenGiaoDien && <p className="text-red-500 text-sm">{errors.tenGiaoDien}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col space-y-4">
            <ImageUpload id="logo" label="Logo" onImageChange={setLogo} error={errors.logo} />
            <ImageUpload id="avt" label="Avt" onImageChange={setAvt} error={errors.avt} />
          </div>
          <div className="flex flex-col space-y-4">
            <ImageUpload id="slider1" label="Slider 1" onImageChange={setSlider1} error={errors.slider1} />
            <ImageUpload id="slider2" label="Slider 2" onImageChange={setSlider2} error={errors.slider2} />
          </div>
          <div className="flex flex-col space-y-4">
            <ImageUpload id="slider3" label="Slider 3" onImageChange={setSlider3} error={errors.slider3} />
            <ImageUpload id="slider4" label="Slider 4" onImageChange={setSlider4} error={errors.slider4} />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Hủy
        </Button>
        <Button
          type="submit"
          className="bg-purple-400 text-white hover:bg-purple-300 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Thêm
        </Button>
      </div>
    </form>
  );
};

const EditForm: React.FC<{
  giaoDien: GiaoDien;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}> = ({ giaoDien, onSubmit, onCancel }) => {
  const [tenGiaoDien, setTenGiaoDien] = useState(giaoDien.tenGiaoDien || "");
  const [logo, setLogo] = useState<File | null>(null);
  const [avt, setAvt] = useState<File | null>(null);
  const [slider1, setSlider1] = useState<File | null>(null);
  const [slider2, setSlider2] = useState<File | null>(null);
  const [slider3, setSlider3] = useState<File | null>(null);
  const [slider4, setSlider4] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tenGiaoDien) newErrors.tenGiaoDien = "Vui lòng nhập tên giao diện";
    else if (tenGiaoDien.length <= 5) newErrors.tenGiaoDien = "Tên giao diện phải trên 5 ký tự";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append("MaGiaoDien", giaoDien.maGiaoDien.toString());
    formData.append("TenGiaoDien", tenGiaoDien);
    formData.append("TrangThai", giaoDien.trangThai.toString());
    if (logo) formData.append("Logo", logo);
    if (avt) formData.append("Avt", avt);
    if (slider1) formData.append("Slider1", slider1);
    if (slider2) formData.append("Slider2", slider2);
    if (slider3) formData.append("Slider3", slider3);
    if (slider4) formData.append("Slider4", slider4);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Chỉnh Sửa Giao Diện</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="tenGiaoDien" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Tên Giao Diện
          </Label>
          <Input
            id="tenGiaoDien"
            value={tenGiaoDien}
            onChange={(e) => setTenGiaoDien(e.target.value)}
            placeholder="Nhập tên giao diện"
          />
          {errors.tenGiaoDien && <p className="text-red-500 text-sm">{errors.tenGiaoDien}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col space-y-4">
            <ImageUpload id="logo" label="Logo" currentImage={giaoDien.logo} onImageChange={setLogo} error={errors.logo} />
            <ImageUpload id="avt" label="Avt" currentImage={giaoDien.avt} onImageChange={setAvt} error={errors.avt} />
          </div>
          <div className="flex flex-col space-y-4">
            <ImageUpload id="slider1" label="Slider 1" currentImage={giaoDien.slider1} onImageChange={setSlider1} error={errors.slider1} />
            <ImageUpload id="slider2" label="Slider 2" currentImage={giaoDien.slider2} onImageChange={setSlider2} error={errors.slider2} />
          </div>
          <div className="flex flex-col space-y-4">
            <ImageUpload id="slider3" label="Slider 3" currentImage={giaoDien.slider3} onImageChange={setSlider3} error={errors.slider3} />
            <ImageUpload id="slider4" label="Slider 4" currentImage={giaoDien.slider4} onImageChange={setSlider4} error={errors.slider4} />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Hủy
        </Button>
        <Button
          type="submit"
          className="bg-purple-400 text-white hover:bg-purple-300 flex items-center gap-2"
        >
          <Save className="h-5 w-5" /> Cập nhật
        </Button>
      </div>
    </form>
  );
};

const HideConfirmation: React.FC<{
  giaoDien: GiaoDien;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ giaoDien, onConfirm, onCancel }) => {
  return (
    <div className="space-y-4 min-h-[150px]">
      <h2 className="text-xl font-bold">Xác nhận xóa Giao Diện</h2>
      <p>Bạn có chắc chắn muốn xóa giao diện {giaoDien.tenGiaoDien} không?</p>
      <div className="flex justify-end space-x-4 mt-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Hủy
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-purple-400 text-white hover:bg-purple-300 flex items-center gap-2"
        >
          <Trash className="h-5 w-5" /> Xóa
        </Button>
      </div>
    </div>
  );
};

const RestoreConfirmation: React.FC<{
  giaoDien: GiaoDien;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ giaoDien, onConfirm, onCancel }) => {
  return (
    <div className="space-y-4 min-h-[150px]">
      <h2 className="text-xl font-bold">Xác nhận khôi phục Giao Diện</h2>
      <p>Bạn có chắc chắn muốn khôi phục giao diện {giaoDien.tenGiaoDien} không?</p>
      <div className="flex justify-end space-x-4 mt-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Hủy
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-purple-400 text-white hover:bg-purple-300 flex items-center gap-2"
        >
          <RotateCcw className="h-5 w-5" /> Khôi phục
        </Button>
      </div>
    </div>
  );
};

const DeleteConfirmation: React.FC<{
  giaoDien: GiaoDien;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ giaoDien, onConfirm, onCancel }) => {
  return (
    <div className="space-y-4 min-h-[150px]">
      <h2 className="text-xl font-bold">Xác nhận xóa vĩnh viễn Giao Diện</h2>
      <p>Bạn có chắc chắn muốn xóa vĩnh viễn giao diện {giaoDien.tenGiaoDien} không?</p>
      <div className="flex justify-end space-x-4 mt-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Hủy
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-purple-400 text-white hover:bg-purple-300 flex items-center gap-2"
        >
          <Trash className="h-5 w-5" /> Xóa
        </Button>
      </div>
    </div>
  );
};

const DetailForm: React.FC<{ giaoDien: GiaoDien; onClose: () => void }> = ({ giaoDien, onClose }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Chi Tiết Giao Diện</h2>
      <p><strong>Tên Giao Diện:</strong> {giaoDien.tenGiaoDien}</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center space-y-4">
          <div>
            <p className="text-sm font-medium">Logo</p>
            <img src={`data:image/png;base64,${giaoDien.logo}`} alt="Logo" className="w-32 h-32 object-cover rounded-md" />
          </div>
          <div>
            <p className="text-sm font-medium">Avt</p>
            <img src={`data:image/png;base64,${giaoDien.avt}`} alt="Avatar" className="w-32 h-32 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div>
            <p className="text-sm font-medium">Slider 1</p>
            <img src={`data:image/png;base64,${giaoDien.slider1}`} alt="Slider1" className="w-32 h-32 object-cover rounded-md" />
          </div>
          <div>
            <p className="text-sm font-medium">Slider 2</p>
            <img src={`data:image/png;base64,${giaoDien.slider2}`} alt="Slider2" className="w-32 h-32 object-cover rounded-md" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div>
            <p className="text-sm font-medium">Slider 3</p>
            <img src={`data:image/png;base64,${giaoDien.slider3}`} alt="Slider3" className="w-32 h-32 object-cover rounded-md" />
          </div>
          <div>
            <p className="text-sm font-medium">Slider 4</p>
            <img src={`data:image/png;base64,${giaoDien.slider4}`} alt="Slider4" className="w-32 h-32 object-cover rounded-md" />
          </div>
        </div>
      </div>
      <p><strong>Trạng thái:</strong> {giaoDien.trangThai === 1 ? "Hoạt động" : giaoDien.trangThai === 0 ? "Không hoạt động" : "Ẩn"}</p>
      <p><strong>Ngày tạo:</strong> {new Date(giaoDien.ngayTao).toLocaleDateString()}</p>
      <div className="flex justify-end">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Đóng
        </Button>
      </div>
    </div>
  );
};

const removeDiacritics = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [brightness, setBrightness] = useState(100);
  const [colorScheme, setColorScheme] = useState<"default" | "warm" | "cool">("default");

  const [giaoDiens, setGiaoDiens] = useState<GiaoDien[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "hide" | "detail" | "confirm" | "restore" | "delete" | null>(null);
  const [selectedGiaoDien, setSelectedGiaoDien] = useState<GiaoDien | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTrangThai, setSearchTrangThai] = useState("");
  const [showDateSearch, setShowDateSearch] = useState<boolean>(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`;
    return () => {
      document.documentElement.style.filter = "";
    };
  }, [brightness]);

  useEffect(() => {
    document.documentElement.classList.remove("color-scheme-warm", "color-scheme-cool");
    if (colorScheme === "warm") {
      document.documentElement.classList.add("color-scheme-warm");
    } else if (colorScheme === "cool") {
      document.documentElement.classList.add("color-scheme-cool");
    }
  }, [colorScheme]);

  const fetchGiaoDiens = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/GiaoDien`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không thể tải dữ liệu: ${errorText}`);
      }
      const data: GiaoDien[] = await response.json();
      const sortedData = data.sort((a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime());
      setGiaoDiens(sortedData);
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi khi tải danh sách giao diện.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiaoDiens();
  }, []);

  const handleCreate = async (formData: FormData) => {
    try {
      const response = await fetch(`${apiUrl}/api/GiaoDien`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo giao diện: ${errorText}`);
      }
      setIsModalOpen(false);
      setModalMode(null);
      fetchGiaoDiens();
      Swal.fire({
        title: "Thành công!",
        text: "Tạo giao diện thành công",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      setCurrentPage(1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi tạo giao diện.";
      setError(errorMessage);
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!selectedGiaoDien) return;
    try {
      const response = await fetch(`${apiUrl}/api/GiaoDien/${selectedGiaoDien.maGiaoDien}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi cập nhật: ${errorText}`);
      }
      setIsModalOpen(false);
      setModalMode(null);
      setSelectedGiaoDien(null);
      fetchGiaoDiens();
      Swal.fire({
        title: "Thành công!",
        text: "Cập nhật giao diện thành công",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi cập nhật giao diện.";
      setError(errorMessage);
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleHide = async () => {
    if (!selectedGiaoDien) return;

    if (selectedGiaoDien.trangThai === 1) {
      setIsModalOpen(false);
      setModalMode(null);
      setSelectedGiaoDien(null);
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể xóa giao diện đang ở trạng thái hoạt động. Vui lòng chọn giao diện khác để kích hoạt trước khi xóa giao diện này.",
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("MaGiaoDien", selectedGiaoDien.maGiaoDien.toString());
      formData.append("TenGiaoDien", selectedGiaoDien.tenGiaoDien);
      formData.append("TrangThai", "2");
      const response = await fetch(`${apiUrl}/api/GiaoDien/${selectedGiaoDien.maGiaoDien}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi xóa giao diện: ${errorText}`);
      }
      setIsModalOpen(false);
      setModalMode(null);
      setSelectedGiaoDien(null);
      fetchGiaoDiens();
      Swal.fire({
        title: "Thành công!",
        text: "xóa giao diện thành công",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      const totalItems = giaoDiens.filter(gd => gd.trangThai !== 2).length - 1;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages) {
        setCurrentPage(totalPages || 1);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi xóa giao diện.";
      setError(errorMessage);
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleRestore = async () => {
    if (!selectedGiaoDien) return;
    try {
      const formData = new FormData();
      formData.append("MaGiaoDien", selectedGiaoDien.maGiaoDien.toString());
      formData.append("TenGiaoDien", selectedGiaoDien.tenGiaoDien);
      formData.append("TrangThai", "0");
      const response = await fetch(`${apiUrl}/api/GiaoDien/${selectedGiaoDien.maGiaoDien}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi khôi phục giao diện: ${errorText}`);
      }
      setIsModalOpen(false);
      setModalMode(null);
      setSelectedGiaoDien(null);
      fetchGiaoDiens();
      Swal.fire({
        title: "Thành công!",
        text: "Khôi phục giao diện thành công",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      const totalItems = giaoDiens.filter(gd => gd.trangThai === 2).length - 1;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages) {
        setCurrentPage(totalPages || 1);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi khôi phục giao diện.";
      setError(errorMessage);
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedGiaoDien) return;
    try {
      const response = await fetch(`${apiUrl}/api/GiaoDien/${selectedGiaoDien.maGiaoDien}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi xóa vĩnh viễn: ${errorText}`);
      }
      setIsModalOpen(false);
      setModalMode(null);
      setSelectedGiaoDien(null);
      fetchGiaoDiens();
      Swal.fire({
        title: "Thành công!",
        text: "Xóa giao diện vĩnh viễn thành công",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      const totalItems = giaoDiens.filter(gd => gd.trangThai === 2).length - 1;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages) {
        setCurrentPage(totalPages || 1);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi xóa vĩnh viễn giao diện.";
      setError(errorMessage);
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleSetActive = async (maGiaoDien: number) => {
    try {
      const response = await fetch(`${apiUrl}/api/GiaoDien/SetActive/${maGiaoDien}`, {
        method: "PUT",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi cập nhật trạng thái: ${errorText}`);
      }
      setIsModalOpen(false);
      setModalMode(null);
      setSelectedGiaoDien(null);
      fetchGiaoDiens();
      Swal.fire({
        title: "Thành công!",
        text: "Cập nhật trạng thái thành công",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái.";
      setError(errorMessage);
      Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const openConfirmModal = (giaoDien: GiaoDien) => {
    setSelectedGiaoDien(giaoDien);
    setConfirmMessage(`Bạn có muốn chuyển sang giao diện ${giaoDien.tenGiaoDien} không?`);
    setModalMode("confirm");
    setIsModalOpen(true);
  };

  const confirmSetActive = () => {
    if (selectedGiaoDien) {
      handleSetActive(selectedGiaoDien.maGiaoDien);
    }
  };

  const openCreateMode = () => {
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditMode = (giaoDien: GiaoDien) => {
    setSelectedGiaoDien(giaoDien);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openHideMode = (giaoDien: GiaoDien) => {
    setSelectedGiaoDien(giaoDien);
    setModalMode("hide");
    setIsModalOpen(true);
  };

  const openRestoreMode = (giaoDien: GiaoDien) => {
    setSelectedGiaoDien(giaoDien);
    setModalMode("restore");
    setIsModalOpen(true);
  };

  const openDeleteMode = (giaoDien: GiaoDien) => {
    setSelectedGiaoDien(giaoDien);
    setModalMode("delete");
    setIsModalOpen(true);
  };

  const openDetailMode = (giaoDien: GiaoDien) => {
    setSelectedGiaoDien(giaoDien);
    setModalMode("detail");
    setIsModalOpen(true);
  };

  const filteredGiaoDiens = giaoDiens.filter((gd) => {
    const searchLower = removeDiacritics(searchTerm.toLowerCase());
    const tenGiaoDienNormalized = removeDiacritics(gd.tenGiaoDien.toLowerCase());
    const ngayTaoNormalized = removeDiacritics(new Date(gd.ngayTao).toLocaleDateString().toLowerCase());
    const matchesSearch =
      tenGiaoDienNormalized.includes(searchLower) ||
      gd.maGiaoDien.toString().includes(searchLower) ||
      ngayTaoNormalized.includes(searchLower);
    const matchesTrangThai = searchTrangThai === "" || gd.trangThai.toString() === searchTrangThai;
    const ngayTaoDate = new Date(gd.ngayTao).getTime();
    const startDateTime = startDate ? new Date(startDate).getTime() : -Infinity;
    const endDateTime = endDate ? new Date(endDate).getTime() : Infinity;
    const matchesDate = ngayTaoDate >= startDateTime && ngayTaoDate <= endDateTime;
    return matchesSearch && matchesTrangThai && matchesDate && (gd.trangThai === 0 || gd.trangThai === 1);
  });

  const filteredHiddenGiaoDiens = giaoDiens.filter((gd) => {
    const searchLower = removeDiacritics(searchTerm.toLowerCase());
    const tenGiaoDienNormalized = removeDiacritics(gd.tenGiaoDien.toLowerCase());
    const ngayTaoNormalized = removeDiacritics(new Date(gd.ngayTao).toLocaleDateString().toLowerCase());
    const matchesSearch =
      tenGiaoDienNormalized.includes(searchLower) ||
      gd.maGiaoDien.toString().includes(searchLower) ||
      ngayTaoNormalized.includes(searchLower);
    const matchesTrangThai = searchTrangThai === "" || gd.trangThai.toString() === searchTrangThai;
    const ngayTaoDate = new Date(gd.ngayTao).getTime();
    const startDateTime = startDate ? new Date(startDate).getTime() : -Infinity;
    const endDateTime = endDate ? new Date(endDate).getTime() : Infinity;
    const matchesDate = ngayTaoDate >= startDateTime && ngayTaoDate <= endDateTime;
    return matchesSearch && matchesTrangThai && matchesDate && gd.trangThai === 2;
  });

  const totalItems = filteredGiaoDiens.length;
  const totalHiddenItems = filteredHiddenGiaoDiens.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const totalHiddenPages = Math.ceil(totalHiddenItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGiaoDiens = filteredGiaoDiens.slice(startIndex, endIndex);
  const currentHiddenGiaoDiens = filteredHiddenGiaoDiens.slice(startIndex, endIndex);

  const handlePageChange = (page: number, isHiddenTab: boolean) => {
    if (page >= 1 && page <= (isHiddenTab ? totalHiddenPages : totalPages)) {
      setCurrentPage(page);
    }
  };

  const toggleDateSearch = () => {
    setShowDateSearch(!showDateSearch);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản Lý Cài đặt</h2>
        <Button onClick={openCreateMode}>
          <Plus className="mr-2 h-4 w-4" /> Thêm Giao diện
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3 gap-1">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Giao diện
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Khôi phục
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Màu sắc
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Màu sắc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="theme">Chế độ giao diện</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex items-center gap-1"
                    >
                      <Sun className="h-4 w-4" /> Sáng
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex items-center gap-1"
                    >
                      <Moon className="h-4 w-4" /> Tối
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="brightness">Độ sáng ({brightness}%)</Label>
                </div>
                <Slider
                  id="brightness"
                  min={50}
                  max={150}
                  step={5}
                  defaultValue={[100]}
                  onValueChange={(value) => setBrightness(value[0])}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Bảng màu</Label>
                <div className="flex flex-col space-y-2 pt-1">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="default"
                      id="default"
                      checked={colorScheme === "default"}
                      onChange={() => setColorScheme("default")}
                    />
                    <Label htmlFor="default" className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-crocus-500 mr-2"></span>
                      Mặc định
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="warm"
                      id="warm"
                      checked={colorScheme === "warm"}
                      onChange={() => setColorScheme("warm")}
                    />
                    <Label htmlFor="warm" className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-amber-500 mr-2"></span>
                      Ấm
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="cool"
                      id="cool"
                      checked={colorScheme === "cool"}
                      onChange={() => setColorScheme("cool")}
                    />
                    <Label htmlFor="cool" className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-cyan-500 mr-2"></span>
                      Mát
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4 rounded-lg">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="searchTerm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm giao diện..."
                      className="w-full pl-10 pr-10"
                    />
                    <Button
                      variant="ghost"
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-10 p-0"
                      onClick={toggleDateSearch}
                    >
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </Button>
                  </div>
                </div>
                <div className="ml-auto">
                  <select
                    id="searchTrangThai"
                    value={searchTrangThai}
                    onChange={(e) => setSearchTrangThai(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Hoạt động</option>
                    <option value="0">Không hoạt động</option>
                  </select>
                </div>
              </div>

              {showDateSearch && (
                <div className="p-4 bg-gray-50 rounded-lg shadow-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Từ ngày
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Đến ngày
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {filteredGiaoDiens.length === 0 ? (
                  <p className="text-center text-gray-500">Không có giao diện nào để hiển thị.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentGiaoDiens.map((gd) => (
                        <Card key={gd.maGiaoDien} className={gd.trangThai === 1 ? "border-2 border-purple-500 relative" : "relative"}>
                          <CardContent className="pt-6">
                            <p className="text-lg font-semibold mb-4">Tên Giao Diện: {gd.tenGiaoDien}</p>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col items-center space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Logo</p>
                                  <img src={`data:image/png;base64,${gd.logo}`} alt="Logo" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Avt</p>
                                  <img src={`data:image/png;base64,${gd.avt}`} alt="Avatar" className="w-32 h-32 rounded-full" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Slider 1</p>
                                  <img src={`data:image/png;base64,${gd.slider1}`} alt="Slider1" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Slider 2</p>
                                  <img src={`data:image/png;base64,${gd.slider2}`} alt="Slider2" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Slider 3</p>
                                  <img src={`data:image/png;base64,${gd.slider3}`} alt="Slider3" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Slider 4</p>
                                  <img src={`data:image/png;base64,${gd.slider4}`} alt="Slider4" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <div className="flex justify-between items-center mt-4 px-6 pb-6">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={gd.trangThai === 1}
                                onChange={() => openConfirmModal(gd)}
                                className="w-8 h-8 text-purple-400 border-2 border-gray-300 rounded focus:ring-purple-500"
                              />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-2xl">
                                  <div className="flex flex-col space-y-1">
                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                  </div>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bottom-0 mb-2">
                                <DropdownMenuItem onClick={() => openDetailMode(gd)} className="text-green-700">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditMode(gd)} className="text-blue-700">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openHideMode(gd)} className="text-red-700">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <Button
                          onClick={() => handlePageChange(currentPage - 1, false)}
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
                            onClick={() => handlePageChange(page, false)}
                            variant={currentPage === page ? "default" : "outline"}
                            className={currentPage === page ? "bg-purple-400 text-white hover:bg-purple-300" : ""}
                          >
                            {page}
                          </Button>
                        ))}

                        <Button
                          onClick={() => handlePageChange(currentPage + 1, false)}
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
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4 mt-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4 rounded-lg">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="searchTerm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm giao diện..."
                      className="w-full pl-10 pr-10"
                    />
                    <Button
                      variant="ghost"
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-10 p-0"
                      onClick={toggleDateSearch}
                    >
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </Button>
                  </div>
                </div>
                <div className="ml-auto">
                  <select
                    id="searchTrangThai"
                    value={searchTrangThai}
                    onChange={(e) => setSearchTrangThai(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Tất cả trạng thái</option>
                  </select>
                </div>
              </div>

              {showDateSearch && (
                <div className="p-4 bg-gray-50 rounded-lg shadow-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Từ ngày
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Đến ngày
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {filteredHiddenGiaoDiens.length === 0 ? (
                  <p className="text-center text-gray-500">Không có giao diện nào để hiển thị.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentHiddenGiaoDiens.map((gd) => (
                        <Card key={gd.maGiaoDien} className="relative">
                          <CardContent className="pt-6">
                            <p className="text-lg font-semibold mb-4">Tên Giao Diện: {gd.tenGiaoDien}</p>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col items-center space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Logo</p>
                                  <img src={`data:image/png;base64,${gd.logo}`} alt="Logo" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Avt</p>
                                  <img src={`data:image/png;base64,${gd.avt}`} alt="Avatar" className="w-32 h-32 rounded-full" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Slider 1</p>
                                  <img src={`data:image/png;base64,${gd.slider1}`} alt="Slider1" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Slider 2</p>
                                  <img src={`data:image/png;base64,${gd.slider2}`} alt="Slider2" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Slider 3</p>
                                  <img src={`data:image/png;base64,${gd.slider3}`} alt="Slider3" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Slider 4</p>
                                  <img src={`data:image/png;base64,${gd.slider4}`} alt="Slider4" className="w-32 h-32 object-cover rounded-md" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <div className="flex justify-between items-center mt-4 px-6 pb-6">
                            <div className="flex items-center"></div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-2xl">
                                  <div className="flex flex-col space-y-1">
                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                  </div>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bottom-0 mb-2">
                                <DropdownMenuItem onClick={() => openDetailMode(gd)} className="text-green-700">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRestoreMode(gd)} className="text-blue-700">
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Khôi phục
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteMode(gd)} className="text-red-700">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Xóa vĩnh viễn
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {totalHiddenPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <Button
                          onClick={() => handlePageChange(currentPage - 1, true)}
                          disabled={currentPage === 1}
                          variant="outline"
                          className="flex items-center"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Trước
                        </Button>

                        {Array.from({ length: totalHiddenPages }, (_, index) => index + 1).map((page) => (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page, true)}
                            variant={currentPage === page ? "default" : "outline"}
                            className={currentPage === page ? "bg-purple-400 text-white hover:bg-purple-300" : ""}
                          >
                            {page}
                          </Button>
                        ))}

                        <Button
                          onClick={() => handlePageChange(currentPage + 1, true)}
                          disabled={currentPage === totalHiddenPages}
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
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Modal isOpen={isModalOpen && modalMode !== "confirm"} onClose={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}>
        {modalMode === "create" && (
          <CreateForm onSubmit={handleCreate} onCancel={() => { setIsModalOpen(false); setModalMode(null); }} />
        )}
        {modalMode === "edit" && selectedGiaoDien && (
          <EditForm
            giaoDien={selectedGiaoDien}
            onSubmit={handleUpdate}
            onCancel={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}
          />
        )}
        {modalMode === "hide" && selectedGiaoDien && (
          <HideConfirmation
            giaoDien={selectedGiaoDien}
            onConfirm={handleHide}
            onCancel={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}
          />
        )}
        {modalMode === "restore" && selectedGiaoDien && (
          <RestoreConfirmation
            giaoDien={selectedGiaoDien}
            onConfirm={handleRestore}
            onCancel={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}
          />
        )}
        {modalMode === "delete" && selectedGiaoDien && (
          <DeleteConfirmation
            giaoDien={selectedGiaoDien}
            onConfirm={handleDelete}
            onCancel={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}
          />
        )}
        {modalMode === "detail" && selectedGiaoDien && (
          <DetailForm
            giaoDien={selectedGiaoDien}
            onClose={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}
          />
        )}
      </Modal>

      {modalMode === "confirm" && (
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setModalMode(null); setSelectedGiaoDien(null); }}
          onConfirm={confirmSetActive}
          message={confirmMessage}
        />
      )}
    </div>
  );
}
