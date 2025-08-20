import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Province { ProvinceID: number; ProvinceName: string; }
interface District { DistrictID: number; DistrictName: string; }
interface Ward { WardCode: string; WardName: string; }
interface FormErrors {
    tinh?: string;
    quanHuyen?: string;
    phuongXa?: string;
    leadTime?: string;
    shippingFee?: string;
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
interface LeadTimeResponse {
    leadtime: number;
    leadtime_order: {
        from_estimate_date: string;
        to_estimate_date: string;
    };
}
interface ShippingOrderFee {
    total?: number;
    main_service?: number;
    insurance?: number;
    cod_fee?: number;
    station_do?: number;
    station_pu?: number;
    return_fee?: number;
    r2s?: number;
    return_again?: number;
    coupon?: number;
    document_return?: number;
    double_check?: number;
    double_check_deliver?: number;
    pick_remote_areas_fee?: number;
    deliver_remote_areas_fee?: number;
    pick_remote_areas_fee_return?: number;
    deliver_remote_areas_fee_return?: number;
    cod_failed_fee?: number;
}

const DiaChiTime = () => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
    const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState<boolean>(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
    const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false);
    const [isLoadingLeadTime, setIsLoadingLeadTime] = useState<boolean>(false);
    const [isLoadingShippingFee, setIsLoadingShippingFee] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [leadTime, setLeadTime] = useState<LeadTimeResponse | null>(null);
    const [shippingFee, setShippingFee] = useState<ShippingOrderFee | null>(null);
    const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

