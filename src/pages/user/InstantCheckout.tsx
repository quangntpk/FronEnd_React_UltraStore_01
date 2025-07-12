import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import Swal from "sweetalert2";
import DiaChiCart from "@/components/default/DiaChiCart";
interface CartItem {
  idSanPham: string;
  tenSanPham: string;
  mauSac: string;
  kickThuoc: string;
  soLuong: number;
  soLuongMua: number;
  tienSanPham: number;
  hinhAnh: string;
}

interface CheckoutForm {
  tenNguoiNhan: string;
  sdt: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
}

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

interface Address {
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

interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
}

interface Product {
  id: string;
  tenSanPham: string;
  maThuongHieu: string;
  loaiSanPham: string;
  mauSac: string;
  moTa: string | null;
  chatLieu: string;
  details: ProductDetail[];
  hinhAnhs: string[];
  donGia: number;
  gioiTinh: string;
  hot: boolean;
  kichThuoc: string[];
  ngayTao: string;
  soLuong: number;
  soLuongDaBan: number;
  thuongHieu: string;
  trangThai: number;
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

const provinceMapping: { [key: string]: string } = {
  "ha noi": "Hà Nội",
  "thanh pho ha noi": "Hà Nội",
  "tp ho chi minh": "TP. Hồ Chí Minh",
  "thanh pho ho chi minh": "TP. Hồ Chí Minh",
  "hai phong": "Hải Phòng",
  "thanh pho hai phong": "Hải Phòng",
  "da nang": "Đà Nẵng",
  "thanh pho da nang": "Đà Nẵng",
  "can tho": "Cần Thơ",
  "thanh pho can tho": "Cần Thơ",
  "an giang": "An Giang",
  "tinh an giang": "An Giang",
  "ba ria vung tau": "Bà Rịa - Vũng Tàu",
  "tinh ba ria vung tau": "Bà Rịa - Vũng Tàu",
  "bac giang": "Bắc Giang",
  "tinh bac giang": "Bắc Giang",
  "bac kan": "Bắc Kạn",
  "tinh bac kan": "Bắc Kạn",
  "bac lieu": "Bạc Liêu",
  "tinh bac lieu": "Bạc Liêu",
  "bac ninh": "Bắc Ninh",
  "tinh bac ninh": "Bắc Ninh",
  "ben tre": "Bến Tre",
  "tinh ben tre": "Bến Tre",
  "binh dinh": "Bình Định",
  "tinh binh dinh": "Bình Định",
  "binh duong": "Bình Dương",
  "tinh binh duong": "Bình Dương",
  "binh phuoc": "Bình Phước",
  "tinh binh phuoc": "Bình Phước",
  "binh thuan": "Bình Thuận",
  "tinh binh thuan": "Bình Thuận",
  "ca mau": "Cà Mau",
  "tinh ca mau": "Cà Mau",
  "cao bang": "Cao Bằng",
  "tinh cao bang": "Cao Bằng",
  "dak lak": "Đắk Lắk",
  "tinh dak lak": "Đắk Lắk",
  "dak nong": "Đắk Nông",
  "tinh dak nong": "Đắk Nông",
  "dien bien": "Điện Biên",
  "tinh dien bien": "Điện Biên",
  "dong nai": "Đồng Nai",
  "tinh dong nai": "Đồng Nai",
  "dong thap": "Đồng Tháp",
  "tinh dong thap": "Đồng Tháp",
  "gia lai": "Gia Lai",
  "tinh gia lai": "Gia Lai",
  "ha giang": "Hà Giang",
  "tinh ha giang": "Hà Giang",
  "ha nam": "Hà Nam",
  "tinh ha nam": "Hà Nam",
  "ha tinh": "Hà Tĩnh",
  "tinh ha tinh": "Hà Tĩnh",
  "hai duong": "Hải Dương",
  "tinh hai duong": "Hải Dương",
  "hau giang": "Hậu Giang",
  "tinh hau giang": "Hậu Giang",
  "hoa binh": "Hòa Bình",
  "tinh hoa binh": "Hòa Bình",
  "hung yen": "Hưng Yên",
  "tinh hung yen": "Hưng Yên",
  "khanh hoa": "Khánh Hòa",
  "tinh khanh hoa": "Khánh Hòa",
  "kien giang": "Kiên Giang",
  "tinh kien giang": "Kiên Giang",
  "kon tum": "Kon Tum",
  "tinh kon tum": "Kon Tum",
  "lai chau": "Lai Châu",
  "tinh lai chau": "Lai Châu",
  "lam dong": "Lâm Đồng",
  "tinh lam dong": "Lâm Đồng",
  "lang son": "Lạng Sơn",
  "tinh lang son": "Lạng Sơn",
  "lao cai": "Lào Cai",
  "tinh lao cai": "Lào Cai",
  "long an": "Long An",
  "tinh long an": "Long An",
  "nam dinh": "Nam Định",
  "tinh nam dinh": "Nam Định",
  "nghe an": "Nghệ An",
  "tinh nghe an": "Nghệ An",
  "ninh binh": "Ninh Bình",
  "tinh ninh binh": "Ninh Bình",
  "ninh thuan": "Ninh Thuận",
  "tinh ninh thuan": "Ninh Thuận",
  "phu tho": "Phú Thọ",
  "tinh phu tho": "Phú Thọ",
  "phu yen": "Phú Yên",
  "tinh phu yen": "Phú Yên",
  "quang binh": "Quảng Bình",
  "tinh quang binh": "Quảng Bình",
  "quang nam": "Quảng Nam",
  "tinh quang nam": "Quảng Nam",
  "quang ngai": "Quảng Ngãi",
  "tinh quang ngai": "Quảng Ngãi",
  "quang ninh": "Quảng Ninh",
  "tinh quang ninh": "Quảng Ninh",
  "quang tri": "Quảng Trị",
  "tinh quang tri": "Quảng Trị",
  "soc trang": "Sóc Trăng",
  "tinh soc trang": "Sóc Trăng",
  "son la": "Sơn La",
  "tinh son la": "Sơn La",
  "tay ninh": "Tây Ninh",
  "tinh tay ninh": "Tây Ninh",
  "thai binh": "Thái Bình",
  "tinh thai binh": "Thái Bình",
  "thai nguyen": "Thái Nguyên",
  "tinh thai nguyen": "Thái Nguyên",
  "thanh hoa": "Thanh Hóa",
  "tinh thanh hoa": "Thanh Hóa",
  "thua thien hue": "Thừa Thiên Huế",
  "tinh thua thien hue": "Thừa Thiên Huế",
  "tien giang": "Tiền Giang",
  "tinh tien giang": "Tiền Giang",
  "tra vinh": "Trà Vinh",
  "tinh tra vinh": "Trà Vinh",
  "tuyen quang": "Tuyên Quang",
  "tinh tuyen quang": "Tuyên Quang",
  "vinh long": "Vĩnh Long",
  "tinh vinh long": "Vĩnh Long",
  "vinh phuc": "Vĩnh Phúc",
  "tinh vinh phuc": "Vĩnh Phúc",
  "yen bai": "Yên Bái",
  "tinh yen bai": "Yên Bái",
};

const CheckOutInstant = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay">("cod");
  const [productDetails, setProductDetails] = useState<Product[]>([]);

  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(() => {
    const savedForm = localStorage.getItem("checkoutForm");
    return savedForm
      ? JSON.parse(savedForm)
      : {
          tenNguoiNhan: "",
          sdt: "",
          province: "",
          district: "",
          ward: "",
          specificAddress: "",
        };
  });

