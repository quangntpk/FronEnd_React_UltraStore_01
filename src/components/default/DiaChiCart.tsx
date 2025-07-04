import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { ChevronDown, ChevronUp, X, MapPin } from "lucide-react";
import Select from "react-select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Province { ProvinceID: number; ProvinceName: string; }
interface District { DistrictID: number; DistrictName: string; }
interface Ward { WardCode: string; WardName: string; }
interface DiaChi {
    maDiaChi: number;
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
    "Hải Phòng": { fee: 45000, time: "3 - 5 ngày" },
    "Đà Nẵng": { fee: 30000, time: "2 - 3 ngày" },
    "Cần Thơ": { fee: 30000, time: "2 - 4 ngày" },
    "An Giang": { fee: 35000, time: "3 - 4 ngày" },
    "Bà Rịa - Vũng Tàu": { fee: 25000, time: "2 - 3 ngày" },
    "Bắc Giang": { fee: 45000, time: "3 - 5 ngày" },
    "Bắc Kạn": { fee: 50000, time: "4 - 6 ngày" },
    "Bạc Liêu": { fee: 35000, time: "3 - 4 ngày" },
    "Bắc Ninh": { fee: 40000, time: "3 - 5 ngày" },
    "Bến Tre": { fee: 30000, time: "2 - 4 ngày" },
    "Bình Định": { fee: 25000, time: "2 - 3 ngày" },
    "Bình Dương": { fee: 20000, time: "2 - 3 ngày" },
    "Bình Phước": { fee: 20000, time: "2 - 3 ngày" },
    "Bình Thuận": { fee: 25000, time: "2 - 3 ngày" },
    "Cà Mau": { fee: 35000, time: "3 - 5 ngày" },
    "Cao Bằng": { fee: 50000, time: "4 - 6 ngày" },
    "Đắk Lắk": { fee: 0, time: "Nội tỉnh" },
    "Đắk Nông": { fee: 15000, time: "1 - 2 ngày" },
    "Điện Biên": { fee: 50000, time: "4 - 6 ngày" },
    "Đồng Nai": { fee: 20000, time: "2 - 3 ngày" },
    "Đồng Tháp": { fee: 30000, time: "3 - 4 ngày" },
    "Gia Lai": { fee: 15000, time: "1 - 2 ngày" },
    "Hà Giang": { fee: 50000, time: "4 - 6 ngày" },
    "Hà Nam": { fee: 45000, time: "3 - 5 ngày" },
    "Hà Tĩnh": { fee: 35000, time: "3 - 4 ngày" },
    "Hải Dương": { fee: 45000, time: "3 - 5 ngày" },
    "Hậu Giang": { fee: 35000, time: "3 - 4 ngày" },
    "Hòa Bình": { fee: 45000, time: "3 - 5 ngày" },
    "Hưng Yên": { fee: 40000, time: "3 - 5 ngày" },
    "Khánh Hòa": { fee: 25000, time: "2 - 3 ngày" },
    "Kiên Giang": { fee: 35000, time: "3 - 4 ngày" },
    "Kon Tum": { fee: 15000, time: "1 - 2 ngày" },
    "Lai Châu": { fee: 50000, time: "4 - 6 ngày" },
    "Lâm Đồng": { fee: 20000, time: "1 - 2 ngày" },
    "Lạng Sơn": { fee: 50000, time: "4 - 6 ngày" },
    "Lào Cai": { fee: 50000, time: "4 - 6 ngày" },
    "Long An": { fee: 30000, time: "2 - 4 ngày" },
    "Nam Định": { fee: 45000, time: "3 - 5 ngày" },
    "Nghệ An": { fee: 35000, time: "3 - 4 ngày" },
    "Ninh Bình": { fee: 45000, time: "3 - 5 ngày" },
    "Ninh Thuận": { fee: 25000, time: "2 - 3 ngày" },
    "Phú Thọ": { fee: 45000, time: "3 - 5 ngày" },
    "Phú Yên": { fee: 25000, time: "2 - 3 ngày" },
    "Quảng Bình": { fee: 35000, time: "3 - 4 ngày" },
    "Quảng Nam": { fee: 25000, time: "2 - 3 ngày" },
    "Quảng Ngãi": { fee: 25000, time: "2 - 3 ngày" },
    "Quảng Ninh": { fee: 50000, time: "4 - 6 ngày" },
    "Quảng Trị": { fee: 30000, time: "3 - 4 ngày" },
    "Sóc Trăng": { fee: 35000, time: "3 - 4 ngày" },
    "Sơn La": { fee: 50000, time: "4 - 6 ngày" },
    "Tây Ninh": { fee: 25000, time: "2 - 3 ngày" },
    "Thái Bình": { fee: 45000, time: "3 - 5 ngày" },
    "Thái Nguyên": { fee: 45000, time: "3 - 5 ngày" },
    "Thanh Hóa": { fee: 40000, time: "3 - 4 ngày" },
    "Thừa Thiên Huế": { fee: 30000, time: "2 - 3 ngày" },
    "Tiền Giang": { fee: 30000, time: "2 - 3 ngày" },
    "Trà Vinh": { fee: 30000, time: "2 - 3 ngày" },
    "Tuyên Quang": { fee: 50000, time: "4 - 6 ngày" },
    "Vĩnh Long": { fee: 30000, time: "2 - 3 ngày" },
    "Vĩnh Phúc": { fee: 45000, time: "3 - 5 ngày" },
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
            <h2 className="text-lg font-semibold text-[#2c3e50] mb-4">Thêm địa chỉ mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="hoTen" className="block text-sm font-medium text-[#2c3e50]">
                        Họ tên
                    </Label>
                    <Input
                        id="hoTen"
                        value={formData.hoTen || ""}
                        onChange={(e) => handleChange("hoTen", e.target.value)}
                        placeholder="Nhập họ tên"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] transition-colors ${formErrors.hoTen ? "border-[#ef4444]" : "border-[#d1d5db]"} text-[#2c3e50]`}
                    />
                    {formErrors.hoTen && <p className="mt-1 text-sm text-[#ef4444]">{formErrors.hoTen}</p>}
                </div>
                <div>
                    <Label htmlFor="sdt" className="block text-sm font-medium text-[#2c3e50]">
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] transition-colors ${formErrors.sdt ? "border-[#ef4444]" : "border-[#d1d5db]"} text-[#2c3e50]`}
                    />
                    {formErrors.sdt && <p className="mt-1 text-sm text-[#ef4444]">{formErrors.sdt}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="tinh" className="block text-sm font-medium text-[#2c3e50]">
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
                        className={`w-full text-[#2c3e50] ${formErrors.tinh ? "border-[#ef4444]" : ""}`}
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formErrors.tinh ? "#ef4444" : "#d1d5db",
                                "&:hover": { borderColor: formErrors.tinh ? "#ef4444" : "#9b87f5" },
                                boxShadow: "none",
                                "&:focus-within": { borderColor: "#9b87f5", boxShadow: "0 0 0 2px rgba(155, 135, 245, 0.5)" },
                            }),
                            singleValue: (base) => ({ ...base, color: "#2c3e50" }),
                            placeholder: (base) => ({ ...base, color: "#6b7280" }),
                            menu: (base) => ({ ...base, zIndex: 50, backgroundColor: "#ffffff" }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected ? "#9b87f5" : state.isFocused ? "#f3effe" : "#ffffff",
                                color: state.isSelected ? "#ffffff" : "#2c3e50",
                                "&:hover": { backgroundColor: "#f3effe" },
                            }),
                        }}
                    />
                    {formErrors.tinh && <p className="mt-1 text-sm text-[#ef4444]">{formErrors.tinh}</p>}
                </div>
                <div>
                    <Label htmlFor="quanHuyen" className="block text-sm font-medium text-[#2c3e50]">
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
                        className={`w-full text-[#2c3e50] ${formErrors.quanHuyen ? "border-[#ef4444]" : ""}`}
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formErrors.quanHuyen ? "#ef4444" : "#d1d5db",
                                "&:hover": { borderColor: formErrors.quanHuyen ? "#ef4444" : "#9b87f5" },
                                boxShadow: "none",
                                "&:focus-within": { borderColor: "#9b87f5", boxShadow: "0 0 0 2px rgba(155, 135, 245, 0.5)" },
                            }),
                            singleValue: (base) => ({ ...base, color: "#2c3e50" }),
                            placeholder: (base) => ({ ...base, color: "#6b7280" }),
                            menu: (base) => ({ ...base, zIndex: 50, backgroundColor: "#ffffff" }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected ? "#9b87f5" : state.isFocused ? "#f3effe" : "#ffffff",
                                color: state.isSelected ? "#ffffff" : "#2c3e50",
                                "&:hover": { backgroundColor: "#f3effe" },
                            }),
                        }}
                    />
                    {formErrors.quanHuyen && <p className="mt-1 text-sm text-[#ef4444]">{formErrors.quanHuyen}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="phuongXa" className="block text-sm font-medium text-[#2c3e50]">
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
                        className={`w-full text-[#2c3e50] ${formErrors.phuongXa ? "border-[#ef4444]" : ""}`}
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: formErrors.phuongXa ? "#ef4444" : "#d1d5db",
                                "&:hover": { borderColor: formErrors.phuongXa ? "#ef4444" : "#9b87f5" },
                                boxShadow: "none",
                                "&:focus-within": { borderColor: "#9b87f5", boxShadow: "0 0 0 2px rgba(155, 135, 245, 0.5)" },
                            }),
                            singleValue: (base) => ({ ...base, color: "#2c3e50" }),
                            placeholder: (base) => ({ ...base, color: "#6b7280" }),
                            menu: (base) => ({ ...base, zIndex: 50, backgroundColor: "#ffffff" }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected ? "#9b87f5" : state.isFocused ? "#f3effe" : "#ffffff",
                                color: state.isSelected ? "#ffffff" : "#2c3e50",
                                "&:hover": { backgroundColor: "#f3effe" },
                            }),
                        }}
                    />
                    {formErrors.phuongXa && <p className="mt-1 text-sm text-[#ef4444]">{formErrors.phuongXa}</p>}
                </div>
                <div>
                    <Label htmlFor="diaChi" className="block text-sm font-medium text-[#2c3e50]">
                        Địa chỉ chi tiết
                    </Label>
                    <Input
                        id="diaChi"
                        value={formData.diaChi || ""}
                        onChange={(e) => handleChange("diaChi", e.target.value)}
                        placeholder="Nhập địa chỉ chi tiết"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#9b87f5] focus:border-[#9b87f5] transition-colors ${formErrors.diaChi ? "border-[#ef4444]" : "border-[#d1d5db]"} text-[#2c3e50]`}
                    />
                    {formErrors.diaChi && <p className="mt-1 text-sm text-[#ef4444]">{formErrors.diaChi}</p>}
                </div>
            </div>
            {shippingInfo && selectedWard && (
                <div className="p-4 bg-[#f9fafb] rounded-lg mt-4">
                    <p className="text-sm text-[#2c3e50]">
                        <strong className="font-semibold">Phí giao hàng:</strong> {shippingInfo.fee.toLocaleString()} VND
                    </p>
                    <p className="text-sm text-[#2c3e50]">
                        <strong className="font-semibold">Thời gian giao hàng:</strong> {shippingInfo.time}
                    </p>
                </div>
            )}
            <div className="flex justify-between items-center mt-6">
                <Button
                    type="button"
                    onClick={() => window.location.href = "/user/diachi"}
                    className="flex items-center px-4 py-2 border border-[#9b87f5] text-[#9b87f5] bg-white rounded-md hover:bg-[#f3effe] hover:border-[#7c6ae8] transition-colors"
                >
                    <MapPin className="mr-2 h-4 w-4" /> Danh sách địa chỉ
                </Button>
                <div className="flex space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex items-center px-4 py-2 border border-[#d1d5db] text-[#2c3e50] bg-white hover:bg-[#f3effe] hover:border-[#9b87f5] transition-colors"
                    >
                        <X className="mr-2 h-4 w-4" /> Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="flex items-center px-4 py-2 bg-[#9b87f5] text-white hover:bg-[#7c6ae8] transition-colors"
                    >
                        <ChevronUp className="mr-2 h-4 w-4" /> Thêm địa chỉ
                    </Button>
                </div>
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
    const [diaChiList, setDiaChiList] = useState<DiaChi[]>([]);

    const location = useLocation();
    const navigate = useNavigate();
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
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, [navigate]);

    useEffect(() => {
        const fetchDiaChiList = async () => {
            if (!maNguoiDung) return;
            try {
                const response = await fetch(`${API_URL}/api/DanhSachDiaChi/maNguoiDung/${maNguoiDung}`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setDiaChiList(data);
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể lấy danh sách địa chỉ",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    showCloseButton: true,
                });
            }
        };
        if (maNguoiDung) fetchDiaChiList();
    }, [maNguoiDung, API_URL]);

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
            if (diaChiList.length >= 5) {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Bạn chỉ có thể có tối đa 5 địa chỉ",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    showCloseButton: true,
                });
                setIsFormOpen(false);
                navigate("/user/diachi");
                return;
            }
            const response = await fetch(`${API_URL}/api/DanhSachDiaChi`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ ...fullFormData, maNguoiDung, trangThai: 1 }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await Promise.all(
                diaChiList.map(async (dc: DiaChi) => {
                    const response = await fetch(`${API_URL}/api/DanhSachDiaChi/${dc.maDiaChi}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                        body: JSON.stringify({ ...dc, trangThai: 0 }),
                    });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                })
            );
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
        <div className="mt-8">
            <div className="flex justify-center mb-4">
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="flex items-center px-6 py-2 text-sm bg-[#9b87f5] text-white font-medium rounded-md border border-[#7c6ae8] hover:bg-[#7c6ae8] transition-colors shadow"
                        >
                            Thêm địa chỉ mới
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </button>

                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0 border-[#9b87f5] bg-white">
                        <div className="p-6 border border-[#9b87f5] rounded-md bg-white shadow-lg">
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