  import { useState, useEffect } from "react";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Badge } from "@/components/ui/badge";
  import { Search, Grid2X2, List, Tag, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
  import { toast } from "sonner";
  import * as Dialog from "@radix-ui/react-dialog";
  import Swal from "sweetalert2";
  import { useNavigate } from "react-router-dom";

  // Hàm kiểm tra mã màu hex
  const isValidHexColor = (color) => /^[0-9a-fA-F]{6}$/.test(color);

  // Hàm hiển thị thông báo
  const showNotification = (message, type) => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Định nghĩa interface
  interface Product {
    id: string;
    name: string;
    mauSac: string;
    kichThuoc: string;
    donGia: number;
    hinh: string[];
    variationId: string;
    thuongHieu: string;
    chatLieu: string;
    soLuong: number;
    loaiSanPham: string;
    trangThai: number;
  }

  interface CartItem {
    idSanPham: number;
    tenSanPham: string;
    mauSac: string;
    kichThuoc: string;
    soLuong: number;
    tienSanPham: number;
    hinhAnh: string;
  }

  interface ComboItem {
    idCombo: string;
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

  const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [comboItems, setComboItems] = useState<ComboItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("grid");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [promoCode, setPromoCode] = useState("");
    const [discountApplied, setDiscountApplied] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [finalAmount, setFinalAmount] = useState<number>(0);
    const [selectedCombo, setSelectedCombo] = useState<ComboItem | null>(null);
    const [cartId, setCartId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "vnpay">("cash");
    const [customerPaid, setCustomerPaid] = useState<string>("");
    const productsPerPage = 6;

    const formatCurrency = (amount: number) => {
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      return subtotal - discountAmount;
    };

    const calculateChange = () => {
      const total = calculateTotal();
      const paid = parseFloat(customerPaid) || 0;
      return paid >= total ? paid - total : 0;
    };

    useEffect(() => {
      const fetchCartData = async () => {
        const userId = "KH001";
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

        try {
          const response = await fetch(
            `http://localhost:5261/api/Cart/GioHangByKhachHang?id=${userId}`
          );
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

          const subtotal = processedCartItems.reduce(
            (sum, item) => sum + item.tienSanPham * item.soLuong,
            0
          ) +
            processedComboItems.reduce(
              (sum, item) => sum + item.gia * item.soLuong,
              0
            );
          setFinalAmount(subtotal);
        } catch (error) {
          console.error("Lỗi lấy dữ liệu giỏ hàng:", error);
        }
      };

      const fetchProducts = async () => {
        try {
          const response = await fetch("http://localhost:5261/api/SanPham/ListSanPham", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            const data = await response.json();
            const flattenedProducts = data.flatMap((product) => {
              const { mauSac = [""], kichThuoc = [""], hinh = [], ...rest } = product;
              return mauSac.flatMap((color) =>
                kichThuoc.map((size) => ({
                  ...rest,
                  mauSac: color || "N/A",
                  kichThuoc: size,
                  hinh: hinh.length > 0 ? hinh : ["/placeholder-image.jpg"],
                  variationId: `${product.id}-${color}-${size}`,
                  name: `${product.name || "Không có tên"} ${
                    color ? `(${color}` : ""
                  }${size ? `${color ? ", " : "("}${size})` : color ? ")" : ""}`,
                }))
              );
            });
            setProducts(flattenedProducts || []);
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

      fetchCartData();
      fetchProducts();
    }, [navigate]);

    const handleAddToCart = async (product: Product) => {
      if (!product.kichThuoc || product.kichThuoc === "N/A") {
        showNotification("Vui lòng chọn kích thước trước khi thêm vào giỏ hàng!", "error");
        return;
      }

      const cartData = {
        IDNguoiDung: "KH001",
        IDSanPham: product.id,
        MauSac: product.mauSac,
        KichThuoc: product.kichThuoc,
        SoLuong: 1,
      };

      try {
        const response = await fetch("http://localhost:5261/api/Cart/ThemSanPhamVaoGioHang", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartData),
        });

        if (!response.ok) {
          throw new Error("Không thể thêm vào giỏ hàng");
        }

        const updatedCartResponse = await fetch(
          `http://localhost:5261/api/Cart/GioHangByKhachHang?id=KH001`
        );
        if (updatedCartResponse.ok) {
          const data = await updatedCartResponse.json();
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
          const subtotal = processedCartItems.reduce(
            (sum, item) => sum + item.tienSanPham * item.soLuong,
            0
          ) +
            processedComboItems.reduce(
              (sum, item) => sum + item.gia * item.soLuong,
              0
            );
          setFinalAmount(subtotal);
        }

        showNotification("Đã thêm vào giỏ hàng thành công!", "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi thêm vào giỏ hàng!", "error");
        console.error("Lỗi thêm vào giỏ hàng:", err);
      }
    };

    const handleQuantityChange = async (idSanPham: number, change: number) => {
      const userId = "KH001";
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
          await fetch("http://localhost:5261/api/Cart/TangSoLuongSanPham", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(info),
          });
        } else {
          await fetch("http://localhost:5261/api/Cart/GiamSoLuongSanPham", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
        setFinalAmount(subtotal - discountAmount);
      } catch (error) {
        toast.error("Không thể cập nhật số lượng");
        console.error("Lỗi cập nhật số lượng:", error);
      }
    };

    const handleRemoveItem = async (idSanPham: number) => {
      const userId = "KH001";
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
          await fetch("http://localhost:5261/api/Cart/XoaSanPham", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(info),
          });

          setCartItems((prevItems) =>
            prevItems.filter((item) => item.idSanPham !== idSanPham)
          );
          toast.success("Đã xóa sản phẩm khỏi giỏ hàng");

          const subtotal = calculateSubtotal();
          setFinalAmount(subtotal - discountAmount);
        } catch (error) {
          toast.error("Xóa sản phẩm thất bại");
          console.error("Lỗi xóa sản phẩm:", error);
        }
      }
    };

    const handleRemoveCombo = async (idCombo: string) => {
      const userId = "KH001";
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
          await fetch("http://localhost:5261/api/Cart/XoaCombo", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(info),
          });

          setComboItems((prevItems) =>
            prevItems.filter((item) => item.idCombo !== idCombo)
          );
          toast.success("Đã xóa combo khỏi giỏ hàng");

          const subtotal = calculateSubtotal();
          setFinalAmount(subtotal - discountAmount);
        } catch (error) {
          toast.error("Xóa combo thất bại");
          console.error("Lỗi xóa combo:", error);
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
      setFinalAmount(subtotal - discountAmount);
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
          `http://localhost:5261/api/Voucher/Validate?code=${encodeURIComponent(
            promoCode
          )}&cartId=${cartId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setDiscountApplied(true);
          setDiscountAmount(result.discountAmount);
          setFinalAmount(calculateSubtotal() - result.discountAmount);
          toast.success("Mã giảm giá đã được áp dụng!");
        } else {
          setDiscountApplied(false);
          setDiscountAmount(0);
          setFinalAmount(calculateSubtotal());
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
        console.error("Lỗi áp dụng mã giảm giá:", error);
      }
    };

    const handleSubmitCheckout = async (e: React.FormEvent) => {
      e.preventDefault();

      const userId = "KH001";
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

      if (paymentMethod === "cash") {
        const total = calculateTotal();
        const paid = parseFloat(customerPaid) || 0;

        if (paid < total) {
          toast.error("Số tiền khách đưa không đủ để thanh toán!");
          return;
        }
      }

      try {
        const response = await fetch(
          `http://localhost:5261/api/Cart/GioHangByKhachHang?id=${userId}`
        );
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
            `http://localhost:5261/api/Voucher/Validate?code=${encodeURIComponent(
              promoCode
            )}&cartId=${data.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const voucherResult = await voucherResponse.json();
          if (!voucherResult.success) {
            setDiscountApplied(false);
            setDiscountAmount(0);
            toast.error("Mã giảm giá không hợp lệ, đã xóa giảm giá");
            setFinalAmount(calculateSubtotal());
            return;
          } else {
            setDiscountApplied(true);
            setDiscountAmount(voucherResult.discountAmount);
          }
        }

        const subtotal = calculateSubtotal();
        const newFinalAmount = subtotal - discountAmount;

        const paymentRequest = {
          cartId: data.id,
          couponCode: promoCode || null,
          paymentMethod: paymentMethod,
          discountAmount: discountAmount,
          finalAmount: newFinalAmount,
          shippingFee: 0,
          tenNguoiNhan: "Khách hàng offline",
          sdt: "N/A",
          diaChi: "Thanh toán tại cửa hàng"
        };

        const paymentResponse = await fetch(
          "http://localhost:5261/api/CheckOut/process-payment",
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
          if (paymentMethod === "cash") {
            toast.success(result.message, {
              description: `Mã đơn hàng: ${result.orderId}`,
              duration: 3000,
              action: {
                label: "Xem chi tiết",
                onClick: () =>
                  navigate("/payment-success", { state: { orderId: result.orderId } }),
              },
            });
            setCartItems([]);
            setComboItems([]);
            setPromoCode("");
            setDiscountApplied(false);
            setDiscountAmount(0);
            setFinalAmount(0);
            setCustomerPaid("");
            navigate("/payment-success", { state: { orderId: result.orderId } });
          } else if (paymentMethod === "vnpay") {
            if (result.finalAmount !== newFinalAmount) {
              toast.error(
                `Tổng tiền VNPay (${formatCurrency(
                  result.finalAmount
                )} VND) không khớp với kỳ vọng (${formatCurrency(
                  newFinalAmount
                )} VND).`
              );
              return;
            }
            window.location.href = result.message;
          }
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Đã xảy ra lỗi khi thanh toán");
        console.error("Lỗi thanh toán:", error);
      }
    };

    const getSortedProducts = () => {
      let filtered = [...products];

      // Tách chuỗi tìm kiếm
      if (searchTerm.includes("_")) {
        const parts = searchTerm.split("_");
        const searchId = parts[0]?.trim() || "";
        const searchMauSac = parts[1]?.trim() || "";
        const searchKichThuoc = parts[2]?.trim() || "";

        filtered = filtered.filter((product) => {
          const idMatch = searchId
            ? (product.id?.toLowerCase() || "") === searchId.toLowerCase()
            : true;
          const mauSacMatch = searchMauSac
            ? (product.mauSac?.toLowerCase() || "") === searchMauSac.toLowerCase()
            : true;
          const kichThuocMatch = searchKichThuoc
            ? (product.kichThuoc?.toLowerCase() || "") === searchKichThuoc.toLowerCase()
            : true;

          // Nếu có searchKichThuoc, yêu cầu cả 3 trường phải khớp chính xác
          // Nếu chỉ có searchId và searchMauSac, bỏ qua kichThuoc
          return searchKichThuoc
            ? idMatch && mauSacMatch && kichThuocMatch
            : idMatch && mauSacMatch;
        });
      } else if (searchTerm.includes(",")) {
        // Xử lý tìm kiếm theo định dạng cũ: id,mauSac,kichThuoc
        const parts = searchTerm.split(",");
        const searchId = parts[0]?.trim() || "";
        const searchMauSac = parts[1]?.trim() || "";
        const searchKichThuoc = parts[2]?.trim() || "";

        filtered = filtered.filter((product) => {
          const idMatch = searchId
            ? (product.id?.toLowerCase() || "") === searchId.toLowerCase()
            : true;
          const mauSacMatch = searchMauSac
            ? (product.mauSac?.toLowerCase() || "") === searchMauSac.toLowerCase()
            : true;
          const kichThuocMatch = searchKichThuoc
            ? (product.kichThuoc?.toLowerCase() || "") === searchKichThuoc.toLowerCase()
            : true;

          return idMatch && mauSacMatch && kichThuocMatch;
        });
      } else {
        // Tìm kiếm thông thường (theo tên, loại, mã, màu, kích thước)
        filtered = filtered.filter(
          (product) =>
            (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (product.loaiSanPham?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (product.id?.toString().toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (product.mauSac?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (product.kichThuoc?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
      }

      // Sắp xếp sản phẩm
      switch (sortBy) {
        case "price-asc":
          return filtered.sort((a, b) => (a.donGia || 0) - (b.donGia || 0));
        case "price-desc":
          return filtered.sort((a, b) => (b.donGia || 0) - (a.donGia || 0));
        case "name-asc":
          return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        case "name-desc":
          return filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        default:
          return filtered;
      }
    };

    const sortedProducts = getSortedProducts();
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    if (loading) {
      return <div className="flex justify-center items-center h-screen">Đang tải sản phẩm...</div>;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sản phẩm</h1>
            <p className="text-muted-foreground mt-1">Danh sách sản phẩm trong cửa hàng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Tất cả sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Tìm theo tên, loại, mã, màu, kích thước hoặc mã_màu_kích thước, mã_màu, mã,màu,kích thước"
                      className="pl-8 w-full sm:w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 self-end items-center">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentProducts.map((product) => (
                      <Card key={product.variationId} className="hover-scale overflow-hidden">
                        <div className="h-40 bg-purple-light flex items-center justify-center">
                          <img
                            src={
                              product.hinh && product.hinh[0]
                                ? `data:image/jpeg;base64,${product.hinh[0]}`
                                : "/placeholder-image.jpg"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div>
                            <h3 className="font-semibold">{product.name || "Không có tên"}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Mã: {product.id || "N/A"}_{product.mauSac}_{product.kichThuoc}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Thương hiệu: {product.thuongHieu || "Không xác định"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center">
                              Màu sắc: {product.mauSac || "N/A"}
                              {isValidHexColor(product.mauSac) && (
                                <span
                                  className="inline-block w-4 h-4 ml-2 rounded-full border border-gray-300"
                                  style={{ backgroundColor: `#${product.mauSac}` }}
                                ></span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Kích thước: {product.kichThuoc || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Chất liệu: {product.chatLieu || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Số lượng: {product.soLuong || 0}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="bg-secondary border-0 text-white">
                              <Tag className="h-3 w-3 mr-1" /> {product.loaiSanPham || "N/A"}
                            </Badge>
                            <Badge
                              variant={product.soLuong > 0 ? "default" : "destructive"}
                              className="flex items-center px-2"
                            >
                              {product.trangThai === 0 ? "Tạm Ngưng Bán" : "Đang Bán"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="font-bold text-purple">
                              {product.donGia?.toFixed(2) || "0"} VND
                            </span>
                          </div>
                          <div className="flex gap-3 mt-3">
                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 bg-crocus-600 hover:bg-crocus-700"
                              disabled={product.soLuong === 0}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentProducts.map((product) => (
                      <Card key={product.variationId} className="flex">
                        <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                          <img
                            src={
                              product.hinh && product.hinh[0]
                                ? `data:image/jpeg;base64,${product.hinh[0]}`
                                : "/placeholder-image.jpg"
                            }
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardContent className="flex-1 p-4">
                          <h3 className="font-semibold">{product.name || "Không có tên"}</h3>
                          <p className="text-sm text-muted-foreground mt-1">Mã: {product.id || "N/A"}</p>
                          <p className="text-sm text-muted-foreground mt-1">Màu sắc: {product.mauSac || "N/A"}</p>
                          <p className="text-sm text-muted-foreground mt-1">Kích thước: {product.kichThuoc || "N/A"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Giá: {product.donGia?.toFixed(2) || "0"} VND
                          </p>
                          <div className="flex gap-3 mt-3">
                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 bg-crocus-600 hover:bg-crocus-700"
                              disabled={product.soLuong === 0}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" /> Thêm
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-center gap-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Giỏ hàng */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Giỏ hàng</h2>
              {cartItems.length > 0 || comboItems.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div
                        key={item.idSanPham}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-2 bg-gray-50 rounded-md"
                      >
                        <div className="w-full sm:w-16 h-16 bg-muted rounded-md overflow-hidden mr-2 mb-2 sm:mb-0">
                          <img
                            src={item.hinhAnh}
                            alt={item.tenSanPham}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.tenSanPham}</h3>
                          <p className="text-muted-foreground text-xs">
                            {item.mauSac}, {item.kichThuoc}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatCurrency(item.tienSanPham)} VND x {item.soLuong}
                          </p>
                        </div>
                        <div className="flex items-center mt-2 sm:mt-0">
                          <button
                            onClick={() => handleQuantityChange(item.idSanPham, -1)}
                            className="p-1 rounded-md hover:bg-muted"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="mx-1 w-6 text-center text-xs">{item.soLuong}</span>
                          <button
                            onClick={() => handleQuantityChange(item.idSanPham, 1)}
                            className="p-1 rounded-md hover:bg-muted"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.idSanPham)}
                            className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {comboItems.map((combo) => (
                      <div
                        key={combo.idCombo}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-2 bg-gray-50 rounded-md"
                      >
                        <div className="w-full sm:w-16 h-16 bg-muted rounded-md overflow-hidden mr-2 mb-2 sm:mb-0">
                          <img
                            src={combo.hinhAnh}
                            alt={combo.tenCombo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{combo.tenCombo}</h3>
                          <p className="text-muted-foreground text-xs">
                            Gồm: {combo.sanPhamList.length} sản phẩm
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatCurrency(combo.gia)} VND x {combo.soLuong}
                          </p>
                        </div>
                        <div className="flex items-center mt-2 sm:mt-0">
                          <span className="mx-1 w-6 text-center text-xs">{combo.soLuong}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-1 py-0 h-6"
                            onClick={() => setSelectedCombo(combo)}
                          >
                            Cập nhật
                          </Button>
                          <button
                            onClick={() => handleRemoveCombo(combo.idCombo)}
                            className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
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
                  <div className="flex items-center mb-4">
                    <Input
                      placeholder="Mã giảm giá"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="mr-2"
                    />
                    <Button size="sm" onClick={handleApplyPromo}>
                      Áp Dụng
                    </Button>
                  </div>
                  <form onSubmit={handleSubmitCheckout} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phương thức thanh toán</Label>
                      <div className="flex gap-3">
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === "cash"}
                            onChange={() => {
                              setPaymentMethod("cash");
                              setCustomerPaid("");
                            }}
                            className="mr-1"
                          />
                          Tiền mặt
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="vnpay"
                            checked={paymentMethod === "vnpay"}
                            onChange={() => {
                              setPaymentMethod("vnpay");
                              setCustomerPaid("");
                            }}
                            className="mr-1"
                          />
                          VNPay
                        </label>
                      </div>
                      {paymentMethod === "cash" && (
                        <div className="space-y-2 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerPaid">Số tiền khách đưa (VND)</Label>
                            <Input
                              id="customerPaid"
                              type="number"
                              value={customerPaid}
                              onChange={(e) => setCustomerPaid(e.target.value)}
                              placeholder="Nhập số tiền khách đưa"
                              min="0"
                              required
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Số tiền thối lại:</span>
                            <span className={calculateChange() >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(calculateChange())} VND
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!cartId || (paymentMethod === "cash" && parseFloat(customerPaid) < calculateTotal())}
                    >
                      {paymentMethod === "cash" ? "Xác nhận thanh toán tiền mặt" : "Thanh toán qua VNPay"}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
                  <p className="text-muted-foreground">Chưa có sản phẩm nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Dialog.Root
          open={!!selectedCombo}
          onOpenChange={(open) => !open && setSelectedCombo(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {/* Placeholder cho GiohangComboSupport */}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    );
  };

  export default Products;