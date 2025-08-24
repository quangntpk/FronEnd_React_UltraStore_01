import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Grid2X2, List, Tag, ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import AdminHoaDon from "./AdminHoaDon";

const isValidHexColor = (color: string) => /^[0-9a-fA-F]{6}$/.test(color);

const showNotification = (message: string, type: "success" | "error") => {
  toast[type](message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: type === "success" ? "#10B981" : "#EF4444",
      color: "white",
      border: "none",
    },
  });
};

interface ProductDetail {
  kichThuoc: string;
  soLuong: number;
  gia: number;
  giaNhap: number;
  hinhAnh: string;
}

interface Product {
  id: string;
  tenSanPham: string;
  maThuongHieu: string;
  loaiSanPham: string;
  th: number;
  lsp: number;
  mauSac: string;
  moTa: string;
  chatLieu: string;
  gioiTinh: number;
  details: ProductDetail[];
  moTaChiTiet: string | null;
  listHashTag: string[];
  khuyenMaiMax: number;
}

interface DisplayProduct {
  id: string;
  name: string;
  mauSac: string;
  kichThuoc: string;
  donGia: number;
  giaNhap: number;
  hinhAnh: string;
  variationId: string;
  thuongHieu: string;
  chatLieu: string;
  soLuong: number;
  loaiSanPham: string;
  trangThai: number;
  khuyenMaiMax: number;
  gioiTinh: number;
}

interface CartItem {
  idSanPham: string;
  tenSanPham: string;
  mauSac: string;
  kichThuoc: string;
  soLuong: number;
  tienSanPham: number;
  hinhAnh: string;
}

const validateProductForCart = (product: DisplayProduct): { isValid: boolean; message?: string } => {
  if (!product) {
    return { isValid: false, message: "Thông tin sản phẩm không hợp lệ" };
  }

  if (!product.id || product.id.trim() === "") {
    return { isValid: false, message: "Mã sản phẩm không hợp lệ" };
  }

  if (!product.variationId || product.variationId.trim() === "") {
    return { isValid: false, message: "ID biến thể sản phẩm không hợp lệ" };
  }

  if (!product.name || product.name.trim() === "") {
    return { isValid: false, message: "Tên sản phẩm không hợp lệ" };
  }

  if (product.soLuong <= 0) {
    return { isValid: false, message: "Sản phẩm đã hết hàng" };
  }

  if (!product.kichThuoc || product.kichThuoc === "N/A" || product.kichThuoc.trim() === "") {
    return { isValid: false, message: "Kích thước sản phẩm không hợp lệ" };
  }

  if (!product.mauSac || product.mauSac === "N/A" || product.mauSac.trim() === "") {
    return { isValid: false, message: "Màu sắc sản phẩm không hợp lệ" };
  }

  if (!product.donGia || product.donGia <= 0) {
    return { isValid: false, message: "Giá sản phẩm không hợp lệ" };
  }

  return { isValid: true };
};