  const formatCurrency = (amount: number) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const normalizeName = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(thanh pho|tinh|quan|huyen|phuong|xa)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizeShippingName = (name: string) => {
    if (!name) return "";
    const normalized = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(thanh pho|tinh)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return provinceMapping[normalized] || name.trim();
  };

  useEffect(() => {
    localStorage.setItem("checkoutForm", JSON.stringify(checkoutForm));
  }, [checkoutForm]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const userId = localStorage.getItem("userId");
      if (!userId) {
        Swal.fire({
          title: "Vui lòng đăng nhập!",
          text: "Bạn cần đăng nhập để thanh toán.",
          icon: "warning",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          navigate("/login");
        });
        return;
      }

      try {
        const existingData = JSON.parse(localStorage.getItem("InstantBuy") || "[]");

        if (existingData.length === 0) {
          setLoading(false);
          return;
        }

        const response2 = await fetch(`http://localhost:5261/api/SanPham/ListSanPham?id=${existingData[0]?.IDSanPham}`);
        const data2: Product[] = await response2.json();
        setProductDetails(data2);

        const processedCartItems = existingData.map((item: any) => ({
          idSanPham: item.IDSanPham,
          tenSanPham: item.TenSanPham,
          mauSac: item.MauSac,
          kickThuoc: item.KichThuoc.trim(),
          soLuong: data2.find((p) => p.id === item.IDSanPham)?.soLuong || 0,
          soLuongMua: item.SoLuong,
          tienSanPham: item.Gia,
          hinhAnh: data2.find((p) => p.id === item.IDSanPham)?.hinhAnhs?.[0] || "",
        }));

        setCartItems(processedCartItems);

        const subtotal = processedCartItems.reduce(
          (sum: number, item: CartItem) => sum + item.tienSanPham * item.soLuongMua,
          0
        );

        const provincesResponse = await fetch("https://provinces.open-api.vn/api/p/");
        const provincesData = await provincesResponse.json();
        setProvinces(provincesData);

        const addressResponse = await fetch(
          `http://localhost:5261/api/DanhSachDiaChi/maNguoiDung/${userId}`
        );
        const addressData = await addressResponse.json();
        setAddresses(
          addressData.sort((a: Address, b: Address) => b.trangThai - a.trangThai)
        );
        console.log(addressData)
        setFinalAmount(subtotal + shippingFee);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, shippingFee]);

