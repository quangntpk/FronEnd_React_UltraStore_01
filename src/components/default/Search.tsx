import React, { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import axios from "axios";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.43.163:5261";

interface ProductResponse {
  id: string;
  name: string;
  hinh: string[];
  donGia: number;
  khuyenMaiMax: number;
  soLuongDaBan: number;
  thuongHieu: string;
  chatLieu: string;
}

interface ComboResponse {
  maCombo: number;
  name: string;
  hinhAnh: string;
  gia: number;
  khuyenMaiMax: number;
  sanPhams: {
    idSanPham: string;
    donGia: number;
    soLuong: number;
  }[];
}

interface BlogResponse {
  maBlog: number;
  tieuDe: string;
  noiDung: string;
  hinhAnh: string | null;
  slug: string | null;
  isPublished: boolean;
  tags: string[] | null;
}

interface SearchResult {
  id: string | number;
  name: string;
  imageSrc: string | null;
  price: number | null;
  originalPrice?: number | null;
  discountPercent: number;
  savings?: number;
  savingsPercentageComparedToRetail?: number;
  type: "product" | "combo" | "blog";
  slug?: string | null;
  thuongHieu?: string;
  chatLieu?: string;
  soLuongDaBan?: number;
  productCount?: number;
}

const transformProductData = (products: ProductResponse[]): SearchResult[] => {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    imageSrc: product.hinh[0] ? `data:image/jpeg;base64,${product.hinh[0]}` : null,
    price: Math.round(product.donGia * (1 - (product.khuyenMaiMax || 0) / 100)),
    discountPercent: product.khuyenMaiMax || 0,
    type: "product" as const,
    thuongHieu: product.thuongHieu || "Không xác định",
    chatLieu: product.chatLieu || "Không xác định",
    soLuongDaBan: product.soLuongDaBan || 0,
  }));
};

const transformComboData = (combos: ComboResponse[]): SearchResult[] => {
  return combos.map((combo) => {
    const totalRetailPrice = combo.sanPhams.reduce(
      (sum, p) => sum + (p.donGia * (p.soLuong || 1)),
      0
    );
    const finalPrice = Math.round(combo.gia * (1 - (combo.khuyenMaiMax || 0) / 100));
    const savings = totalRetailPrice - finalPrice;
    const savingsPercentageComparedToRetail = Math.round(
      ((totalRetailPrice - combo.gia) / totalRetailPrice) * 100
    );

    return {
      id: combo.maCombo,
      name: combo.name,
      imageSrc: combo.hinhAnh ? `data:image/jpeg;base64,${combo.hinhAnh}` : null,
      price: finalPrice,
      originalPrice: totalRetailPrice,
      discountPercent: combo.khuyenMaiMax || 0,
      savings,
      savingsPercentageComparedToRetail,
      type: "combo" as const,
      productCount: combo.sanPhams.length,
    };
  });
};

const transformBlogData = (blogs: BlogResponse[]): SearchResult[] => {
  return blogs
    .filter((blog) => blog.isPublished)
    .map((blog) => ({
      id: blog.maBlog,
      name: blog.tieuDe,
      imageSrc: blog.hinhAnh ? `data:image/jpeg;base64,${blog.hinhAnh}` : null,
      price: null,
      discountPercent: 0,
      type: "blog" as const,
      slug: blog.slug,
    }));
};