const handleAddToCart = async (
  product: DisplayProduct,
  cartItems: CartItem[],
  setButtonLoading: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
  fetchCartData: () => Promise<void>,
  navigate: (path: string) => void
) => {
  try {
    const userId = "KH001";
    if (!userId) {
      Swal.fire({
        title: "Vui lòng đăng nhập!",
        text: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.",
        icon: "warning",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    if (!product) {
      showNotification("Thông tin sản phẩm không hợp lệ!", "error");
      return;
    }

    if (product.soLuong <= 0) {
      showNotification(`Sản phẩm "${product.name}" đã hết hàng!`, "error");
      return;
    }

    if (!product.kichThuoc || product.kichThuoc === "N/A" || product.kichThuoc.trim() === "") {
      showNotification("Sản phẩm này chưa có kích thước hợp lệ!", "error");
      return;
    }

    if (!product.mauSac || product.mauSac === "N/A" || product.mauSac.trim() === "") {
      showNotification("Sản phẩm này chưa có màu sắc hợp lệ!", "error");
      return;
    }

    const existingCartItem = cartItems.find(item => item.idSanPham === product.variationId);
    if (existingCartItem) {
      if (existingCartItem.soLuong >= product.soLuong) {
        showNotification(`Không thể thêm thêm. Số lượng trong kho chỉ còn ${product.soLuong}!`, "error");
        return;
      }
    }

    const cartData = {
      IDNguoiDung: userId,
      IDSanPham: product.id.trim(),
      MauSac: product.mauSac.trim(),
      KichThuoc: product.kichThuoc.trim(),
      SoLuong: 1,
    };

    setButtonLoading((prev) => ({ ...prev, [`add_${product.variationId}`]: true }));

    const response = await fetch("https://bicacuatho.azurewebsites.net/api/Cart/ThemSanPhamVaoGioHang", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(cartData),
    });

    if (!response.ok) {
      let errorMessage = "Không thể thêm vào giỏ hàng";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        const errorText = await response.text();
        errorMessage = errorText || `HTTP Error: ${response.status} - ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    let responseData;
    try {
      const responseText = await response.text();
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.warn("Không thể parse response JSON, nhưng request thành công");
      responseData = { success: true };
    }

    await fetchCartData();

    showNotification(
      `Đã thêm "${product.name}" (${product.mauSac}, ${product.kichThuoc}) vào giỏ hàng!`,
      "success"
    );

  } catch (error) {
    console.error("Lỗi thêm vào giỏ hàng:", error);

    let errorMessage = "Có lỗi xảy ra khi thêm vào giỏ hàng";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    showNotification(errorMessage, "error");

  } finally {
    setButtonLoading((prev) => ({ ...prev, [`add_${product.variationId}`]: false }));
  }
};

const handleAddToCartWithValidation = async (
  product: DisplayProduct,
  cartItems: CartItem[],
  setButtonLoading: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
  fetchCartData: () => Promise<void>,
  navigate: (path: string) => void
) => {
  const validation = validateProductForCart(product);
  if (!validation.isValid) {
    showNotification(validation.message!, "error");
    return;
  }

  await handleAddToCart(product, cartItems, setButtonLoading, fetchCartData, navigate);
};

const handleAddToCartWithRetry = async (
  product: DisplayProduct,
  cartItems: CartItem[],
  setButtonLoading: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
  fetchCartData: () => Promise<void>,
  navigate: (path: string) => void,
  maxRetries = 3
) => {
  let currentTry = 0;

  while (currentTry < maxRetries) {
    try {
      await handleAddToCartWithValidation(product, cartItems, setButtonLoading, fetchCartData, navigate);
      return;
    } catch (error) {
      currentTry++;
      console.error(`Lần thử ${currentTry} thất bại:`, error);

      if (currentTry >= maxRetries) {
        showNotification("Thêm vào giỏ hàng thất bại sau nhiều lần thử. Vui lòng thử lại sau.", "error");
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * currentTry));
    }
  }
};

const AdminBuy = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState<{ [key: string]: boolean }>({});
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "vnpay">("cash");
  const [customerPaid, setCustomerPaid] = useState<string>("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [cartId, setCartId] = useState<number | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const productsPerPage = 6;

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.tienSanPham * item.soLuong,
      0
    );
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const paid = parseFloat(customerPaid) || 0;
    return paid >= total ? paid - total : 0;
  };

  const fetchProductIds = async () => {
    try {
      const response = await fetch("https://bicacuatho.azurewebsites.net/api/SanPham/ListSanPham", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const ids = data.map((product: any) => product.id).filter((id: string) => id);
        setProductIds(ids);
        return ids;
      } else {
        showNotification("Lỗi khi lấy danh sách ID sản phẩm!", "error");
        return [];
      }
    } catch (error) {
      showNotification("Lỗi kết nối API danh sách ID sản phẩm!", "error");
      console.error("Lỗi kết nối API danh sách ID sản phẩm:", error);
      return [];
    }
  };

  const fetchProductById = async (id: string): Promise<Product[]> => {
    try {
      const response = await fetch(
        `https://bicacuatho.azurewebsites.net/api/SanPham/SanPhamByIDSorted?id=${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: { "Accept": "*/*" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        showNotification(`Lỗi khi lấy sản phẩm ID ${id}!`, "error");
        return [];
      }
    } catch (error) {
      showNotification(`Lỗi kết nối API sản phẩm ID ${id}!`, "error");
      console.error(`Lỗi kết nối API sản phẩm ID ${id}:`, error);
      return [];
    }
  };

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
      setButtonLoading((prev) => ({ ...prev, fetchCart: true }));
      const response = await fetch(
        `https://bicacuatho.azurewebsites.net/api/Cart/GioHangByKhachHang?id=${userId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setCartId(data.id || null);
      const processedCartItems = data.ctghSanPhamView?.map((item: any) => ({
        idSanPham: item.idSanPham,
        tenSanPham: item.tenSanPham,
        mauSac: item.mauSac || "N/A",
        kichThuoc: item.kickThuoc || "N/A",
        soLuong: item.soLuong,
        tienSanPham: item.tienSanPham,
        hinhAnh: item.hinhAnh?.startsWith("data:image")
          ? item.hinhAnh
          : `data:image/jpeg;base64,${item.hinhAnh || ""}`,
      })) || [];
      setCartItems(processedCartItems);
    } catch (error) {
      showNotification("Lỗi lấy dữ liệu giỏ hàng: " + error.message, "error");
      console.error("Lỗi lấy dữ liệu giỏ hàng:", error);
    } finally {
      setButtonLoading((prev) => ({ ...prev, fetchCart: false }));
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const ids = await fetchProductIds();

      if (ids.length === 0) {
        setProducts([]);
        showNotification("Không tìm thấy sản phẩm!", "error");
        return;
      }

      const allProducts: Product[] = [];
      for (const id of ids) {
        const productVariants = await fetchProductById(id);
        allProducts.push(...productVariants);
      }

      const flattenedProducts: DisplayProduct[] = allProducts.flatMap((product) => {
        const baseId = product.id.split("_")[0];
        return product.details.map((detail) => ({
          id: baseId,
          name: product.tenSanPham,
          mauSac: product.mauSac || "N/A",
          kichThuoc: detail.kichThuoc?.trim() || "N/A",
          donGia: detail.gia,
          giaNhap: detail.giaNhap,
          hinhAnh: detail.hinhAnh || "/placeholder-image.jpg",
          variationId: `${baseId}_${product.mauSac || "N/A"}_${detail.kichThuoc?.trim() || "N/A"}`,
          thuongHieu: product.maThuongHieu || "N/A",
          chatLieu: product.chatLieu || "N/A",
          soLuong: detail.soLuong || 0,
          loaiSanPham: product.loaiSanPham || "N/A",
          trangThai: detail.soLuong > 0 ? 1 : 0,
          khuyenMaiMax: product.khuyenMaiMax || 0,
          gioiTinh: product.gioiTinh || 0,
        }));
      });

      setProducts(flattenedProducts);
    } catch (error) {
      showNotification("Lỗi khi lấy danh sách sản phẩm!", "error");
      console.error("Lỗi khi lấy tất cả sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSearch = () => {
    const orderId = parseInt(orderSearchTerm, 10);
    if (isNaN(orderId) || orderId <= 0) {
      showNotification("Vui lòng nhập mã đơn hàng hợp lệ (số nguyên dương)!", "error");
      return;
    }
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  useEffect(() => {
    fetchCartData();
    fetchAllProducts();
  }, [navigate]);

  const handleQuantityChange = async (idSanPham: string, change: number) => {
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

    const item = cartItems.find((item) => item.idSanPham === idSanPham);
    if (!item) {
      showNotification("Sản phẩm không tồn tại trong giỏ hàng!", "error");
      return;
    }

    const product = products.find((p) => p.variationId === idSanPham);
    if (change > 0 && product && item.soLuong >= product.soLuong) {
      showNotification("Số lượng vượt quá tồn kho!", "error");
      return;
    }
    if (change < 0 && item.soLuong <= 1) {
      showNotification("Số lượng không thể nhỏ hơn 1! Vui lòng xóa sản phẩm nếu cần.", "error");
      return;
    }

    try {
      setButtonLoading((prev) => ({ ...prev, [`quantity_${idSanPham}_${change}`]: true }));
      const info = {
        MaKhachHang: userId,
        IDSanPham: idSanPham,
      };

      const endpoint =
        change > 0
          ? "https://bicacuatho.azurewebsites.net/api/Cart/TangSoLuongSanPham"
          : "https://bicacuatho.azurewebsites.net/api/Cart/GiamSoLuongSanPham";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(info),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      await fetchCartData();
      showNotification("Cập nhật số lượng thành công!", "success");
    } catch (error: any) {
      showNotification(`Không thể cập nhật số lượng: ${error.message}`, "error");
      console.error("Lỗi cập nhật số lượng:", error);
    } finally {
      setButtonLoading((prev) => ({ ...prev, [`quantity_${idSanPham}_${change}`]: false }));
    }
  };

  const handleRemoveItem = async (idSanPham: string) => {
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
      try {
        setButtonLoading((prev) => ({ ...prev, [`remove_${idSanPham}`]: true }));
        const info = {
          MaKhachHang: userId,
          IDSanPham: idSanPham,
        };
        const response = await fetch("https://bicacuatho.azurewebsites.net/api/Cart/XoaSanPham", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(info),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        await fetchCartData();
        showNotification("Đã xóa sản phẩm khỏi giỏ hàng!", "success");
      } catch (error: any) {
        showNotification(`Xóa sản phẩm thất bại: ${error.message}`, "error");
        console.error("Lỗi xóa sản phẩm:", error);
      } finally {
        setButtonLoading((prev) => ({ ...prev, [`remove_${idSanPham}`]: false }));
      }
    }
  };

  const handleSubmitCheckout = async () => {
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

    if (!cartItems.length) {
      showNotification("Giỏ hàng trống, vui lòng thêm sản phẩm!", "error");
      return;
    }

    if (paymentMethod === "cash") {
      const total = calculateTotal();
      const paid = parseFloat(customerPaid) || 0;
      if (paid < total) {
        showNotification("Số tiền khách đưa không đủ để thanh toán!", "error");
        return;
      }
    }

    try {
      setButtonLoading((prev) => ({ ...prev, checkout: true }));
      const response = await fetch(
        `https://bicacuatho.azurewebsites.net/api/Cart/GioHangByKhachHang?id=${userId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setCartId(data.id || null);

      const processedCartItems = data.ctghSanPhamView?.map((item: any) => ({
        idSanPham: item.idSanPham,
        tenSanPham: item.tenSanPham,
        mauSac: item.mauSac || "N/A",
        kichThuoc: item.kichThuoc || "N/A",
        soLuong: item.soLuong,
        tienSanPham: item.tienSanPham,
        hinhAnh: item.hinhAnh?.startsWith("data:image")
          ? item.hinhAnh
          : `data:image/jpeg;base64,${item.hinhAnh || ""}`,
      })) || [];
      setCartItems(processedCartItems);

      for (const item of processedCartItems) {
        const product = products.find((p) => p.variationId === item.idSanPham);
        if (product && item.soLuong > product.soLuong) {
          showNotification(`Sản phẩm ${item.tenSanPham} vượt quá tồn kho!`, "error");
          return;
        }
      }

      const total = calculateTotal();

      const paymentRequest = {
        cartId: data.id,
        paymentMethod: paymentMethod,
        finalAmount: total,
        shippingFee: 0,
        tenNguoiNhan: "Khách hàng offline",
        sdt: "N/A",
        diaChi: "Thanh toán tại cửa hàng",
      };

      const paymentResponse = await fetch(
        "https://bicacuatho.azurewebsites.net/api/CheckOut/process-payment",
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
          showNotification(`Thanh toán thành công! Mã đơn hàng: ${result.orderId}`, "success");
          setCartItems([]);
          setCustomerPaid("");
          setSelectedOrderId(result.orderId);
          setIsOrderModalOpen(true);
        } else if (paymentMethod === "vnpay") {
          if (result.finalAmount !== total) {
            showNotification(
              `Tổng tiền VNPay (${formatCurrency(
                result.finalAmount
              )}) không khớp với kỳ vọng (${formatCurrency(
                total
              )}).`,
              "error"
            );
            return;
          }
          setSelectedOrderId(result.orderId);
          setIsOrderModalOpen(true);
          window.location.href = result.message;
        }
      } else {
        showNotification(result.message || "Thanh toán thất bại!", "error");
      }
    } catch (error: any) {
      showNotification(`Đã xảy ra lỗi khi thanh toán: ${error.message}`, "error");
      console.error("Lỗi thanh toán:", error);
    } finally {
      setButtonLoading((prev) => ({ ...prev, checkout: false }));
    }
  };

  const getSortedProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      if (searchTerm.includes("_")) {
        const parts = searchTerm.split("_");
        const searchId = parts[0]?.trim().toLowerCase() || "";
        const searchMauSac = parts[1]?.trim().toLowerCase() || "";
        const searchKichThuoc = parts[2]?.trim().toLowerCase() || "";

        filtered = filtered.filter((product) => {
          const idMatch = searchId
            ? product.id.toLowerCase().includes(searchId)
            : true;
          const mauSacMatch = searchMauSac
            ? product.mauSac.toLowerCase().includes(searchMauSac)
            : true;
          const kichThuocMatch = searchKichThuoc
            ? product.kichThuoc.toLowerCase().includes(searchKichThuoc)
            : true;

          return searchKichThuoc
            ? idMatch && mauSacMatch && kichThuocMatch
            : idMatch && mauSacMatch;
        });
      } else if (searchTerm.includes(",")) {
        const parts = searchTerm.split(",");
        const searchId = parts[0]?.trim().toLowerCase() || "";
        const searchMauSac = parts[1]?.trim().toLowerCase() || "";
        const searchKichThuoc = parts[2]?.trim().toLowerCase() || "";

        filtered = filtered.filter((product) => {
          const idMatch = searchId
            ? product.id.toLowerCase().includes(searchId)
            : true;
          const mauSacMatch = searchMauSac
            ? product.mauSac.toLowerCase().includes(searchMauSac)
            : true;
          const kichThuocMatch = searchKichThuoc
            ? product.kichThuoc.toLowerCase().includes(searchKichThuoc)
            : true;

          return idMatch && mauSacMatch && kichThuocMatch;
        });
      } else {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(term) ||
            product.loaiSanPham.toLowerCase().includes(term) ||
            product.id.toLowerCase().includes(term) ||
            product.mauSac.toLowerCase().includes(term) ||
            product.kichThuoc.toLowerCase().includes(term)
        );
      }
    }

    switch (sortBy) {
      case "price-asc":
        return filtered.sort((a, b) => (a.donGia * (1 - a.khuyenMaiMax / 100)) - (b.donGia * (1 - b.khuyenMaiMax / 100)));
      case "price-desc":
        return filtered.sort((a, b) => (b.donGia * (1 - b.khuyenMaiMax / 100)) - (a.donGia * (1 - a.khuyenMaiMax / 100)));
      case "name-asc":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
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
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" /> Đang tải sản phẩm...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Link to="/admin">
            <ArrowLeft className="w-6 h-6 hover:text-purple-500 transition-colors duration-200" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Nhân viên bán hàng</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Bán hàng tại quầy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Tìm kiếm"
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Nhập mã đơn hàng"
                        className="pl-8 w-full sm:w-[200px]"
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleOrderSearch}
                      size="sm"
                      className="h-9"
                      disabled={buttonLoading.orderSearch}
                    >
                      {buttonLoading.orderSearch ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Tìm đơn hàng
                    </Button>
                  </div>
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
                  {currentProducts.map((product) => {
                    const discountedPrice = product.donGia * (1 - product.khuyenMaiMax / 100);
                    return (
                      <Card key={product.variationId} className="hover-scale overflow-hidden relative">
                        {product.khuyenMaiMax > 0 && (
                          <div className="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-red-600 text-white p-2 min-w-[60px] min-h-[60px] flex flex-col items-center justify-center shadow-lg rounded">
                            <div className="text-xs font-medium">Khuyến Mãi</div>
                            <div className="text-sm font-bold">-{product.khuyenMaiMax}%</div>
                          </div>
                        )}
                        <div className="h-40 bg-purple-light flex items-center justify-center">
                          <img
                            src={
                              product.hinhAnh
                                ? product.hinhAnh.startsWith("data:image")
                                  ? product.hinhAnh
                                  : `data:image/jpeg;base64,${product.hinhAnh}`
                                : "/placeholder-image.jpg"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Mã: {product.variationId}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              Màu sắc: {product.mauSac || "N/A"}
                              {isValidHexColor(product.mauSac) && (
                                <span
                                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: `#${product.mauSac}` }}
                                ></span>
                              )}
                              | Kích thước: {product.kichThuoc || "N/A"}
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
                          <div className="mt-3">
                            {product.khuyenMaiMax > 0 ? (
                              <>
                                <p className="font-bold text-red-600">
                                  {formatCurrency(discountedPrice)}
                                </p>
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.donGia)}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-purple-600">
                                {formatCurrency(product.donGia)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-3 mt-3">
                            <Button
                              onClick={() => handleAddToCartWithRetry(product, cartItems, setButtonLoading, fetchCartData, navigate)}
                              className="flex-1 bg-crocus-600 hover:bg-crocus-700"
                              disabled={product.soLuong === 0 || buttonLoading[`add_${product.variationId}`]}
                            >
                              {buttonLoading[`add_${product.variationId}`] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="mr-2 h-4 w-4" />
                              )}
                              Thêm
                            </Button>
                          </div>
                          <div className="text-center mt-3">
                            <img
                              alt="Barcode"
                              src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
                                product.variationId
                              )}&translate-esc=on`}
                              className="mx-auto h-12"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentProducts.map((product) => {
                    const discountedPrice = product.donGia * (1 - product.khuyenMaiMax / 100);
                    return (
                      <Card key={product.variationId} className="flex relative">
                        {product.khuyenMaiMax > 0 && (
                          <div className="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-red-600 text-white p-2 min-w-[60px] min-h-[60px] flex flex-col items-center justify-center shadow-lg rounded">
                            <div className="text-xs font-medium">Khuyến Mãi</div>
                            <div className="text-sm font-bold">-{product.khuyenMaiMax}%</div>
                          </div>
                        )}
                        <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                          <img
                            src={
                              product.hinhAnh
                                ? product.hinhAnh.startsWith("data:image")
                                  ? product.hinhAnh
                                  : `data:image/jpeg;base64,${product.hinhAnh}`
                                : "/placeholder-image.jpg"
                            }
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <CardContent className="flex-1 p-4">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Mã: {product.variationId}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            Màu sắc: {product.mauSac || "N/A"}
                            {isValidHexColor(product.mauSac) && (
                              <span
                                className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: `#${product.mauSac}` }}
                              ></span>
                            )}
                            | Kích thước: {product.kichThuoc || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Thương hiệu: {product.thuongHieu || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Chất liệu: {product.chatLieu || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Số lượng: {product.soLuong || 0}
                          </p>
                          <div className="mt-3">
                            {product.khuyenMaiMax > 0 ? (
                              <>
                                <p className="font-bold text-red-600">
                                  {formatCurrency(discountedPrice)}
                                </p>
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.donGia)}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-purple-600">
                                {formatCurrency(product.donGia)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-3 mt-3">
                            <Button
                              onClick={() => handleAddToCartWithRetry(product, cartItems, setButtonLoading, fetchCartData, navigate)}
                              className="flex-1 bg-crocus-600 hover:bg-crocus-700"
                              disabled={product.soLuong === 0 || buttonLoading[`add_${product.variationId}`]}
                            >
                              {buttonLoading[`add_${product.variationId}`] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="mr-2 h-4 w-4" />
                              )}
                              Thêm
                            </Button>
                          </div>
                          <div className="text-center mt-3">
                            <img
                              alt="Barcode"
                              src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
                                product.variationId
                              )}&translate-esc=on`}
                              className="mx-auto h-12"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-border sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Giỏ hàng</h2>
            {cartItems.length > 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const product = products.find((p) => p.variationId === item.idSanPham);
                    const discountedPrice = product
                      ? item.tienSanPham * (1 - (product.khuyenMaiMax / 100))
                      : item.tienSanPham;
                    return (
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
                        <div className="flex gap-3 border-b py-3">

                          <div className="flex-1 space-y-1 text-sm">
                            <p><span className="font-medium">{item.tenSanPham}</span></p>

                            <p><span className="font-medium">Kích thước:</span> {item.kichThuoc}</p>
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Màu sắc:</span> {item.mauSac}
                              <span
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: item.mauSac.startsWith("#") ? item.mauSac : `#${item.mauSac}` }}
                              ></span>
                            </p>

                            <p><span className="font-medium">Giá:</span> {formatCurrency(discountedPrice)}</p>
                            <p className="flex items-center gap-2">
                              <div className="flex items-center">
                                <button
                                  onClick={() => handleQuantityChange(item.idSanPham, -1)}
                                  className="p-1 rounded-md hover:bg-muted"
                                  disabled={item.soLuong <= 1 || buttonLoading[`quantity_${item.idSanPham}_-1`]}
                                >
                                  {buttonLoading[`quantity_${item.idSanPham}_-1`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Minus className="h-4 w-4" />
                                  )}
                                </button>

                                <span className="mx-2 w-6 text-center">{item.soLuong}</span>

                                <button
                                  onClick={() => handleQuantityChange(item.idSanPham, 1)}
                                  className="p-1 rounded-md hover:bg-muted"
                                  disabled={buttonLoading[`quantity_${item.idSanPham}_1`]}
                                >
                                  {buttonLoading[`quantity_${item.idSanPham}_1`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleRemoveItem(item.idSanPham)}
                                  className="ml-3 p-1 text-red-500 hover:bg-red-50 rounded-md"
                                  disabled={buttonLoading[`remove_${item.idSanPham}`]}
                                >
                                  {buttonLoading[`remove_${item.idSanPham}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </p>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                  <div className="border-t my-3"></div>
                  <div className="border-t pt-3 flex justify-between font-medium">
                    <span>Tổng tiền</span>
                    <span className="text-lg">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
                <div className="space-y-4">
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
                            {formatCurrency(calculateChange())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSubmitCheckout}
                    className="w-full"
                    disabled={
                      !cartId ||
                      (paymentMethod === "cash" && parseFloat(customerPaid) < calculateTotal()) ||
                      buttonLoading.checkout
                    }
                  >
                    {buttonLoading.checkout ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {paymentMethod === "cash" ? "Xác nhận thanh toán tiền mặt" : "Thanh toán qua VNPay"}
                  </Button>
                </div>
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

      {isOrderModalOpen && selectedOrderId && (
        <AdminHoaDon
          orderId={selectedOrderId}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedOrderId(null);
            setOrderSearchTerm("");
          }}
        />
      )}
    </div>
  );
};

export default AdminBuy;