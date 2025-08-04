import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaCheck, FaTimes, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import Select from "react-select";
import { ArrowLeft } from "lucide-react";

interface Province { ProvinceID: number; ProvinceName: string; }
interface District { DistrictID: number; DistrictName: string; }
interface Ward { WardCode: string; WardName: string; }
interface DiaChi {
  maDiaChi: number;
  maNguoiDung: string;
  hoTen: string;
  sdt: string;
  moTa: string;
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
interface LeadTimeResponse {
  leadtime: number;
  leadtime_order: {
    from_estimate_date: string;
    to_estimate_date: string;
  };
}
type Mode = "add" | "edit" | "view";

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

const shippingData: { [key: string]: { fee: number } } = {
  "Hà Nội": { fee: 40000 },
  "TP. Hồ Chí Minh": { fee: 20000 },
  "Hải Phòng": { fee: 45000 },
  "Đà Nẵng": { fee: 30000 },
  "Cần Thơ": { fee: 30000 },
  "An Giang": { fee: 35000 },
  "Bà Rịa - Vũng Tàu": { fee: 25000 },
  "Bắc Giang": { fee: 45000 },
  "Bắc Kạn": { fee: 50000 },
  "Bạc Liêu": { fee: 35000 },
  "Bắc Ninh": { fee: 40000 },
  "Bến Tre": { fee: 30000 },
  "Bình Định": { fee: 25000 },
  "Bình Dương": { fee: 20000 },
  "Bình Phước": { fee: 20000 },
  "Bình Thuận": { fee: 25000 },
  "Cà Mau": { fee: 35000 },
  "Cao Bằng": { fee: 50000 },
  "Đắk Lắk": { fee: 0 },
  "Đắk Nông": { fee: 15000 },
  "Điện Biên": { fee: 50000 },
  "Đồng Nai": { fee: 20000 },
  "Đồng Tháp": { fee: 30000 },
  "Gia Lai": { fee: 15000 },
  "Hà Giang": { fee: 50000 },
  "Hà Nam": { fee: 45000 },
  "Hà Tĩnh": { fee: 35000 },
  "Hải Dương": { fee: 45000 },
  "Hậu Giang": { fee: 35000 },
  "Hòa Bình": { fee: 45000 },
  "Hưng Yên": { fee: 40000 },
  "Khánh Hòa": { fee: 25000 },
  "Kiên Giang": { fee: 35000 },
  "Kon Tum": { fee: 15000 },
  "Lai Châu": { fee: 50000 },
  "Lâm Đồng": { fee: 20000 },
  "Lạng Sơn": { fee: 50000 },
  "Lào Cai": { fee: 50000 },
  "Long An": { fee: 30000 },
  "Nam Định": { fee: 45000 },
  "Nghệ An": { fee: 35000 },
  "Ninh Bình": { fee: 45000 },
  "Ninh Thuận": { fee: 25000 },
  "Phú Thọ": { fee: 45000 },
  "Phú Yên": { fee: 25000 },
  "Quảng Bình": { fee: 35000 },
  "Quảng Nam": { fee: 25000 },
  "Quảng Ngãi": { fee: 25000 },
  "Quảng Ninh": { fee: 50000 },
  "Quảng Trị": { fee: 30000 },
  "Sóc Trăng": { fee: 35000 },
  "Sơn La": { fee: 50000 },
  "Tây Ninh": { fee: 25000 },
  "Thái Bình": { fee: 45000 },
  "Thái Nguyên": { fee: 45000 },
  "Thanh Hóa": { fee: 40000 },
  "Thừa Thiên Huế": { fee: 30000 },
  "Tiền Giang": { fee: 30000 },
  "Trà Vinh": { fee: 30000 },
  "Tuyên Quang": { fee: 50000 },
  "Vĩnh Long": { fee: 30000 },
  "Vĩnh Phúc": { fee: 45000 },
  "Yên Bái": { fee: 50000 },
};

const AddressForm = ({
  mode,
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
  mode: Mode;
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
  const isViewMode = mode === "view";
  const [formData, setFormData] = useState<Partial<DiaChi>>(diaChi);
  const [leadTime, setLeadTime] = useState<LeadTimeResponse | null>(null);
  const [isLoadingLeadTime, setIsLoadingLeadTime] = useState<boolean>(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5261";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    setFormData(diaChi);
  }, [diaChi]);

  useEffect(() => {
    if (!selectedDistrict?.DistrictID || !selectedWard?.WardCode) {
      setLeadTime(null);
      return;
    }

    const fetchLeadTime = async () => {
      setIsLoadingLeadTime(true);
      try {
        const request = {
          from_district_id: 1552,
          from_ward_code: "400103",
          to_district_id: selectedDistrict.DistrictID,
          to_ward_code: selectedWard.WardCode,
          service_id: 53320,
        };
        const response = await fetch(`${API_URL}/api/GHN/leadtime`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: LeadTimeResponse = await response.json();
        setLeadTime(data);
      } catch (error) {
        console.error("Error fetching lead time:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể tải thời gian giao hàng dự kiến",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          showCloseButton: true,
        });
      } finally {
        setIsLoadingLeadTime(false);
      }
    };
    fetchLeadTime();
  }, [selectedDistrict, selectedWard, API_URL]);

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

  const formatDate = (dateString: string) => {
    const deliveryDate = new Date(dateString);
    const day = deliveryDate.getDate();
    const month = deliveryDate.getMonth() + 1;
    const year = deliveryDate.getFullYear();
    return `Ngày ${day}, tháng ${month}, năm ${year} nhận hàng`;
  };

  const shippingInfo = selectedProvince ? shippingData[selectedProvince.ProvinceName] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hoTen" className="font-semibold text-gray-800">Họ tên</Label>
          <Input
            id="hoTen"
            value={formData.hoTen || ""}
            onChange={(e) => handleChange("hoTen", e.target.value)}
            disabled={isViewMode}
            placeholder="Nhập họ tên"
            className={`border-gray-300 rounded-md text-gray-800 ${formErrors.hoTen ? "border-red-500" : ""}`}
          />
          {formErrors.hoTen && <p className="text-red-500 text-sm mt-1">{formErrors.hoTen}</p>}
        </div>
        <div>
          <Label htmlFor="sdt" className="font-semibold text-gray-800">Số điện thoại</Label>
          <Input
            id="sdt"
            type="tel"
            maxLength={10}
            value={formData.sdt || ""}
            onChange={(e) => handleChange("sdt", e.target.value)}
            onKeyPress={handlePhoneNumberKeyPress}
            disabled={isViewMode}
            placeholder="Nhập số điện thoại"
            className={`border-gray-300 rounded-md text-gray-800 ${formErrors.sdt ? "border-red-500" : ""}`}
          />
          {formErrors.sdt && <p className="text-red-500 text-sm mt-1">{formErrors.sdt}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tinh" className="font-semibold text-gray-800">Tỉnh/Thành phố</Label>
          <Select
            options={provinces}
            getOptionLabel={(option: Province) => option.ProvinceName}
            getOptionValue={(option: Province) => option.ProvinceID.toString()}
            value={selectedProvince}
            onChange={(option: Province | null) => setSelectedProvince(option)}
            placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"}
            isDisabled={isLoadingProvinces || isViewMode}
            isSearchable
            isClearable
            className={`border-gray-300 rounded-md text-gray-800 ${formErrors.tinh ? "border-red-500" : ""}`}
            styles={{
              control: (base) => ({ ...base, color: "gray-800" }),
              singleValue: (base) => ({ ...base, color: "gray-800" }),
              placeholder: (base) => ({ ...base, color: "gray-800" }),
            }}
          />
          {formErrors.tinh && <p className="text-red-500 text-sm mt-1">{formErrors.tinh}</p>}
        </div>
        <div>
          <Label htmlFor="quanHuyen" className="font-semibold text-gray-800">Quận/Huyện</Label>
          <Select
            options={districts}
            getOptionLabel={(option: District) => option.DistrictName}
            getOptionValue={(option: District) => option.DistrictID.toString()}
            value={selectedDistrict}
            onChange={(option: District | null) => setSelectedDistrict(option)}
            placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
            isDisabled={!selectedProvince || isLoadingDistricts || isViewMode}
            isSearchable
            isClearable
            className={`border-gray-300 rounded-md text-gray-800 ${formErrors.quanHuyen ? "border-red-500" : ""}`}
            styles={{
              control: (base) => ({ ...base, color: "gray-800" }),
              singleValue: (base) => ({ ...base, color: "gray-800" }),
              placeholder: (base) => ({ ...base, color: "gray-800" }),
            }}
          />
          {formErrors.quanHuyen && <p className="text-red-500 text-sm mt-1">{formErrors.quanHuyen}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phuongXa" className="font-semibold text-gray-800">Phường/Xã</Label>
          <Select
            options={wards}
            getOptionLabel={(option: Ward) => option.WardName}
            getOptionValue={(option: Ward) => option.WardCode}
            value={selectedWard}
            onChange={(option: Ward | null) => setSelectedWard(option)}
            placeholder={isLoadingWards ? "Đang tải..." : "Chọn phường/xã"}
            isDisabled={!selectedDistrict || isLoadingWards || isViewMode}
            isSearchable
            isClearable
            className={`border-gray-300 rounded-md text-gray-800 ${formErrors.phuongXa ? "border-red-500" : ""}`}
            styles={{
              control: (base) => ({ ...base, color: "gray-800" }),
              singleValue: (base) => ({ ...base, color: "gray-800" }),
              placeholder: (base) => ({ ...base, color: "gray-800" }),
            }}
          />
          {formErrors.phuongXa && <p className="text-red-500 text-sm mt-1">{formErrors.phuongXa}</p>}
        </div>
        <div>
          <Label htmlFor="diaChi" className="font-semibold text-gray-800">Địa chỉ chi tiết</Label>
          <Input
            id="diaChi"
            value={formData.diaChi || ""}
            onChange={(e) => handleChange("diaChi", e.target.value)}
            disabled={isViewMode}
            placeholder="Nhập địa chỉ chi tiết"
            className={`border-gray-300 rounded-md text-gray-800 ${formErrors.diaChi ? "border-red-500" : ""}`}
          />
          {formErrors.diaChi && <p className="text-red-500 text-sm mt-1">{formErrors.diaChi}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="moTa" className="font-semibold text-gray-800">Mô tả</Label>
        <textarea
          id="moTa"
          value={formData.moTa || ""}
          onChange={(e) => handleChange("moTa", e.target.value)}
          disabled={isViewMode}
          placeholder="Nhập mô tả địa chỉ (tùy chọn)"
          className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
          rows={2}
        />
      </div>
      {shippingInfo && selectedWard && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p><strong className="font-semibold">Phí giao hàng:</strong> {shippingInfo.fee.toLocaleString()} VND</p>
          <p>
            <strong className="font-semibold">Thời gian giao hàng:</strong>{" "}
            {isLoadingLeadTime ? (
              "Đang tính thời gian giao hàng..."
            ) : leadTime ? (
              formatDate(leadTime.leadtime_order.to_estimate_date)
            ) : (
              "Không thể tải thời gian giao hàng"
            )}
          </p>
        </div>
      )}
      <div className="flex justify-end space-x-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex items-center border-gray-300 text-gray-800 hover:bg-gray-100"
        >
          <FaTimes className="mr-2" /> {isViewMode ? "Đóng" : "Hủy"}
        </Button>
        {!isViewMode && (
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-[#9b87f5] hover:bg-[#8a76e4] text-white flex items-center"
          >
            <FaCheck className="mr-2" /> {mode === "add" ? "Thêm" : "Cập nhật"}
          </Button>
        )}
      </div>
    </div>
  );
};

const DiaChi = () => {
  const [diaChiList, setDiaChiList] = useState<DiaChi[]>([]);
  const [newDiaChi, setNewDiaChi] = useState<Partial<DiaChi>>({ trangThai: 1 });
  const [editingDiaChi, setEditingDiaChi] = useState<DiaChi | null>(null);
  const [viewingDiaChi, setViewingDiaChi] = useState<DiaChi | null>(null);
  const [maNguoiDung, setMaNguoiDung] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showSelectModal, setShowSelectModal] = useState<boolean>(false);
  const [deleteMaDiaChi, setDeleteMaDiaChi] = useState<number | null>(null);
  const [pendingSelectMaDiaChi, setPendingSelectMaDiaChi] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<Mode>("add");
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
  const [activeTab, setActiveTab] = useState<"add" | "list">("list");
  const [leadTimes, setLeadTimes] = useState<{ [key: number]: LeadTimeResponse | null }>({});
  const [isLoadingLeadTimes, setIsLoadingLeadTimes] = useState<{ [key: number]: boolean }>({});

  const navigate = useNavigate();
  const addressListRef = useRef<HTMLDivElement>(null);
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
          timer: 3000,
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
          timer: 3000,
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
          timer: 3000,
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

  const fetchDiaChiList = useCallback(async () => {
    if (!maNguoiDung) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/DanhSachDiaChi/maNguoiDung/${maNguoiDung}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const sortedData = data.sort((a: DiaChi, b: DiaChi) => b.trangThai - a.trangThai);
      setDiaChiList(sortedData);

      const leadTimesData: { [key: number]: LeadTimeResponse | null } = {};
      const loadingStates: { [key: number]: boolean } = {};
      for (const dc of sortedData) {
        loadingStates[dc.maDiaChi] = true;
        leadTimesData[dc.maDiaChi] = null;

        const province = provinces.find((p) => p.ProvinceName === dc.tinh);
        if (province) {
          try {
            const districtResponse = await fetch(`${API_URL}/api/GHN/districts/${province.ProvinceID}`, { headers: getAuthHeaders() });
            if (!districtResponse.ok) throw new Error(`HTTP error! status: ${districtResponse.status}`);
            const districtsData: DistrictResponse[] = await districtResponse.json();
            const district = districtsData.find((d) => d.districtName === dc.quanHuyen);
            if (district) {
              const wardResponse = await fetch(`${API_URL}/api/GHN/wards/${district.districtID}`, { headers: getAuthHeaders() });
              if (!wardResponse.ok) throw new Error(`HTTP error! status: ${wardResponse.status}`);
              const wardsData: WardResponse[] = await wardResponse.json();
              const ward = wardsData.find((w) => w.wardName === dc.phuongXa);
              if (ward) {
                const request = {
                  from_district_id: 1552,
                  from_ward_code: "400103",
                  to_district_id: district.districtID,
                  to_ward_code: ward.wardCode,
                  service_id: 53320,
                };
                const leadTimeResponse = await fetch(`${API_URL}/api/GHN/leadtime`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                  body: JSON.stringify(request),
                });
                if (!leadTimeResponse.ok) throw new Error(`HTTP error! status: ${leadTimeResponse.status}`);
                const leadTimeData: LeadTimeResponse = await leadTimeResponse.json();
                leadTimesData[dc.maDiaChi] = leadTimeData;
              }
            }
          } catch (error) {
            console.error(`Error fetching lead time for address ${dc.maDiaChi}:`, error);
          }
        }
        loadingStates[dc.maDiaChi] = false;
      }
      setLeadTimes(leadTimesData);
      setIsLoadingLeadTimes(loadingStates);
    } catch (error) {
      console.error("Error fetching address list:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể lấy danh sách địa chỉ",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [maNguoiDung, API_URL, provinces]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setMaNguoiDung(parsedUser.maNguoiDung);
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (maNguoiDung) fetchDiaChiList();
  }, [maNguoiDung, fetchDiaChiList]);

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
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    try {
      if (formMode === "add") {
        if (diaChiList.length >= 5) {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Bạn chỉ có thể có tối đa 5 địa chỉ",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            showCloseButton: true,
          });
          setActiveTab("list");
          addressListRef.current?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        const response = await fetch(`${API_URL}/api/DanhSachDiaChi`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ ...fullFormData, maNguoiDung, trangThai: 1 }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã thêm địa chỉ mới",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          showCloseButton: true,
        });
        await fetchDiaChiList();
        setActiveTab("list");
        addressListRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (formMode === "edit" && editingDiaChi) {
        const response = await fetch(`${API_URL}/api/DanhSachDiaChi/${editingDiaChi.maDiaChi}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            ...fullFormData,
            maDiaChi: editingDiaChi.maDiaChi,
            maNguoiDung,
            trangThai: editingDiaChi.trangThai,
          }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã cập nhật địa chỉ",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          showCloseButton: true,
        });
        await fetchDiaChiList();
      }
      setShowFormModal(false);
      setFormErrors({});
    } catch (error) {
      console.error(`Error ${formMode === "add" ? "adding" : "updating"} address:`, error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: `Không thể ${formMode === "add" ? "thêm" : "cập nhật"} địa chỉ`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    }
  };

  const handleDelete = (maDiaChi: number) => {
    setDeleteMaDiaChi(maDiaChi);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteMaDiaChi === null) return;
    try {
      const response = await fetch(`${API_URL}/api/DanhSachDiaChi/${deleteMaDiaChi}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setDiaChiList(diaChiList.filter((dc) => dc.maDiaChi !== deleteMaDiaChi));
      setLeadTimes((prev) => {
        const newLeadTimes = { ...prev };
        delete newLeadTimes[deleteMaDiaChi];
        return newLeadTimes;
      });
      setIsLoadingLeadTimes((prev) => {
        const newLoadingStates = { ...prev };
        delete newLoadingStates[deleteMaDiaChi];
        return newLoadingStates;
      });
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã xóa địa chỉ",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể xóa địa chỉ",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setShowDeleteModal(false);
      setDeleteMaDiaChi(null);
    }
  };

  const handleSelectDiaChi = (maDiaChi: number) => {
    setPendingSelectMaDiaChi(maDiaChi);
    setShowSelectModal(true);
  };

  const confirmSelectDiaChi = async () => {
    if (pendingSelectMaDiaChi === null) return;
    try {
      await Promise.all(
        diaChiList.map(async (dc: DiaChi) => {
          const newStatus = dc.maDiaChi === pendingSelectMaDiaChi ? 1 : 0;
          const response = await fetch(`${API_URL}/api/DanhSachDiaChi/${dc.maDiaChi}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ ...dc, trangThai: newStatus }),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        })
      );
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã chọn địa chỉ",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
      await fetchDiaChiList();
    } catch (error) {
      console.error("Error selecting address:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể chọn địa chỉ",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setShowSelectModal(false);
      setPendingSelectMaDiaChi(null);
    }
  };

  const openAddForm = () => {
    setFormMode("add");
    setNewDiaChi({ trangThai: 1 });
    setEditingDiaChi(null);
    setViewingDiaChi(null);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setFormErrors({});
  };

  const openEditForm = (diaChi: DiaChi) => {
    setFormMode("edit");
    setEditingDiaChi(diaChi);
    setViewingDiaChi(null);
    setNewDiaChi(diaChi);
    const province = provinces.find((p) => p.ProvinceName === diaChi.tinh) || null;
    setSelectedProvince(province);

    if (province) {
      fetch(`${API_URL}/api/GHN/districts/${province.ProvinceID}`, { headers: getAuthHeaders() })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((data: DistrictResponse[]) => {
          const transformedDistricts = data.map((item) => ({
            DistrictID: item.districtID,
            DistrictName: item.districtName,
          }));
          setDistricts(transformedDistricts);
          const district = transformedDistricts.find((d) => d.DistrictName === diaChi.quanHuyen) || null;
          setSelectedDistrict(district);

          if (district) {
            fetch(`${API_URL}/api/GHN/wards/${district.DistrictID}`, { headers: getAuthHeaders() })
              .then((response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
              })
              .then((wardData: WardResponse[]) => {
                const transformedWards = wardData.map((item) => ({
                  WardCode: item.wardCode,
                  WardName: item.wardName,
                }));
                setWards(transformedWards);
                const ward = transformedWards.find((w) => w.WardName === diaChi.phuongXa) || null;
                setSelectedWard(ward);
              })
              .catch((error) => {
                console.error("Error fetching wards:", error);
                Swal.fire({
                  icon: "error",
                  title: "Lỗi",
                  text: "Không thể lấy danh sách phường/xã",
                  timer: 3000,
                  timerProgressBar: true,
                  showConfirmButton: false,
                  showCloseButton: true,
                });
              });
          }
        })
        .catch((error) => {
          console.error("Error fetching districts:", error);
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không thể lấy danh sách quận/huyện",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            showCloseButton: true,
          });
        });
    }

    setFormErrors({});
    setShowFormModal(true);
  };

  const openViewForm = (diaChi: DiaChi) => {
    setFormMode("view");
    setViewingDiaChi(diaChi);
    setEditingDiaChi(null);
    setNewDiaChi(diaChi);
    const province = provinces.find((p) => p.ProvinceName === diaChi.tinh) || null;
    setSelectedProvince(province);

    if (province) {
      fetch(`${API_URL}/api/GHN/districts/${province.ProvinceID}`, { headers: getAuthHeaders() })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((data: DistrictResponse[]) => {
          const transformedDistricts = data.map((item) => ({
            DistrictID: item.districtID,
            DistrictName: item.districtName,
          }));
          setDistricts(transformedDistricts);
          const district = transformedDistricts.find((d) => d.DistrictName === diaChi.quanHuyen) || null;
          setSelectedDistrict(district);

          if (district) {
            fetch(`${API_URL}/api/GHN/wards/${district.DistrictID}`, { headers: getAuthHeaders() })
              .then((response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
              })
              .then((wardData: WardResponse[]) => {
                const transformedWards = wardData.map((item) => ({
                  WardCode: item.wardCode,
                  WardName: item.wardName,
                }));
                setWards(transformedWards);
                const ward = transformedWards.find((w) => w.WardName === diaChi.phuongXa) || null;
                setSelectedWard(ward);
              })
              .catch((error) => {
                console.error("Error fetching wards:", error);
                Swal.fire({
                  icon: "error",
                  title: "Lỗi",
                  text: "Không thể lấy danh sách phường/xã",
                  timer: 3000,
                  timerProgressBar: true,
                  showConfirmButton: false,
                  showCloseButton: true,
                });
              });
          }
        })
        .catch((error) => {
          console.error("Error fetching districts:", error);
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không thể lấy danh sách quận/huyện",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            showCloseButton: true,
          });
        });
    }

    setFormErrors({});
    setShowFormModal(true);
  };

  const formatDate = (dateString: string) => {
    const deliveryDate = new Date(dateString);
    const day = deliveryDate.getDate();
    const month = deliveryDate.getMonth() + 1;
    const year = deliveryDate.getFullYear();
    return `Ngày ${day}, tháng ${month}, năm ${year} nhận hàng`;
  };

  return (
    <div className="flex justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
        <div className="relative flex justify-between items-center mb-8">
          <button
            onClick={() => window.location.href = "/user/cart"}
            className="flex items-center px-4 py-2 text-sm font-medium text-[#9b87f5] border border-[#9b87f5] rounded-md hover:bg-[#f3effe] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại giỏ hàng
          </button>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg shadow-sm">
            <button
              onClick={() => {
                setActiveTab("add");
                openAddForm();
              }}
              className={`relative px-6 py-2 text-sm font-semibold rounded-md transition-all duration-300 ease-in-out ${activeTab === "add"
                  ? "bg-[#9b87f5] text-white shadow-md"
                  : "bg-transparent text-gray-800 hover:bg-gray-200"
                }`}
            >
              Thêm địa chỉ mới
              {activeTab === "add" && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#9b87f5] rounded-t-md" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`relative px-6 py-2 text-sm font-semibold rounded-md transition-all duration-300 ease-in-out ${activeTab === "list"
                  ? "bg-[#9b87f5] text-white shadow-md"
                  : "bg-transparent text-gray-800 hover:bg-gray-200"
                }`}
            >
              Danh sách địa chỉ
              {activeTab === "list" && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#9b87f5] rounded-t-md" />
              )}
            </button>
          </div>
        </div>

        {activeTab === "add" && (
          <AddressForm
            mode="add"
            diaChi={newDiaChi}
            onSubmit={handleFormSubmit}
            onCancel={() => setActiveTab("list")}
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
        )}

        {activeTab === "list" && (
          <div className="space-y-4" ref={addressListRef}>
            {isLoading ? (
              <p className="text-gray-800">Đang tải danh sách địa chỉ...</p>
            ) : diaChiList.length === 0 ? (
              <p className="text-gray-800">Không có địa chỉ nào để hiển thị.</p>
            ) : (
              diaChiList.map((dc: DiaChi) => (
                <div
                  key={dc.maDiaChi}
                  className={`border p-4 rounded-lg bg-white shadow-sm ${dc.trangThai === 1 ? "border-[#9b87f5]" : "border-gray-300"
                    } flex justify-between items-start`}
                >
                  <div>
                    <p><strong className="font-semibold text-gray-800">Họ tên:</strong> {dc.hoTen}</p>
                    <p><strong className="font-semibold text-gray-800">Số điện thoại:</strong> {dc.sdt}</p>
                    <p><strong className="font-semibold text-gray-800">Mô tả:</strong> {dc.moTa || "Không có mô tả"}</p>
                    <p>
                      <strong className="font-semibold text-gray-800">Địa chỉ:</strong> {dc.diaChi}, {dc.phuongXa},{" "}
                      {dc.quanHuyen}, {dc.tinh}
                    </p>
                    <p>
                      <strong className="font-semibold text-gray-800">Trạng thái:</strong>{" "}
                      {dc.trangThai === 1 ? "Hoạt động" : "Không hoạt động"}
                    </p>
                    {shippingData[dc.tinh] ? (
                      <div className="mt-2 text-sm text-gray-800">
                        <p>
                          <strong className="font-semibold">Phí giao hàng:</strong>{" "}
                          {shippingData[dc.tinh].fee.toLocaleString()} VND
                        </p>
                        <p>
                          <strong className="font-semibold">Thời gian giao hàng:</strong>{" "}
                          {isLoadingLeadTimes[dc.maDiaChi] ? (
                            "Đang tính thời gian giao hàng..."
                          ) : leadTimes[dc.maDiaChi] ? (
                            formatDate(leadTimes[dc.maDiaChi]!.leadtime_order.to_estimate_date)
                          ) : (
                            "Không thể tải thời gian giao hàng"
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-800">Không có thông tin phí và thời gian giao hàng</p>
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <input
                      type="checkbox"
                      checked={dc.trangThai === 1}
                      onChange={() => handleSelectDiaChi(dc.maDiaChi)}
                      className="h-5 w-5"
                    />
                    <Button
                      onClick={() => openViewForm(dc)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-6 h-6 p-0"
                    >
                      <FaEye size={12} />
                    </Button>
                    <Button
                      onClick={() => openEditForm(dc)}
                      className="bg-[#9b87f5] hover:bg-[#8a76e4] text-white w-6 h-6 p-0"
                    >
                      <FaEdit size={12} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(dc.maDiaChi)}
                      variant="destructive"
                      className="w-6 h-6 p-0"
                    >
                      <FaTrash size={12} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showFormModal && activeTab !== "add" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {formMode === "edit" ? "Chỉnh sửa địa chỉ" : "Xem chi tiết địa chỉ"}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowFormModal(false)}
                  className="text-gray-800"
                >
                  ✕
                </Button>
              </div>
              <AddressForm
                mode={formMode}
                diaChi={formMode === "edit" ? editingDiaChi! : viewingDiaChi!}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowFormModal(false)}
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
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Xác nhận xóa</h2>
              <p className="mb-4 text-gray-800">Bạn có chắc chắn muốn xóa địa chỉ này?</p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex items-center border-gray-300 text-gray-800 hover:bg-gray-100"
                >
                  <FaTimes className="mr-2" /> Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="flex items-center"
                >
                  <FaCheck className="mr-2" /> Xác nhận
                </Button>
              </div>
            </div>
          </div>
        )}

        {showSelectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Xác nhận chọn địa chỉ</h2>
              <p className="mb-4 text-gray-800">Bạn có muốn đổi qua địa chỉ này không?</p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSelectModal(false)}
                  className="flex items-center border-gray-300 text-gray-800 hover:bg-gray-100"
                >
                  <FaTimes className="mr-2" /> Hủy
                </Button>
                <Button
                  onClick={confirmSelectDiaChi}
                  className="bg-[#9b87f5] hover:bg-[#8a76e4] text-white flex items-center"
                >
                  <FaCheck className="mr-2" /> Xác nhận
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaChi;