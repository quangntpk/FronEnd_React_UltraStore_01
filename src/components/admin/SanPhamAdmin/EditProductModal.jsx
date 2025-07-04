import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";

const EditProductModal = ({ isEditModalOpen, setIsEditModalOpen, selectedProduct, productData }) => {
  const [colors, setColors] = useState([]);
  const [tenSanPham, setTenSanPham] = useState("");
  const [maThuongHieu, setMaThuongHieu] = useState("");
  const [loaiSanPham, setLoaiSanPham] = useState("");
  const [moTa, setMoTa] = useState("");
  const [chatLieu, setChatLieu] = useState("");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loaiSanPhamList, setLoaiSanPhamList] = useState([]);
  const [thuongHieuList, setThuongHieuList] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchLoaiSanPham = async () => {
      try {
        const response = await fetch("http://localhost:5261/api/LoaiSanPham");
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

  useEffect(() => {
    if (productData && productData.length > 0) {
      const productInfo = productData[0];
      setTenSanPham(productInfo.tenSanPham || "");
      setMaThuongHieu(productInfo.maThuongHieu || "");
      setLoaiSanPham(productInfo.loaiSanPham || "");
      setMoTa(productInfo.moTa || "");
      setChatLieu(productInfo.chatLieu || "");
      const cleanedImages = (productInfo.hinhAnhs || []).map(img => img);
      setImages(cleanedImages);
      initializeColors(productData);
    }
  }, [productData]);

  const initializeColors = (data) => {
    if (data && data.length > 0) {
      const uniqueColors = data.map(item => ({
        color: `#${item.mauSac}`,
        sizes: item.details.map(detail => ({
          size: detail.kichThuoc.trim(),
          price: detail.gia.toString(),
          quantity: detail.soLuong.toString(),
        })),
      }));
      setColors(uniqueColors);
    } else {
      setColors([{ color: "#ffffff", sizes: [{ size: "S", price: "", quantity: "" }] }]);
    }
  };

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
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
          setImages(prevImages => [...prevImages, base64String]);
          setErrors(prevErrors => ({ ...prevErrors, images: "" }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
          setImages(prevImages => [...prevImages, base64String]);
          setErrors(prevErrors => ({ ...prevErrors, images: "" }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleClickChooseFile = () => {
    fileInputRef.current.click();
  };

  const handleDeleteImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleAddColor = () => {
    setColors([...colors, { color: "#ffffff", sizes: [{ size: "S", price: "", quantity: "" }] }]);
  };

  const handleAddSize = (colorIndex) => {
    const newColors = [...colors];
    newColors[colorIndex].sizes.push({ size: "S", price: "", quantity: "" });
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

  const handleSaveChanges = async () => {
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
    if (images.length === 0) {
      errorList["images"] = "Vui lòng thêm ít nhất một hình ảnh.";
      hasError = true;
    }

    const imagesToSend = images.map(img => 
      img.startsWith("data:image") ? img.replace(/^data:image\/[a-z]+;base64,/, "") : img
    );

    const updatedData = colors.map(colorItem => ({
      ID: selectedProduct?.id || "A00001",
      TenSanPham: tenSanPham,
      MaThuongHieu: parseInt(maThuongHieu),
      LoaiSanPham: parseInt(loaiSanPham),
      MauSac: colorItem.color.slice(1),
      MoTa: moTa || null,
      HinhAnhs: imagesToSend,
      ChatLieu: chatLieu,
      Details: colorItem.sizes.map(sizeItem => ({
        KichThuoc: sizeItem.size.padEnd(10, " ").trim(),
        SoLuong: parseInt(sizeItem.quantity) || 0,
        Gia: parseInt(sizeItem.price) || 0,
      })),
    }));

    updatedData.forEach((item, index) => {
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
      });
    });

    if (hasError) {
      setErrors(errorList);
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ và đúng thông tin trước khi cập nhật sản phẩm.",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }

    setErrors({});
    try {
      const response = await fetch("http://localhost:5261/api/SanPham/EditSanPham", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        Swal.fire({
          title: "Thành công!",
          text: "Cập nhật sản phẩm thành công!",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          setIsEditModalOpen(false);
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: "Lỗi!",
          text: "Có lỗi xảy ra khi cập nhật sản phẩm.",
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
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="max-w-7xl p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">Chỉnh Sửa Sản Phẩm</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Section: Product Info and Colors/Sizes */}
            <div className="col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Tên Sản Phẩm</label>
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
                      <p className="text-red-500 text-sm mt-1">{errors.tenSanPham}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Chất Liệu</label>
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
                    <label className="block mb-2 font-medium text-gray-700">Thương Hiệu</label>
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
                        <option key={thuongHieu.maThuongHieu} value={thuongHieu.maThuongHieu}>
                          {thuongHieu.tenThuongHieu}
                        </option>
                      ))}
                    </select>
                    {errors.maThuongHieu && (
                      <p className="text-red-500 text-sm mt-1">{errors.maThuongHieu}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Loại Sản Phẩm</label>
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
                        <option key={loai.maLoaiSanPham} value={loai.maLoaiSanPham}>
                          {loai.tenLoaiSanPham}
                        </option>
                      ))}
                    </select>
                    {errors.loaiSanPham && (
                      <p className="text-red-500 text-sm mt-1">{errors.loaiSanPham}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-medium text-gray-700">Màu Sắc và Kích Thước</label>
                </div>
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 mb-2 px-2">
                  <div className="col-span-2 text-center">Màu sắc</div>
                  <div className="col-span-3 text-center">Kích thước</div>
                  <div className="col-span-3 text-center">Đơn giá</div>
                  <div className="col-span-4 text-center">Số lượng</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
                  {colors.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm">Chưa có màu sắc hoặc kích thước nào</p>
                      <p className="text-xs">Nhấn "Thêm Màu Sắc" để bắt đầu</p>
                    </div>
                  ) : (
                    colors.map((colorItem, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="relative p-3 bg-white rounded-md border border-gray-200 shadow-sm"
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveColor(colorIndex)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs"
                        >
                          ×
                        </Button>
                        <div className="space-y-2">
                          {colorItem.sizes.map((sizeItem, sizeIndex) => (
                            <div key={sizeIndex} className="grid grid-cols-12 gap-1 items-center">
                              {sizeIndex === 0 && (
                                <div className="col-span-2 flex justify-center items-center">
                                  <input
                                    type="color"
                                    value={colorItem.color}
                                    onChange={(e) => handleInputChange(colorIndex, null, "color", e.target.value)}
                                    className="w-16 h-16 border-2 border-gray-300 rounded-md cursor-pointer"
                                  />
                                </div>
                              )}
                              {sizeIndex !== 0 && <div className="col-span-2"></div>}
                              <div className="col-span-3">
                                <select
                                  value={sizeItem.size}
                                  onChange={(e) => handleInputChange(colorIndex, sizeIndex, "size", e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                  <option value="S">S</option>
                                  <option value="M">M</option>
                                  <option value="XL">XL</option>
                                  <option value="XXL">XXL</option>
                                  <option value="XXXL">XXXL</option>
                                </select>
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Đơn Giá"
                                  value={sizeItem.price}
                                  onChange={(e) => handleInputChange(colorIndex, sizeIndex, "price", e.target.value)}
                                  className="w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                              <div className="col-span-4 flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Số Lượng"
                                  value={sizeItem.quantity}
                                  onChange={(e) => handleInputChange(colorIndex, sizeIndex, "quantity", e.target.value)}
                                  className="w-40 p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <div className="flex gap-2">
                                  {colorItem.sizes.length > 1 && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRemoveSize(colorIndex, sizeIndex)}
                                      className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs"
                                    >
                                      ×
                                    </Button>
                                  )}
                                  {sizeIndex === colorItem.sizes.length - 1 && (
                                    <Button
                                      onClick={() => handleAddSize(colorIndex)}
                                      size="sm"
                                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs"
                                    >
                                      +
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  onClick={handleAddColor}
                  className="mt-4 w-fit mx-auto bg-purple-400 hover:bg-purple-500 text-white rounded-lg py-1.5 text-sm"
                >
                  Thêm Màu Sắc
                </Button>
              </div>
            </div>

            {/* Right Section: Images and Description */}
            <div className="col-span-1 space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Hình Ảnh</label>
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
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-medium">Kéo thả ảnh vào đây</p>
                      <p className="text-sm">hoặc nhấp để chọn file</p>
                      <p className="text-xs mt-2 text-gray-400">PNG, JPG, GIF (tối đa 5MB)</p>
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
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center p-0"
                          >
                            ×
                          </Button>
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
                  placeholder="Nhập mô tả chi tiết về sản phẩm..."
                />
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
              onClick={() => setIsEditModalOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="bg-purple-400 hover:bg-purple-500 text-white rounded-lg px-6"
            >
              Lưu Thay Đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;