  const handleProvinceChange = async (provinceCode: string) => {
    setCheckoutForm((prev) => ({
      ...prev,
      province: provinceCode,
      district: "",
      ward: "",
    }));
    setDistricts([]);
    setWards([]);

    const selectedProvince = provinces.find(
      (p) => p.code.toString() === provinceCode
    );
    if (selectedProvince) {
      const shippingInfo = shippingData[selectedProvince.name.trim()] || {
        fee: 0,
        time: "Không xác định",
      };
      setShippingFee(shippingInfo.fee);
    }

    const subtotal = calculateSubtotal();
    setFinalAmount(subtotal - discountAmount + shippingFee);

    if (provinceCode) {
      try {
        const response = await fetch(
          `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
        );
        const data = await response.json();
        setDistricts(data.districts || []);
      } catch (error) {
        toast.error("Không thể tải danh sách quận/huyện");
        console.error("Error fetching districts:", error);
      }
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    setCheckoutForm((prev) => ({
      ...prev,
      district: districtCode,
      ward: "",
    }));
    setWards([]);

    if (districtCode) {
      try {
        const response = await fetch(
          `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
        );
        const data = await response.json();
        setWards(data.wards || []);
      } catch (error) {
        toast.error("Không thể tải danh sách phường/xã");
        console.error("Error fetching wards:", error);
      }
    }
  };

