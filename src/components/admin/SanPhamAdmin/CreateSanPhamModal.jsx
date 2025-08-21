import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, X, Upload, Trash2, Search } from "lucide-react";
import Swal from "sweetalert2";
import MoTaModal from "../SanPhamAdmin/MoTa.jsx";

const AddProductModal = ({ isAddModalOpen, setIsAddModalOpen }) => {
  const [colors, setColors] = useState([
    {
      color: "#ffffff",
      image: null,
      sizes: [{ size: "", price: "", giaNhap: "", quantity: 1 }],
    },
  ]);
  const [tenSanPham, setTenSanPham] = useState("");
  const [maThuongHieu, setMaThuongHieu] = useState("");
  const [loaiSanPham, setLoaiSanPham] = useState("");
  const [moTa, setMoTa] = useState("");
  const [chatLieu, setChatLieu] = useState("");
  const [gioiTinh, setGioiTinh] = useState("");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loaiSanPhamList, setLoaiSanPhamList] = useState([]);
  const [thuongHieuList, setThuongHieuList] = useState([]);
  const [hashTagList, setHashTagList] = useState([]);
  const [selectedHashTags, setSelectedHashTags] = useState([]);
  const [hashTagSearch, setHashTagSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isMoTaModalOpen, setIsMoTaModalOpen] = useState(false);
  const [kichThuocList, setKichThuocList] = useState([]);
  const fileInputRef = useRef(null);
  const colorImageInputRefs = useRef({});

  useEffect(() => {
    const fetchLoaiSanPham = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://localhost:7051/api/LoaiSanPham", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!response.ok) {
          if (response.status === 401) throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          throw new Error("Không thể lấy danh sách loại sản phẩm.");
        }
        const data = await response.json();
        setLoaiSanPhamList(Array.isArray(data) ? data.filter(lsp => lsp.trangThai === 1) : []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại sản phẩm:", error);
        Swal.fire({
          title: "Lỗi!",
          text: error.message || "Không thể lấy danh sách loại sản phẩm.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    };

    const fetchThuongHieu = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://localhost:7051/api/ThuongHieu", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!response.ok) {
          if (response.status === 401) throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          throw new Error("Không thể lấy danh sách thương hiệu.");
        }
        const data = await response.json();
        setThuongHieuList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thương hiệu:", error);
        Swal.fire({
          title: "Lỗi!",
          text: error.message || "Không thể lấy danh sách thương hiệu.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    };

    const fetchHashTags = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://localhost:7051/api/HashTag", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!response.ok) {
          if (response.status === 401) throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          throw new Error("Không thể lấy danh sách hashtag.");
        }
        const data = await response.json();
        setHashTagList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách hashtag:", error);
        Swal.fire({
          title: "Lỗi!",
          text: error.message || "Không thể lấy danh sách hashtag.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    };

    fetchLoaiSanPham();
    fetchThuongHieu();
    fetchHashTags();
  }, []);

  useEffect(() => {
    const fetchKichThuoc = async () => {
      if (!loaiSanPham) {
        setKichThuocList([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`https://localhost:7051/api/LoaiSanPham/${loaiSanPham}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!response.ok) {
          if (response.status === 401) throw new Error("Không có quyền truy cập, vui lòng đăng nhập lại.");
          if (response.status === 404) throw new Error("Loại sản phẩm không tồn tại.");
          throw new Error("Không thể lấy danh sách kích thước.");
        }
        const data = await response.json();
        setKichThuocList(Array.isArray(data.kichThuoc) ? data.kichThuoc : []);
        setColors(colors.map(color => ({
          ...color,
          sizes: color.sizes.map(size => ({
            ...size,
            size: data.kichThuoc.length > 0 ? data.kichThuoc[0] : "",
          })),
        })));
      } catch (error) {
        console.error("Lỗi khi lấy danh sách kích thước:", error);
        Swal.fire({
          title: "Lỗi!",
          text: error.message || "Không thể lấy danh sách kích thước.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        setKichThuocList([]);
      }
    };

    fetchKichThuoc();
  }, [loaiSanPham]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
          setImages((prevImages) => [...prevImages, base64String]);
          setErrors((prevErrors) => ({ ...prevErrors, images: "" }));
        };
        reader.readAsDataURL(file);
      } else {
        Swal.fire({
          title: "Lỗi!",
          text: file.type.startsWith("image/") ? "Hình ảnh không được vượt quá 5MB." : "Vui lòng chọn tệp hình ảnh.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
          setImages((prevImages) => [...prevImages, base64String]);
          setErrors((prevErrors) => ({ ...prevErrors, images: "" }));
        };
        reader.readAsDataURL(file);
      } else {
        Swal.fire({
          title: "Lỗi!",
          text: file.type.startsWith("image/") ? "Hình ảnh không được vượt quá 5MB." : "Vui lòng chọn tệp hình ảnh.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleColorImageChange = (colorIndex, e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
        const newColors = [...colors];
        newColors[colorIndex].image = base64String;
        setColors(newColors);
      };
      reader.readAsDataURL(file);
    } else {
      Swal.fire({
        title: "Lỗi!",
        text: file.type.startsWith("image/") ? "Hình ảnh không được vượt quá 5MB." : "Vui lòng chọn tệp hình ảnh.",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const handleDeleteImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleDeleteColorImage = (colorIndex) => {
    const newColors = [...colors];
    newColors[colorIndex].image = null;
    setColors(newColors);
  };

  const handleAddColor = () => {
    setColors([
      ...colors,
      {
        color: "#ffffff",
        image: null,
        sizes: [{ size: kichThuocList.length > 0 ? kichThuocList[0] : "", price: "", giaNhap: "", quantity: 1 }],
      },
    ]);
  };

  const handleAddSize = (colorIndex) => {
    const newColors = [...colors];
    newColors[colorIndex].sizes.push({
      size: kichThuocList.length > 0 ? kichThuocList[0] : "",
      price: "",
      giaNhap: "",
      quantity: 1,
    });
    setColors(newColors);
  };

  const handleRemoveSize = (colorIndex, sizeIndex) => {
    const newColors = [...colors];
    newColors[colorIndex].sizes.splice(sizeIndex, 1);
    setColors(newColors);
  };

  const handleRemoveColor = (colorIndex) => {
    const newColors = colors.filter((_, index) => index !== colorIndex);
    setColors(newColors);
  };

  const handleInputChange = (colorIndex, sizeIndex, field, value) => {
    const newColors = [...colors];
    if (field === "color") {
      newColors[colorIndex].color = value;
    } else {
      newColors[colorIndex].sizes[sizeIndex][field] = value;
    }
    setColors(newColors);
  };

  const handleQuantityChange = (colorIndex, sizeIndex, increment) => {
    const newColors = [...colors];
    const currentQuantity = parseInt(newColors[colorIndex].sizes[sizeIndex].quantity) || 0;
    const newQuantity = Math.max(1, currentQuantity + increment);
    newColors[colorIndex].sizes[sizeIndex].quantity = newQuantity.toString();
    setColors(newColors);
  };

  const handleHashTagToggle = (hashTag) => {
    setSelectedHashTags((prev) => {
      const isSelected = prev.some((tag) => tag.ID === hashTag.maHashTag);
      if (isSelected) {
        return prev.filter((tag) => tag.ID !== hashTag.maHashTag);
      } else {
        return [...prev, { ID: hashTag.maHashTag, Name: hashTag.tenHashTag }];
      }
    });
  };

  const handleSaveChanges = async () => {
    let errorList = {};
    let hasError = false;
    const colorSet = new Set();
    const imagesToSend = images.map((img) =>
      img.startsWith("data:image") ? img.replace(/^data:image\/[a-z]+;base64,/, "") : img
    );

    if (!tenSanPham.trim()) {
      errorList["tenSanPham"] = "Tên sản phẩm không được để trống.";
      hasError = true;
    }
    if (!maThuongHieu) {
      errorList["maThuongHieu"] = "Vui lòng chọn thương hiệu.";
      hasError = true;
    }
    if (!loaiSanPham) {
      errorList["loaiSanPham"] = "Vui lòng chọn loại sản phẩm.";
      hasError = true;
    }
    if (!gioiTinh) {
      errorList["gioiTinh"] = "Vui lòng chọn giới tính.";
      hasError = true;
    }
    if (imagesToSend.length === 0) {
      errorList["images"] = "Vui lòng thêm ít nhất một hình ảnh.";
      hasError = true;
    }
    if (!chatLieu.trim()) {
      errorList["chatLieu"] = "Chất liệu không được để trống.";
      hasError = true;
    }

    colors.forEach((item, index) => {
      const mauSac = item.color.slice(1).toUpperCase();
      if (!mauSac) {
        errorList[`${index}-mauSac`] = `- Vui lòng chọn màu sắc cho màu ${index + 1}.`;
        hasError = true;
      } else if (colorSet.has(mauSac)) {
        errorList[`${index}-mauSac`] = `- Màu ${mauSac} đã tồn tại.`;
        hasError = true;
      } else {
        colorSet.add(mauSac);
      }

      if (!item.image) {
        errorList[`${index}-image`] = `- Vui lòng thêm hình ảnh cho màu ${mauSac}.`;
        hasError = true;
      }

      const sizeSet = new Set();
      item.sizes.forEach((detail, detailIndex) => {
        if (!detail.size) {
          errorList[`${index}-details-${detailIndex}-kichThuoc`] = `- Vui lòng chọn kích thước cho màu ${mauSac}.`;
          hasError = true;
        } else if (sizeSet.has(detail.size)) {
          errorList[`${index}-details-${detailIndex}-kichThuoc`] = `- Kích thước ${detail.size} của màu ${mauSac} đã tồn tại.`;
          hasError = true;
        } else {
          sizeSet.add(detail.size);
        }
        if (!detail.quantity || parseInt(detail.quantity) <= 0) {
          errorList[`${index}-details-${detailIndex}-soLuong`] = `- Số lượng của kích thước ${detail.size} thuộc màu ${mauSac} phải lớn hơn 0.`;
          hasError = true;
        }
        if (!detail.price || parseInt(detail.price) <= 0) {
          errorList[`${index}-details-${detailIndex}-gia`] = `- Giá của kích thước ${detail.size} thuộc màu ${mauSac} phải lớn hơn 0.`;
          hasError = true;
        }
        if (!detail.giaNhap || parseInt(detail.giaNhap) <= 0) {
          errorList[`${index}-details-${detailIndex}-giaNhap`] = `- Giá nhập của kích thước ${detail.size} thuộc màu ${mauSac} phải lớn hơn 0.`;
          hasError = true;
        }
      });
    });

    if (hasError) {
      setErrors(errorList);
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ và đúng thông tin trước khi thêm sản phẩm.",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }

    const newProductData = {
      data: colors.map((colorItem) => ({
        TenSanPham: tenSanPham.trim(),
        MaThuongHieu: parseInt(maThuongHieu),
        LoaiSanPham: parseInt(loaiSanPham),
        MoTa: moTa.trim() || null,
        MauSac: colorItem.color.slice(1).toUpperCase(),
        ChatLieu: chatLieu.trim(),
        GioiTinh: parseInt(gioiTinh),
        HinhAnhs: imagesToSend,
        Details: colorItem.sizes.map((sizeItem) => ({
          KichThuoc: sizeItem.size.trim(),
          SoLuong: parseInt(sizeItem.quantity),
          Gia: parseInt(sizeItem.price),
          GiaNhap: parseInt(sizeItem.giaNhap),
          HinhAnh: colorItem.image || null,
        })),
      })),
      ListHashTag: selectedHashTags.map((tag) => ({
        ID: tag.ID,
        Name: tag.Name,
      })),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://localhost:7051/api/SanPham/CreateSanPham", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(newProductData),
      });

      if (response.ok) {
        const responseData = await response.json();
        Swal.fire({
          title: "Thành công!",
          text: "Thêm sản phẩm thành công!",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
          setIsAddModalOpen(false);
          setTenSanPham("");
          setMaThuongHieu("");
          setLoaiSanPham("");
          setMoTa("");
          setChatLieu("");
          setGioiTinh("");
          setImages([]);
          setColors([{ color: "#ffffff", image: null, sizes: [{ size: kichThuocList.length > 0 ? kichThuocList[0] : "", price: "", giaNhap: "", quantity: 1 }] }]);
          setSelectedHashTags([]);
          setErrors({});
          setIsMoTaModalOpen(true);
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Lỗi!",
          text: errorData.message || "Có lỗi xảy ra khi thêm sản phẩm.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Có lỗi xảy ra khi gửi dữ liệu tới API.",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const filteredHashTags = hashTagList.filter((tag) =>
    tag.tenHashTag.toLowerCase().includes(hashTagSearch.toLowerCase())
  );

  return (
    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <DialogContent className="max-w-7xl p-6 bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Thêm sản phẩm mới
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tên Sản Phẩm
                    </label>
                    <Input
                      value={tenSanPham}
                      onChange={(e) => {
                        setTenSanPham(e.target.value);
                        setErrors({ ...errors, tenSanPham: "" });
                      }}
                      className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Nhập tên sản phẩm"
                      maxLength={100}
                    />
                    {errors.tenSanPham && (
                      <p className="text-red-500 text-sm mt-1">{errors.tenSanPham}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Chất Liệu
                    </label>
                    <Input
                      value={chatLieu}
                      onChange={(e) => {
                        setChatLieu(e.target.value);
                        setErrors({ ...errors, chatLieu: "" });
                      }}
                      className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Nhập chất liệu"
                      maxLength={50}
                    />
                    {errors.chatLieu && (
                      <p className="text-red-500 text-sm mt-1">{errors.chatLieu}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Thương Hiệu
                    </label>
                    <select
                      value={maThuongHieu}
                      onChange={(e) => {
                        setMaThuongHieu(e.target.value);
                        setErrors({ ...errors, maThuongHieu: "" });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Chọn thương hiệu</option>
                      {thuongHieuList.map((thuongHieu) => (
                        <option
                          key={thuongHieu.maThuongHieu}
                          value={thuongHieu.maThuongHieu}
                        >
                          {thuongHieu.tenThuongHieu}
                        </option>
                      ))}
                    </select>
                    {errors.maThuongHieu && (
                      <p className="text-red-500 text-sm mt-1">{errors.maThuongHieu}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Loại Sản Phẩm
                    </label>
                    <select
                      value={loaiSanPham}
                      onChange={(e) => {
                        setLoaiSanPham(e.target.value);
                        setErrors({ ...errors, loaiSanPham: "" });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Chọn loại sản phẩm</option>
                      {loaiSanPhamList.map((loai) => (
                        <option
                          key={loai.maLoaiSanPham}
                          value={loai.maLoaiSanPham}
                        >
                          {loai.tenLoaiSanPham} ({loai.kiHieu})
                        </option>
                      ))}
                    </select>
                    {errors.loaiSanPham && (
                      <p className="text-red-500 text-sm mt-1">{errors.loaiSanPham}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Giới Tính
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gioiTinh"
                          value="1"
                          checked={gioiTinh === "1"}
                          onChange={(e) => {
                            setGioiTinh(e.target.value);
                            setErrors({ ...errors, gioiTinh: "" });
                          }}
                          className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-300"
                        />
                        <span className="text-gray-700">Nam</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gioiTinh"
                          value="2"
                          checked={gioiTinh === "2"}
                          onChange={(e) => {
                            setGioiTinh(e.target.value);
                            setErrors({ ...errors, gioiTinh: "" });
                          }}
                          className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-300"
                        />
                        <span className="text-gray-700">Nữ</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gioiTinh"
                          value="3"
                          checked={gioiTinh === "3"}
                          onChange={(e) => {
                            setGioiTinh(e.target.value);
                            setErrors({ ...errors, gioiTinh: "" });
                          }}
                          className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-300"
                        />
                        <span className="text-gray-700">Unisex</span>
                      </label>
                    </div>
                    {errors.gioiTinh && (
                      <p className="text-red-500 text-sm mt-1">{errors.gioiTinh}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="block font-medium text-gray-700">
                    Màu sắc và kích thước
                  </label>
                  <Button
                    onClick={handleAddColor}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={!loaiSanPham}
                  >
                    <Plus size={16} />
                    Thêm Màu Sắc
                  </Button>
                </div>

                <div className="space-y-4">
                  {colors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg
                        className="w-12 h-12 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <p className="text-sm">Chưa có màu sắc hoặc kích thước nào</p>
                      <p className="text-xs">Nhấn "Thêm Màu Sắc" để bắt đầu</p>
                    </div>
                  ) : (
                    colors.map((colorItem, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="relative border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={colorItem.color}
                                onChange={(e) =>
                                  handleInputChange(
                                    colorIndex,
                                    null,
                                    "color",
                                    e.target.value
                                  )
                                }
                                className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                              />
                              <span className="font-medium text-gray-700">
                                Màu {colorIndex + 1} ({colorItem.color.slice(1).toUpperCase()})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                ref={(el) => (colorImageInputRefs.current[colorIndex] = el)}
                                onChange={(e) => handleColorImageChange(colorIndex, e)}
                                accept="image/*"
                                className="hidden"
                              />
                              {colorItem.image ? (
                                <div className="relative">
                                  <img
                                    src={`data:image/jpeg;base64,${colorItem.image}`}
                                    alt={`Color ${colorIndex + 1}`}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-300"
                                  />
                                  <button
                                    onClick={() => handleDeleteColorImage(colorIndex)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    colorImageInputRefs.current[colorIndex]?.click()
                                  }
                                  className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                                >
                                  <Upload size={16} className="text-gray-400" />
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveColor(colorIndex)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                            title="Xóa màu sắc"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 mb-2 px-2">
                          <div className="col-span-2 text-center">Kích thước</div>
                          <div className="col-span-3 text-center">Giá Nhập</div>
                          <div className="col-span-3 text-center">Đơn Giá</div>
                          <div className="col-span-3 text-center">Số Lượng</div>
                          <div className="col-span-1 text-center">Thao tác</div>
                        </div>
                        <div className="space-y-2">
                          {colorItem.sizes.map((sizeItem, sizeIndex) => (
                            <div
                              key={sizeIndex}
                              className="grid grid-cols-12 gap-2 items-center"
                            >
                              <div className="col-span-2">
                                <select
                                  value={sizeItem.size}
                                  onChange={(e) =>
                                    handleInputChange(
                                      colorIndex,
                                      sizeIndex,
                                      "size",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                  disabled={!loaiSanPham || kichThuocList.length === 0}
                                >
                                  {kichThuocList.length === 0 ? (
                                    <option value="">Chọn loại sản phẩm trước</option>
                                  ) : (
                                    kichThuocList.map((size) => (
                                      <option key={size} value={size}>
                                        {size}
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Giá Nhập"
                                  value={sizeItem.giaNhap}
                                  onChange={(e) =>
                                    handleInputChange(
                                      colorIndex,
                                      sizeIndex,
                                      "giaNhap",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Đơn Giá"
                                  value={sizeItem.price}
                                  onChange={(e) =>
                                    handleInputChange(
                                      colorIndex,
                                      sizeIndex,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                />
                              </div>
                              <div className="col-span-3">
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(colorIndex, sizeIndex, -1)
                                    }
                                    className="p-1 hover:bg-gray-100 transition-colors"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={sizeItem.quantity}
                                    onChange={(e) =>
                                      handleInputChange(
                                        colorIndex,
                                        sizeIndex,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="flex-1 border-0 text-center text-sm focus:ring-0"
                                  />
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(colorIndex, sizeIndex, 1)
                                    }
                                    className="p-1 hover:bg-gray-100 transition-colors"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-center">
                                {colorItem.sizes.length > 1 ? (
                                  <button
                                    onClick={() => handleRemoveSize(colorIndex, sizeIndex)}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                                    title="Xóa kích thước"
                                  >
                                    <X size={12} />
                                  </button>
                                ) : (
                                  <div className="w-6 h-6" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center mt-3">
                          <Button
                            onClick={() => handleAddSize(colorIndex)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={!loaiSanPham || kichThuocList.length === 0}
                          >
                            <Plus size={14} />
                            Thêm Kích Thước
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-1 space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Hình Ảnh Chung
                </label>
                <div
                  className={`relative w-full h-48 border-2 border-dashed rounded-lg transition-all duration-200 ${
                    isDragging
                      ? "border-purple-500 bg-purple-50"
                      : images.length > 0
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Upload className="w-12 h-12 mb-3" />
                      <p className="text-lg font-medium">Kéo thả ảnh vào đây</p>
                      <p className="text-sm">hoặc nhấp để chọn file</p>
                      <p className="text-xs mt-2 text-gray-400">
                        PNG, JPG, GIF (tối đa 5MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-2 overflow-y-auto h-full">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={
                              image.startsWith("data:image")
                                ? image
                                : `data:image/jpeg;base64,${image}`
                            }
                            alt={`Image ${index}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleDeleteImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.images && (
                  <p className="text-red-500 text-sm mt-1">{errors.images}</p>
                )}
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Mô Tả Ngắn Gọn</label>
                <textarea
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn về sản phẩm..."
                  maxLength={500}
                />
                <Button
                  onClick={() => setIsMoTaModalOpen(true)}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg"
                >
                  Nhập Mô Tả Chi Tiết
                </Button>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Hashtags</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    value={hashTagSearch}
                    onChange={(e) => setHashTagSearch(e.target.value)}
                    placeholder="Tìm kiếm hashtag..."
                    className="pl-10 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {filteredHashTags.length === 0 ? (
                    <p className="text-gray-500 text-sm">Không tìm thấy hashtag</p>
                  ) : (
                    filteredHashTags.map((hashTag) => (
                      <div
                        key={hashTag.maHashTag}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                        onClick={() => handleHashTagToggle(hashTag)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHashTags.some((tag) => tag.ID === hashTag.maHashTag)}
                          readOnly
                          className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-300"
                        />
                        <span>{hashTag.tenHashTag}</span>
                      </div>
                    ))
                  )}
                </div>
                {selectedHashTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Hashtags đã chọn:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedHashTags.map((tag) => (
                        <div
                          key={tag.ID}
                          className="flex items-center gap-1 bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full"
                        >
                          <span>{tag.Name}</span>
                          <button
                            onClick={() => handleHashTagToggle({ maHashTag: tag.ID, tenHashTag: tag.Name })}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {Object.keys(errors).length > 0 && (
                <div className="text-red-500 text-sm">
                  <p className="font-medium">Đã xảy ra lỗi:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6"
            >
              Thêm Sản Phẩm
            </Button>
          </div>
        </div>
      </DialogContent>
      <MoTaModal isOpen={isMoTaModalOpen} onClose={() => setIsMoTaModalOpen(false)} moTaChiTiet={null} />
    </Dialog>
  );
};

export default AddProductModal;