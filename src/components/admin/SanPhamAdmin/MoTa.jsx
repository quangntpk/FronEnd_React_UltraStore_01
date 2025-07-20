import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload, Eye, EyeOff, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PreviewDes from './PreviewDes.jsx';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const MoTaModal = ({ isOpen, onClose, moTaChiTiet }) => {
  const [formData, setFormData] = useState({
    MoTa: {
      Header: {},
      Picture: [{}],
      Title: [
        {
          Subtitle: [
            {
              Description: {}
            }
          ]
        }
      ]
    }
  });
  const [showJson, setShowJson] = useState(false);
  const [jsonOutput, setJsonOutput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [mainImage, setMainImage] = useState(null);
  const [sliderImages, setSliderImages] = useState([]);
  const fileInputRef = useRef(null);
  const sliderFileInputRef = useRef(null);

  // Initialize formData, mainImage, and sliderImages with moTaChiTiet
  useEffect(() => {
    if (moTaChiTiet) {
      const { header, picture, title } = moTaChiTiet.moTa || {};
      setFormData({
        MoTa: {
          Header: header || {},
          Picture: picture && Array.isArray(picture) ? picture : [{}],
          Title: title && Array.isArray(title) ? title.map(t => ({
            name: t.name || '',
            Subtitle: t.subtitle && Array.isArray(t.subtitle) ? t.subtitle.map(s => ({
              name: s.name || '',
              Description: s.description || {}
            })) : [{ Description: {} }]
          })) : [{ Subtitle: [{ Description: {} }] }]
        }
      });
      setMainImage(picture?.[0]?.url || null);
      setSliderImages(picture && Array.isArray(picture) ? picture.slice(1).map(p => p.url).filter(url => url) : []);
    }
  }, [moTaChiTiet]);

  const handleDragOver = (e, isSlider = false) => {
    e.preventDefault();
    e.stopPropagation();
    isSlider ? setIsDraggingSlider(true) : setIsDragging(true);
  };

  const handleDragLeave = (e, isSlider = false) => {
    e.preventDefault();
    e.stopPropagation();
    isSlider ? setIsDraggingSlider(false) : setIsDragging(false);
  };

  const handleDrop = (e, isSlider = false) => {
    e.preventDefault();
    e.stopPropagation();
    isSlider ? setIsDraggingSlider(false) : setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files, isSlider);
  };

  const handleFileChange = (e, isSlider = false) => {
    const files = Array.from(e.target.files);
    handleFiles(files, isSlider);
  };

  const handleFiles = (files, isSlider) => {
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
          if (isSlider) {
            setSliderImages((prev) => [...prev, base64String]);
            setFormData((prev) => ({
              ...prev,
              MoTa: {
                ...prev.MoTa,
                Picture: prev.MoTa.Picture.length === 1 && !prev.MoTa.Picture[0].url
                  ? [prev.MoTa.Picture[0], { url: base64String }]
                  : [...prev.MoTa.Picture, { url: base64String }],
              },
            }));
          } else {
            setMainImage(base64String);
            setFormData((prev) => ({
              ...prev,
              MoTa: {
                ...prev.MoTa,
                Picture: [{ url: base64String }, ...prev.MoTa.Picture.slice(1)],
              },
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDeleteImage = (index, isSlider = false) => {
    if (isSlider) {
      setSliderImages((prev) => prev.filter((_, i) => i !== index));
      setFormData((prev) => ({
        ...prev,
        MoTa: {
          ...prev.MoTa,
          Picture: [
            prev.MoTa.Picture[0],
            ...prev.MoTa.Picture.slice(1).filter((_, i) => i !== index),
          ],
        },
      }));
    } else {
      setMainImage(null);
      setFormData((prev) => ({
        ...prev,
        MoTa: {
          ...prev.MoTa,
          Picture: [{}, ...prev.MoTa.Picture.slice(1)],
        },
      }));
    }
  };

  const updateHeader = (value) => {
    setFormData((prev) => ({
      ...prev,
      MoTa: {
        ...prev.MoTa,
        Header: {
          title: value,
        },
      },
    }));
  };

  const updateTitle = (titleIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      MoTa: {
        ...prev.MoTa,
        Title: prev.MoTa.Title.map((title, i) =>
          i === titleIndex ? { ...title, name: value } : title
        ),
      },
    }));
  };

  const addTitle = () => {
    setFormData((prev) => ({
      ...prev,
      MoTa: {
        ...prev.MoTa,
        Title: [...prev.MoTa.Title, { Subtitle: [{ Description: {} }] }],
      },
    }));
  };

  const removeTitle = (index) => {
    if (formData.MoTa.Title.length > 1) {
      setFormData((prev) => ({
        ...prev,
        MoTa: {
          ...prev.MoTa,
          Title: prev.MoTa.Title.filter((_, i) => i !== index),
        },
      }));
    }
  };

  const updateSubtitle = (titleIndex, subtitleIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      MoTa: {
        ...prev.MoTa,
        Title: prev.MoTa.Title.map((title, ti) =>
          ti === titleIndex
            ? {
                ...title,
                Subtitle: title.Subtitle.map((subtitle, si) =>
                  si === subtitleIndex ? { ...subtitle, name: value } : subtitle
                ),
              }
            : title
        ),
      },
    }));
  };

  const addSubtitle = (titleIndex) => {
    setFormData((prev) => ({
      ...prev,
      MoTa: {
        ...prev.MoTa,
        Title: prev.MoTa.Title.map((title, i) =>
          i === titleIndex
            ? {
                ...title,
                Subtitle: [...title.Subtitle, { Description: {} }],
              }
            : title
        ),
      },
    }));
  };

  const removeSubtitle = (titleIndex, subtitleIndex) => {
    const currentTitle = formData.MoTa.Title[titleIndex];
    if (currentTitle.Subtitle.length > 1) {
      setFormData((prev) => ({
        ...prev,
        MoTa: {
          ...prev.MoTa,
          Title: prev.MoTa.Title.map((title, i) =>
            i === titleIndex
              ? {
                  ...title,
                  Subtitle: title.Subtitle.filter((_, si) => si !== subtitleIndex),
                }
              : title
          ),
        },
      }));
    }
  };

  const updateDescription = (titleIndex, subtitleIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      MoTa: {
        ...prev.MoTa,
        Title: prev.MoTa.Title.map((title, ti) =>
          ti === titleIndex
            ? {
                ...title,
                Subtitle: title.Subtitle.map((subtitle, si) =>
                  si === subtitleIndex
                    ? {
                        ...subtitle,
                        Description: {
                          content: value,
                        },
                      }
                    : subtitle
                ),
              }
            : title
        ),
      },
    }));
  };

  const generateJson = () => {
    const output = JSON.stringify([formData], null, 2);
    setJsonOutput(output);
    setShowJson(true);
  };

  const handleSave = async () => {
    const dataToSend = [{
      ...formData,
      MaSanPham: moTaChiTiet?.maSanPham || null,
      IdMoTa: moTaChiTiet?.idMoTa || null
    }];
    try {
      const response = await fetch("http://localhost:5261/api/SanPham/MoTaSanPhamCreate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        Swal.fire({
          title: "Thành công!",
          text: "Lưu mô tả thành công!",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          generateJson();
          onClose();
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Lỗi!",
          text: errorData.message || "Có lỗi xảy ra khi lưu mô tả.",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Nhập Thông Tin Mô Tả Sản Phẩm
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Tiêu đề</h3>
            <Input
              type="text"
              className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề chính"
              value={formData.MoTa.Header.title || ''}
              onChange={(e) => updateHeader(e.target.value)}
            />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Ảnh Chính</h3>
            <div
              className={`relative w-full h-40 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer overflow-hidden ${
                isDragging ? 'border-blue-500 bg-blue-50' : mainImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => handleDragOver(e)}
              onDragLeave={(e) => handleDragLeave(e)}
              onDrop={(e) => handleDrop(e)}
              onClick={() => !mainImage && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e)}
                accept="image/*"
                className="hidden"
              />
              {mainImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={`data:image/jpeg;base64,${mainImage}`}
                    alt="Main Image Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(0);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-lg z-10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Upload className="w-10 h-10 mb-2" />
                  <p className="text-base font-medium">Kéo thả ảnh vào đây</p>
                  <p className="text-sm">hoặc nhấp để chọn file</p>
                  <p className="text-xs mt-1 text-gray-400">PNG, JPG, GIF (1 ảnh duy nhất)</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Ảnh Slider</h3>
            <div
              className={`relative w-full min-h-[160px] border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                isDraggingSlider ? 'border-blue-500 bg-blue-50' : sliderImages.length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => handleDragOver(e, true)}
              onDragLeave={(e) => handleDragLeave(e, true)}
              onDrop={(e) => handleDrop(e, true)}
              onClick={() => sliderFileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={sliderFileInputRef}
                onChange={(e) => handleFileChange(e, true)}
                accept="image/*"
                multiple
                className="hidden"
              />
              {sliderImages.length > 0 ? (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    {sliderImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`data:image/jpeg;base64,${image}`}
                          alt={`Slider Image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 group-hover:border-blue-400 transition-colors"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(index, true);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      {sliderImages.length} ảnh đã chọn - Click để thêm ảnh khác
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <Upload className="w-10 h-10 mb-2" />
                  <p className="text-base font-medium">Kéo thả ảnh vào đây</p>
                  <p className="text-sm">hoặc nhấp để chọn file</p>
                  <p className="text-xs mt-1 text-gray-400">PNG, JPG, GIF (nhiều ảnh)</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-700">Mục Đề</h3>
              <Button
                onClick={addTitle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={16} />
                Thêm Mục Đề
              </Button>
            </div>
            {formData.MoTa.Title.map((title, titleIndex) => (
              <div key={titleIndex} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-600" hidden>Mục Đề {titleIndex + 1}</h4>
                  {formData.MoTa.Title.length > 1 && (
                    <button
                      onClick={() => removeTitle(titleIndex)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="mb-4">
                  <Input
                    type="text"
                    className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên Mục Đề"
                    value={title.name || ''}
                    onChange={(e) => updateTitle(titleIndex, e.target.value)}
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-gray-600" hidden>Mục Đề Con</h5>
                    <Button
                      onClick={() => addSubtitle(titleIndex)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <Plus size={12} />
                      Thêm Mục Nhỏ
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {title.Subtitle.map((subtitle, subtitleIndex) => (
                      <div key={subtitleIndex} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-medium text-gray-500" hidden>Mục Nhỏ {subtitleIndex + 1}</h6>
                          {title.Subtitle.length > 1 && (
                            <button
                              onClick={() => removeSubtitle(titleIndex, subtitleIndex)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                        <div className="mb-3">
                          <Input
                            type="text"
                            className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Tên Mục Nhỏ"
                            value={subtitle.name || ''}
                            onChange={(e) => updateSubtitle(titleIndex, subtitleIndex, e.target.value)}
                          />
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="text-xs font-medium text-gray-500 mb-2 block" hidden>Nội dung mô tả:</label>
                          <ReactQuill
                            value={subtitle.Description.content || ''}
                            onChange={(value) => updateDescription(titleIndex, subtitleIndex, value)}
                            modules={quillModules}
                            className="min-h-[100px] bg-white border border-gray-300 rounded-lg"
                            placeholder="Nội dung mô tả"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <PreviewDes formData={formData} />
          </div>
          {showJson && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">JSON Preview</h4>
              <pre className="bg-gray-800 text-green-400 p-3 rounded-md text-xs overflow-x-auto">
                {jsonOutput || JSON.stringify([formData], null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6"
          >
            Lưu Mô Tả
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoTaModal;