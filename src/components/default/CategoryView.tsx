import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from "react-router-dom";

interface LoaiSanPhamView {
  maLoaiSanPham?: number;
  tenLoaiSanPham?: string;
  kiHieu?: string;
  hinhAnh?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7051/";

const CategoryView = () => {
  const [loaiSanPhams, setLoaiSanPhams] = useState<LoaiSanPhamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoaiSanPhams = async () => {
      try {
        const response = await fetch(`${API_URL}/api/LoaiSanPham`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,            
          },
        });

        if (!response.ok) {
          throw new Error(`Lỗi HTTP! Mã trạng thái: ${response.status}`);
        }

        const data: LoaiSanPhamView[] = await response.json();
        const uniqueProducts = data
          .filter((item) => item.tenLoaiSanPham && item.kiHieu)
          .reduce((acc, item) => {
            if (!acc.some((existing) => existing.kiHieu === item.kiHieu)) {
              acc.push(item);
            }
            return acc;
          }, [] as LoaiSanPhamView[]);

        setLoaiSanPhams(uniqueProducts);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu loại sản phẩm:", error);
        setError("Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchLoaiSanPhams();
  }, []);

  const getImageSrc = (base64?: string): string => {
    if (!base64) return "/fallback-image.jpg";
    if (base64.startsWith("/9j/")) {
      return `data:image/jpeg;base64,${base64}`;
    }
    if (base64.startsWith("iVBORw0KGgo")) {
      return `data:image/png;base64,${base64}`;
    }
    return `data:image/png;base64,${base64}`;
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (loaiSanPhams.length === 0) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-gray-500">
        Không có danh mục sản phẩm để hiển thị
      </div>
    );
  }

  return (
    <section className="w-full py-2 bg-gradient-to-b from-[#f8f5ff] to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-[#9b87f5] mt-2 mb-3 text-center md:text-left">
          DANH MỤC
        </h2>
        <Carousel
          className="w-full max-w-[1800px] mx-auto"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="gap-2">
            {loaiSanPhams.map((loai) => (
              <CarouselItem
                key={loai.maLoaiSanPham || loai.kiHieu}
                className="basis-1/2 sm:basis-1/3 md:basis-1/6 lg:basis-1/12"
              >
                <div className="w-full text-center transition-all duration-300 hover:scale-105">
                  <Link
                    to={`/products?category=${encodeURIComponent(loai.tenLoaiSanPham || "")}`}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="relative w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto">
                      <img
                        src={getImageSrc(loai.hinhAnh)}
                        alt={loai.tenLoaiSanPham || "Danh mục"}
                        className="w-full h-full rounded-full object-cover border-2 border-[#9b87f5] transition-opacity duration-300 hover:opacity-90"
                        onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                      />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-700 line-clamp-2">
                      {loai.tenLoaiSanPham || "Không xác định"}
                    </p>
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white text-[#9b87f5] p-2 rounded-full hover:bg-[#9b87f5]/20 transition-colors z-20" />
          <CarouselNext className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white text-[#9b87f5] p-2 rounded-full hover:bg-[#9b87f5]/20 transition-colors z-20" />
        </Carousel>
      </div>
    </section>
  );
};

export default CategoryView;