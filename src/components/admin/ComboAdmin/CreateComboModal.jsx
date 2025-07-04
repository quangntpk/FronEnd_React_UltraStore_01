import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";

const CreateComboModal = ({ isCreateModalOpen, setIsCreateModalOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [combo, setCombo] = useState({
    ID: 0,
    TenCombo: "",
    MoTa: "",
    SoLuong: 0,
    Discount: 0,
    HinhAnh: null,
    SanPham: [],
  });
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null); // Added ref for file input

  // Fetch products khi modal mở
  useEffect(() => {
    if (isCreateModalOpen) {
      const fetchProducts = async () => {
        setSearchLoading(true);
        try {
          const response = await fetch("http://localhost:5261/api/SanPham/ListSanPham", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) throw new Error("Failed to fetch products");
          const data = await response.json();
          setProducts(data || []);
          setFilteredProducts(data || []);
        } catch (error) {
          console.error("Error fetching products:", error);
          setProducts([]);
          setFilteredProducts([]);
        } finally {
          setSearchLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isCreateModalOpen]);

  // Filter products
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (product.loaiSanPham?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCombo({ ...combo, HinhAnh: reader.result.replace(/^data:image\/[a-z]+;base64,/, "") });
      setErrors({ ...errors, HinhAnh: "" });
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle click to change image
  const handleChangeImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger file input click
    }
  };

  // Các hàm xử lý product
  const addProductToCombo = (product) => {
    const existingProduct = combo.SanPham.find((p) => p.MaSanPham === product.id);
    if (existingProduct) {
      setCombo({
        ...combo,
        SanPham: combo.SanPham.map((p) =>
          p.MaSanPham === product.id ? { ...p, SoLuong: p.SoLuong + 1 } : p
        ),
      });
    } else {
      setCombo({
        ...combo,
        SanPham: [
          ...combo.SanPham,
          {
            MaSanPham: product.id,
            SoLuong: 1,
            TenSanPham: product.name || "Không có tên",
          },
        ],
      });
    }
    setErrors({ ...errors, SanPham: "" });
  };

  const updateQuantity = (maSanPham, delta) => {
    setCombo({
      ...combo,
      SanPham: combo.SanPham.map((p) =>
        p.MaSanPham === maSanPham ? { ...p, SoLuong: Math.max(1, p.SoLuong + delta) } : p
      ),
    });
  };

  const removeProductFromCombo = (maSanPham) => {
    const newSanPham = combo.SanPham.filter((p) => p.MaSanPham !== maSanPham);
    setCombo({ ...combo, SanPham: newSanPham });
    if (newSanPham.length === 0) {
      setErrors({ ...errors, SanPham: "Combo phải có ít nhất 1 sản phẩm" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
  
    if (!combo.TenCombo.trim()) {
      newErrors.TenCombo = "Tên combo không được để trống";
    }
  
    if (!combo.MoTa.trim()) {
      newErrors.MoTa = "Mô tả không được để trống";
    }
  
    if (combo.Discount <= 1) {
      newErrors.Discount = "Giá phải lớn hơn 1";
    }
  
    if (!combo.HinhAnh) {
      newErrors.HinhAnh = "Vui lòng chọn ít nhất 1 hình ảnh";
    }
  
    if (combo.SanPham.length === 0) {
      newErrors.SanPham = "Combo phải có ít nhất 1 sản phẩm";
    }
  
    if (combo.SoLuong < 0) {
      newErrors.SoLuong = "Số lượng không thể nhỏ hơn 0";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form với validation
  const handleSaveChanges = async () => {
    if (!validateForm()) {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ và đúng thông tin trước khi tạo combo",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const comboDataToSend = {
        ID: combo.ID,
        TenCombo: combo.TenCombo,
        MoTa: combo.MoTa,
        SoLuong: combo.SoLuong,
        Discount: combo.Discount,
        HinhAnh: combo.HinhAnh,
        SanPham: combo.SanPham.map((product) => ({
          MaSanPham: product.MaSanPham,
          SoLuong: product.SoLuong,
        })),
      };

      const response = await fetch("http://localhost:5261/api/Combo/CreateComboSanPham", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comboDataToSend),
      });

      if (!response.ok) throw new Error("Failed to create combo");

      Swal.fire({
        title: "Thành công!",
        text: "Tạo combo thành công!",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        setIsCreateModalOpen(false);
        window.location.reload();
      });
    } catch (error) {
      console.error("Error creating combo:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Có lỗi xảy ra khi tạo combo.",
        icon: "error",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="max-w-7xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Tạo mới combo</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Tên Combo</label>
                    <Input
                      value={combo.TenCombo}
                      onChange={(e) => {
                        setCombo({ ...combo, TenCombo: e.target.value });
                        setErrors({ ...errors, TenCombo: "" });
                      }}
                      className="w-full"
                      placeholder="Nhập tên combo"
                    />
                    {errors.TenCombo && (
                      <p className="text-red-500 text-sm mt-1">{errors.TenCombo}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Giảm Giá (%)</label>
                    <Input
                      type="number"
                      min="0"
                      value={combo.Discount}
                      onChange={(e) => {
                        setCombo({ ...combo, Discount: parseInt(e.target.value) || 0 });
                        setErrors({ ...errors, Discount: "" });
                      }}
                      className="w-full"
                      placeholder="Nhập giá combo"
                    />
                    {errors.Discount && (
                      <p className="text-red-500 text-sm mt-1">{errors.Discount}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Hình Ảnh Combo</label>
                  <div
                    className={`relative w-full h-48 border-2 border-dashed rounded-lg transition-all duration-200 ${
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : combo.HinhAnh
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef} // Attach ref to file input
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {combo.HinhAnh ? (
                      <div className="relative w-full h-full">
                        <img
                          src={`data:image/jpeg;base64,${combo.HinhAnh}`}
                          alt="Combo Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div
                          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-opacity-70"
                          onClick={handleChangeImageClick} // Added onClick handler
                        >
                          Nhấp để thay đổi
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-medium">Kéo thả ảnh vào đây</p>
                        <p className="text-sm">hoặc nhấp để chọn file</p>
                        <p className="text-xs mt-2 text-gray-400">PNG, JPG, GIF (tối đa 5MB)</p>
                      </div>
                    )}
                  </div>
                  {errors.HinhAnh && (
                    <p className="text-red-500 text-sm mt-1">{errors.HinhAnh}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Số Lượng</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={combo.SoLuong}
                    onChange={(e) => {
                      setCombo({ ...combo, SoLuong: parseInt(e.target.value) || 0 });
                      setErrors({ ...errors, SoLuong: "" });
                    }}
                    className="w-full max-w-xs"
                    placeholder="Nhập số lượng"
                  />
                  {errors.SoLuong && (
                    <p className="text-red-500 text-sm mt-1">{errors.SoLuong}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Mô Tả</label>
                  <textarea
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    value={combo.MoTa}
                    onChange={(e) => {
                      setCombo({ ...combo, MoTa: e.target.value });
                      setErrors({ ...errors, MoTa: "" });
                    }}
                    placeholder="Nhập mô tả chi tiết về combo..."
                  />
                  {errors.MoTa && (
                    <p className="text-red-500 text-sm mt-1">{errors.MoTa}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block mb-2 font-medium text-gray-700">Sản phẩm trong Combo</label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {combo.SanPham.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p>Chưa có sản phẩm trong combo</p>
                      <p className="text-sm">Thêm sản phẩm từ danh sách bên phải</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {combo.SanPham.map((product) => (
                        <div
                          key={product.MaSanPham}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{product.TenSanPham}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(product.MaSanPham, -1)}
                                className="h-8 w-8 p-0"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium">{product.SoLuong}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(product.MaSanPham, 1)}
                                className="h-8 w-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeProductFromCombo(product.MaSanPham)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.SanPham && (
                    <p className="text-red-500 text-sm mt-2">{errors.SanPham}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Tìm kiếm sản phẩm</label>
                  <Input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {searchLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img
                              src={
                                product.hinh && product.hinh[0]
                                  ? `data:image/jpeg;base64,${product.hinh[0]}`
                                  : "https://via.placeholder.com/40"
                              }
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 text-sm truncate">{product.name || "Không có tên"}</p>
                              <p className="text-xs text-gray-500 truncate">{product.loaiSanPham || "Chưa phân loại"}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addProductToCombo(product)}
                            className="shrink-0 text-xs px-2 py-1"
                          >
                            Thêm
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveChanges} disabled={searchLoading} className="px-6">
            Tạo Combo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateComboModal;