
import React, { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import axios from "axios";
import { cn } from "@/lib/utils";

interface ProductResponse {
  id: string;
  name: string;
  hinh: string[];
  donGia: number;
}

interface ComboResponse {
  maCombo: number;
  name: string;
  hinhAnh: string;
  gia: number;
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
  type: "product" | "combo" | "blog";
  slug?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.43.163:5261";

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
        setBlogs(blogsRes.data.filter((blog) => blog.isPublished));
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
        const query = searchQuery.toLowerCase();
        const allResults: SearchResult[] = [
          ...products
            .filter((product) => product.name.toLowerCase().includes(query))
            .map((product) => ({
              id: product.id,
              name: product.name,
              imageSrc: product.hinh[0] ? `data:image/jpeg;base64,${product.hinh[0]}` : null,
              price: product.donGia,
              type: "product" as const,
            })),
          ...combos
            .filter((combo) => combo.name.toLowerCase().includes(query))
            .map((combo) => ({
              id: combo.maCombo,
              name: combo.name,
              imageSrc: combo.hinhAnh ? `data:image/jpeg;base64,${combo.hinhAnh}` : null,
              price: combo.gia,
              type: "combo" as const,
            })),
          ...blogs
            .filter(
              (blog) =>
                blog.tieuDe.toLowerCase().includes(query) ||
                blog.noiDung.toLowerCase().includes(query) ||
                (blog.tags && blog.tags.some((tag) => tag.toLowerCase().includes(query)))
            )
            .map((blog) => ({
              id: blog.maBlog,
              name: blog.tieuDe,
              imageSrc: blog.hinhAnh ? `data:image/jpeg;base64,${blog.hinhAnh}` : null,
              price: null,
              type: "blog" as const,
              slug: blog.slug,
            })),
        ];
        setSearchResults(allResults.slice(0, 5));
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
        aria-label="Mở/đóng tìm kiếm"
        className={cn(
          "flex items-center space-x-2 px-4 py-2",
          isSearchOpen && "bg-accent text-accent-foreground"
        )}
      >
        <SearchIcon
          className={cn("h-5 w-5", isSearchOpen ? "text-crocus-600" : "text-gray-600")}
        />
        <span>TÌM KIẾM</span>
      </Button>

      {isSearchOpen && (
        <div className="absolute right-0 mt-2 w-[640px] bg-white shadow-lg rounded-md z-50">
          <div className="p-2 flex items-center">
            <Input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              aria-label="Nhập từ khóa tìm kiếm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="ml-2"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {error && <div className="p-4 text-center text-red-500">{error}</div>}
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Đang tải...</div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={
                    result.type === "blog" && result.slug
                      ? `/blogs/${result.slug}`
                      : `/${result.type}s/${result.id}`
                  }
                  aria-label={`Xem chi tiết ${result.type} ${result.name}`}
                >
                  <Card className="m-2 hover:bg-gray-50 transition-colors">
                    <CardContent className="flex items-center p-2">
                      {result.imageSrc && (
                        <img
                          src={result.imageSrc}
                          alt={result.name}
                          className="w-12 h-12 object-cover rounded-md mr-2"
                        />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{result.name}</div>
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span className={result.price ? "text-red-600 font-bold" : ""}>
                            {result.type === "blog"
                              ? "Bài viết"
                              : result.price
                              ? `${result.price.toLocaleString("vi-VN", {
                                  maximumFractionDigits: 0,
                                })} VND`
                              : ""}
                          </span>
                          <span className="capitalize">
                            {result.type === "blog"
                              ? "Bài viết"
                              : result.type === "product"
                              ? "Sản phẩm"
                              : "Combo"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">Không tìm thấy kết quả</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Search;