  const handleSelectAddress = async (address: Address) => {
    try {
      const rawProvinceName = address.tinh;
      const normalizedProvinceName = normalizeName(rawProvinceName);

      const province = provinces.find(
        (p) => normalizeName(p.name) === normalizedProvinceName
      );
      if (!province) {
        return;
      }

      const districtResponse = await fetch(
        `https://provinces.open-api.vn/api/p/${province.code}?depth=2`
      );
      const districtData = await districtResponse.json();
      const normalizedDistrictName = normalizeName(address.quanHuyen);
      const district = districtData.districts.find(
        (d: District) => normalizeName(d.name) === normalizedDistrictName
      );

      if (!district) {
        toast.error("Không thể tìm thấy quận/huyện tương ứng");
        return;
      }

      const wardResponse = await fetch(
        `https://provinces.open-api.vn/api/d/${district.code}?depth=2`
      );
      const wardData = await wardResponse.json();
      const normalizedWardName = normalizeName(address.phuongXa);
      const ward = wardData.wards.find(
        (w: Ward) => normalizeName(w.name) === normalizedWardName
      );

      if (!ward) {
        toast.error("Địa chỉ không hoạt động, vui lòng đổi trạng thái cho nó");
        return;
      }

      const shippingProvinceName = normalizeShippingName(rawProvinceName);
      const shippingInfo = shippingData[shippingProvinceName] || {
        fee: 0,
        time: "Không xác định",
      };
      setShippingFee(shippingInfo.fee);

      setDistricts(districtData.districts || []);
      setWards(wardData.wards || []);

      const fullAddress = `${address.diaChi}, ${ward.name}, ${district.name}, ${province.name}`;
      setCheckoutForm({
        tenNguoiNhan: address.hoTen,
        sdt: address.sdt,
        province: province.code.toString(),
        district: district.code.toString(),
        ward: ward.code.toString(),
        specificAddress: address.diaChi,
      });

      const subtotal = calculateSubtotal();
      setFinalAmount(subtotal - discountAmount + shippingInfo.fee);

      setShowAddressModal(false);
    } catch (error) {
      toast.error("Không thể chọn địa chỉ, vui lòng thử lại");
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.tienSanPham * item.soLuongMua,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discountAmount + shippingFee;
  };

  const handleCheckoutFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCheckoutForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyPromo = async () => {
    if (!promoCode) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5261/api/Voucher/ValidateInstant?code=${encodeURIComponent(
          promoCode
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartItems),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setDiscountApplied(true);
        setDiscountAmount(result.discountAmount);
        setFinalAmount(
          calculateSubtotal() - result.discountAmount + shippingFee
        );
        toast.success("Mã giảm giá đã được áp dụng!");
      } else {
        setDiscountApplied(false);
        setDiscountAmount(0);
        setFinalAmount(calculateSubtotal() + shippingFee);
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      console.error("Error applying promo:", error);
    }
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true); // Disable button when submission starts

  const userId = localStorage.getItem("userId");
  if (!userId) {
    Swal.fire({
      title: "Vui lòng đăng nhập!",
      text: "Bạn cần đăng nhập để thanh toán.",
      icon: "warning",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    }).then(() => {
      navigate("/login");
      setIsSubmitting(false); // Re-enable button after redirect
    });
    return;
  }

  const requiredFields = [
    "tenNguoiNhan",
    "sdt",
    "province",
    "district",
    "ward",
    "specificAddress",
  ];
  const emptyFields = requiredFields.filter(
    (field) => !checkoutForm[field as keyof CheckoutForm]
  );
  if (emptyFields.length > 0) {
    toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
    setIsSubmitting(false); // Re-enable button if validation fails
    return;
  }

  try {
    const selectedProvince = provinces.find(
      (p) => p.code.toString() === checkoutForm.province
    );
    if (!selectedProvince) {
      toast.error("Vui lòng chọn tỉnh/thành phố hợp lệ");
      setIsSubmitting(false); // Re-enable button if province is invalid
      return;
    }
    const normalizedProvinceName = normalizeShippingName(selectedProvince.name);
    const expectedShippingFee = shippingData[normalizedProvinceName]?.fee || 0;
    if (shippingFee !== expectedShippingFee) {
      setShippingFee(expectedShippingFee);
    }

    const subtotal = calculateSubtotal();
    const newFinalAmount = subtotal - discountAmount + expectedShippingFee;

    const selectedDistrict =
      districts.find((d) => d.code.toString() === checkoutForm.district)?.name || "";
    const selectedWard =
      wards.find((w) => w.code.toString() === checkoutForm.ward)?.name || "";
    const fullAddress = `${checkoutForm.specificAddress}, ${selectedWard}, ${selectedDistrict}, ${selectedProvince.name}`;

    const paymentRequest = {
      userId: userId,
      items: cartItems,
      couponCode: promoCode || null,
      paymentMethod: paymentMethod,
      tenNguoiNhan: checkoutForm.tenNguoiNhan,
      sdt: checkoutForm.sdt,
      diaChi: fullAddress,
      discountAmount: discountAmount,
      shippingFee: expectedShippingFee,
      finalAmount: newFinalAmount,
    };
    console.log(paymentRequest);
    const paymentResponse = await fetch(
      "http://localhost:5261/api/CheckOut/InstantCheckOut",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequest),
      }
    );