    const API_URL = "https://bicacuatho.azurewebsites.net";

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
                setFormErrors((prev) => ({ ...prev, tinh: "Không thể tải danh sách tỉnh/thành phố" }));
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
            setLeadTime(null);
            setShippingFee(null);
            setFormErrors((prev) => ({ ...prev, quanHuyen: undefined, phuongXa: undefined, leadTime: undefined, shippingFee: undefined }));
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
                setLeadTime(null);
                setShippingFee(null);
                setFormErrors((prev) => ({ ...prev, quanHuyen: undefined, phuongXa: undefined, leadTime: undefined, shippingFee: undefined }));
            } catch (error) {
                console.error("Error fetching districts:", error);
                setFormErrors((prev) => ({ ...prev, quanHuyen: "Không thể tải danh sách quận/huyện" }));
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
            setLeadTime(null);
            setShippingFee(null);
            setFormErrors((prev) => ({ ...prev, phuongXa: undefined, leadTime: undefined, shippingFee: undefined }));
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
                setLeadTime(null);
                setShippingFee(null);
                setFormErrors((prev) => ({ ...prev, phuongXa: undefined, leadTime: undefined, shippingFee: undefined }));
            } catch (error) {
                console.error("Error fetching wards:", error);
                setFormErrors((prev) => ({ ...prev, phuongXa: "Không thể tải danh sách phường/xã" }));
            } finally {
                setIsLoadingWards(false);
            }
        };
        fetchWards();
    }, [selectedDistrict, API_URL]);

    useEffect(() => {
        if (!selectedDistrict?.DistrictID || !selectedWard?.WardCode) {
            setLeadTime(null);
            setShippingFee(null);
            setFormErrors((prev) => ({ ...prev, leadTime: undefined, shippingFee: undefined }));
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
                setFormErrors((prev) => ({ ...prev, leadTime: undefined }));
            } catch (error) {
                console.error("Error fetching lead time:", error);
                setFormErrors((prev) => ({ ...prev, leadTime: "Không thể tải thời gian giao hàng dự kiến" }));
            } finally {
                setIsLoadingLeadTime(false);
            }
        };

        const fetchShippingFee = async () => {
            setIsLoadingShippingFee(true);
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
                const data: ShippingOrderFee = await response.json();
                setShippingFee(data);
                setFormErrors((prev) => ({ ...prev, shippingFee: undefined }));
            } catch (error) {
                console.error("Error fetching shipping fee:", error);
                setFormErrors((prev) => ({ ...prev, shippingFee: "Không thể tải phí giao hàng dự kiến" }));
            } finally {
                setIsLoadingShippingFee(false);
            }
        };

        fetchLeadTime();
        fetchShippingFee();
    }, [selectedDistrict, selectedWard, API_URL]);

    const formatDate = (dateString: string) => {
        const deliveryDate = new Date(dateString);
        const day = deliveryDate.getDate();
        const month = deliveryDate.getMonth() + 1;
        const year = deliveryDate.getFullYear();
        return `${day}, tháng ${month}, năm ${year} nhận hàng`;
    };

    return (
        <div style={styles.containerWrapper}>
            <div style={styles.headerContainer}>
                <button
                    onClick={() => setIsFormVisible(!isFormVisible)}
                    style={styles.toggleButton}
                >
                    Thời gian giao hàng dự kiến
                    {isFormVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            {isFormVisible && (
                <div style={styles.container}>
                    <div className="space-y-4">
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
                            <Label htmlFor="shippingFee" className="block text-sm font-medium text-[#2c3e50]">
                                Phí giao hàng dự kiến
                            </Label>
                            {isLoadingShippingFee ? (
                                <Input
                                    id="shippingFee"
                                    value="Đang tính phí giao hàng..."
                                    readOnly
                                    className="w-full text-[#2c3e50] bg-[#f9fafb] border-[#d1d5db] focus:border-[#9b87f5] focus:ring-[#9b87f5] focus:ring-opacity-50"
                                />
                            ) : shippingFee && shippingFee.total ? (
                                <Input
                                    id="shippingFee"
                                    value={`${shippingFee.total.toLocaleString()} VND`}
                                    readOnly
                                    className="w-full text-[#2c3e50] bg-[#f9fafb] border-[#d1d5db] focus:border-[#9b87f5] focus:ring-[#9b87f5] focus:ring-opacity-50"
                                />
                            ) : (
                                <Input
                                    id="shippingFee"
                                    value=""
                                    placeholder="Xem phí giao hàng"
                                    readOnly
                                    className="w-full text-[#2c3e50] bg-[#f9fafb] border-[#d1d5db] focus:border-[#9b87f5] focus:ring-[#9b87f5] focus:ring-opacity-50"
                                />
                            )}
                            {formErrors.shippingFee && (
                                <p className="mt-1 text-sm text-[#ef4444]">{formErrors.shippingFee}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="leadTime" className="block text-sm font-medium text-[#2c3e50]">
                                Thời gian giao hàng dự kiến
                            </Label>
                            {isLoadingLeadTime ? (
                                <Input
                                    id="leadTime"
                                    value="Đang tính thời gian giao hàng..."
                                    readOnly
                                    className="w-full text-[#2c3e50] bg-[#f9fafb] border-[#d1d5db] focus:border-[#9b87f5] focus:ring-[#9b87f5] focus:ring-opacity-50"
                                />
                            ) : leadTime ? (
                                <Input
                                    id="leadTime"
                                    value={formatDate(leadTime.leadtime_order.to_estimate_date)}
                                    readOnly
                                    className="w-full text-[#2c3e50] bg-[#f9fafb] border-[#d1d5db] focus:border-[#9b87f5] focus:ring-[#9b87f5] focus:ring-opacity-50"
                                />
                            ) : (
                                <Input
                                    id="leadTime"
                                    value=""
                                    placeholder="Xem thời gian giao hàng"
                                    readOnly
                                    className="w-full text-[#2c3e50] bg-[#f9fafb] border-[#d1d5db] focus:border-[#9b87f5] focus:ring-[#9b87f5] focus:ring-opacity-50"
                                />
                            )}
                            {formErrors.leadTime && (
                                <p className="mt-1 text-sm text-[#ef4444]">{formErrors.leadTime}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    containerWrapper: {
        maxWidth: '1200px',
        margin: '30px auto',
        position: 'relative',
    },
    headerContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '10px',
    },
    toggleButton: {
        padding: '8px 27px',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        backgroundColor: '#f5f5ff',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#2c3e50',
    },
    container: {
        padding: '15px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
};

export default DiaChiTime;