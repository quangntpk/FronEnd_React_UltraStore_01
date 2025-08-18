import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, FileText, Search } from 'lucide-react';
import CreateMoTaEvent from './CreateMoTaEvent';

const PromotionForm = () => {
  const [formData, setFormData] = useState({
    promotionName: '',
    startDate: '',
    endDate: '',
    promotionImages: [], // Store File objects
    applyToAll: false,
    discountPercentage: ''
  });
  const [descriptionFormData, setDescriptionFormData] = useState(null);
  const [showDescriptionForm, setShowDescriptionForm] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCombos, setAvailableCombos] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [productDiscounts, setProductDiscounts] = useState({});
  const [comboDiscounts, setComboDiscounts] = useState({});
  const [productDiscountErrors, setProductDiscountErrors] = useState({});
  const [comboDiscountErrors, setComboDiscountErrors] = useState({});
  const [productSearch, setProductSearch] = useState('');
  const [comboSearch, setComboSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showComboSuggestions, setShowComboSuggestions] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [comboLoading, setComboLoading] = useState(true);
  const [productError, setProductError] = useState(null);
  const [comboError, setComboError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductLoading(true);
        const response = await fetch('https://bicacuatho.azurewebsites.net/api/SanPham/ListSanPham');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        const transformedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          price: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(product.donGia),
          originalPrice: product.donGia,
          image: product.hinh && product.hinh.length > 0 ? product.hinh[0] : '/api/placeholder/60/60'
        }));
        setAvailableProducts(transformedProducts);
      } catch (err) {
        setProductError(err.message);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setComboLoading(true);
        const response = await fetch('https://bicacuatho.azurewebsites.net/api/Combo/ComboSanPhamView');
        if (!response.ok) {
          throw new Error('Failed to fetch combos');
        }
        const data = await response.json();
        const transformedCombos = data.map(combo => ({
          id: combo.maCombo,
          name: combo.name,
          price: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(combo.gia),
          originalPrice: combo.gia,
          items: combo.sanPhams.length,
          image: combo.hinhAnh || '/api/placeholder/60/60'
        }));
        setAvailableCombos(transformedCombos);
      } catch (err) {
        setComboError(err.message);
      } finally {
        setComboLoading(false);
      }
    };

    fetchCombos();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newImages = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      setFormData(prev => ({
        ...prev,
        promotionImages: [...prev.promotionImages, ...newImages]
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files).filter(file => file.type.startsWith('image/'));
      setFormData(prev => ({
        ...prev,
        promotionImages: [...prev.promotionImages, ...newImages]
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      promotionImages: prev.promotionImages.filter((_, i) => i !== index)
    }));
  };

  const addProduct = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => [...prev, product]);
      setProductDiscounts(prev => ({
        ...prev,
        [product.id]: ''
      }));
    }
    setProductSearch('');
    setShowProductSuggestions(false);
  };

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    setProductDiscounts(prev => {
      const newDiscounts = { ...prev };
      delete newDiscounts[productId];
      return newDiscounts;
    });
    setProductDiscountErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[productId];
      return newErrors;
    });
  };

  const updateProductDiscount = (productId, discount) => {
    setProductDiscounts(prev => ({
      ...prev,
      [productId]: discount
    }));
  };

  const validateProductDiscount = (productId, discount) => {
    const numDiscount = parseFloat(discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
      setProductDiscountErrors(prev => ({
        ...prev,
        [productId]: 'Phần trăm giảm giá phải từ 0 đến 100'
      }));
    } else {
      setProductDiscountErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  const addCombo = (combo) => {
    if (!selectedCombos.find(c => c.id === combo.id)) {
      setSelectedCombos(prev => [...prev, combo]);
      setComboDiscounts(prev => ({
        ...prev,
        [combo.id]: ''
      }));
    }
    setComboSearch('');
    setShowComboSuggestions(false);
  };

  const removeCombo = (comboId) => {
    setSelectedCombos(prev => prev.filter(c => c.id !== comboId));
    setComboDiscounts(prev => {
      const newDiscounts = { ...prev };
      delete newDiscounts[comboId];
      return newDiscounts;
    });
    setComboDiscountErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[comboId];
      return newErrors;
    });
  };

  const updateComboDiscount = (comboId, discount) => {
    setComboDiscounts(prev => ({
      ...prev,
      [comboId]: discount
    }));
  };

  const validateComboDiscount = (comboId, discount) => {
    const numDiscount = parseFloat(discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
      setComboDiscountErrors(prev => ({
        ...prev,
        [comboId]: 'Phần trăm giảm giá phải từ 0 đến 100'
      }));
    } else {
      setComboDiscountErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[comboId];
        return newErrors;
      });
    }
  };

  const calculateDiscountedPrice = (originalPrice, discount) => {
    const numDiscount = parseFloat(discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) return null;
    const discountedPrice = originalPrice * (1 - numDiscount / 100);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(discountedPrice);
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCombos = availableCombos.filter(combo =>
    combo.name.toLowerCase().includes(comboSearch.toLowerCase())
  );

  const handleDescriptionClick = () => {
    setShowDescriptionForm(true);
  };

  const handleDescriptionCancel = () => {
    setShowDescriptionForm(false);
    setDescriptionFormData(null);
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.promotionName) {
        throw new Error('Tên khuyến mãi là bắt buộc');
      }
      if (!formData.startDate) {
        throw new Error('Thời gian bắt đầu là bắt buộc');
      }
      if (!formData.endDate) {
        throw new Error('Thời gian kết thúc là bắt buộc');
      }
      if (formData.applyToAll && !formData.discountPercentage) {
        throw new Error('Phần trăm giảm giá là bắt buộc khi áp dụng cho tất cả sản phẩm');
      }

      // Convert images to base64
      const promotionImageBase64 = await Promise.all(
        formData.promotionImages.map(async (image) => await convertImageToBase64(image))
      );

      // Prepare KhuyenMaiCreate data
      const khuyenMaiData = {
        TenKhuyenMai: formData.promotionName,
        BatDau: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : null,
        KetThuc: formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : null,
        PercentChung: formData.applyToAll ? parseInt(formData.discountPercentage) || null : null,
        Pictures: promotionImageBase64.length > 0 ? promotionImageBase64 : null,
        All: formData.applyToAll,
        ChiTiet: formData.applyToAll ? null : [
          ...selectedProducts.map(product => ({
            IdSanPham: product.id,
            IdCombo: null,
            TenSanPhamCombo: null,
            GiaMoi: productDiscounts[product.id] ? product.originalPrice * (1 - parseFloat(productDiscounts[product.id]) / 100) : null,
            Percent: parseInt(productDiscounts[product.id]) || null,
            GiaGoc: product.originalPrice
          })),
          ...selectedCombos.map(combo => ({
            IdSanPham: null,
            IdCombo: combo.id,
            TenSanPhamCombo: combo.name,
            GiaMoi: comboDiscounts[combo.id] ? combo.originalPrice * (1 - parseFloat(comboDiscounts[combo.id]) / 100) : null,
            Percent: parseInt(comboDiscounts[combo.id]) || null,
            GiaGoc: combo.originalPrice
          }))
        ]
      };

      const response = await fetch('https://bicacuatho.azurewebsites.net/api/KhuyenMai/KhuyenMaiCreate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(khuyenMaiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save promotion');
      }

      const result = await response.json();
      console.log('Promotion saved successfully:', result);
      localStorage.removeItem('promotionDescription');

      // Reset form after successful submission
      setFormData({
        promotionName: '',
        startDate: '',
        endDate: '',
        promotionImages: [],
        applyToAll: false,
        discountPercentage: ''
      });
      setSelectedProducts([]);
      setSelectedCombos([]);
      setProductDiscounts({});
      setComboDiscounts({});
      setDescriptionFormData(null);
      alert('Khuyến mãi đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Lỗi khi lưu khuyến mãi: ' + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo Khuyến Mãi Mới</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông Tin Khuyến Mãi</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên Khuyến Mãi *
            </label>
            <input
              type="text"
              value={formData.promotionName}
              onChange={(e) => handleInputChange('promotionName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên khuyến mãi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời Gian Bắt Đầu *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời Gian Kết Thúc *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4" hidden>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình Ảnh Khuyến Mãi
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            {formData.promotionImages.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {formData.promotionImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`promotion-image-${index}`}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <div className="text-gray-600">
                  <span className="font-medium">Kéo thả hình ảnh vào đây</span> hoặc{' '}
                  <label
                    htmlFor="image-upload"
                    className="text-blue-500 cursor-pointer hover:text-blue-600"
                  >
                    chọn file
                  </label>
                </div>
                <p className="text-sm text-gray-500">PNG, JPG, GIF tối đa 10MB (Có thể chọn nhiều hình)</p>
              </div>
            )}
            {formData.promotionImages.length > 0 && (
              <label
                htmlFor="image-upload"
                className="block mt-4 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm hình ảnh
              </label>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.applyToAll}
              onChange={(e) => handleInputChange('applyToAll', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Khuyến mãi cho tất cả sản phẩm
            </span>
          </label>
        </div>

        {formData.applyToAll && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              % Khuyến Mãi Cho Tất Cả *
            </label>
            <div className="relative w-48">
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
        )}
      </div>

      {!formData.applyToAll && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sản Phẩm</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductSuggestions(e.target.value.length > 0);
                }}
                onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                onFocus={() => setShowProductSuggestions(productSearch.length > 0)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {productLoading ? (
                <p className="text-gray-500 text-center py-4">Đang tải sản phẩm...</p>
              ) : productError ? (
                <p className="text-red-500 text-center py-4">Lỗi: {productError}</p>
              ) : showProductSuggestions && filteredProducts.length > 0 ? (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    >
                      <img src={`data:image/jpeg;base64,${product.image}`} alt={product.name} className="w-6 h-6 rounded-md object-cover" />
                      <span className="text-sm">{product.name}</span>
                    </div>
                  ))}
                </div>
              ) : showProductSuggestions && (
                <p className="text-gray-500 text-center py-4">Không tìm thấy sản phẩm</p>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">
                  Chưa có sản phẩm nào được chọn
                </p>
              ) : (
                selectedProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1 min-w-0">
                        <img
                          src={`data:image/jpeg;base64,${product.image}`}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">{product.name}</h4>
                          <p className="text-xs text-gray-600">
                            Giá gốc: <span className={productDiscounts[product.id] && !productDiscountErrors[product.id] ? 'line-through' : ''}>{product.price}</span>
                            {productDiscounts[product.id] && !productDiscountErrors[product.id] && (
                              <span className="ml-2 text-blue-600">
                                {calculateDiscountedPrice(product.originalPrice, productDiscounts[product.id])}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Giảm giá:</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={productDiscounts[product.id] || ''}
                          onChange={(e) => updateProductDiscount(product.id, e.target.value)}
                          onBlur={() => validateProductDiscount(product.id, productDiscounts[product.id])}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              validateProductDiscount(product.id, productDiscounts[product.id]);
                            }
                          }}
                          className={`w-16 px-2 py-1 pr-6 border ${productDiscountErrors[product.id] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm`}
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1 text-gray-500 text-xs">%</span>
                      </div>
                    </div>
                    {productDiscountErrors[product.id] && (
                      <p className="text-red-500 text-xs mt-1">{productDiscountErrors[product.id]}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Combo</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm combo..."
                value={comboSearch}
                onChange={(e) => {
                  setComboSearch(e.target.value);
                  setShowComboSuggestions(e.target.value.length > 0);
                }}
                onBlur={() => setTimeout(() => setShowComboSuggestions(false), 200)}
                onFocus={() => setShowComboSuggestions(comboSearch.length > 0)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {comboLoading ? (
                <p className="text-gray-500 text-center py-4">Đang tải combo...</p>
              ) : comboError ? (
                <p className="text-red-500 text-center py-4">Lỗi: {comboError}</p>
              ) : showComboSuggestions && filteredCombos.length > 0 ? (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredCombos.map(combo => (
                    <div
                      key={combo.id}
                      onClick={() => addCombo(combo)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    >
                      <img src={`data:image/jpeg;base64,${combo.image}`} alt={combo.name} className="w-6 h-6 rounded-md object-cover" />
                      <span className="text-sm">{combo.name}</span>
                    </div>
                  ))}
                </div>
              ) : showComboSuggestions && (
                <p className="text-gray-500 text-center py-4">Không tìm thấy combo</p>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedCombos.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">
                  Chưa có combo nào được chọn
                </p>
              ) : (
                selectedCombos.map(combo => (
                  <div
                    key={combo.id}
                    className="p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1 min-w-0">
                        <img
                          src={`data:image/jpeg;base64,${combo.image}`}
                          alt={combo.name}
                          className="w-10 h-10 rounded-md object-cover mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">{combo.name}</h4>
                          <p className="text-xs text-gray-600">
                            Giá gốc: <span className={comboDiscounts[combo.id] && !comboDiscountErrors[combo.id] ? 'line-through' : ''}>{combo.price}</span>
                            {comboDiscounts[combo.id] && !comboDiscountErrors[combo.id] && (
                              <span className="ml-2 text-blue-600">
                                {calculateDiscountedPrice(combo.originalPrice, comboDiscounts[combo.id])}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCombo(combo.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Giảm giá:</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={comboDiscounts[combo.id] || ''}
                          onChange={(e) => updateComboDiscount(combo.id, e.target.value)}
                          onBlur={() => validateComboDiscount(combo.id, comboDiscounts[combo.id])}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              validateComboDiscount(combo.id, comboDiscounts[combo.id]);
                            }
                          }}
                          className={`w-16 px-2 py-1 pr-6 border ${comboDiscountErrors[combo.id] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm`}
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1 text-gray-500 text-xs">%</span>
                      </div>
                    </div>
                    {comboDiscountErrors[combo.id] && (
                      <p className="text-red-500 text-xs mt-1">{comboDiscountErrors[combo.id]}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDescriptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Thêm Mô Tả</h2>
              <button
                onClick={handleDescriptionCancel}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <CreateMoTaEvent
              onSave={(data) => {
                setDescriptionFormData(data);
                setShowDescriptionForm(false);
              }}
              onCancel={handleDescriptionCancel}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={handleDescriptionClick}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          Thêm Mô Tả
        </button>
        
        <div className="space-x-3">
          <button
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            onClick={() => {
              setFormData({
                promotionName: '',
                startDate: '',
                endDate: '',
                promotionImages: [],
                applyToAll: false,
                discountPercentage: ''
              });
              setSelectedProducts([]);
              setSelectedCombos([]);
              setProductDiscounts({});
              setComboDiscounts({});
              setDescriptionFormData(null);
              localStorage.removeItem('promotionDescription');
            }}
          >
            Hủy
          </button>
          <button
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={handleSubmit}
          >
            Lưu Khuyến Mãi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionForm;