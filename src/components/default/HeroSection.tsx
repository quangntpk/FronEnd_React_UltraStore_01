import { useState, useEffect, useRef } from "react";
import { HubConnectionBuilder, LogLevel, HubConnection } from "@microsoft/signalr";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselApi,
} from "@/components/ui/carousel";
import { ShoppingCart, ShoppingBag } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const APP_TITLE = import.meta.env.VITE_TITLE;

interface GiaoDien {
  maGiaoDien: number;
  tenGiaoDien: string;
  logo: string;
  slider1: string;
  slider2: string;
  slider3: string;
  slider4: string;
  avt: string;
  ngayTao: string;
  trangThai: number;
}

const HeroSection = () => {
  const [activeTheme, setActiveTheme] = useState<GiaoDien | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const hubConnection = useRef<HubConnection | null>(null);

  const fetchActiveTheme = async () => {
    try {
      const response = await fetch(`${API_URL}/api/GiaoDien`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data: GiaoDien[] = await response.json();
      const active = data.find(theme => theme.trangThai === 1);
      setActiveTheme(active || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTheme();

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/giaoDienHub`)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    hubConnection.current = connection;

    connection.on("ReceiveGiaoDienUpdated", (updated: GiaoDien) => {
      if (updated.trangThai === 1) {
        setActiveTheme(updated);
      } else if (activeTheme?.maGiaoDien === updated.maGiaoDien) {
        setActiveTheme(null);
      }
    });

    connection.on("ReceiveGiaoDienSetActive", () => {
      fetchActiveTheme();
    });

    connection.on("ReceiveGiaoDienDeleted", (id: number) => {
      if (activeTheme?.maGiaoDien === id) {
        setActiveTheme(null);
      }
    });

    connection.start().catch(() => {});
    return () => {
      connection.stop();
    };
  }, [activeTheme?.maGiaoDien]);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % api.scrollSnapList().length;
      api.scrollTo(next);
      setCurrentSlide(next);
    }, 5000);
    return () => clearInterval(interval);
  }, [api, currentSlide]);

  useEffect(() => {
    if (!api) return;
    const handleSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  const sliders = [
    activeTheme?.slider1,
    activeTheme?.slider2,
    activeTheme?.slider3,
    activeTheme?.slider4,
  ]
    .filter(s => s && !s.includes("null"))
    .map((s, i) => ({
      image: `data:image/png;base64,${s}`,
      name: `Slider ${i + 1}`,
    }));

  const renderButtons = (
    <>
      <Button asChild className="bg-crocus-500 hover:bg-crocus-600">
        <Link to="/products">
          <ShoppingBag className="h-4 w-4 mr-2" />
          <span>Mua sắm ngay</span>
        </Link>
      </Button>
      <Button asChild variant="outline" className="flex gap-2 items-center">
        <Link to="/user/cart">
          <ShoppingCart className="h-4 w-4" />
          <span>Xem giỏ hàng</span>
        </Link>
      </Button>
    </>
  );

  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-r from-crocus-500/20 to-crocus-200/40 rounded-xl p-8 md:p-16 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Khám phá bộ sưu tập{" "}
            <span className="bg-gradient-to-r from-crocus-500 to-crocus-700 bg-clip-text text-transparent">
              {APP_TITLE}
            </span>{" "}
            2025
          </h1>
          <p className="text-lg text-gray-700 max-w-lg">
            Nâng tầm phong cách của bạn với sản phẩm hot nhất năm 2025. Bộ sưu tập mới kết hợp sự thanh lịch với thiết kế đương đại.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {renderButtons}
          </div>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0">
          {loading ? (
            <div className="w-full h-[300px] bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Đang tải slider...</p>
            </div>
          ) : error || !activeTheme || sliders.length === 0 ? (
            <div className="w-full h-[300px] bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">{error || "Không có giao diện hoạt động."}</p>
            </div>
          ) : (
            <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
              <CarouselContent>
                {sliders.map((s, idx) => (
                  <CarouselItem key={idx} className="md:basis-1/1">
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={s.image}
                        alt={s.name}
                        className="w-full h-[300px] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/600x300?text=Image+Error";
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-4">
                        <h3 className="text-xl text-white font-semibold">{s.name}</h3>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