    const result = await paymentResponse.json();

    if (result.success) {
      if (paymentMethod === "cod") {
        toast.success(result.message, {
          description: `Mã đơn hàng: ${result.orderId}`,
          duration: 3000,
          action: {
            label: "Xem chi tiết",
            onClick: () =>
              navigate("/user/orders", { state: { orderId: result.orderId } }),
          },
        });

        setCartItems([]);
        setPromoCode("");
        setDiscountApplied(false);
        setDiscountAmount(0);
        setFinalAmount(0);
        localStorage.removeItem("InstantBuy");
        localStorage.removeItem("checkoutForm");
        navigate("/", { state: { orderId: result.orderId } });
      } else if (paymentMethod === "vnpay") {
        if (result.finalAmount !== newFinalAmount) {
          toast.error(
            `Tổng tiền VNPay (${formatCurrency(
              result.finalAmount
            )} VND) không khớp với kỳ vọng (${formatCurrency(
              newFinalAmount
            )} VND). Vui lòng thử lại.`
          );
          setIsSubmitting(false); // Re-enable button if VNPay amount mismatch
          return;
        }
        window.location.href = result.message;
      }
    } else {
      toast.error(result.message);
      setIsSubmitting(false); // Re-enable button if API returns error
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi trong quá trình thanh toán");
    console.error("Error during checkout:", error);
    setIsSubmitting(false); // Re-enable button on error
  }
};

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-6">
        <div className="container mx-auto max-w-6xl my-[50px]">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg">Đang tải dữ liệu...</p>
            </div>
          ) : cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <form
                  onSubmit={handleSubmitCheckout}
                  className="bg-white p-6 rounded-lg shadow-sm border border-border"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold mb-6">
                      Thông tin giao hàng
                    </h2>
                    <div className="relative -top-[7px]">
                        <DiaChiCart />
                    </div>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Chọn địa chỉ có sẵn
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="tenNguoiNhan">Tên người nhận</Label>
                      <Input
                        id="tenNguoiNhan"
                        name="tenNguoiNhan"
                        value={checkoutForm.tenNguoiNhan}
                        onChange={handleCheckoutFormChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sdt">Số điện thoại</Label>
                      <Input
                        id="sdt"
                        name="sdt"
                        type="tel"
                        value={checkoutForm.sdt}
                        onChange={handleCheckoutFormChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province">Tỉnh/Thành phố</Label>
                      <select
                        id="province"
                        name="province"
                        value={checkoutForm.province}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required disabled
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">Quận/Huyện</Label>
                      <select
                        id="district"
                        name="district"
                        value={checkoutForm.district}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required disabled
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ward">Phường/Xã</Label>
                      <select
                        id="ward"
                        name="ward"
                        value={checkoutForm.ward}
                        onChange={handleCheckoutFormChange}
                        className="w-full p-2 border rounded-md"
                        required disabled
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="specificAddress">
                        Địa chỉ cụ thể (số nhà, tên đường)
                      </Label>
                      <Input
                        id="specificAddress"
                        name="specificAddress"
                        value={checkoutForm.specificAddress}
                        onChange={handleCheckoutFormChange}
                        required readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <Label>Phương thức thanh toán</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="mr-2"
                        />
                        Thanh toán khi nhận hàng (COD)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="vnpay"
                          checked={paymentMethod === "vnpay"}
                          onChange={() => setPaymentMethod("vnpay")}
                          className="mr-2"
                        />
                        Thanh toán qua VNPay
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-6">
                    <Button type="submit" className={`flex-1 sm:order-2 isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`} disabled={isSubmitting}>                   
                      {paymentMethod === "cod"
                        ? "Xác nhận thanh toán COD"
                        : "Thanh toán qua VNPay"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 sm:order-1"
                      onClick={() => navigate("/")}
                    >
                      Quay lại trang Sản Phẩm
                    </Button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-border sticky top-4">
                  <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>

                  <div className="space-y-3 mb-6">
                    {cartItems.map((item) => {
                      const product = productDetails.find((p) => p.id === item.idSanPham);
                      return (
                        <div key={item.idSanPham} className="flex flex-col space-y-2">
                          <div className="flex items-start gap-4">
                            
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <img
                                src={`data:image/png;base64,${product.hinh}`}
                                alt={item.tenSanPham}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                                <span className="text-muted-foreground font-medium">
                                  {item.tenSanPham} <span className="text-xs">x{item.soLuongMua}</span>
                                </span>
                                <span>{formatCurrency(item.tienSanPham * item.soLuongMua)} VND</span>
                              </div>
                              {product && (
                                <div className="text-sm text-muted-foreground mt-2">
                                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <strong>Màu Sắc:</strong>
                                    <span
                                      className={`w-5 h-5 rounded-full border ? "border-crocus-500 ring-2 ring-crocus-500" : "border-gray-200 hover:border-gray-300"}`}
                                      style={{ backgroundColor: `#${item.mauSac}` }}
                                      title={item.mauSac}
                                    ></span>
                                    <span> {item.mauSac}</span>
                                  </p>                                          
                                  <p><strong>Kích thước:</strong> {item.kickThuoc}</p>
                                  <p><strong>Chất liệu:</strong> {product.chatLieu}</p>
                                  <p><strong>Loại sản phẩm:</strong> {product.loaiSanPham}</p>
                                  <p><strong>Thương hiệu:</strong> {product.thuongHieu}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="border-t my-3"></div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng tiền gốc</span>
                      <span>{formatCurrency(calculateSubtotal())} VND</span>
                    </div>

                    {discountApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(discountAmount)} VND</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phí giao hàng</span>
                      <span>{formatCurrency(shippingFee)} VND</span>
                    </div>

                    <div className="border-t pt-3 flex justify-between font-medium">
                      <span>Tổng tiền</span>
                      <span className="text-lg">{formatCurrency(calculateTotal())} VND</span>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <Input
                      placeholder="Mã giảm giá (nếu có)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="mr-2"
                    />
                    <Button size="sm" onClick={handleApplyPromo}>
                      Áp Dụng
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
              <h2 className="text-2xl font-medium mb-2">
                Không có sản phẩm để thanh toán
              </h2>
              <p className="text-muted-foreground mb-8">
                Có vẻ như bạn chưa chọn sản phẩm nào để mua ngay.
              </p>
              <Link to="/">
                <Button>Tiếp tục mua sắm</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
            <Dialog.Root
              open={showAddressModal}
              onOpenChange={(open) => setShowAddressModal(open)}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full overflow-y-auto max-h-[600px]">
                  <h2 className="text-xl font-bold mb-4">Chọn địa chỉ giao hàng</h2>
                  {addresses.length === 0 ? (
                    <p>Chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới.</p>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.maDiaChi}
                          className="border p-4 rounded-lg bg-white shadow-sm flex justify-between"
                        >
                          <div>
                            <p>
                              <strong>Họ tên:</strong> {address.hoTen}
                            </p>
                            <p>
                              <strong>SĐT:</strong> {address.sdt}
                            </p>
                            <p>
                              <strong>Địa chỉ:</strong> {address.diaChi},{" "}
                              {address.phuongXa}, {address.quanHuyen}, {address.tinh}
                            </p>
                            <p>
                              <strong>Trạng thái:</strong>{" "}
                              {address.trangThai === 1 ? "Hoạt động" : "Không hoạt động"}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleSelectAddress(address)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Chọn
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddressModal(false)}
                  >
                    Đóng
                  </Button>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
    </div>
  );
};

export default CheckOutInstant;