const Search: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [combos, setCombos] = useState<ComboResponse[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, combosRes, blogsRes] = await Promise.all([
          axios.get<ProductResponse[]>(`${API_BASE_URL}/api/SanPham/ListSanPham`),
          axios.get<ComboResponse[]>(`${API_BASE_URL}/api/Combo/ComboSanPhamView`),
          axios.get<BlogResponse[]>(`${API_BASE_URL}/api/Blog`),
        ]);
        setProducts(productsRes.data);
        setCombos(combosRes.data);
        setBlogs(blogsRes.data);
      } catch (error: any) {
        setError("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isSearchOpen && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const productResults = transformProductData(
          products.filter((product) => product.name.toLowerCase().includes(query))
        );
        const comboResults = transformComboData(
          combos.filter((combo) => combo.name.toLowerCase().includes(query))
        );
        const blogResults = transformBlogData(
          blogs.filter(
            (blog) =>
              blog.tieuDe.toLowerCase().includes(query) ||
              blog.noiDung.toLowerCase().includes(query) ||
              (blog.tags && blog.tags.some((tag) => tag.toLowerCase().includes(query)))
          )
        );
        const allResults = [...productResults, ...comboResults, ...blogResults].slice(0, 5);
        setSearchResults(allResults);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearchOpen, products, combos, blogs]);

  return (
    <div className="relative" ref={searchRef}>
      <Button
        variant="ghost"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        aria-label={isSearchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
        className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-[5px]",
          isSearchOpen && "bg-accent text-accent-foreground"
        )}
      >
        <SearchIcon
          className={cn("h-5 w-5", isSearchOpen ? "text-crocus-600" : "text-gray-600")}
        />
        <span className="text-sm font-medium">TÌM KIẾM</span>
      </Button>

      {isSearchOpen && (
        <div className="absolute right-0 mt-2 w-[640px] bg-white shadow-lg rounded-lg z-50 border border-gray-100">
          <div className="p-4 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-gray-300 focus:ring-crocus-500"
              aria-label="Nhập từ khóa tìm kiếm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 text-center text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Đang tải dữ liệu...</div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-96 overflow-y-auto px-2 pb-2">
              {searchResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={
                    result.type === "blog" && result.slug
                      ? `/blogs/${result.slug}`
                      : `/${result.type}s/${result.id}`
                  }
                  aria-label={`Xem chi tiết ${result.type === "blog" ? "bài viết" : result.type === "product" ? "sản phẩm" : "combo"} ${result.name}`}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <Card className="m-2 hover:bg-gray-50 transition-colors rounded-md">
                    <CardContent className="flex items-center p-3 gap-3">
                      {result.imageSrc && (
                        <img
                          src={result.imageSrc}
                          alt={result.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-semibold text-gray-800 line-clamp-1">
                            {result.name}
                          </div>
                          <span className="text-xs text-gray-500 capitalize">
                            {result.type === "blog"
                              ? "Bài viết"
                              : result.type === "product"
                              ? "Sản phẩm"
                              : "Combo"}
                          </span>
                        </div>
                        {result.type !== "blog" && result.price && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-red-600">
                                {result.price.toLocaleString("vi-VN", {
                                  maximumFractionDigits: 0,
                                })} VND
                              </span>
                              {result.discountPercent > 0 && (
                                <span className="text-xs text-gray-500 line-through">
                                  {result.type === "product"
                                    ? (result.price / (1 - result.discountPercent / 100)).toLocaleString(
                                        "vi-VN",
                                        { maximumFractionDigits: 0 }
                                      )
                                    : result.originalPrice?.toLocaleString("vi-VN", {
                                        maximumFractionDigits: 0,
                                      })} VND
                                </span>
                              )}
                            </div>

                            {result.discountPercent > 0 && (
                              <div className="flex gap-2 items-center">
                                <Badge className="text-xs text-green-700 bg-green-50 px-2 py-0.5">
                                  Tiết kiệm{" "}
                                  {result.type === "product"
                                    ? Math.round(
                                        (result.price / (1 - result.discountPercent / 100)) *
                                          (result.discountPercent / 100)
                                      ).toLocaleString("vi-VN")
                                    : result.savings?.toLocaleString("vi-VN")} VND
                                </Badge>
                              </div>
                            )}
                            {result.type === "combo" && result.savingsPercentageComparedToRetail ? (
                              <Badge className="text-xs bg-blue-500 text-white px-2 py-0.5">
                                Đã giảm {result.savingsPercentageComparedToRetail}%
                              </Badge>
                            ) : null}
                            {result.type === "product" && (
                              <div className="flex gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 bg-blue-50 border-blue-200 text-blue-700"
                                >
                                  🏷️ {result.thuongHieu}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 bg-green-50 border-green-200 text-green-700"
                                >
                                  🧵 {result.chatLieu}
                                </Badge>
                              </div>
                            )}
                            {result.type === "combo" && result.productCount && (
                              <Badge className="text-xs bg-crocus-500 text-white px-2 py-0.5">
                                📦 {result.productCount} sản phẩm
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Không tìm thấy kết quả cho "{searchQuery}"
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Vui lòng nhập từ khóa để tìm kiếm
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;