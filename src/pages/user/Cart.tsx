import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Trash2, Plus, Minus, Check, MapPin } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import GiohangComboSupport from "@/components/user/cart/GioHangComboSupport";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import Swal from "sweetalert2";
import { CircleLoader } from "react-spinners";
import DiaChiCart from "@/components/default/DiaChiCart";
import DiaChiTime from "@/components/default/DiaChiTime";

interface CartItem {
  idSanPham: string;
  tenSanPham: string;
  mauSac: string;
  kickThuoc: string;
  soLuong: number;
  tienSanPham: number;
  hinhAnh: string;
}

interface ComboItem {
  idCombo: number;
  tenCombo: string;
  hinhAnh: string;
  soLuong: number;
  chiTietGioHangCombo: number;
  sanPhamList: {
    hinhAnh: string;
    maSanPham: string;
    soLuong: number;
    version: number;
    tenSanPham: string;
  }[];
  gia: number;
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
  ProvinceID: number;
  ProvinceName: string;
}

interface District {
  DistrictID: number;
  DistrictName: string;
}

interface Ward {
  WardCode: string;
  WardName: string;
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

const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ComboItem | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [cartId, setCartId] = useState<number | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [leadTime, setLeadTime] = useState<LeadTimeResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay">("cod");
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingAddress, setIsSelectingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState<number | null>(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isLoadingShippingFee, setIsLoadingShippingFee] = useState(false);
  const [isLoadingLeadTime, setIsLoadingLeadTime] = useState(false);

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

