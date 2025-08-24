import React, { useState, useEffect } from "react";
import { Upload, X, Sparkles, Camera, User } from "lucide-react";
import Swal from "sweetalert2";

interface TestingsProps {
  defaultClothingImage?: string;
}

const Testings: React.FC<TestingsProps> = ({ defaultClothingImage }) => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [zoom1, setZoom1] = useState<number>(1);
  const [zoom2, setZoom2] = useState<number>(1);
  const [zoomOutput, setZoomOutput] = useState<number>(1);
  const [textPrompt, setTextPrompt] = useState<string>("Kết hợp ảnh của bạn với ảnh đồ để tạo phong cách hoàn hảo");

  const API_URL = "https://bicacuatho.azurewebsites.net/";

  const showAlert = (type: "success" | "error", title: string, text: string) => {
    Swal.fire({
      icon: type,
      title,
      text,
      confirmButtonColor: "#3085d6",
    });
  };

  useEffect(() => {
    if (defaultClothingImage) {
      const base64Data = defaultClothingImage.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const file = new File([blob], "clothing.jpg", { type: "image/jpeg" });

      setFile2(file);
      setPreview2(defaultClothingImage);
    }
  }, [defaultClothingImage]);

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const selectedFile = event.dataTransfer.files[0];
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);
      }
    }
  };

  const handleClick = (
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const selectedFile = target.files[0];
        setFile(selectedFile);
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);
      }
    };
    input.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleZoomIn = (setZoom: React.Dispatch<React.SetStateAction<number>>) => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));
  };

  const handleZoomOut = (setZoom: React.Dispatch<React.SetStateAction<number>>) => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  useEffect(() => {
    return () => {
      if (preview1) URL.revokeObjectURL(preview1);
      if (preview2 && !defaultClothingImage) URL.revokeObjectURL(preview2);
    };
  }, [preview1, preview2, defaultClothingImage]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64Data = reader.result.split(",")[1];
          resolve(base64Data);
        } else {
          reject(new Error("Kết quả không phải là chuỗi"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!file1 || !file2 || !textPrompt.trim()) {
      showAlert("error", "Lỗi", "Vui lòng chọn cả hai tệp hình ảnh và nhập mô tả yêu cầu!");
      return;
    }

    setLoading(true);
    try {
      const base64Data1 = await readFileAsBase64(file1);
      const base64Data2 = await readFileAsBase64(file2);

      const requestData = {
        textPrompt,
        imageBase64: [base64Data1, base64Data2],
      };

      const response = await fetch(`${API_URL}/api/GoogleApis/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok && data.generatedImageBase64) {
        setOutputImage(`data:image/jpeg;base64,${data.generatedImageBase64}`);
        setZoomOutput(1);
        showAlert("success", "Thành công!", "Đã tạo ảnh thử đồ thành công!");
      } else {
        showAlert("error", "Lỗi", data.message || "Có lỗi xảy ra khi xử lý yêu cầu");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      showAlert("error", "Lỗi", "Có lỗi xảy ra khi gửi yêu cầu đến API");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile1(null);
    setFile2(null);
    setPreview1(null);
    setPreview2(null);
    setOutputImage(null);
    setZoom1(1);
    setZoom2(1);
    setZoomOutput(1);
    setTextPrompt("Kết hợp ảnh của bạn với áo/quần để tạo phong cách hoàn hảo");
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          <div className="mb-8">
            <label className="block text-center font-semibold text-lg text-gray-700 mb-4">
              💬 Mô tả yêu cầu của bạn
            </label>
            <div className="max-w-2xl mx-auto">
              <input
                type="text"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Nhập yêu cầu thử đồ (ví dụ: Mặc áo từ ảnh thứ hai)"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 text-center shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mb-2 shadow-lg">
                  <User className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-700">Ảnh Người</h3>
                <p className="text-gray-500 text-sm">Tải lên ảnh của bạn</p>
              </div>
              <div
                className="w-full h-80 border-3 border-dashed border-purple-300 rounded-2xl flex items-center justify-center bg-white cursor-pointer overflow-hidden transition-all duration-300 hover:border-purple-400 hover:shadow-lg group"
                onDrop={(e) => handleDrop(e, setFile1, setPreview1)}
                onDragOver={handleDragOver}
                onClick={() => handleClick(setFile1, setPreview1)}
              >
                {preview1 ? (
                  <div className="relative">
                    <img
                      src={preview1}
                      alt="Preview 1"
                      className="max-w-full max-h-72 object-contain rounded-xl shadow-lg transition-transform duration-300"
                      style={{ transform: `scale(${zoom1})` }}
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-red-600 transition-colors shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile1(null);
                        setPreview1(null);
                        setZoom1(1);
                      }}
                    >
                      ×
                    </button>
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <button
                        className="bg-gray-800/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomIn(setZoom1);
                        }}
                      >
                        +
                      </button>
                      <button
                        className="bg-gray-800/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomOut(setZoom1);
                        }}
                      >
                        -
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center group-hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="text-purple-500" size={32} />
                    </div>
                    <p className="text-gray-600 font-medium">Kéo thả hoặc click để chọn ảnh</p>
                    <p className="text-gray-400 text-sm mt-1">Hỗ trợ JPG, PNG</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mb-2 shadow-lg">
                  <Camera className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-700">Ảnh Trang Phục</h3>
                <p className="text-gray-500 text-sm">Tải lên ảnh quần áo</p>
              </div>
              <div
                className="w-full h-80 border-3 border-dashed border-blue-300 rounded-2xl flex items-center justify-center bg-white cursor-pointer overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-lg group"
                onDrop={(e) => handleDrop(e, setFile2, setPreview2)}
                onDragOver={handleDragOver}
                onClick={() => handleClick(setFile2, setPreview2)}
              >
                {preview2 ? (
                  <div className="relative">
                    <img
                      src={preview2}
                      alt="Preview 2"
                      className="max-w-full max-h-72 object-contain rounded-xl shadow-lg transition-transform duration-300"
                      style={{ transform: `scale(${zoom2})` }}
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-red-600 transition-colors shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile2(null);
                        setPreview2(null);
                        setZoom2(1);
                      }}
                    >
                      ×
                    </button>
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <button
                        className="bg-gray-800/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomIn(setZoom2);
                        }}
                      >
                        +
                      </button>
                      <button
                        className="bg-gray-800/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomOut(setZoom2);
                        }}
                      >
                        -
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center group-hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                      <Camera className="text-blue-500" size={32} />
                    </div>
                    <p className="text-gray-600 font-medium">Kéo thả hoặc click để chọn ảnh</p>
                    <p className="text-gray-400 text-sm mt-1">Hỗ trợ JPG, PNG</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full mb-2 shadow-lg">
                  <Sparkles className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-700">Kết Quả</h3>
                <p className="text-gray-500 text-sm">Ảnh sau khi xử lý</p>
              </div>
              <div className="w-full h-80 border-3 border-dashed border-emerald-300 rounded-2xl flex items-center justify-center bg-white overflow-hidden">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang xử lý...</p>
                    <p className="text-gray-400 text-sm">Vui lòng đợi một chút</p>
                  </div>
                ) : outputImage ? (
                  <div className="relative">
                    <img
                      src={outputImage}
                      alt="Processed Output"
                      className="max-w-full max-h-72 object-contain rounded-xl shadow-lg transition-transform duration-300"
                      style={{ transform: `scale(${zoomOutput})` }}
                    />
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <button
                        className="bg-gray-800/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
                        onClick={() => handleZoomIn(setZoomOutput)}
                      >
                        +
                      </button>
                      <button
                        className="bg-gray-800/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors shadow-lg backdrop-blur-sm"
                        onClick={() => handleZoomOut(setZoomOutput)}
                      >
                        -
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="text-emerald-500" size={32} />
                    </div>
                    <p className="text-gray-600 font-medium">Chưa có kết quả</p>
                    <p className="text-gray-400 text-sm mt-1">Tải ảnh và nhấn "Mặc đồ thử"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Upload size={20} />
              {loading ? "Đang xử lý..." : "✨ Mặc đồ thử"}
            </button>
            <button
              onClick={handleClear}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <X size={20} />
              🗑️ Xóa toàn bộ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testings;