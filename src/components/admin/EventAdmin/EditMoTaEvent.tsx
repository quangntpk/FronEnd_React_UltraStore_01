import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Image, Upload, Bold, Italic, Underline, AlignCenter } from 'lucide-react';

const EditMoTaEvent = ({ promotionId, initialData, onSave, onCancel }) => {
  // Default MoTa structure to prevent undefined errors
  const defaultMoTa = {
    Header: { Title: '' },
    Picture: [],
    Title: [{
      Name: '',
      Subtitle: [{
        Name: '',
        Description: { Content: '' },
        Picture: { Url: null }
      }],
      Picture: { Url: null }
    }]
  };

  const [formData, setFormData] = useState(initialData || { IdMoTa: promotionId || '', MoTa: defaultMoTa });
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const previewUrls = useRef(new Set());

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.current.forEach(url => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    };
  }, []);

  // Fixed updateNestedValue to preserve File objects
  const updateNestedValue = (path, value) => {
    const pathArray = path.split('.');
    
    setFormData(prevFormData => {
      const deepClone = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof File) return obj;
        if (obj instanceof Array) return obj.map(deepClone);
        const cloned = {};
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
          }
        }
        return cloned;
      };
      
      const newFormData = deepClone(prevFormData);
      let current = newFormData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (key.includes('[') && key.includes(']')) {
          const [arrayKey, index] = key.split('[');
          const arrayIndex = parseInt(index.replace(']', ''));
          if (!current[arrayKey]) current[arrayKey] = [];
          if (!current[arrayKey][arrayIndex]) current[arrayKey][arrayIndex] = {};
          current = current[arrayKey][arrayIndex];
        } else {
          if (!current[key]) current[key] = {};
          current = current[key];
        }
      }
      
      const finalKey = pathArray[pathArray.length - 1];
      if (finalKey.includes('[') && finalKey.includes(']')) {
        const [arrayKey, index] = finalKey.split('[');
        const arrayIndex = parseInt(index.replace(']', ''));
        if (!current[arrayKey]) current[arrayKey] = [];
        current[arrayKey][arrayIndex] = value;
      } else {
        current[finalKey] = value;
      }
      
      return newFormData;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  };

  const handleDrop = (e, path, multiple = false) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} không phải là hình ảnh.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} vượt quá giới hạn 10MB.`);
        return false;
      }
      return true;
    });
    
    if (multiple) {
      const newPictures = files.map(file => {
        const preview = URL.createObjectURL(file);
        previewUrls.current.add(preview);
        return { file, preview };
      });
      setFormData(prevFormData => ({
        ...prevFormData,
        MoTa: {
          ...prevFormData.MoTa,
          Picture: [...(prevFormData.MoTa.Picture || []), ...newPictures]
        }
      }));
    } else {
      if (files.length > 0) {
        const file = files[0];
        const preview = URL.createObjectURL(file);
        previewUrls.current.add(preview);
        updateNestedValue(path, { file, preview });
      }
    }
  };

  const handleFileUpload = (e, path, multiple = false) => {
    const files = Array.from(e.target.files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} không phải là hình ảnh.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} vượt quá giới hạn 10MB.`);
        return false;
      }
      return true;
    });
    
    if (multiple) {
      const newPictures = files.map(file => {
        const preview = URL.createObjectURL(file);
        previewUrls.current.add(preview);
        return { file, preview };
      });
      setFormData(prevFormData => ({
        ...prevFormData,
        MoTa: {
          ...prevFormData.MoTa,
          Picture: [...(prevFormData.MoTa.Picture || []), ...newPictures]
        }
      }));
    } else {
      if (files.length > 0) {
        const file = files[0];
        const preview = URL.createObjectURL(file);
        previewUrls.current.add(preview);
        updateNestedValue(path, { file, preview });
      }
    }
  };

  const removePicture = (index) => {
    const picture = formData.MoTa?.Picture[index];
    if (picture?.preview) {
      URL.revokeObjectURL(picture.preview);
      previewUrls.current.delete(picture.preview);
    }
    const newPictures = (formData.MoTa?.Picture || []).filter((_, i) => i !== index);
    setFormData(prevFormData => ({
      ...prevFormData,
      MoTa: {
        ...prevFormData.MoTa,
        Picture: newPictures
      }
    }));
  };

  const removeTitlePicture = (index) => {
    const picture = formData.MoTa?.Title[index]?.Picture?.Url;
    if (picture?.preview) {
      URL.revokeObjectURL(picture.preview);
      previewUrls.current.delete(picture.preview);
    }
    updateNestedValue(`MoTa.Title[${index}].Picture.Url`, null);
  };

  const removeSubtitlePicture = (titleIndex, subtitleIndex) => {
    const picture = formData.MoTa?.Title[titleIndex]?.Subtitle[subtitleIndex]?.Picture?.Url;
    if (picture?.preview) {
      URL.revokeObjectURL(picture.preview);
      previewUrls.current.delete(picture.preview);
    }
    updateNestedValue(`MoTa.Title[${titleIndex}].Subtitle[${subtitleIndex}].Picture.Url`, null);
  };

  const addTitle = () => {
    setFormData(prevFormData => ({
      ...prevFormData,
      MoTa: {
        ...prevFormData.MoTa,
        Title: [...(prevFormData.MoTa.Title || []), {
          Name: '',
          Subtitle: [{
            Name: '',
            Description: { Content: '' },
            Picture: { Url: null }
          }],
          Picture: { Url: null }
        }]
      }
    }));
    setSelectedTitleIndex((formData.MoTa?.Title?.length || 0));
    setSelectedSubtitleIndex(0);
  };

  const removeTitle = (index) => {
    if (formData.MoTa?.Title?.length <= 1) return;
    const title = formData.MoTa?.Title[index];
    if (title?.Picture?.Url?.preview) {
      URL.revokeObjectURL(title.Picture.Url.preview);
      previewUrls.current.delete(title.Picture.Url.preview);
    }
    title?.Subtitle?.forEach(subtitle => {
      if (subtitle?.Picture?.Url?.preview) {
        URL.revokeObjectURL(subtitle.Picture.Url.preview);
        previewUrls.current.delete(subtitle.Picture.Url.preview);
      }
    });
    const newTitles = (formData.MoTa?.Title || []).filter((_, i) => i !== index);
    setFormData(prevFormData => ({
      ...prevFormData,
      MoTa: {
        ...prevFormData.MoTa,
        Title: newTitles
      }
    }));
    setSelectedTitleIndex(Math.max(0, index - 1));
    setSelectedSubtitleIndex(0);
  };

  const addSubtitle = (titleIndex) => {
    setFormData(prevFormData => {
      const newTitles = [...(prevFormData.MoTa?.Title || [])];
      newTitles[titleIndex] = {
        ...newTitles[titleIndex],
        Subtitle: [...(newTitles[titleIndex]?.Subtitle || []), {
          Name: '',
          Description: { Content: '' },
          Picture: { Url: null }
        }]
      };
      return {
        ...prevFormData,
        MoTa: { ...prevFormData.MoTa, Title: newTitles }
      };
    });
    setSelectedSubtitleIndex((formData.MoTa?.Title[titleIndex]?.Subtitle?.length || 0));
  };

  const removeSubtitle = (titleIndex, subtitleIndex) => {
    if (formData.MoTa?.Title[titleIndex]?.Subtitle?.length <= 1) return;
    const subtitle = formData.MoTa?.Title[titleIndex]?.Subtitle[subtitleIndex];
    if (subtitle?.Picture?.Url?.preview) {
      URL.revokeObjectURL(subtitle.Picture.Url.preview);
      previewUrls.current.delete(subtitle.Picture.Url.preview);
    }
    setFormData(prevFormData => {
      const newTitles = [...(prevFormData.MoTa?.Title || [])];
      newTitles[titleIndex] = {
        ...newTitles[titleIndex],
        Subtitle: (newTitles[titleIndex]?.Subtitle || []).filter((_, i) => i !== subtitleIndex)
      };
      return {
        ...prevFormData,
        MoTa: { ...prevFormData.MoTa, Title: newTitles }
      };
    });
    setSelectedSubtitleIndex(Math.max(0, subtitleIndex - 1));
  };

  const insertFormatting = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText;
    switch (tag) {
      case 'bold': formattedText = `<strong>${selectedText}</strong>`; break;
      case 'italic': formattedText = `<em>${selectedText}</em>`; break;
      case 'underline': formattedText = `<u>${selectedText}</u>`; break;
      case 'p': formattedText = `<p>${selectedText}</p>`; break;
      case 'h3': formattedText = `<h3>${selectedText}</h3>`; break;
      case 'center': formattedText = `<div style="text-align: center;">${selectedText}</div>`; break;
      case 'right': formattedText = `<div style="text-align: right;">${selectedText}</div>`; break;
      default: formattedText = selectedText;
    }

    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    const path = `MoTa.Title[${selectedTitleIndex}].Subtitle[${selectedSubtitleIndex}].Description.Content`;
    updateNestedValue(path, newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const insertColor = (color) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const formattedText = `<span style="color: ${color};">${selectedText}</span>`;

    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    const path = `MoTa.Title[${selectedTitleIndex}].Subtitle[${selectedSubtitleIndex}].Description.Content`;
    updateNestedValue(path, newContent);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.MoTa?.Header?.Title?.trim()) {
        throw new Error('Tiêu đề Header là bắt buộc');
      }

      const convertedPictures = [];
      for (const pic of formData.MoTa?.Picture || []) {
        if (pic.file instanceof File) {
          const binaryData = await fileToBase64(pic.file);
          convertedPictures.push({ Url: binaryData });
        } else if (pic.Url) {
          convertedPictures.push({ Url: pic.Url });
        }
      }

      const convertedTitles = [];
      for (const title of formData.MoTa?.Title || []) {
        let titlePictureUrl = title.Picture?.Url;
        if (title.Picture?.Url?.file instanceof File) {
          titlePictureUrl = await fileToBase64(title.Picture.Url.file);
        }

        const convertedSubtitles = [];
        for (const subtitle of title.Subtitle || []) {
          let subtitlePictureUrl = subtitle.Picture?.Url;
          if (subtitle.Picture?.Url?.file instanceof File) {
            subtitlePictureUrl = await fileToBase64(subtitle.Picture.Url.file);
          }

          convertedSubtitles.push({
            Name: subtitle.Name || '',
            Description: { Content: subtitle.Description?.Content || '' },
            Picture: { Url: subtitlePictureUrl }
          });
        }

        convertedTitles.push({
          Name: title.Name || '',
          Subtitle: convertedSubtitles,
          Picture: { Url: titlePictureUrl }
        });
      }

      const moTaData = {
        Header: { Title: formData.MoTa?.Header?.Title || '' },
        Picture: convertedPictures,
        Title: convertedTitles
      };

      console.log('Sending data to API:', {
        ...moTaData,
        Picture: moTaData.Picture.map((pic, index) => ({
          ...pic,
          Url: pic.Url ? `[Binary Data - ${pic.Url.length} characters]` : ""
        }))
      });

      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/KhuyenMai/MoTaKhuyenMaiUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moTaData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to update MoTaKhuyenMai: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('MoTaKhuyenMai updated successfully:', result);

      previewUrls.current.forEach(url => URL.revokeObjectURL(url));
      previewUrls.current.clear();

      onSave(moTaData);
      Swal.fire({
                    title: "Thành công!",
                    text: "Mô tả  đã được lưu vào bộ nhớ tạm, hãy nhập cập nhật khuyến mại!",
                    icon: "Success",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                  })
    } catch (error) {
      console.error('Error updating MoTaKhuyenMai:', error);
      setError(error.message);
      alert(`Lỗi khi cập nhật mô tả khuyến mãi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            ✨ Chỉnh Sửa Mô Tả Khuyến Mãi
          </h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              Lỗi: {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Tiêu đề Header</label>
            <input
              type="text"
              value={formData.MoTa?.Header?.Title || ''}
              onChange={(e) => updateNestedValue('MoTa.Header.Title', e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
              placeholder="Nhập tiêu đề chính của khuyến mãi..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">🖼️ Hình ảnh chính (Kéo thả nhiều ảnh)</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, '', true)}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Kéo thả ảnh vào đây hoặc</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e, '', true)}
                className="hidden"
                id="main-pictures"
              />
              <label htmlFor="main-pictures" className="bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                Chọn ảnh
              </label>
            </div>
            
            {(formData.MoTa?.Picture?.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.MoTa.Picture.map((picture, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={picture.url ? `data:image/jpeg;base64,${picture.url}`:picture.preview } 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removePicture(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                📝 Tiêu đề
              </h2>
              <button
                type="button"
                onClick={addTitle}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg"
              >
                <Plus size={16} />
                Thêm Title
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {(formData.MoTa?.Title || []).map((title, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedTitleIndex === index 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedTitleIndex(index);
                    setSelectedSubtitleIndex(0);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-800">Tiêu đề {index + 1}</h3>
                    {(formData.MoTa?.Title?.length > 1) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTitle(index);
                        }}
                        className="text-red-500 hover:bg-red-100 p-1 rounded-full transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={title.Name || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateNestedValue(`MoTa.Title[${index}].Name`, e.target.value);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên tiêu đề..."
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, `MoTa.Title[${index}].Picture.Url`);
                    }}
                    className="border border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {title.Picture?.Url ? (
                      <div className="relative">
                        <img 
                          src={title.Picture.Url.preview ? title.Picture.Url.preview : `data:image/jpeg;base64,${title.Picture.Url}`} 
                          alt="Title preview" 
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTitlePicture(index);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Kéo thả ảnh của tiêu đề này</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFileUpload(e, `MoTa.Title[${index}].Picture.Url`);
                          }}
                          className="hidden"
                          id={`title-pic-${index}`}
                        />
                        <label htmlFor={`title-pic-${index}`} className="text-blue-500 cursor-pointer hover:underline text-sm">
                          hoặc chọn file
                        </label>
                      </>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    {title.Subtitle?.length || 0} Mục đề
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                📄 Các mục đề trong tiêu đề {selectedTitleIndex + 1}
              </h2>
              <button
                type="button"
                onClick={() => addSubtitle(selectedTitleIndex)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
              >
                <Plus size={16} />
                Thêm Mục Đề
              </button>
            </div>

            {(formData.MoTa?.Title[selectedTitleIndex]?.Subtitle || []).map((subtitle, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedSubtitleIndex === index 
                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Mục đề {index + 1}</h4>
                  {(formData.MoTa?.Title[selectedTitleIndex]?.Subtitle?.length > 1) && (
                    <button
                      type="button"
                      onClick={() => removeSubtitle(selectedTitleIndex, index)}
                      className="text-red-500 hover:bg-red-100 p-1 rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={subtitle.Name || ''}
                  onChange={(e) => {
                    updateNestedValue(`MoTa.Title[${selectedTitleIndex}].Subtitle[${index}].Name`, e.target.value);
                    setSelectedSubtitleIndex(index);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tên Mục đề..."
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, `MoTa.Title[${selectedTitleIndex}].Subtitle[${index}].Picture.Url`)}
                  className="border border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 mb-3"
                >
                  {subtitle.Picture?.Url ? (
                    <div className="relative">
                      <img 
                        src={subtitle.Picture.Url.preview ? subtitle.Picture.Url.preview : `data:image/jpeg;base64,${subtitle.Picture.Url}`} 
                        alt="Subtitle preview" 
                        className="w-full h-16 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubtitlePicture(selectedTitleIndex, index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600 mb-1">Kéo thả ảnh của mục đề này</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, `MoTa.Title[${selectedTitleIndex}].Subtitle[${index}].Picture.Url`)}
                        className="hidden"
                        id={`subtitle-pic-${selectedTitleIndex}-${index}`}
                      />
                      <label htmlFor={`subtitle-pic-${selectedTitleIndex}-${index}`} className="text-purple-500 cursor-pointer hover:underline text-xs">
                        chọn file
                      </label>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-2 mb-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubtitleIndex(index);
                        setTimeout(() => insertFormatting('bold'), 0);
                      }}
                      className="p-1 bg-white rounded hover:bg-blue-100 transition-colors"
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubtitleIndex(index);
                        setTimeout(() => insertFormatting('italic'), 0);
                      }}
                      className="p-1 bg-white rounded hover:bg-blue-100 transition-colors"
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubtitleIndex(index);
                        setTimeout(() => insertFormatting('underline'), 0);
                      }}
                      className="p-1 bg-white rounded hover:bg-blue-100 transition-colors"
                      title="Underline"
                    >
                      <Underline size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubtitleIndex(index);
                        setTimeout(() => insertFormatting('h3'), 0);
                      }}
                      className="p-1 bg-white rounded hover:bg-blue-100 transition-colors text-xs font-bold"
                      title="Heading"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubtitleIndex(index);
                        setTimeout(() => insertFormatting('center'), 0);
                      }}
                      className="p-1 bg-white rounded hover:bg-blue-100 transition-colors"
                      title="Center"
                    >
                      <AlignCenter size={16} />
                    </button>
                    
                    <div className="flex gap-1">
                      {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setSelectedSubtitleIndex(index);
                            setTimeout(() => insertColor(color), 0);
                          }}
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{backgroundColor: color}}
                          title={`Color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  ref={selectedSubtitleIndex === index ? textareaRef : null}
                  value={subtitle.Description?.Content || ''}
                  onChange={(e) => {
                    updateNestedValue(`MoTa.Title[${selectedTitleIndex}].Subtitle[${index}].Description.Content`, e.target.value);
                    setSelectedSubtitleIndex(index);
                  }}
                  onFocus={() => setSelectedSubtitleIndex(index)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Nhập mô tả chi tiết (có thể sử dụng HTML tags)..."
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-12 py-4 rounded-2xl hover:bg-gray-400 transition-all duration-200 font-bold text-lg"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl transition-all duration-200 font-bold text-lg shadow-xl transform hover:scale-105 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mô tả'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMoTaEvent;