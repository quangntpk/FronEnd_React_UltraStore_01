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
interface ShippingFeeResponse {
  total: number;
  main_service: number | null;
  insurance: number | null;
  cod_fee: number;
  station_do: number | null;
  station_pu: number | null;
  return_fee: number | null;
  r2s: number | null;
  return_again: number;
  coupon: number | null;
  document_return: number;
  double_check: number;
  double_check_deliver: number | null;
  pick_remote_areas_fee: number;
  deliver_remote_areas_fee: number;
  pick_remote_areas_fee_return: number | null;
  deliver_remote_areas_fee_return: number | null;
  cod_failed_fee: number;
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
  shippingFee,
  isLoadingShippingFee,
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
  shippingFee: number | null;
  isLoadingShippingFee: boolean;
}) => {
  const isViewMode = mode === "view";
  const [formData, setFormData] = useState<Partial<DiaChi>>(diaChi);
  const [leadTime, setLeadTime] = useState<LeadTimeResponse | null>(null);
  const [isLoadingLeadTime, setIsLoadingLeadTime] = useState<boolean>(false);
  const API_URL = "https://bicacuatho.azurewebsites.net";

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
    onSubmit({ ...formData, moTa: shippingFee !== null ? shippingFee.toString() : "" });
  };

  const formatDate = (dateString: string) => {
    const deliveryDate = new Date(dateString);
    const day = deliveryDate.getDate();
    const month = deliveryDate.getMonth() + 1;
    const year = deliveryDate.getFullYear();
    return `Ngày ${day}, tháng ${month}, năm ${year} nhận hàng`;
  };

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
      {selectedWard && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p>
            <strong className="font-semibold">Phí giao hàng dự kiến:</strong>{" "}
            {isLoadingShippingFee ? (
              "Đang tính phí giao hàng..."
            ) : shippingFee !== null ? (
              `${shippingFee.toLocaleString()} VND`
            ) : (
              "Không thể tải phí giao hàng"
            )}
          </p>
          <p>
            <strong className="font-semibold">Thời gian giao hàng dự kiến:</strong>{" "}
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
  const [shippingFees, setShippingFees] = useState<{ [key: number]: number | null }>({});
  const [isLoadingShippingFees, setIsLoadingShippingFees] = useState<{ [key: number]: boolean }>({});
  const [formShippingFee, setFormShippingFee] = useState<number | null>(null);
  const [isLoadingFormShippingFee, setIsLoadingFormShippingFee] = useState<boolean>(false);

  const navigate = useNavigate();
  const addressListRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "https://bicacuatho.azurewebsites.net";

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
      setFormShippingFee(null);
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
        setFormShippingFee(null);
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
      setFormShippingFee(null);
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
        setFormShippingFee(null);
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

  useEffect(() => {
    if (!selectedDistrict?.DistrictID || !selectedWard?.WardCode) {
      setFormShippingFee(null);
      return;
    }

    const fetchShippingFee = async () => {
      setIsLoadingFormShippingFee(true);
      try {
        const request = {
          service_type_id: 2,
          from_district_id: 1552,
          from_ward_code: "400103",
          to_district_id: selectedDistrict.DistrictID,
          to_ward_code: selectedWard.WardCode,
          length: 35,
          width: 25,
          height: 10,
          weight: 1000,
          insurance_value: 0,
          coupon: null,
          items: [],
        };
        const response = await fetch(`${API_URL}/api/GHN/shipping-fee`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: ShippingFeeResponse = await response.json();
        setFormShippingFee(data.total);
      } catch (error) {
        console.error("Error fetching shipping fee:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể tải phí giao hàng",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          showCloseButton: true,
        });
        setFormShippingFee(null);
      } finally {
        setIsLoadingFormShippingFee(false);
      }
    };
    fetchShippingFee();
  }, [selectedDistrict, selectedWard, API_URL]);

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
      const loadingLeadTimes: { [key: number]: boolean } = {};
      const shippingFeesData: { [key: number]: number | null } = {};
      const loadingShippingFees: { [key: number]: boolean } = {};

      for (const dc of sortedData) {
        loadingLeadTimes[dc.maDiaChi] = true;
        leadTimesData[dc.maDiaChi] = null;
        loadingShippingFees[dc.maDiaChi] = true;
        shippingFeesData[dc.maDiaChi] = null;

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
                const leadTimeRequest = {
                  from_district_id: 1552,
                  from_ward_code: "400103",
                  to_district_id: district.districtID,
                  to_ward_code: ward.wardCode,
                  service_id: 53320,
                };
                const leadTimeResponse = await fetch(`${API_URL}/api/GHN/leadtime`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                  body: JSON.stringify(leadTimeRequest),
                });
                if (!leadTimeResponse.ok) throw new Error(`HTTP error! status: ${leadTimeResponse.status}`);
                const leadTimeData: LeadTimeResponse = await leadTimeResponse.json();
                leadTimesData[dc.maDiaChi] = leadTimeData;

                const feeRequest = {
                  service_type_id: 2,
                  from_district_id: 1552,
                  from_ward_code: "400103",
                  to_district_id: district.districtID,
                  to_ward_code: ward.wardCode,
                  length: 35,
                  width: 25,
                  height: 10,
                  weight: 1000,
                  insurance_value: 0,
                  coupon: null,
                  items: [],
                };
                const feeResponse = await fetch(`${API_URL}/api/GHN/shipping-fee`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                  body: JSON.stringify(feeRequest),
                });
                if (!feeResponse.ok) throw new Error(`HTTP error! status: ${feeResponse.status}`);
                const feeData: ShippingFeeResponse = await feeResponse.json();
                shippingFeesData[dc.maDiaChi] = feeData.total;
              }
            }
          } catch (error) {
            console.error(`Error fetching data for address ${dc.maDiaChi}:`, error);
          }
        }
        loadingLeadTimes[dc.maDiaChi] = false;
        loadingShippingFees[dc.maDiaChi] = false;
      }
      setLeadTimes(leadTimesData);
      setIsLoadingLeadTimes(loadingLeadTimes);
      setShippingFees(shippingFeesData);
      setIsLoadingShippingFees(loadingShippingFees);
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
      setShippingFees((prev) => {
        const newShippingFees = { ...prev };
        delete newShippingFees[deleteMaDiaChi];
        return newShippingFees;
      });
      setIsLoadingShippingFees((prev) => {
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
    setFormShippingFee(null);
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
            shippingFee={formShippingFee}
            isLoadingShippingFee={isLoadingFormShippingFee}
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
                    <p><strong className="font-semibold text-gray-800">Phí giao hàng dự kiến:</strong> {dc.moTa || "Không có mô tả"} VND</p>
                    <p>
                      <strong className="font-semibold text-gray-800">Địa chỉ:</strong> {dc.diaChi}, {dc.phuongXa},{" "}
                      {dc.quanHuyen}, {dc.tinh}
                    </p>
                    <p>
                      <strong className="font-semibold text-gray-800">Trạng thái:</strong>{" "}
                      {dc.trangThai === 1 ? "Hoạt động" : "Không hoạt động"}
                    </p>
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
                shippingFee={formShippingFee}
                isLoadingShippingFee={isLoadingFormShippingFee}
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