  const formatDate = (dateString: string) => {
    const deliveryDate = new Date(dateString);
    const day = deliveryDate.getDate();
    const month = deliveryDate.getMonth() + 1;
    const year = deliveryDate.getFullYear();
    return `Ngày ${day}, tháng ${month}, năm ${year} nhận hàng`;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    localStorage.setItem("checkoutForm", JSON.stringify(checkoutForm));
  }, [checkoutForm]);

  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/provinces`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProvinces(data.map((item: any) => ({
          ProvinceID: item.provinceID,
          ProvinceName: item.provinceName,
        })));
      } catch (error) {
        toast.error("Không thể tải danh sách tỉnh/thành phố");
        console.error("Error fetching provinces:", error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    const fetchAddresses = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await fetch(
          `https://bicacuatho.azurewebsites.net/api/DanhSachDiaChi/maNguoiDung/${userId}`,
          { headers: getAuthHeaders() }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const sortedAddresses = data.sort((a: Address, b: Address) => b.trangThai - a.trangThai);
        setAddresses(sortedAddresses);

        // Automatically select the active address (trangThai: 1)
        const activeAddress = sortedAddresses.find((addr: Address) => addr.trangThai === 1);
        if (activeAddress && !location.state?.newAddress) {
          handleSelectAddress(activeAddress, false);
        } else if (location.state?.newAddress) {
          handleSelectAddress(location.state.newAddress, false);
        }
      } catch (error) {
        toast.error("Không thể tải danh sách địa chỉ");
        console.error("Error fetching addresses:", error);
      }
    };

    const fetchCartData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        Swal.fire({
          title: "Vui lòng đăng nhập!",
          text: "Bạn cần đăng nhập để xem giỏ hàng.",
          icon: "warning",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          navigate("/login");
        });
        return;
      }

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        `${API_URL}/api/Cart/CopyGioHang?id=${userId}`
      )}&size=200x200`;
      setQrCodeUrl(qrUrl);

      try {
        const response = await fetch(
          `https://bicacuatho.azurewebsites.net/api/Cart/GioHangByKhachHang?id=${userId}`,
          { headers: getAuthHeaders() }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCartId(data.id);

        const processedCartItems = data.ctghSanPhamView.map((item: any) => ({
          ...item,
          hinhAnh: item.hinhAnh.startsWith("data:image")
            ? item.hinhAnh
            : `data:image/jpeg;base64,${item.hinhAnh}`,
        }));
        setCartItems(processedCartItems);

        const processedComboItems = data.ctghComboView.map((combo: any) => ({
          ...combo,
          chiTietGioHangCombo: combo.chiTietGioHangCombo,
          hinhAnh: combo.hinhAnh?.startsWith("data:image")
            ? combo.hinhAnh
            : combo.hinhAnh
              ? `data:image/jpeg;base64,${combo.hinhAnh}`
              : "/placeholder-image.jpg",
          sanPhamList: combo.sanPhamList.map((item: any) => ({
            ...item,
            hinhAnh: item.hinhAnh?.startsWith("data:image")
              ? item.hinhAnh
              : item.hinhAnh
                ? `data:image/jpeg;base64,${item.hinhAnh}`
                : "/placeholder-image.jpg",
          })),
        }));
        setComboItems(processedComboItems);

        const subtotal = calculateSubtotal();
        setFinalAmount(subtotal + shippingFee - discountAmount);
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    fetchCartData();
    fetchProvinces();
    fetchAddresses();

    if (location.state?.fromDiachi) {
      const savedModalState = localStorage.getItem("showAddressModal");
      if (savedModalState === "true") {
        setShowAddressModal(true);
      }
      const savedScrollY = localStorage.getItem("scrollY");
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY));
      }
    }
  }, [navigate, location, shippingFee, discountAmount]);

  useEffect(() => {
    if (!checkoutForm.province) {
      setDistricts([]);
      setWards([]);
      setShippingFee(0);
      setLeadTime(null);
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const response = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/districts/${checkoutForm.province}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDistricts(data.map((item: any) => ({
          DistrictID: item.districtID,
          DistrictName: item.districtName,
        })));
      } catch (error) {
        toast.error("Không thể tải danh sách quận/huyện");
        console.error("Error fetching districts:", error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [checkoutForm.province]);

  useEffect(() => {
    if (!checkoutForm.district) {
      setWards([]);
      setShippingFee(0);
      setLeadTime(null);
      return;
    }

    const fetchWards = async () => {
      setIsLoadingWards(true);
      try {
        const response = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/wards/${checkoutForm.district}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setWards(data.map((item: any) => ({
          WardCode: item.wardCode,
          WardName: item.wardName,
        })));
      } catch (error) {
        toast.error("Không thể tải danh sách phường/xã");
        console.error("Error fetching wards:", error);
      } finally {
        setIsLoadingWards(false);
      }
    };

    fetchWards();
  }, [checkoutForm.district]);

  useEffect(() => {
    if (!checkoutForm.district || !checkoutForm.ward) {
      setShippingFee(0);
      setLeadTime(null);
      return;
    }

    const fetchShippingFeeAndLeadTime = async () => {
      setIsLoadingShippingFee(true);
      setIsLoadingLeadTime(true);
      try {
        const shippingRequest = {
          service_type_id: 2,
          from_district_id: 1552,
          from_ward_code: "400103",
          to_district_id: parseInt(checkoutForm.district),
          to_ward_code: checkoutForm.ward,
          length: 35,
          width: 25,
          height: 10,
          weight: 1000,
          insurance_value: 0,
          coupon: null,
          items: [],
        };
        const shippingResponse = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/shipping-fee`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(shippingRequest),
        });
        if (!shippingResponse.ok) throw new Error(`HTTP error! status: ${shippingResponse.status}`);
        const shippingData: ShippingFeeResponse = await shippingResponse.json();
        setShippingFee(shippingData.total);

        const leadTimeRequest = {
          from_district_id: 1552,
          from_ward_code: "400103",
          to_district_id: parseInt(checkoutForm.district),
          to_ward_code: checkoutForm.ward,
          service_id: 53320,
        };
        const leadTimeResponse = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/leadtime`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(leadTimeRequest),
        });
        if (!leadTimeResponse.ok) throw new Error(`HTTP error! status: ${leadTimeResponse.status}`);
        const leadTimeData: LeadTimeResponse = await leadTimeResponse.json();
        setLeadTime(leadTimeData);
      } catch (error) {
        toast.error("Không thể tải phí hoặc thời gian giao hàng");
        console.error("Error fetching shipping fee or lead time:", error);
        setShippingFee(0);
        setLeadTime(null);
      } finally {
        setIsLoadingShippingFee(false);
        setIsLoadingLeadTime(false);
      }
    };

    fetchShippingFeeAndLeadTime();
  }, [checkoutForm.district, checkoutForm.ward]);

  const handleSelectAddress = async (address: Address, showToast: boolean = true) => {
    setIsSelectingAddress(true);
    try {
      if (!provinces.length) {
        return;
      }

      const province = provinces.find((p) => p.ProvinceName === address.tinh);
      if (!province) {
        toast.error(`Không tìm thấy tỉnh/thành phố: ${address.tinh}`);
        setShowAddressModal(true);
        return;
      }

      const districtResponse = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/districts/${province.ProvinceID}`, {
        headers: getAuthHeaders(),
      });
      if (!districtResponse.ok) throw new Error(`HTTP error! status: ${districtResponse.status}`);
      const districtData = await districtResponse.json();
      const district = districtData.find((d: any) => d.districtName === address.quanHuyen);
      if (!district) {
        toast.error(`Không tìm thấy quận/huyện: ${address.quanHuyen}`);
        setShowAddressModal(true);
        return;
      }

      const wardResponse = await fetch(`https://bicacuatho.azurewebsites.net/api/GHN/wards/${district.districtID}`, {
        headers: getAuthHeaders(),
      });
      if (!wardResponse.ok) throw new Error(`HTTP error! status: ${wardResponse.status}`);
      const wardData = await wardResponse.json();
      const ward = wardData.find((w: any) => w.wardName === address.phuongXa);
      if (!ward) {
        toast.error(`Không tìm thấy phường/xã: ${address.phuongXa}`);
        setShowAddressModal(true);
        return;
      }

      setCheckoutForm({
        tenNguoiNhan: address.hoTen,
        sdt: address.sdt,
        province: province.ProvinceID.toString(),
        district: district.districtID.toString(),
        ward: ward.wardCode,
        specificAddress: address.diaChi,
      });

      setDistricts(districtData.map((item: any) => ({
        DistrictID: item.districtID,
        DistrictName: item.districtName,
      })));
      setWards(wardData.map((item: any) => ({
        WardCode: item.wardCode,
        WardName: item.wardName,
      })));

      const subtotal = calculateSubtotal();
      setFinalAmount(subtotal - discountAmount + shippingFee);

      setShowAddressModal(false);
      if (showToast) {
        toast.success("Đã chọn địa chỉ thành công");
      }
    } catch (error) {
      toast.error("Không thể chọn địa chỉ, vui lòng thử lại");
      console.error("Error in handleSelectAddress:", error);
    } finally {
      setIsSelectingAddress(false);
    }
  };

  const handleDeleteAddress = async (maDiaChi: number) => {
    setIsDeletingAddress(maDiaChi);
    try {
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/DanhSachDiaChi/${maDiaChi}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setAddresses((prevAddresses) =>
        prevAddresses.filter((address) => address.maDiaChi !== maDiaChi)
      );

      // If the deleted address was the selected one, clear the checkout form
      if (
        checkoutForm.specificAddress === addresses.find((a) => a.maDiaChi === maDiaChi)?.diaChi
      ) {
        setCheckoutForm({
          tenNguoiNhan: "",
          sdt: "",
          province: "",
          district: "",
          ward: "",
          specificAddress: "",
        });
        setShippingFee(0);
        setLeadTime(null);
        setFinalAmount(calculateSubtotal() - discountAmount);
      }

      toast.success("Đã xóa địa chỉ thành công");
    } catch (error) {
      toast.error("Xóa địa chỉ thất bại");
      console.error("Error deleting address:", error);
    } finally {
      setIsDeletingAddress(null);
    }
  };

  const handleQuantityChange = async (idSanPham: string, change: number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      Swal.fire({
        title: "Vui lòng đăng nhập!",
        text: "Bạn cần đăng nhập để thay đổi số lượng.",
        icon: "warning",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    const info = {
      MaKhachHang: userId,
      IDSanPham: idSanPham,
      IDCombo: null,
    };

    try {
      if (change > 0) {
        await fetch(`https://bicacuatho.azurewebsites.net/api/Cart/TangSoLuongSanPham`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(info),
        });
      } else {
        await fetch(`${API_URL}/api/Cart/GiamSoLuongSanPham`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(info),
        });
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.idSanPham === idSanPham
            ? { ...item, soLuong: Math.max(1, item.soLuong + change) }
            : item
        )
      );

      const subtotal = calculateSubtotal();
      setFinalAmount(subtotal - discountAmount + shippingFee);
    } catch (error) {
      toast.error("Không thể cập nhật số lượng");
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveItem = async (idSanPham: string) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      Swal.fire({
        title: "Vui lòng đăng nhập!",
        text: "Bạn cần đăng nhập để xóa sản phẩm.",
        icon: "warning",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    const result = await Swal.fire({
      title: "Bạn có chắc không?",
      text: "Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, xóa nó!",
      cancelButtonText: "Không, giữ lại",
    });

    if (result.isConfirmed) {
      const info = {
        MaKhachHang: userId,
        IDSanPham: idSanPham,
        IDCombo: null,
      };
      try {
        await fetch(`${API_URL}/api/Cart/XoaSanPham`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(info),
        });

        setCartItems((prevItems) =>
          prevItems.filter((item) => item.idSanPham !== idSanPham)
        );
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng");

        const subtotal = calculateSubtotal();
        setFinalAmount(subtotal - discountAmount + shippingFee);
      } catch (error) {
        toast.error("Xóa sản phẩm thất bại");
        console.error("Error removing item:", error);
      }
    }
  };

  const handleRemoveCombo = async (idCombo: number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      Swal.fire({
        title: "Vui lòng đăng nhập!",
        text: "Bạn cần đăng nhập để xóa combo.",
        icon: "warning",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    const result = await Swal.fire({
      title: "Bạn có chắc không?",
      text: "Bạn có muốn xóa combo này khỏi giỏ hàng?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, xóa nó!",
      cancelButtonText: "Không, giữ lại",
    });

    if (result.isConfirmed) {
      const info = {
        MaKhachHang: userId,
        IDSanPham: null,
        IDCombo: idCombo,
      };

      try {
        await fetch(`https://bicacuatho.azurewebsites.net/api/Cart/XoaCombo`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(info),
        });

        setComboItems((prevItems) =>
          prevItems.filter((item) => item.idCombo !== idCombo)
        );
        toast.success("Đã xóa combo khỏi giỏ hàng");

        const subtotal = calculateSubtotal();
        setFinalAmount(subtotal - discountAmount + shippingFee);
      } catch (error) {
        toast.error("Xóa combo thất bại");
        console.error("Error removing combo:", error);
      }
    }
  };

  const handleUpdateCombo = (updatedCombo: ComboItem) => {
    setComboItems((prevItems) =>
      prevItems.map((item) =>
        item.idCombo === updatedCombo.idCombo ? updatedCombo : item
      )
    );

    const subtotal = calculateSubtotal();
    setFinalAmount(subtotal - discountAmount + shippingFee);
  };

  const calculateSubtotal = () => {
    const productTotal = cartItems.reduce(
      (sum, item) => sum + item.tienSanPham * item.soLuong,
      0
    );
    const comboTotal = comboItems.reduce(
      (sum, item) => sum + item.gia * item.soLuong,
      0
    );
    return productTotal + comboTotal;
  };

  const calculateDiscount = () => {
    return discountAmount;
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

    if (!cartId) {
      toast.error("Giỏ hàng không hợp lệ");
      return;
    }

    try {
      const response = await fetch(
        `$https://bicacuatho.azurewebsites.net/api/Voucher/Validate?code=${encodeURIComponent(promoCode)}&cartId=${cartId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setDiscountApplied(true);
        setDiscountAmount(result.discountAmount);
        setFinalAmount(calculateSubtotal() - result.discountAmount + shippingFee);
        toast.success("Mã giảm giá đã được áp dụng!");
      } else {
        setDiscountApplied(false);
        setDiscountAmount(0);
        setFinalAmount(calculateSubtotal() + shippingFee);
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Mã giảm giá không hợp lệ, không đủ điều kiện hoặc đã hết hạn.");
      console.error("Error applying promo:", error);
    }
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

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
      return;
    }

    if (paymentMethod === "cod") {
      setIsLoading(true);
    }

    try {
      const response = await fetch(
        `https://bicacuatho.azurewebsites.net/api/Cart/GioHangByKhachHang?id=${userId}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCartId(data.id);

      const processedCartItems = data.ctghSanPhamView.map((item: any) => ({
        ...item,
        hinhAnh: item.hinhAnh.startsWith("data:image")
          ? item.hinhAnh
          : `data:image/jpeg;base64,${item.hinhAnh}`,
      }));
      setCartItems(processedCartItems);

      const processedComboItems = data.ctghComboView.map((combo: any) => ({
        ...combo,
        chiTietGioHangCombo: combo.chiTietGioHangCombo,
        hinhAnh: combo.hinhAnh?.startsWith("data:image")
          ? combo.hinhAnh
          : combo.hinhAnh
            ? `data:image/jpeg;base64,${combo.hinhAnh}`
            : "/placeholder-image.jpg",
        sanPhamList: combo.sanPhamList.map((item: any) => ({
          ...item,
          hinhAnh: item.hinhAnh?.startsWith("data:image")
            ? item.hinhAnh
            : item.hinhAnh
              ? `data:image/jpeg;base64,${item.hinhAnh}`
              : "/placeholder-image.jpg",
        })),
      }));
      setComboItems(processedComboItems);

      if (promoCode) {
        const voucherResponse = await fetch(
          `https://bicacuatho.azurewebsites.net/api/Voucher/Validate?code=${encodeURIComponent(promoCode)}&cartId=${data.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          }
        );

        const voucherResult = await voucherResponse.json();
        if (!voucherResult.success) {
          setDiscountApplied(false);
          setDiscountAmount(0);
          toast.error("Mã giảm giá không hợp lệ, đã xóa giảm giá");
          setFinalAmount(calculateSubtotal() + shippingFee);
          return;
        } else {
          setDiscountApplied(true);
          setDiscountAmount(voucherResult.discountAmount);
        }
      }

      const selectedProvince = provinces.find(
        (p) => p.ProvinceID.toString() === checkoutForm.province
      );
      const selectedDistrict = districts.find(
        (d) => d.DistrictID.toString() === checkoutForm.district
      );
      const selectedWard = wards.find(
        (w) => w.WardCode === checkoutForm.ward
      );
      if (!selectedProvince) {
        toast.error("Vui lòng chọn tỉnh/thành phố hợp lệ");
        return;
      }
      if (!selectedDistrict) {
        toast.error("Vui lòng chọn quận/huyện hợp lệ");
        return;
      }
      if (!selectedWard) {
        toast.error("Vui lòng chọn phường/xã hợp lệ");
        return;
      }

      const subtotal = calculateSubtotal();
      const newFinalAmount = subtotal - discountAmount + shippingFee;
      setFinalAmount(newFinalAmount);

      const fullAddress = `${checkoutForm.specificAddress}, ${selectedWard.WardName}, ${selectedDistrict.DistrictName}, ${selectedProvince.ProvinceName}`;
      if (typeof fullAddress !== "string" || fullAddress.includes("[object Object]")) {
        toast.error("Lỗi định dạng địa chỉ, vui lòng kiểm tra lại");
        console.error("Invalid fullAddress:", fullAddress);
        return;
      }

      const paymentRequest = {
        cartId: data.id,
        couponCode: promoCode || null,
        paymentMethod: paymentMethod,
        tenNguoiNhan: checkoutForm.tenNguoiNhan,
        sdt: checkoutForm.sdt,
        diaChi: fullAddress,
        discountAmount: discountAmount,
        shippingFee: shippingFee,
        finalAmount: newFinalAmount,
      };

      const paymentResponse = await fetch(
        `https://bicacuatho.azurewebsites.net/api/CheckOut/process-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(paymentRequest),
        }
      );

      const result = await paymentResponse.json();

      if (result.success) {
        if (paymentMethod === "cod") {
          toast.success(`Thanh toán COD thành công! Mã đơn hàng: ${result.orderId}`, {
            description: "Cảm ơn bạn đã mua sắm. Vui lòng kiểm tra đơn hàng trong mục Lịch sử mua hàng.",
            duration: 5000,
            action: {
              label: "Xem chi tiết",
              onClick: () =>
                navigate("/user/orders", { state: { orderId: result.orderId } }),
            },
          });

          setCartItems([]);
          setComboItems([]);
          setPromoCode("");
          setDiscountApplied(false);
          setDiscountAmount(0);
          setFinalAmount(0);
          setShowCheckout(false);
          localStorage.removeItem("checkoutForm");
          localStorage.removeItem("showAddressModal");
          localStorage.removeItem("scrollY");
          navigate("/", { state: { orderId: result.orderId } });
        } else if (paymentMethod === "vnpay") {
          if (result.finalAmount !== newFinalAmount) {
            toast.error(
              `Tổng tiền VNPay (${formatCurrency(result.finalAmount)} VND) không khớp với kỳ vọng (${formatCurrency(newFinalAmount)} VND). Vui lòng thử lại.`
            );
            return;
          }
          // Note: Success notification for VNPay should be handled after payment completion (e.g., via callback).
          // Example placeholder (to be implemented based on backend callback):
          /*
          toast.success(`Thanh toán VNPay thành công! Mã đơn hàng: ${result.orderId}`, {
            description: "Cảm ơn bạn đã mua sắm. Vui lòng kiểm tra đơn hàng trong mục Lịch sử mua hàng.",
            duration: 5000,
            action: {
              label: "Xem chi tiết",
              onClick: () => navigate("/user/orders", { state: { orderId: result.orderId } }),
            },
          });
          */
          window.location.href = result.message;
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi trong quá trình thanh toán");
      console.error("Error during checkout:", error);
    } finally {
      if (paymentMethod === "cod") {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-6">
        <div className="container mx-auto max-w-6xl my-[50px]">
          {cartItems.length > 0 || comboItems.length > 0 ? (
            <>
              {!showCheckout ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.idSanPham}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-4 mb-4 bg-white rounded-lg shadow-sm border border-border"
                      >
                        <div className="w-full sm:w-24 h-24 bg-muted rounded-md overflow-hidden mr-4 mb-4 sm:mb-0">
                          <img
                            src={item.hinhAnh}
                            alt={item.tenSanPham}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{item.tenSanPham}</h3>
                          <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700">Kích thước:</span>
                              <span className="text-sm text-gray-600">{item.kickThuoc}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700">Màu sắc:</span>
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block rounded-full border border-gray-200 shadow-sm"
                                  style={{
                                    backgroundColor: `#${item.mauSac}`,
                                    width: "1.5rem",
                                    height: "1.5rem",
                                  }}
                                ></span>
                                <span className="text-sm text-gray-600 capitalize">{item.mauSac}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700">Đơn Giá:</span>
                              <span className="text-xl font-bold text-crocus-600">
                                {formatCurrency(item.tienSanPham)} VND
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center mt-4 sm:mt-0">
                          <button
                            onClick={() => handleQuantityChange(item.idSanPham, -1)}
                            className="p-1 rounded-md hover:bg-muted"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-2 w-8 text-center">{item.soLuong}</span>
                          <button
                            onClick={() => handleQuantityChange(item.idSanPham, 1)}
                            className="p-1 rounded-md hover:bg-muted"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.idSanPham)}
                            className="ml-4 p-1 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {comboItems.map((combo) => (
                      <div
                        key={combo.idCombo}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-4 mb-4 bg-white rounded-lg shadow-sm border border-border"
                      >
                        <div className="w-full sm:w-24 h-24 bg-muted rounded-md overflow-hidden mr-4 mb-4 sm:mb-0">
                          <img
                            src={combo.hinhAnh}
                            alt={combo.tenCombo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{combo.tenCombo}</h3>
                          <p className="text-muted-foreground">
                            Gồm: {combo.sanPhamList.length} sản phẩm
                          </p>
                          <p className="text-muted-foreground">{formatCurrency(combo.gia)} VND</p>
                        </div>
                        <div className="flex items-center mt-4 sm:mt-0">
                          <span className="mx-2 w-8 text-center">{combo.soLuong}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => setSelectedCombo(combo)}
                          >
                            Cập nhật
                          </Button>
                          <button
                            onClick={() => handleRemoveCombo(combo.idCombo)}
                            className="ml-4 p-1 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-border sticky top-4">
                      <h2 className="text-xl font-semibold mb-4">Giỏ Hàng</h2>
                      <div className="space-y-3 mb-6">
                        {cartItems.map((item) => (
                          <div key={item.idSanPham} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {item.tenSanPham} <span className="text-xs">x{item.soLuong}</span>
                            </span>
                            <span>{formatCurrency(item.tienSanPham * item.soLuong)} VND</span>
                          </div>
                        ))}
                        {comboItems.map((combo) => (
                          <div key={combo.idCombo} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {combo.tenCombo} <span className="text-xs">x{combo.soLuong}</span>
                            </span>
                            <span>{formatCurrency(combo.gia * combo.soLuong)} VND</span>
                          </div>
                        ))}
                        <div className="border-t my-3"></div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tổng tiền gốc</span>
                          <span>{formatCurrency(calculateSubtotal())} VND</span>
                        </div>
                        {discountApplied && (
                          <div className="flex justify-between text-green-600">
                            <span>Giảm giá</span>
                            <span>-{formatCurrency(calculateDiscount())} VND</span>
                          </div>
                        )}

                        <div className="border-t pt-3 flex justify-between font-medium">
                          <span>Tổng tiền</span>
                          <span className="text-lg">{formatCurrency(calculateTotal())} VND</span>
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => setShowCheckout(true)}>
                        Chuyển đến trang Thanh Toán
                      </Button>
                      <Link to="/" className="block text-center text-primary hover:underline mt-4">
                        Quay về trang Sản Phẩm
                      </Link>
                      <DiaChiTime />
                      {qrCodeUrl && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-2 text-center">
                            Chia sẻ mã QR này để cho bạn bè Copy giỏ hàng của bạn
                          </h3>
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <form
                      onSubmit={handleSubmitCheckout}
                      className="bg-white p-6 rounded-lg shadow-sm border border-border"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold mb-6">Thông tin giao hàng</h2>
                        <div className="relative -top-[7px]">
                          <DiaChiCart />
                        </div>
                        <div className="space-x-2">
                          <Button
                            type="button"
                            onClick={() => setShowAddressModal(true)}
                            className="bg-purple-400 hover:bg-purple-600 text-white"
                          >
                            <MapPin size={16} className="mr-2" />
                            Chọn địa chỉ có sẵn
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <Label htmlFor="tenNguoiNhan">Tên người nhận</Label>
                          <Input
                            placeholder="Nhâp tên người nhận"
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
                            placeholder="Nhập số điện thoại"
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
                            onChange={(e) => handleCheckoutFormChange(e)}
                            className="w-full p-2 border rounded-md"
                            required

                          >
                            <option value="">{isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"}</option>
                            {provinces.map((province) => (
                              <option key={province.ProvinceID} value={province.ProvinceID}>
                                {province.ProvinceName}
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
                            onChange={(e) => handleCheckoutFormChange(e)}
                            className="w-full p-2 border rounded-md"
                            required

                          >
                            <option value="">{isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}</option>
                            {districts.map((district) => (
                              <option key={district.DistrictID} value={district.DistrictID}>
                                {district.DistrictName}
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
                            required

                          >
                            <option value="">{isLoadingWards ? "Đang tải..." : "Chọn phường/xã"}</option>
                            {wards.map((ward) => (
                              <option key={ward.WardCode} value={ward.WardCode}>
                                {ward.WardName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="specificAddress">Địa chỉ cụ thể (số nhà, tên đường)</Label>
                          <Input
                            placeholder="Nhập địa chỉ cụ thể"
                            id="specificAddress"
                            name="specificAddress"
                            value={checkoutForm.specificAddress}
                            onChange={handleCheckoutFormChange}
                            required
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
                      <div className="flex flex-col sm:flex-row gap-2 mt-6 relative">
                        <Button
                          type="submit"
                          className="flex-1 sm:order-2"
                          disabled={!cartId || (paymentMethod === "cod" && isLoading)}
                        >
                          {paymentMethod === "cod" ? (
                            isLoading ? (
                              <div className="flex items-center justify-center">
                                <CircleLoader size={20} color="#ffffff" className="mr-2" />
                                Đang xử lý...
                              </div>
                            ) : (
                              "Xác nhận thanh toán COD"
                            )
                          ) : (
                            "Thanh toán qua VNPay"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 sm:order-1"
                          onClick={() => setShowCheckout(false)}
                          disabled={isLoading}
                        >
                          Quay lại giỏ hàng
                        </Button>
                        {isLoading && paymentMethod === "cod" && (
                          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
                            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center animate-fade-in max-w-sm w-full">
                              <CircleLoader size={60} color="#9333ea" className="mb-4" />
                              <p className="text-lg font-semibold text-gray-800">
                                Đang xử lý đơn hàng...
                              </p>
                              <p className="text-sm text-gray-500 mt-2 text-center">
                                Vui lòng đợi trong giây lát, đơn hàng của bạn đang được xử lý.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-border sticky top-4">
                      <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
                      <div className="space-y-3 mb-6">
                        {cartItems.map((item) => (
                          <div key={item.idSanPham} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {item.tenSanPham} <span className="text-xs">x{item.soLuong}</span>
                            </span>
                            <span>{formatCurrency(item.tienSanPham * item.soLuong)} VND</span>
                          </div>
                        ))}
                        {comboItems.map((combo) => (
                          <div key={combo.idCombo} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {combo.tenCombo} <span className="text-xs">x{combo.soLuong}</span>
                            </span>
                            <span>{formatCurrency(combo.gia * combo.soLuong)} VND</span>
                          </div>
                        ))}
                        <div className="border-t my-3"></div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tổng tiền gốc</span>
                          <span>{formatCurrency(calculateSubtotal())} VND</span>
                        </div>
                        {discountApplied && (
                          <div className="flex justify-between text-green-600">
                            <span>Giảm giá</span>
                            <span>-{formatCurrency(calculateDiscount())} VND</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phí giao hàng</span>
                          <span>
                            {isLoadingShippingFee ? "Đang tính..." : formatCurrency(shippingFee)} VND
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Thời gian giao hàng dự kiến</span>
                          <span>
                            {isLoadingLeadTime
                              ? "Đang tính..."
                              : leadTime
                                ? formatDate(leadTime.leadtime_order.to_estimate_date)
                                : "Không xác định"}
                          </span>
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
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
              <h2 className="text-2xl font-medium mb-2">Giỏ hàng của bạn đang trống</h2>
              <p className="text-muted-foreground mb-8">
                Có vẻ như bạn chưa thêm sản phẩm hoặc combo nào vào giỏ hàng.
              </p>
              <Link to="/">
                <Button>Tiếp tục mua sắm</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Dialog.Root
        open={!!selectedCombo}
        onOpenChange={(open) => !open && setSelectedCombo(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {selectedCombo && (
              <GiohangComboSupport
                combo={selectedCombo}
                onClose={() => setSelectedCombo(null)}
                onUpdateCombo={handleUpdateCombo}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={showAddressModal}
        onOpenChange={(open) => setShowAddressModal(open)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full ">

            <h2 className="text-xl font-bold mb-4">Chọn địa chỉ giao hàng</h2>
            <div className="overflow-y-auto max-h-[350px]">
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
                        <p><strong>Họ tên:</strong> {address.hoTen}</p>
                        <p><strong>SĐT:</strong> {address.sdt}</p>
                        <p><strong>Địa chỉ:</strong> {address.diaChi}, {address.phuongXa}, {address.quanHuyen}, {address.tinh}</p>
                        <p><strong>Trạng thái:</strong> {address.trangThai === 1 ? "Hoạt động" : "Không hoạt động"}</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => handleSelectAddress(address)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          disabled={isSelectingAddress || isDeletingAddress === address.maDiaChi}
                        >
                          <Check size={16} className="mr-2" />
                          {isSelectingAddress ? "Đang chọn..." : "Chọn"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteAddress(address.maDiaChi)}
                          variant="destructive"
                          disabled={isSelectingAddress || isDeletingAddress === address.maDiaChi}
                        >
                          <Trash2 size={16} className="mr-2" />
                          {isDeletingAddress === address.maDiaChi ? "Đang xóa..." : "Xóa"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddressModal(false)}
              disabled={isSelectingAddress || isDeletingAddress !== null}
            >
              Đóng
            </Button>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default CartPage;