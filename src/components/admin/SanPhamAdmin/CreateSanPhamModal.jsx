import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, X, Upload, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import MoTaModal from "../SanPhamAdmin/MoTa.jsx"; // 

const AddProductModal = ({ isAddModalOpen, setIsAddModalOpen }) => {
  const [colors, setColors] = useState([
    {
      color: "#ffffff",
      image: null,
      sizes: [{ size: "S", price: "", giaNhap: "", quantity: 1 }],
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
  const [isDragging, setIsDragging] = useState(false);
  const [isMoTaModalOpen, setIsMoTaModalOpen] = useState(false); // State for MoTaModal
  const fileInputRef = useRef(null);
  const colorImageInputRefs = useRef({});

  useEffect(() => {
    const fetchLoaiSanPham = async () => {
      try {
        const response = await fetch("http://localhost:5261/api/LoaiSanPham");
        if (!response.ok) throw new Error("Failed to fetch product types");
        const data = await response.json();
        setLoaiSanPhamList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại sản phẩm:", error);
        Swal.fire({
          title: "Lỗi!",
          text: "Không thể lấy danh sách loại sản phẩm.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    };

    const fetchThuongHieu = async () => {
      try {
        const response = await fetch("http://localhost:5261/api/ThuongHieu");
        if (!response.ok) throw new Error("Failed to fetch brands");
        const data = await response.json();
        setThuongHieuList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thương hiệu:", error);
        Swal.fire({
          title: "Lỗi!",
          text: "Không thể lấy danh sách thương hiệu.",
          icon: "error",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    };

    fetchLoaiSanPham();
    fetchThuongHieu();
  }, []);

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
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(
            /^data:image\/[a-z]+;base64,/,
            ""
          );
          setImages((prevImages) => [...prevImages, base64String]);
          setErrors((prevErrors) => ({ ...prevErrors, images: "" }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(
            /^data:image\/[a-z]+;base64,/,
            ""
          );
          setImages((prevImages) => [...prevImages, base64String]);
          setErrors((prevErrors) => ({ ...prevErrors, images: "" }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleColorImageChange = (colorIndex, e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.replace(
          /^data:image\/[a-z]+;base64,/,
          ""
        );
        const newColors = [...colors];
        newColors[colorIndex].image = base64String;
        setColors(newColors);
      };
      reader.readAsDataURL(file);
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
        sizes: [{ size: "S", price: "", giaNhap: "", quantity: 1 }],
      },
    ]);
  };

  const handleAddSize = (colorIndex) => {
    const newColors = [...colors];
    newColors[colorIndex].sizes.push({
      size: "S",
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
    const currentQuantity =
      parseInt(newColors[colorIndex].sizes[sizeIndex].quantity) || 0;
    const newQuantity = Math.max(1, currentQuantity + increment);
    newColors[colorIndex].sizes[sizeIndex].quantity = newQuantity.toString();
    setColors(newColors);
  };

  const handleSaveChanges = async () => {
    const imagesToSend = images.map((img) =>
      img.startsWith("data:image") ? img.replace(/^data:image\/[a-z]+;base64,/, "") : img
    );

    const newProductData = colors.map((colorItem) => ({
      TenSanPham: tenSanPham || null,
      MaThuongHieu: parseInt(maThuongHieu) || null,
      LoaiSanPham: parseInt(loaiSanPham) || null,
      MauSac: colorItem.color.slice(1) || null,
      MoTa: moTa || null,
      ChatLieu: chatLieu || null,
      GioiTinh: parseInt(gioiTinh) || null,
      HinhAnhs: imagesToSend,
      Details: colorItem.sizes.map((sizeItem) => ({
        KichThuoc: sizeItem.size.padEnd(10, " ").trim() || null,
        SoLuong: parseInt(sizeItem.quantity) || 0,
        Gia: parseInt(sizeItem.price) || 0,
        GiaNhap: parseInt(sizeItem.giaNhap) || 0,
        HinhAnh: colorItem.image || null,
      })),
    }));

    let errorList = {};
    let hasError = false;
    const colorSet = new Set();

    if (!tenSanPham) {
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

    newProductData.forEach((item, index) => {
      if (colorSet.has(item.MauSac)) {
        errorList[`${index}-mauSac`] = `- Màu ${item.MauSac} đã tồn tại.`;
        hasError = true;
      } else {
        colorSet.add(item.MauSac);
      }

      const sizeSet = new Set();
      item.Details.forEach((detail, detailIndex) => {
        if (sizeSet.has(detail.KichThuoc)) {
          errorList[`${index}-details-${detailIndex}-kichThuoc`] = `- Kích thước ${detail.KichThuoc} của mã màu ${item.MauSac} đã tồn tại.`;
          hasError = true;
        } else {
          sizeSet.add(detail.KichThuoc);
        }
        if (detail.SoLuong <= 0) {
          errorList[`${index}-details-${detailIndex}-soLuong`] = `- Số lượng của kích thước ${detail.KichThuoc} thuộc mã màu ${item.MauSac} phải lớn hơn 0.`;
          hasError = true;
        }
        if (detail.Gia <= 0) {
          errorList[`${index}-details-${detailIndex}-gia`] = `- Giá của kích thước ${detail.KichThuoc} thuộc mã màu ${item.MauSac} phải lớn hơn 0.`;
          hasError = true;
        }
        if (detail.GiaNhap <= 0) {
          errorList[`${index}-details-${detailIndex}-giaNhap`] = `- Giá nhập của kích thước ${detail.KichThuoc} thuộc mã màu ${item.MauSac} phải lớn hơn 0.`;
          hasError = true;
        }
      });
    });

    if (hasError) {
      setErrors(errorList);
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ và đúng thông tin trước khi thêm sản phẩm",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }

    setErrors({});
    try {
      const response = await fetch("http://localhost:5261/api/SanPham/CreateSanPham", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProductData),
      });

      if (response.ok) {
        const responseData = await response.json();
        const maSanPham = responseData.maSanPham; // Assuming API returns maSanPham
        Swal.fire({
          title: "Thành công!",
          text: "Thêm sản phẩm thành công!",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          // Pass maSanPham to MoTaModal if needed
          setIsMoTaModalOpen(true); // Open MoTaModal after successful product creation
          window.location.reload();
          setIsAddModalOpen(false);
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

  return (
    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <DialogContent className="max-w-7xl p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Thêm sản phẩm mới
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
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
                      className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên sản phẩm"
                    />
                    {errors.tenSanPham && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.tenSanPham}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Chất Liệu
                    </label>
                    <Input
                      value={chatLieu}
                      onChange={(e) => setChatLieu(e.target.value)}
                      className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập chất liệu"
                    />
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <p className="text-red-500 text-sm mt-1">
                        {errors.maThuongHieu}
                      </p>
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Chọn loại sản phẩm</option>
                      {loaiSanPhamList.map((loai) => (
                        <option
                          key={loai.maLoaiSanPham}
                          value={loai.maLoaiSanPham}
                        >
                          {loai.tenLoaiSanPham}
                        </option>
                      ))}
                    </select>
                    {errors.loaiSanPham && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.loaiSanPham}
                      </p>
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
                          className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
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
                          className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
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
                          className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700">Unisex</span>
                      </label>
                    </div>
                    {errors.gioiTinh && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.gioiTinh}
                      </p>
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
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
                                Màu {colorIndex + 1}
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
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                  <option value="S">S</option>
                                  <option value="M">M</option>
                                  <option value="L">L</option>
                                  <option value="XL">XL</option>
                                  <option value="XXL">XXL</option>
                                  <option value="XXXL">XXXL</option>
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
                                  className="w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                                  className="w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                          >
                            <Plus size={14} />
                            Thêm Kích Thước
                          </Button>
                        </div>
                      </div>
                    )))}
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
                      ? "border-blue-500 bg-blue-50"
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
                <label className="block mb-2 font-medium text-gray-700">Mô Tả</label>
                <textarea
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn về sản phẩm..."
                />
                <Button
                  onClick={() => setIsMoTaModalOpen(true)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
                >
                  Nhập Mô Tả Chi Tiết
                </Button>
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
      <MoTaModal isOpen={isMoTaModalOpen} onClose={() => setIsMoTaModalOpen(false)} />
    </Dialog>
  );
};

export default AddProductModal;