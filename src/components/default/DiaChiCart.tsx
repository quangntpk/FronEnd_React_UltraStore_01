import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import Select from "react-select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Province { ProvinceID: number; ProvinceName: string; }
interface District { DistrictID: number; DistrictName: string; }
interface Ward { WardCode: string; WardName: string; }
interface DiaChi {
    maNguoiDung: string;
    hoTen: string;
    sdt: string;
    diaChi: string;
    phuongXa: string;
    quanHuyen: string;
    tinh: string;
    trangThai: number;
}
interface FormErrors {
    hoTen?: string;
    sdt?: string;
    tinh?: string;
    quanHuyen?: string;
    phuongXa?: string;
    diaChi?: string;
}
interface ProvinceResponse {
    provinceID: number;
    provinceName: string;
}
interface DistrictResponse {
    districtID: number;
    districtName: string;
}
interface WardResponse {
    wardCode: string;
    wardName: string;
}

const shippingData = {
    "Hà Nội": { fee: 40000, time: "3 - 5 ngày" },
    "TP. Hồ Chí Minh": { fee: 20000, time: "2 - 3 ngày" },
    "Yên Bái": { fee: 50000, time: "4 - 6 ngày" },
};

const AddressForm = ({
    diaChi,
    onSubmit,
    onCancel,
    provinces,
    districts,
    wards,
    selectedProvince,
    setSelectedProvince,
    selectedDistrict,
    setSelectedDistrict,
    selectedWard,
    setSelectedWard,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards,
    formErrors,
}: {
    diaChi: Partial<DiaChi>;
    onSubmit: (data: Partial<DiaChi>) => void;
    onCancel: () => void;
    provinces: Province[];
    districts: District[];
    wards: Ward[];
    selectedProvince: Province | null;
    setSelectedProvince: (value: Province | null) => void;
    selectedDistrict: District | null;
    setSelectedDistrict: (value: District | null) => void;
    selectedWard: Ward | null;
    setSelectedWard: (value: Ward | null) => void;
    isLoadingProvinces: boolean;
    isLoadingDistricts: boolean;
    isLoadingWards: boolean;
    formErrors: FormErrors;
}) => {
    const [formData, setFormData] = useState<Partial<DiaChi>>(diaChi);

    useEffect(() => {
        setFormData(diaChi);
    }, [diaChi]);

    const handleChange = (field: keyof DiaChi, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePhoneNumberKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const charCode = e.charCode;
        if (charCode < 48 || charCode > 57) {
            e.preventDefault();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const shippingInfo = selectedProvince ? shippingData[selectedProvince.ProvinceName] : null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#9b87f5] mb-4">Thêm địa chỉ mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="hoTen" className="block text-sm font-medium text-gray-700">
                        Họ tên
                    </Label>
                    <Input
                        id="hoTen"
                        value={formData.hoTen || ""}
                        onChange={(e) => handleChange("hoTen", e.target.value)}
                        placeholder="Nhập họ tên"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] transition-colors ${formErrors.hoTen ? "border-red-500" : "border-gray-300"
                            }`}
                    />
                    {formErrors.hoTen && <p className="mt-1 text-sm text-red-500">{formErrors.hoTen}</p>}
                </div>
                <div>
                    <Label htmlFor="sdt" className="block text-sm font-medium text-gray-700">
                        Số điện thoại
                    </Label>
                    <Input
                        id="sdt"
                        type="tel"
                        maxLength={10}
                        value={formData.sdt || ""}
                        onChange={(e) => handleChange("sdt", e.target.value)}
                        onKeyPress={handlePhoneNumberKeyPress}
                        placeholder="Nhập số điện thoại"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] transition-colors ${formErrors.sdt ? "border-red-500" : "border-gray-300"
                            }`}
                    />
                    {formErrors.sdt && <p className="mt-1 text-sm text-red-500">{formErrors.sdt}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="tinh" className="block text-sm font-medium text-gray-700">
                        Tỉnh/Thành phố
                    </Label>
                    <Select
                        options={provinces}
                        getOptionLabel={(option: Province) => option.ProvinceName}
                        getOptionValue={(option: Province) => option.ProvinceID.toString()}
                        value={selectedProvince}
                        onChange={(option: Province | null) => setSelectedProvince(option)}
                        placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"}
                        isDisabled={isLoadingProvinces}
                        isSearchable
                        isClearable
                        className={`w-full ${formErrors.tinh ? "border-red-500" : ""}`}
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formErrors.tinh ? "#ef4444" : base.borderColor,
                                "&:hover": { borderColor: formErrors.tinh ? "#ef4444" : "#a1a1aa" },
                                boxShadow: "none",
                                "&:focus-within": { borderColor: "#9b87f5", boxShadow: "0 0 0 2px rgba(155, 135, 245, 0.5)" },
                            }),
                            singleValue: (base) => ({ ...base, color: "#1f2937" }),
                            placeholder: (base) => ({ ...base, color: "#9ca3af" }),
                            menu: (base) => ({ ...base, zIndex: 50 }),
                        }}
                    />
                    {formErrors.tinh && <p className="mt-1 text-sm text-red-500">{formErrors.tinh}</p>}
                </div>
                <div>
                    <Label htmlFor="quanHuyen" className="block text-sm font-medium text-gray-700">
                        Quận/Huyện
                    </Label>
                    <Select
                        options={districts}
                        getOptionLabel={(option: District) => option.DistrictName}
                        getOptionValue={(option: District) => option.DistrictID.toString()}
                        value={selectedDistrict}
                        onChange={(option: District | null) => setSelectedDistrict(option)}
                        placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
                        isDisabled={!selectedProvince || isLoadingDistricts}
                        isSearchable
                        isClearable
                        className={`w-full ${formErrors.quanHuyen ? "border-red-500" : ""}`}
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formErrors.quanHuyen ? "#ef4444" : base.borderColor,
                                "&:hover": { borderColor: formErrors.quanHuyen ? "#ef4444" : "#a1a1aa" },
                                boxShadow: "none",
                                "&:focus-within": { borderColor: "#9b87f5", boxShadow: "0 0 0 2px rgba(155, 135, 245, 0.5)" },
                            }),
                            singleValue: (base) => ({ ...base, color: "#1f2937" }),
                            placeholder: (base) => ({ ...base, color: "#9ca3af" }),
                            menu: (base) => ({ ...base, zIndex: 50 }),
                        }}
                    />
                    {formErrors.quanHuyen && <p className="mt-1 text-sm text-red-500">{formErrors.quanHuyen}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="phuongXa" className="block text-sm font-medium text-gray-700">
                        Phường/Xã
                    </Label>
                    <Select
                        options={wards}
                        getOptionLabel={(option: Ward) => option.WardName}
                        getOptionValue={(option: Ward) => option.WardCode}
                        value={selectedWard}
                        onChange={(option: Ward | null) => setSelectedWard(option)}
                        placeholder={isLoadingWards ? "Đang tải..." : "Chọn phường/xã"}
                        isDisabled={!selectedDistrict || isLoadingWards}
                        isSearchable
                        isClearable
                        className={`w-full ${formErrors.phuongXa ? "border-red-500" : ""}`}
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formErrors.phuongXa ? "#ef4444" : base.borderColor,
                                "&:hover": { borderColor: formErrors.phuongXa ? "#ef4444" : "#a1a1aa" },
                                boxShadow: "none",
                                "&:focus-within": { borderColor: "#9b87f5", boxShadow: "0 0 0 2px rgba(155, 135, 245, 0.5)" },
                            }),
                            singleValue: (base) => ({ ...base, color: "#1f2937" }),
                            placeholder: (base) => ({ ...base, color: "#9ca3af" }),
                            menu: (base) => ({ ...base, zIndex: 50 }),
                        }}
                    />
                    {formErrors.phuongXa && <p className="mt-1 text-sm text-red-500">{formErrors.phuongXa}</p>}
                </div>
                <div>
                    <Label htmlFor="diaChi" className="block text-sm font-medium text-gray-700">
                        Địa chỉ chi tiết
                    </Label>
                    <Input
                        id="diaChi"
                        value={formData.diaChi || ""}
                        onChange={(e) => handleChange("diaChi", e.target.value)}
                        placeholder="Nhập địa chỉ chi tiết"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] transition-colors ${formErrors.diaChi ? "border-red-500" : "border-gray-300"
                            }`}
                    />
                    {formErrors.diaChi && <p className="mt-1 text-sm text-red-500">{formErrors.diaChi}</p>}
                </div>
            </div>
            {shippingInfo && selectedWard && (
                <div className="p-4 bg-gray-50 rounded-lg mt-4">
                    <p className="text-sm text-gray-700">
                        <strong>Phí giao hàng:</strong> {shippingInfo.fee.toLocalecompletLocaleString()} VND
                    </p>
                    <p className="text-sm text-gray-700">
                        <strong>Thời gian giao hàng:</strong> {shippingInfo.time}
                    </p>
                </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                    <X className="mr-2 h-4 w-4" /> Hủy
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center px-4 py-2 bg-[#9b87f5] text-white hover:bg-[#8a76e4] transition-colors"
                >
                    <ChevronUp className="mr-2 h-4 w-4" /> Thêm địa chỉ
                </Button>
            </div>
        </div>
    );
};

const DiaChiCart = () => {
    const [newDiaChi, setNewDiaChi] = useState<Partial<DiaChi>>({ trangThai: 1 });
    const [maNguoiDung, setMaNguoiDung] = useState<string | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
    const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState<boolean>(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
    const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5261";

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    useEffect(() => {
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true);
            try {
                const response = await fetch(`${API_URL}/api/GHN/provinces`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: ProvinceResponse[] = await response.json();
                const transformedProvinces = data.map((item) => ({
                    ProvinceID: item.provinceID,
                    ProvinceName: item.provinceName,
                }));
                setProvinces(transformedProvinces);
            } catch (error) {
                console.error("Error fetching provinces:", error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể lấy danh sách tỉnh/thành phố",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    showCloseButton: true,
                });
            } finally {
                setIsLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, [API_URL]);

    useEffect(() => {
        if (!selectedProvince?.ProvinceID) {
            setDistricts([]);
            setWards([]);
            setSelectedDistrict(null);
            setSelectedWard(null);
            return;
        }

        const fetchDistricts = async () => {
            setIsLoadingDistricts(true);
            try {
                const response = await fetch(`${API_URL}/api/GHN/districts/${selectedProvince.ProvinceID}`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: DistrictResponse[] = await response.json();
                const transformedDistricts = data.map((item) => ({
                    DistrictID: item.districtID,
                    DistrictName: item.districtName,
                }));
                setDistricts(transformedDistricts);
                setWards([]);
                setSelectedDistrict(null);
                setSelectedWard(null);
            } catch (error) {
                console.error("Error fetching districts:", error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể lấy danh sách quận/huyện",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    showCloseButton: true,
                });
            } finally {
                setIsLoadingDistricts(false);
            }
        };
        fetchDistricts();
    }, [selectedProvince, API_URL]);

    useEffect(() => {
        if (!selectedDistrict?.DistrictID) {
            setWards([]);
            setSelectedWard(null);
            return;
        }

        const fetchWards = async () => {
            setIsLoadingWards(true);
            try {
                const response = await fetch(`${API_URL}/api/GHN/wards/${selectedDistrict.DistrictID}`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: WardResponse[] = await response.json();
                const transformedWards = data.map((item) => ({
                    WardCode: item.wardCode,
                    WardName: item.wardName,
                }));
                setWards(transformedWards);
                setSelectedWard(null);
            } catch (error) {
                console.error("Error fetching wards:", error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể lấy danh sách phường/xã",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    showCloseButton: true,
                });
            } finally {
                setIsLoadingWards(false);
            }
        };
        fetchWards();
    }, [selectedDistrict, API_URL]);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setMaNguoiDung(parsedUser.maNguoiDung);
            } catch (error) {
                console.error("Error parsing user data:", error);
                setIsFormOpen(false);
            }
        } else {
            setIsFormOpen(false);
        }
    }, []);

    useEffect(() => {
        const { state } = location;
        const savedShowAddressModal = localStorage.getItem("showAddressModal");
        if (state?.showAddressModal || savedShowAddressModal === "true") {
            setNewDiaChi({ trangThai: 1 });
            setSelectedProvince(null);
            setSelectedDistrict(null);
            setSelectedWard(null);
            setDistricts([]);
            setWards([]);
            setFormErrors({});
            setIsFormOpen(true);
            localStorage.removeItem("showAddressModal");
        }
    }, [location]);

    const validateForm = (formData: Partial<DiaChi>): FormErrors => {
        const errors: FormErrors = {};
        if (!formData.hoTen || formData.hoTen.trim().length < 5)
            errors.hoTen = "Họ tên phải có ít nhất 5 ký tự";
        if (!formData.sdt)
            errors.sdt = "Số điện thoại là bắt buộc";
        else if (!/^\d{10}$/.test(formData.sdt))
            errors.sdt = "Số điện thoại phải có đúng 10 chữ số";
        if (!selectedProvince)
            errors.tinh = "Tỉnh/Thành phố là bắt buộc";
        if (!selectedDistrict)
            errors.quanHuyen = "Quận/Huyện là bắt buộc";
        if (!selectedWard)
            errors.phuongXa = "Phường/Xã là bắt buộc";
        if (!formData.diaChi || formData.diaChi.trim() === "")
            errors.diaChi = "Địa chỉ chi tiết là bắt buộc";
        return errors;
    };

    const handleFormSubmit = async (formData: Partial<DiaChi>) => {
        const fullFormData = {
            ...formData,
            tinh: selectedProvince?.ProvinceName,
            quanHuyen: selectedDistrict?.DistrictName,
            phuongXa: selectedWard?.WardName,
        };
        const errors = validateForm(fullFormData);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Vui lòng điền đầy đủ và đúng thông tin",
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/DanhSachDiaChi`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ ...fullFormData, maNguoiDung, trangThai: 1 }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Đã thêm địa chỉ mới thành công",
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
                
            }).then(() => {
            window.location.reload();         
          });
            setIsFormOpen(false);
            handleClear();
        } catch (error) {
            console.error("Error adding address:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể thêm địa chỉ",
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                showCloseButton: true,
            });
        }
    };

    const handleClear = () => {
        setNewDiaChi({ trangThai: 1 });
        setSelectedProvince(null);
        setSelectedDistrict(null);
        setSelectedWard(null);
        setDistricts([]);
        setWards([]);
        setFormErrors({});
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        handleClear();
    };

    return (
        <div className="max-w-5xl mx-auto mt-8">
            <div className="flex justify-center mb-4">
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="flex items-center px-6 py-2 bg-[#9b87f5] text-white font-semibold rounded-[8px] border border-[#8a76e4] hover:bg-[#8a76e4] transition-colors shadow-md"
                        >
                            Thêm địa chỉ mới
                            <ChevronDown className="ml-2 h-5 w-5" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0 border-[#9b87f5]">
                        <div className="p-6 border border-[#9b87f5] rounded-md bg-white shadow-md">
                            <AddressForm
                                diaChi={newDiaChi}
                                onSubmit={handleFormSubmit}
                                onCancel={handleCancel}
                                provinces={provinces}
                                districts={districts}
                                wards={wards}
                                selectedProvince={selectedProvince}
                                setSelectedProvince={setSelectedProvince}
                                selectedDistrict={selectedDistrict}
                                setSelectedDistrict={setSelectedDistrict}
                                selectedWard={selectedWard}
                                setSelectedWard={setSelectedWard}
                                isLoadingProvinces={isLoadingProvinces}
                                isLoadingDistricts={isLoadingDistricts}
                                isLoadingWards={isLoadingWards}
                                formErrors={formErrors}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default DiaChiCart;