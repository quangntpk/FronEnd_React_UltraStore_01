import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Ruler, Weight, Image, X } from "lucide-react";

const SelectSize: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"huongDan" | "bangSize">("huongDan");
  const [loaiSanPham, setLoaiSanPham] = useState<string>("Quần");
  const [formDang, setFormDang] = useState<"om" | "vua" | "rong" | "thuong" | "cao">("vua");
  const [weight, setWeight] = useState<number>(56);
  const [height, setHeight] = useState<number>(160);

  const formRef = useRef<HTMLDivElement>(null);

  const forms: Record<"om" | "vua" | "rong" | "thuong" | "cao", string> = {
    om: "Ôm",
    vua: "Vừa",
    rong: "Rộng",
    thuong: "Thường",
    cao: "Cao",
  };

  const sizeData: Record<string, string[][]> = {
    "Quần - Ôm": [
      ["Cân nặng (kg)", "50-60", "61-65", "66-70", "71-76", "76-80", "81-86"],
      ["Vòng lưng (cm)", "74", "78", "81", "84", "88", "91"],
      ["Vòng đùi (cm)", "50", "52", "54", "56", "58", "60"],
      ["Rộng ống (cm)", "16.4", "16.5", "17", "17", "17", "17"],
      ["Dài quần (cm)", "98", "97", "97", "97", "98", "98"],
    ],
    "Quần - Vừa": [
      ["Cân nặng (kg)", "50-60", "61-65", "66-70", "71-76", "76-80", "81-86"],
      ["Vòng lưng (cm)", "74", "78", "81", "84", "88", "91"],
      ["Vòng đùi (cm)", "50", "52", "54", "56", "58", "60"],
      ["Rộng ống (cm)", "16.4", "16.5", "17", "17", "17", "17"],
      ["Dài quần (cm)", "98", "97", "97", "97", "98", "98"],
    ],
    "Quần - Rộng": [
      ["Cân nặng (kg)", "50-60", "61-65", "66-70", "71-76", "76-80", "81-86"],
      ["Vòng lưng (cm)", "78", "80", "82", "84", "88", "91"],
      ["Vòng đùi (cm)", "54", "56", "58", "60", "62", "64"],
      ["Rộng ống (cm)", "18", "18", "18", "18", "18", "18"],
      ["Dài quần (cm)", "98", "97", "97", "98", "100", "101"],
    ],
    "Áo - Ôm": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Ngang vai (cm)", "42", "43.5", "45", "46.5"],
      ["Rộng ngực (cm)", "46", "48", "50", "52"],
      ["Dài áo (cm)", "68", "70", "72", "74"],
    ],
    "Áo - Vừa": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Ngang vai (cm)", "43.5", "45", "46.5", "48"],
      ["Rộng ngực (cm)", "48", "50", "52", "54"],
      ["Dài áo (cm)", "70", "72", "74", "76"],
    ],
    "Áo - Rộng": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Ngang vai (cm)", "47.5", "49", "50.5", "52"],
      ["Rộng ngực (cm)", "52", "54", "56", "58"],
      ["Dài áo (cm)", "72", "74", "76", "78"],
    ],
    "Giày - Thường": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Kích thước (US)", "6", "7", "8", "9"],
      ["Chiều dài bàn chân (cm)", "24", "25", "26", "27"],
    ],
    "Giày - Cao": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Kích thước (US)", "6.5", "7.5", "8.5", "9.5"],
      ["Chiều dài bàn chân (cm)", "24.5", "25.5", "26.5", "27.5"],
    ],
    "Dép - Thường": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Kích thước (US)", "6", "7", "8", "9"],
      ["Chiều dài bàn chân (cm)", "24", "25", "26", "27"],
    ],
    "Dép - Cao": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Kích thước (US)", "6.5", "7.5", "8.5", "9.5"],
      ["Chiều dài bàn chân (cm)", "24.5", "25.5", "26.5", "27.5"],
    ],
    "Túi xách - Thường": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Chiều rộng (cm)", "20", "22", "24", "26"],
      ["Chiều cao (cm)", "15", "16", "17", "18"],
    ],
    "Phụ kiện - Thường": [
      ["Chiều cao (cm)", "150-160", "161-170", "171-180", "181-190"],
      ["Kích thước vòng cổ (cm)", "35", "38", "41", "44"],
      ["Đường kính (cm)", "5", "5.5", "6", "6.5"],
    ],
  };

  const suggestSize = (weight: number, height: number, loaiSanPham: string) => {
    if (loaiSanPham === "Quần") {
      if (weight < 60) return "28";
      if (weight < 65) return "29";
      if (weight < 70) return "30";
      if (weight < 76) return "31";
      if (weight < 80) return "32";
      return "34";
    } else if (loaiSanPham === "Áo") {
      if (height < 160) return "S";
      if (height < 170) return "M";
      if (height < 180) return "L";
      return "XL";
    } else if (loaiSanPham === "Giày" || loaiSanPham === "Dép") {
      if (height < 160) return "6";
      if (height < 170) return "7";
      if (height < 180) return "8";
      return "9";
    } else if (loaiSanPham === "Túi xách") {
      if (height < 160) return "S (20x15cm)";
      if (height < 170) return "M (22x16cm)";
      if (height < 180) return "L (24x17cm)";
      return "XL (26x18cm)";
    } else if (loaiSanPham === "Phụ kiện") {
      if (height < 160) return "S (35cm)";
      if (height < 170) return "M (38cm)";
      if (height < 180) return "L (41cm)";
      return "XL (44cm)";
    }
    return "Không xác định";
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowForm(false);
      }
    };

    if (showForm) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForm]);

  return (
    <div className="relative">
      <h5
        onClick={() => setShowForm(!showForm)}
        className="px-3 py-1 text-sm rounded-md bg-white text-[#9b87f5] mb-2 cursor-pointer flex items-center gap-2 border border-[#9b87f5] w-fit hover:bg-[#9b87f5]/10 transition-colors duration-300"
      >
        {showForm ? (
          <>
            <EyeOff size={16} />
            Ẩn Hướng dẫn
          </>
        ) : (
          <>
            <Eye size={16} />
            Hướng dẫn chọn size
          </>
        )}
      </h5>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div ref={formRef} className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
            <span
              onClick={() => setShowForm(false)}
              className="absolute top-[-10px] right-[-10px] text-xl cursor-pointer bg-[#9b87f5] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#9b87f5]/80 transition-colors duration-300"
            >
              <X size={16} />
            </span>

            <div className="flex justify-between items-center mb-4 transition-all duration-300">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("huongDan")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "huongDan" ? "bg-[#9b87f5] text-white font-bold" : "bg-gray-100 text-gray-700"
                  } hover:bg-[#9b87f5]/20 transition-colors duration-300`}
                >
                  <Ruler className="inline-block mr-2 h-4 w-4" />
                  Hướng dẫn chọn size
                </button>
                <button
                  onClick={() => setActiveTab("bangSize")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "bangSize" ? "bg-[#9b87f5] text-white font-bold" : "bg-gray-100 text-gray-700"
                  } hover:bg-[#9b87f5]/20 transition-colors duration-300`}
                >
                  <Image className="inline-block mr-2 h-4 w-4" />
                  Bảng size
                </button>
              </div>
              <select
                className="border border-[#9b87f5] rounded px-3 py-1 text-[#9b87f5] bg-white hover:bg-[#9b87f5]/10 transition-colors duration-300 appearance-none"
                value={loaiSanPham}
                onChange={(e) => setLoaiSanPham(e.target.value)}
              >
                <option value="Quần" className="flex items-center">
                  <span className="mr-2">👖</span>Quần
                </option>
                <option value="Áo" className="flex items-center">
                  <span className="mr-2">👕</span>Áo
                </option>
                <option value="Giày" className="flex items-center">
                  <span className="mr-2">👞</span>Giày
                </option>
                <option value="Dép" className="flex items-center">
                  <span className="mr-2">👡</span>Dép
                </option>
                <option value="Túi xách" className="flex items-center">
                  <span className="mr-2">👜</span>Túi xách
                </option>
                <option value="Phụ kiện" className="flex items-center">
                  <span className="mr-2">💍</span>Phụ kiện
                </option>
              </select>
            </div>

            {activeTab === "huongDan" && (
              <div>
                <div className="mb-4 flex items-center transition-all duration-300">
                  <label className="text-sm mr-2 text-gray-700 flex items-center">
                    <Ruler className="mr-1 h-4 w-4" />Chiều cao (cm):
                  </label>
                  <span className="font-bold text-[#9b87f5]">{height}cm</span>
                  <input
                    type="range"
                    min="140"
                    max="200"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="ml-2 w-full accent-[#9b87f5]"
                  />
                </div>
                <div className="mb-4 flex items-center transition-all duration-300">
                  <label className="text-sm mr-2 text-gray-700 flex items-center">
                    <Weight className="mr-1 h-4 w-4" />Cân nặng (kg):
                  </label>
                  <span className="font-bold text-[#9b87f5]">{weight}kg</span>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="ml-2 w-full accent-[#9b87f5]"
                  />
                </div>
                <div className="mt-4 flex flex-row justify-center gap-2 transition-all duration-300">
                  {loaiSanPham === "Quần" || loaiSanPham === "Áo" ? (
                    <>
                      <div
                        onClick={() => setFormDang("om")}
                        className={`cursor-pointer text-center ${formDang === "om" ? "border-2 border-[#9b87f5]" : ""}`}
                      >
                        <img
                          src="https://file.hstatic.net/1000253775/file/om_160_519a3dbfd5314c2fb5f4d90913534ec4.jpg"
                          alt="Ôm"
                          className="w-3/4 max-w-sm mx-auto"
                        />
                        <p className="mt-2 bg-[#9b87f5] text-white rounded px-2 py-1 inline-block">Ôm</p>
                      </div>
                      <div
                        onClick={() => setFormDang("vua")}
                        className={`cursor-pointer text-center ${formDang === "vua" ? "border-2 border-[#9b87f5]" : ""}`}
                      >
                        <img
                          src="https://file.hstatic.net/1000253775/file/vua_160_85cf53bb243943ad90c3890031cc15ae.jpg"
                          alt="Vừa"
                          className="w-3/4 max-w-sm mx-auto"
                        />
                        <p className="mt-2 bg-[#9b87f5] text-white rounded px-2 py-1 inline-block">Vừa</p>
                      </div>
                      <div
                        onClick={() => setFormDang("rong")}
                        className={`cursor-pointer text-center ${formDang === "rong" ? "border-2 border-[#9b87f5]" : ""}`}
                      >
                        <img
                          src="https://file.hstatic.net/1000253775/file/rong_160_09b702fafaca4d879af662e6383baa5f.jpg"
                          alt="Rộng"
                          className="w-3/4 max-w-sm mx-auto"
                        />
                        <p className="mt-2 bg-[#9b87f5] text-white rounded px-2 py-1 inline-block">Rộng</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        onClick={() => setFormDang("thuong")}
                        className={`cursor-pointer text-center ${formDang === "thuong" ? "border-2 border-[#9b87f5]" : ""}`}
                      >
                        <img
                          src="https://file.hstatic.net/1000253775/file/thuong_160_0f4c5b3e6d0e4e8e8f1d2b3c4d5e6f7a.jpg"
                          alt="Thường"
                          className="w-3/4 max-w-sm mx-auto"
                        />
                        <p className="mt-2 bg-[#9b87f5] text-white rounded px-2 py-1 inline-block">Thường</p>
                      </div>
                      <div
                        onClick={() => setFormDang("cao")}
                        className={`cursor-pointer text-center ${formDang === "cao" ? "border-2 border-[#9b87f5]" : ""}`}
                      >
                        <img
                          src="https://file.hstatic.net/1000253775/file/cao_160_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d.jpg"
                          alt="Cao"
                          className="w-3/4 max-w-sm mx-auto"
                        />
                        <p className="mt-2 bg-[#9b87f5] text-white rounded px-2 py-1 inline-block">Cao</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-4 text-center transition-all duration-300">
                  <p className="text-lg text-gray-700">UltraStore gợi ý bạn</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <span className="bg-[#9b87f5] text-white rounded px-3 py-1">
                      {suggestSize(weight, height, loaiSanPham)} - {loaiSanPham}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bangSize" && (
              <div className="max-h-96 overflow-y-auto transition-all duration-300">
                {["om", "vua", "rong", "thuong", "cao"].map((formKey) => {
                  const isApplicable =
                    (loaiSanPham === "Quần" || loaiSanPham === "Áo") && (formKey === "om" || formKey === "vua" || formKey === "rong") ||
                    (loaiSanPham === "Giày" || loaiSanPham === "Dép" || loaiSanPham === "Túi xách" || loaiSanPham === "Phụ kiện") &&
                    (formKey === "thuong" || formKey === "cao");
                  return isApplicable ? (
                    <div key={formKey} className="mb-4">
                      <h3 className="text-lg font-bold mb-2 text-[#9b87f5] transition-all duration-300">
                        {loaiSanPham} - {forms[formKey as "om" | "vua" | "rong" | "thuong" | "cao"]}
                      </h3>
                      <table className="w-full border border-[#9b87f5] text-sm transition-all duration-300">
                        <thead>
                          <tr className="bg-[#9b87f5] text-white">
                            <th className="p-2">SIZE</th>
                            {loaiSanPham === "Quần" ? (
                              <>
                                <th className="p-2">28</th>
                                <th className="p-2">29</th>
                                <th className="p-2">30</th>
                                <th className="p-2">31</th>
                                <th className="p-2">32</th>
                                <th className="p-2">34</th>
                              </>
                            ) : loaiSanPham === "Áo" ? (
                              <>
                                <th className="p-2">S</th>
                                <th className="p-2">M</th>
                                <th className="p-2">L</th>
                                <th className="p-2">XL</th>
                              </>
                            ) : loaiSanPham === "Giày" || loaiSanPham === "Dép" ? (
                              <>
                                <th className="p-2">6</th>
                                <th className="p-2">7</th>
                                <th className="p-2">8</th>
                                <th className="p-2">9</th>
                              </>
                            ) : loaiSanPham === "Túi xách" ? (
                              <>
                                <th className="p-2">S</th>
                                <th className="p-2">M</th>
                                <th className="p-2">L</th>
                                <th className="p-2">XL</th>
                              </>
                            ) : loaiSanPham === "Phụ kiện" ? (
                              <>
                                <th className="p-2">S</th>
                                <th className="p-2">M</th>
                                <th className="p-2">L</th>
                                <th className="p-2">XL</th>
                              </>
                            ) : null}
                          </tr>
                        </thead>
                        <tbody>
                          {sizeData[`${loaiSanPham} - ${forms[formKey as "om" | "vua" | "rong" | "thuong" | "cao"]}`]?.map((row, idx) => (
                            <tr key={idx} className="border-t border-gray-300 transition-all duration-300">
                              {row.map((cell, i) => (
                                <td key={i} className="p-2 border-r border-gray-200">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null;
                })}
                <p className="text-sm text-gray-500 mt-2 transition-all duration-300">
                  * Size có thể chênh lệch tùy theo từng dáng người, bạn nên thử trước khi mua.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectSize;
