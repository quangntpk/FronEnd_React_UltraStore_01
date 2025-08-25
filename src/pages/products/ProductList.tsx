import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Search, SlidersHorizontal, Star, Sparkles, TrendingUp, Package, Filter, Grid3X3, List, ArrowUpDown, X, Zap, Award, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";

// Interface cho dữ liệu người dùng
interface UserData {
  maNguoiDung?: string;
  hoTen?: string;
}

// Interface cho hashtag
interface HashTag {
  id: number;
  name: string;
}

// Interface cho sản phẩm
interface Product {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  price: number;
  category: string;
  thuongHieu: string;
  chatLieu: string;
  kichThuoc: string[];
  mauSac: string[];
  averageRating: number;
  commentCount: number;
  isFavorite: boolean;
  hot: boolean;
  likedId?: string;
  hashtags: HashTag[];
  gioiTinh: string;
  trangThai: number;
  khuyenMaiMax?: number;
}

interface ColorRange {
  name: string;
  displayName: string;
  ranges: Array<{
    minHex: string;
    maxHex: string;
  }>;
  previewColor: string;
  gradientColors: string[];
}

// Grid Loader FX Class với continuous animation
class GridLoaderFx {
  el: HTMLElement;
  items: NodeListOf<HTMLElement>;
  effects: any;
  animationId: number | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.items = this.el.querySelectorAll('.grid__item .loading-placeholder, .grid__item .product-card');
    this.effects = {
      'Shu': {
        lineDrawing: true,
        animeLineDrawingOpts: {
          duration: 800,
          delay: function (t: any, i: number) {
            return i * 150;
          },
          easing: 'easeInOutSine',
          strokeDashoffset: [this.setDashoffset, 0],
          opacity: [
            { value: [0, 1] },
            { value: [1, 0], duration: 200, easing: 'linear', delay: 500 }
          ]
        },
        animeOpts: {
          duration: 800,
          easing: [0.2, 1, 0.3, 1],
          delay: function (t: any, i: number) {
            return i * 150 + 800;
          },
          opacity: {
            value: [0, 1],
            easing: 'linear'
          },
          scale: [0.5, 1]
        }
      }
    };
  }

  setDashoffset(path: SVGPathElement) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length + ' ' + length;
    path.style.strokeDashoffset = String(length);
    return length;
  }

  // Continuous animation for loading state
  _renderContinuous(effect: string) {
    this._resetStyles();

    const runAnimation = () => {
      this._resetStyles();

      const effectSettings = this.effects[effect];

      if (effectSettings.lineDrawing) {
        Array.from(this.items).forEach((item) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const itemW = item.offsetWidth;
          const itemH = item.offsetHeight;

          svg.setAttribute('width', itemW + 'px');
          svg.setAttribute('height', itemH + 'px');
          svg.setAttribute('viewBox', '0 0 ' + itemW + ' ' + itemH);
          svg.setAttribute('class', 'grid__deco');
          path.setAttribute('d', 'M0,0 l' + itemW + ',0 0,' + itemH + ' -' + itemW + ',0 0,-' + itemH);
          path.setAttribute('stroke-dashoffset', String(this.setDashoffset(path)));
          svg.appendChild(path);
          item.parentNode?.appendChild(svg);
        });

        // Animate paths
        setTimeout(() => {
          const paths = this.el.querySelectorAll('.grid__deco > path');
          paths.forEach((path, i) => {
            const pathElement = path as SVGPathElement;
            setTimeout(() => {
              pathElement.style.strokeDashoffset = '0';
              pathElement.style.transition = 'stroke-dashoffset 0.8s ease-in-out';
              setTimeout(() => {
                pathElement.style.opacity = '0';
                pathElement.style.transition = 'opacity 0.2s linear';
              }, 500);
            }, i * 150);
          });
        }, 100);
      }

      // Animate placeholder items
      Array.from(this.items).forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.5)';
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
          item.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.2,1,0.3,1)';
        }, i * 150 + 800);
      });

      // Schedule next animation cycle
      this.animationId = setTimeout(() => {
        runAnimation();
      }, 2500); // Repeat every 2.5 seconds
    };

    runAnimation();
  }

  // Single animation for loaded products
  _render(effect: string) {
    this.stopContinuous();
    this._resetStyles();

    const effectSettings = this.effects[effect];

    if (effectSettings.lineDrawing) {
      Array.from(this.items).forEach((item) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const itemW = item.offsetWidth;
        const itemH = item.offsetHeight;

        svg.setAttribute('width', itemW + 'px');
        svg.setAttribute('height', itemH + 'px');
        svg.setAttribute('viewBox', '0 0 ' + itemW + ' ' + itemH);
        svg.setAttribute('class', 'grid__deco');
        path.setAttribute('d', 'M0,0 l' + itemW + ',0 0,' + itemH + ' -' + itemW + ',0 0,-' + itemH);
        path.setAttribute('stroke-dashoffset', String(this.setDashoffset(path)));
        svg.appendChild(path);
        item.parentNode?.appendChild(svg);
      });

      // Simulate anime.js functionality with CSS animations
      setTimeout(() => {
        const paths = this.el.querySelectorAll('.grid__deco > path');
        paths.forEach((path, i) => {
          const pathElement = path as SVGPathElement;
          setTimeout(() => {
            pathElement.style.strokeDashoffset = '0';
            pathElement.style.transition = 'stroke-dashoffset 0.8s ease-in-out';
            setTimeout(() => {
              pathElement.style.opacity = '0';
              pathElement.style.transition = 'opacity 0.2s linear';
            }, 500);
          }, i * 150);
        });
      }, 100);
    }

    // Apply main animation
    Array.from(this.items).forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'scale(0.5)';
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
        item.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.2,1,0.3,1)';
      }, i * 150 + 800);
    });
  }

  stopContinuous() {
    if (this.animationId) {
      clearTimeout(this.animationId);
      this.animationId = null;
    }
  }

  _resetStyles() {
    Array.from(this.items).forEach((item) => {
      const gItem = item.parentNode as HTMLElement;
      item.style.opacity = '0';
      item.style.transform = 'none';
      item.style.transition = '';

      const svg = gItem?.querySelector('svg.grid__deco');
      if (svg) {
        gItem.removeChild(svg);
      }
    });
  }
}

const COLOR_RANGES: ColorRange[] = [
  {
    name: "red",
    displayName: "Đỏ",
    ranges: [
      { minHex: "CC0000", maxHex: "FF3333" },
      { minHex: "FF0000", maxHex: "FF6666" },
      { minHex: "B22222", maxHex: "DC143C" }
    ],
    previewColor: "#FF0000",
    gradientColors: ["#8B0000", "#FF0000", "#FF6B6B"]
  },
  {
    name: "blue",
    displayName: "Xanh dương",
    ranges: [
      { minHex: "0000CC", maxHex: "3333FF" },
      { minHex: "0066CC", maxHex: "3399FF" },
      { minHex: "000080", maxHex: "4169E1" }
    ],
    previewColor: "#0066FF",
    gradientColors: ["#000080", "#0066FF", "#87CEEB"]
  },
  {
    name: "green",
    displayName: "Xanh lá",
    ranges: [
      { minHex: "00CC00", maxHex: "33FF33" },
      { minHex: "228B22", maxHex: "32CD32" },
      { minHex: "006400", maxHex: "90EE90" }
    ],
    previewColor: "#00CC00",
    gradientColors: ["#006400", "#00CC00", "#90EE90"]
  },
  {
    name: "yellow",
    displayName: "Vàng",
    ranges: [
      { minHex: "CCCC00", maxHex: "FFFF33" },
      { minHex: "FFD700", maxHex: "FFFF99" },
      { minHex: "FFA500", maxHex: "FFFF00" }
    ],
    previewColor: "#FFFF00",
    gradientColors: ["#B8860B", "#FFD700", "#FFFFE0"]
  },
  {
    name: "purple",
    displayName: "Tím",
    ranges: [
      { minHex: "6600CC", maxHex: "9933FF" },
      { minHex: "800080", maxHex: "DA70D6" },
      { minHex: "4B0082", maxHex: "9370DB" }
    ],
    previewColor: "#8000FF",
    gradientColors: ["#4B0082", "#8000FF", "#DDA0DD"]
  },
  {
    name: "orange",
    displayName: "Cam",
    ranges: [
      { minHex: "FF6600", maxHex: "FF9933" },
      { minHex: "FF4500", maxHex: "FFA500" },
      { minHex: "CC3300", maxHex: "FF7F50" }
    ],
    previewColor: "#FF6600",
    gradientColors: ["#CC3300", "#FF6600", "#FFB07A"]
  },
  {
    name: "pink",
    displayName: "Hồng",
    ranges: [
      { minHex: "FF66CC", maxHex: "FF99DD" },
      { minHex: "FF1493", maxHex: "FFB6C1" },
      { minHex: "FF69B4", maxHex: "FFC0CB" }
    ],
    previewColor: "#FF69B4",
    gradientColors: ["#C91E6A", "#FF69B4", "#FFB6C1"]
  },
  {
    name: "brown",
    displayName: "Nâu",
    ranges: [
      { minHex: "8B4513", maxHex: "D2691E" },
      { minHex: "A0522D", maxHex: "CD853F" },
      { minHex: "654321", maxHex: "DEB887" }
    ],
    previewColor: "#8B4513",
    gradientColors: ["#654321", "#8B4513", "#D2B48C"]
  },
  {
    name: "gray",
    displayName: "Xám",
    ranges: [
      { minHex: "666666", maxHex: "CCCCCC" },
      { minHex: "808080", maxHex: "D3D3D3" },
      { minHex: "2F2F2F", maxHex: "A9A9A9" }
    ],
    previewColor: "#808080",
    gradientColors: ["#2F2F2F", "#808080", "#D3D3D3"]
  },
  {
    name: "black",
    displayName: "Đen",
    ranges: [
      { minHex: "000000", maxHex: "333333" },
      { minHex: "000000", maxHex: "2F2F2F" }
    ],
    previewColor: "#000000",
    gradientColors: ["#000000", "#2F2F2F", "#696969"]
  },
  {
    name: "white",
    displayName: "Trắng",
    ranges: [
      { minHex: "CCCCCC", maxHex: "FFFFFF" },
      { minHex: "F0F0F0", maxHex: "FFFFFF" }
    ],
    previewColor: "#FFFFFF",
    gradientColors: ["#E5E5E5", "#F8F8F8", "#FFFFFF"]
  }
];

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleanHex = hex.replace('#', '').toUpperCase();
  if (cleanHex.length !== 6) return null;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
};

const isColorInRange = (color: string, minHex: string, maxHex: string): boolean => {
  const colorRgb = hexToRgb(color);
  const minRgb = hexToRgb(minHex);
  const maxRgb = hexToRgb(maxHex);

  if (!colorRgb || !minRgb || !maxRgb) return false;

  return (
    colorRgb.r >= minRgb.r && colorRgb.r <= maxRgb.r &&
    colorRgb.g >= minRgb.g && colorRgb.g <= maxRgb.g &&
    colorRgb.b >= minRgb.b && colorRgb.b <= maxRgb.b
  );
};

const getColorCategory = (color: string): string | null => {
  const cleanColor = color.replace('#', '').toUpperCase();

  for (const colorRange of COLOR_RANGES) {
    for (const range of colorRange.ranges) {
      if (isColorInRange(cleanColor, range.minHex, range.maxHex)) {
        return colorRange.name;
      }
    }
  }

  return null;
};

const ColorRangeFilter = ({
  selectedColorRanges,
  onColorRangeChange
}: {
  selectedColorRanges: string[];
  onColorRangeChange: (colorRange: string) => void;
}) => {
  return (
    <div>
      <Label className="text-lg font-medium mb-4 block text-white">Phổ Màu</Label>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {COLOR_RANGES.map((colorRange) => (
          <div key={colorRange.name} className="flex items-center space-x-2">
            <Checkbox
              id={`color-range-${colorRange.name}`}
              checked={selectedColorRanges.includes(colorRange.name)}
              onCheckedChange={() => onColorRangeChange(colorRange.name)}
              aria-label={`Chọn phổ màu ${colorRange.displayName}`}
              className="flex-shrink-0"
            />

            <div
              className="w-12 h-5 rounded-md border border-gray-600 shadow-sm flex-shrink-0"
              style={{
                background: `linear-gradient(to right, ${colorRange.gradientColors[0]} 0%, ${colorRange.gradientColors[1]} 50%, ${colorRange.gradientColors[2]} 100%)`,
                ...(colorRange.name === 'white' && {
                  border: '2px solid #6b7280'
                })
              }}
              title={`Phổ màu ${colorRange.displayName}`}
            />

            <label
              htmlFor={`color-range-${colorRange.name}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate text-white"
            >
              {colorRange.displayName}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const showNotification = (message: string, type: "success" | "error" | "warning") => {
  return Swal.fire({
    title: type === "error" ? "Lỗi!" : type === "warning" ? "Cảnh báo!" : "Thành công!",
    text: message,
    icon: type,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

const ProductListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const gridRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<GridLoaderFx | null>(null);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColorRanges, setSelectedColorRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; // 8 products per page

  // Start continuous animation when loading
  useEffect(() => {
    if (isLoading && gridRef.current && viewMode === 'grid') {
      setTimeout(() => {
        if (gridRef.current && isLoading) {
          loaderRef.current = new GridLoaderFx(gridRef.current);
          loaderRef.current._renderContinuous('Shu');
        }
      }, 300);
    }
  }, [isLoading, viewMode]);

  // Single animation when products are loaded
  useEffect(() => {
    if (!isLoading && filteredProducts.length > 0 && gridRef.current && viewMode === 'grid') {
      setTimeout(() => {
        if (gridRef.current) {
          if (loaderRef.current) {
            loaderRef.current.stopContinuous();
          }
          loaderRef.current = new GridLoaderFx(gridRef.current);
          loaderRef.current._render('Shu');
        }
      }, 300);
    }
  }, [isLoading, filteredProducts, viewMode, currentPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loaderRef.current) {
        loaderRef.current.stopContinuous();
      }
    };
  }, []);

  // Loading placeholder positions for 7 items (old layout)
  const getLoadingPosition = (index: number) => {
    const positions = [
      // Item 1 - Top left
      { left: '0%', top: '200px' },
      // Item 2 - Top center
      { left: '25%', top: '100px' },
      // Item 3 - Middle center right
      { left: '50%', top: '350px' }, // Điều chỉnh vị trí
      // Item 4 - Top right
      { left: '75%', top: '200px' },
      // Item 5 - Bottom center left
      { left: '25%', top: '750px' }, // Tăng từ 600px
      // Item 6 - Bottom left
      { left: '0%', top: '850px' }, // Tăng từ 700px
      // Item 7 - Bottom right
      { left: '75%', top: '850px' } // Tăng từ 700px
    ];
    return positions[index] || positions[0];
  };
  // Product layout positions for 8 items (2 rows x 4 columns)
  const getProductPosition = (index: number) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    return {
      left: `${col * 25}%`,
      top: `${row * 650 + 100}px`
    };
  };

  // Add CSS styles for both loading and product layouts
  // Cập nhật CSS styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
    .grid__deco {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 10;
    }

    .grid__deco path {
      fill: none;
      stroke: #e6629a;
      stroke-width: 2px;
    }

    .grid__item {
      position: relative;
      break-inside: avoid;
    }

    .loading-grid {
      position: relative;
      width: 100%;
      height: 1300px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .product-grid {
      position: relative;
      width: 100%;
      height: 1500px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .enhanced-card {
      width: 300px !important;
      height: 600px !important;
      display: flex;
      flex-direction: column;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .enhanced-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(168, 85, 247, 0.3);
    }

    .loading-placeholder {
      width: 300px !important;
      height: 600px !important;
      background: linear-gradient(135deg, #ffffffff 0%, #ebc9f8ff 50%, #f6b0ffff 100%);
      border-radius: 12px;
      border: 1px solid #ffffff;
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: scale(0.5);
    }

    .loading-placeholder::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .enhanced-card .card-image {
      height: 250px;
      overflow: hidden;
      position: relative;
      border-radius: 12px 12px 0 0;
    }

    .enhanced-card .card-content {
      height: 350px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* Hover overlay effect */
    .card-hover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(139, 92, 246, 0.15);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 20;
      border-radius: 0 0 12px 12px;
    }

    .enhanced-card:hover .card-hover-overlay {
      opacity: 1;
      visibility: visible;
    }

    .hover-detail-button {
      background: rgba(139, 92, 246, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      transform: scale(0.8);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
    }

    .enhanced-card:hover .hover-detail-button {
      transform: scale(1);
    }

    .hover-detail-button:hover {
      background: rgba(139, 92, 246, 1);
      transform: scale(1.05);
      box-shadow: 0 12px 30px rgba(139, 92, 246, 0.6);
    }

    /* Compact content layout */
    .card-content-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rating-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .product-title {
      font-size: 16px;
      font-weight: 700;
      color: white;
      line-height: 1.3;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 40px;
    }

    .price-section {
      margin-bottom: 10px;
    }

    .brand-material-row {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .colors-sizes-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .colors-display {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
    }

    .sizes-display {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      justify-content: flex-end;
    }

    .hashtags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }

    .category-gender-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .compact-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      white-space: nowrap;
    }

    .color-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #4b5563;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .color-dot:hover {
      transform: scale(1.2);
    }

    .color-counter {
      background: #4b5563;
      color: white;
      font-size: 8px;
      font-weight: bold;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .size-badge {
      background: transparent;
      border: 1px solid #4b5563;
      color: black;
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 3px;
    }

    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .loading-grid, .product-grid {
        height: auto;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        padding: 20px;
      }
      
      .loading-grid .grid__item, .product-grid .grid__item {
        position: static !important;
        width: 100% !important;
        max-width: 300px;
        height: 600px !important;
        left: auto !important;
        top: auto !important;
        justify-self: center;
      }
    }

    @media (max-width: 768px) {
      .loading-grid, .product-grid {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 16px;
      }
      
      .enhanced-card, .loading-placeholder {
        width: 100% !important;
        max-width: 350px;
        height: 550px !important;
        margin: 0 auto;
      }

      .enhanced-card .card-image {
        height: 220px;
      }

      .enhanced-card .card-content {
        height: 330px;
        padding: 14px;
      }
    }

    .product-card {
      display: block;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scale(0.5);
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productResponse = await fetch("https://bicacuatho.azurewebsites.net/api/SanPham/ListSanPham", {
          headers: { Accept: "application/json" },
        });

        if (!productResponse.ok) {
          throw new Error(`Lỗi ${productResponse.status}: Không thể tải danh sách sản phẩm`);
        }

        const productData = await productResponse.json();
        const commentResponse = await fetch("https://bicacuatho.azurewebsites.net/api/Comment/list");
        if (!commentResponse.ok) throw new Error("Không thể tải bình luận");
        const commentData = await commentResponse.json();

        let userData: UserData = {};
        try {
          const user = localStorage.getItem("user");
          userData = user ? JSON.parse(user) : {};
        } catch (error) {
          console.error("Lỗi parse user data:", error);
        }
        const currentUserId = userData?.maNguoiDung;
        let yeuThichData: any[] = [];
        if (currentUserId) {
          const yeuThichResponse = await fetch("https://bicacuatho.azurewebsites.net/api/YeuThich", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
          });
          if (yeuThichResponse.ok) {
            yeuThichData = await yeuThichResponse.json();
          }
        }

        const mappedProducts: Product[] = productData.map((product: {
          id: string;
          name: string;
          moTa?: string;
          hinh: string[];
          donGia: number;
          loaiSanPham?: string;
          thuongHieu?: string;
          chatLieu?: string;
          kichThuoc: string[];
          mauSac: string[];
          hot?: boolean;
          listHashTag: HashTag[];
          gioiTinh?: string;
          trangThai?: number;
          khuyenMaiMax?: number;
        }) => {
          const baseProductId = product.id.split("_")[0] || product.id;
          const productComments = commentData.filter(
            (comment: any) => comment.maSanPham === baseProductId && comment.trangThai === 1
          );
          const totalRating = productComments.reduce(
            (sum: number, comment: any) => sum + (comment.danhGia || 0),
            0
          );
          const averageRating = productComments.length > 0 ? totalRating / productComments.length : 0;
          const userFavorite = yeuThichData.find(
            (yeuThich: any) => yeuThich.maSanPham === baseProductId && yeuThich.maNguoiDung === currentUserId
          );

          return {
            id: product.id,
            name: product.name,
            description: product.moTa || `Thương hiệu: ${product.thuongHieu || "Không xác định"} <br/> Chất liệu: ${product.chatLieu || "Không xác định"}`,
            imageSrc: product.hinh[0] ? `data:image/jpeg;base64,${product.hinh[0]}` : "https://via.placeholder.com/300",
            price: product.donGia,
            category: product.loaiSanPham || "Không xác định",
            thuongHieu: product.thuongHieu || "Không xác định",
            chatLieu: product.chatLieu || "Không xác định",
            kichThuoc: product.kichThuoc || [],
            mauSac: product.mauSac || [],
            averageRating,
            commentCount: productComments.length,
            isFavorite: !!userFavorite,
            hot: product.hot || false,
            likedId: userFavorite?.maYeuThich,
            hashtags: product.listHashTag || [],
            gioiTinh: product.gioiTinh || "Không xác định",
            trangThai: product.trangThai || 0,
            khuyenMaiMax: product.khuyenMaiMax || 0,
          };
        });

        setOriginalProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
        setPriceRange([
          Math.floor(Math.min(...mappedProducts.map((p) => p.price))),
          Math.ceil(Math.max(...mappedProducts.map((p) => p.price))),
        ]);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
        console.error("Lỗi khi lấy sản phẩm:", errorMessage);
        setError("Không thể tải sản phẩm. Vui lòng kiểm tra kết nối và thử lại.");
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    if (categoryParam && !selectedCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    } else if (!categoryParam && selectedCategories.length > 0) {
      setSelectedCategories([]);
    }
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  const uniqueBrands = useMemo(
    () => [...new Set(originalProducts.map((product) => product.thuongHieu))].sort(),
    [originalProducts]
  );

  const uniqueCategories = useMemo(
    () => [...new Set(originalProducts.map((product) => product.category))].sort(),
    [originalProducts]
  );

  const uniqueGenders = useMemo(
    () => [...new Set(originalProducts.map((product) => product.gioiTinh))].sort(),
    [originalProducts]
  );

  const minPrice = useMemo(
    () => Math.floor(Math.min(...originalProducts.map((p) => p.price)) || 0),
    [originalProducts]
  );

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...originalProducts.map((p) => p.price)) || Infinity),
    [originalProducts]
  );

  useEffect(() => {
    let result = [...originalProducts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    if (selectedColorRanges.length > 0) {
      result = result.filter((product) =>
        product.mauSac.some((color) => {
          const colorCategory = getColorCategory(color);
          return colorCategory && selectedColorRanges.includes(colorCategory);
        })
      );
    }

    if (selectedBrands.length > 0) {
      result = result.filter((product) => selectedBrands.includes(product.thuongHieu));
    }

    if (selectedCategories.length > 0) {
      result = result.filter((product) => selectedCategories.includes(product.category));
    }

    if (selectedGenders.length > 0) {
      result = result.filter((product) => selectedGenders.includes(product.gioiTinh));
    }

    result = result.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "rating_desc":
          return b.averageRating - a.averageRating;
        default:
          return 0;
      }
    });

    setFilteredProducts(result);
  }, [
    originalProducts,
    searchQuery,
    selectedColorRanges,
    selectedBrands,
    selectedCategories,
    selectedGenders,
    priceRange,
    sortBy,
  ]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleColorRangeChange = (colorRange: string) => {
    setSelectedColorRanges((prev) =>
      prev.includes(colorRange) ? prev.filter((c) => c !== colorRange) : [...prev, colorRange]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleGenderChange = (gender: string) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedColorRanges([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedGenders([]);
    setPriceRange([minPrice, maxPrice]);
    setSortBy("name_asc");
    setShowFilters(false);
    toast({
      title: "Đã xóa bộ lọc",
      description: "Tất cả bộ lọc đã được đặt lại về mặc định.",
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    toast({
      title: "Đã áp dụng bộ lọc",
      description: "Bộ lọc sản phẩm của bạn đã được áp dụng.",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tìm kiếm",
      description: `Đã tìm kiếm: ${searchQuery}`,
    });
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const product = originalProducts.find(p => p.id === productId);
      let userData: UserData = {};
      try {
        const user = localStorage.getItem("user");
        userData = user ? JSON.parse(user) : {};
      } catch (error) {
        console.error("Lỗi parse user data:", error);
      }
      const userId = userData?.maNguoiDung;
      const hoTen = userData?.hoTen;

      if (!userId) {
        showNotification("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!", "warning").then(() => {
          navigate("/auth/login");
        });
        return;
      }

      if (product?.isFavorite) {
        const response = await fetch(`https://bicacuatho.azurewebsites.net/api/YeuThich/${product.likedId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Không thể xóa sản phẩm khỏi danh sách yêu thích");
        setOriginalProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: false, likedId: undefined } : p)
        );
        setFilteredProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: false, likedId: undefined } : p)
        );
        showNotification("Đã xóa sản phẩm khỏi danh sách yêu thích!", "success");
      } else {
        const yeuThichData = {
          maSanPham: productId.split("_")[0] || productId,
          tenSanPham: product?.name,
          maNguoiDung: userId,
          hoTen: hoTen,
          soLuongYeuThich: 1,
          ngayYeuThich: new Date().toISOString(),
        };
        const response = await fetch("https://bicacuatho.azurewebsites.net/api/YeuThich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(yeuThichData),
        });
        if (!response.ok) throw new Error("Không thể thêm sản phẩm vào danh sách yêu thích");
        const addedFavorite = await response.json();
        setOriginalProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p)
        );
        setFilteredProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, isFavorite: true, likedId: addedFavorite.maYeuThich } : p)
        );
        showNotification("Đã thêm sản phẩm vào danh sách yêu thích!", "success");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích!", "error");
    }
  };

  const activeFiltersCount = [
    searchQuery,
    selectedColorRanges.length > 0 ? "colors" : null,
    selectedBrands.length > 0 ? "brands" : null,
    selectedCategories.length > 0 ? "categories" : null,
    selectedGenders.length > 0 ? "genders" : null,
    priceRange[0] > minPrice || priceRange[1] < maxPrice ? "price" : null
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white text-white">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="h-12 px-6 rounded-full border-2 border-gray-600 text-black hover:border-purple-500 hover:text-purple-400 hover:bg-purple-900/30 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc nâng cao
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-red-500 animate-pulse">{activeFiltersCount}</Badge>
              )}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-60 h-12 rounded-full border-2 border-gray-600 bg-white text-black shadow-md">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-600">
                <SelectItem value="name_asc" className="text-black hover:bg-gray-700">Tên: A đến Z</SelectItem>
                <SelectItem value="name_desc" className="text-black hover:bg-gray-700">Tên: Z đến A</SelectItem>
                <SelectItem value="price_asc" className="text-black hover:bg-gray-700">Giá: Thấp đến Cao</SelectItem>
                <SelectItem value="price_desc" className="text-black hover:bg-gray-700">Giá: Cao đến Thấp</SelectItem>
                <SelectItem value="rating_desc" className="text-black hover:bg-gray-700">Đánh giá cao nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFilters(false)}>
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden m-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-8 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white">
                <h2 className="text-3xl font-bold flex items-center">
                  <SlidersHorizontal className="h-8 w-8 mr-3" />
                  Bộ Lọc Thông Minh
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                  className="text-white hover:bg-white/20 rounded-full w-12 h-12"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-white flex items-center">
                      <Package className="h-6 w-6 mr-3 text-purple-400" />
                      Danh Mục Sản Phẩm
                    </Label>
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="space-y-4">
                        {uniqueCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-700 transition-colors">
                            <Checkbox
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() => handleCategoryChange(category)}
                              className="rounded-md w-5 h-5"
                            />
                            <label
                              htmlFor={`category-${category}`}
                              className="text-sm font-medium cursor-pointer flex-1 text-white"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-white flex items-center">
                      <Award className="h-6 w-6 mr-3 text-blue-400" />
                      Thương Hiệu
                    </Label>
                    <div className="bg-gray-800 rounded-2xl p-6 max-h-80 overflow-y-auto border border-gray-700">
                      <div className="space-y-4">
                        {uniqueBrands.map((brand) => (
                          <div key={brand} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-700 transition-colors">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={selectedBrands.includes(brand)}
                              onCheckedChange={() => handleBrandChange(brand)}
                              className="rounded-md w-5 h-5"
                            />
                            <label
                              htmlFor={`brand-${brand}`}
                              className="text-sm font-medium cursor-pointer flex-1 text-white"
                            >
                              {brand}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <ColorRangeFilter
                        selectedColorRanges={selectedColorRanges}
                        onColorRangeChange={handleColorRangeChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-white flex items-center">
                      <Users className="h-6 w-6 mr-3 text-pink-400" />
                      Giới Tính
                    </Label>
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="space-y-4">
                        {uniqueGenders.map((gender) => (
                          <div key={gender} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-700 transition-colors">
                            <Checkbox
                              id={`gender-${gender}`}
                              checked={selectedGenders.includes(gender)}
                              onCheckedChange={() => handleGenderChange(gender)}
                              className="rounded-md w-5 h-5"
                            />
                            <label
                              htmlFor={`gender-${gender}`}
                              className="text-sm font-medium cursor-pointer flex-1 text-white"
                            >
                              {gender}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-xl font-bold text-white">Khoảng Giá</Label>
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <Select
                        onValueChange={(value) => {
                          switch (value) {
                            case "all":
                              setPriceRange([minPrice, maxPrice]);
                              break;
                            case "under-100000":
                              setPriceRange([0, 100000]);
                              break;
                            case "100000-200000":
                              setPriceRange([100000, 200000]);
                              break;
                            case "200000-500000":
                              setPriceRange([200000, 500000]);
                              break;
                            case "over-500000":
                              setPriceRange([500000, maxPrice]);
                              break;
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-2 border-gray-600 bg-gray-700 text-white">
                          <SelectValue placeholder="Chọn khoảng giá" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all" className="text-white hover:bg-gray-700">Tất cả giá</SelectItem>
                          <SelectItem value="under-100000" className="text-white hover:bg-gray-700">Dưới 100,000 VND</SelectItem>
                          <SelectItem value="100000-200000" className="text-white hover:bg-gray-700">100,000 - 200,000 VND</SelectItem>
                          <SelectItem value="200000-500000" className="text-white hover:bg-gray-700">200,000 - 500,000 VND</SelectItem>
                          <SelectItem value="over-500000" className="text-white hover:bg-gray-700">Trên 500,000 VND</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-8 bg-gray-800 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="px-8 h-12 rounded-xl border-2 border-gray-600 text-white hover:bg-red-900/30 hover:border-red-400 hover:text-red-400"
                >
                  Xóa Tất Cả Bộ Lọc
                </Button>
                <Button
                  onClick={applyFilters}
                  className="px-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Áp Dụng Bộ Lọc
                </Button>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="py-20 text-center">
            <div className="max-w-md mx-auto bg-gray-800 rounded-3xl shadow-xl p-12 border border-gray-700">
              <div className="text-8xl mb-6">😔</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Oops! Có lỗi xảy ra</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="rounded-full px-8">
                Thử lại
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-8">
            {/* Loading placeholders with 7 items in old layout */}
            <div
              ref={gridRef}
              className={viewMode === 'grid' ?
                "loading-grid" :
                "space-y-6"
              }
            >
              {Array.from({ length: 7 }).map((_, index) => {
                const position = getLoadingPosition(index);
                return (
                  <div
                    key={`loading-${index}`}
                    className="grid__item"
                    style={viewMode === 'grid' ? {
                      position: 'absolute',
                      left: position.left,
                      top: position.top,
                      width: '300px',
                      height: '400px'
                    } : {}}
                  >
                    <div className="loading-placeholder">
                      <div className="placeholder-content">
                        <div className="placeholder-image"></div>
                        <div className="space-y-3">
                          <div className="placeholder-text"></div>
                          <div className="placeholder-text short"></div>
                          <div className="placeholder-text medium"></div>
                          <div className="placeholder-text short"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="max-w-lg mx-auto bg-gray-800 rounded-3xl shadow-xl p-12 border border-gray-700">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-300 mb-8">Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc để tìm được sản phẩm phù hợp</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={clearFilters} className="rounded-full px-8">
                  Xóa Tất Cả Bộ Lọc
                </Button>
                <Button variant="outline" className="rounded-full px-8 border-gray-600 text-white hover:bg-gray-700">
                  Xem sản phẩm hot
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between bg-gray-700 rounded-2xl shadow-lg p-6 border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-400" />
                  <span className="text-lg font-semibold text-white">
                    Hiển thị <span className="text-purple-400 font-bold">{filteredProducts.length}</span> sản phẩm
                  </span>
                </div>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-purple-900 text-purple-300 hover:bg-purple-900">
                    {activeFiltersCount} bộ lọc đang áp dụng
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-purple-400"
                >
                  Chia sẻ kết quả
                </Button>
              </div>
            </div>

            {/* Products display with 8 items in 2 rows x 4 columns */}
            <div
              style={{ height: viewMode === 'grid' ? Math.ceil(currentProducts.length / 4) * 650 : 'auto' }}
              ref={gridRef}
              className={viewMode === 'grid' ?
                "product-grid" :
                "space-y-6"
              }
            >
              {currentProducts.map((product, index) => {
                const position = getProductPosition(index);
                return (
                  <div
                    key={product.id}
                    className="grid__item"
                    style={viewMode === 'grid' ? {
                      position: 'absolute',
                      left: position.left,
                      top: position.top,
                      width: '300px',
                      height: '500px'
                    } : {}}
                  >
                    <Card className={`product-card enhanced-card overflow-hidden group border border-gray-700 shadow-lg bg-white ${viewMode === 'list' ? 'flex flex-col md:flex-row h-auto min-h-[300px]' : ''
                      }`}>
                      {/* Image Section */}
                      <div className={`card-image relative ${viewMode === 'list' ? 'md:w-1/3 h-56 md:h-auto' : ''}`}>
                        <Link to={`/products/${product.id}`} className="block h-full">
                          <img
                            src={product.imageSrc}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                        </Link>

                        {/* Badges and Favorite Button */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.khuyenMaiMax && product.khuyenMaiMax > 0 && (
                            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white px-2 py-1 rounded-lg shadow-lg">
                              <div className="text-xs font-bold text-center">
                                -{product.khuyenMaiMax}%
                              </div>
                            </div>
                          )}
                          {product.hot && product.trangThai === 1 && (
                            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-2 py-1 rounded-full animate-pulse shadow-lg text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Hot
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(product.id);
                          }}
                        >
                          <Heart
                            className={`h-3 w-3 transition-all duration-300 ${product.isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-gray-600"
                              }`}
                          />
                        </Button>
                      </div>

                      {/* Content Section */}
                      <div className={`card-content relative ${viewMode === 'list' ? 'md:w-2/3 p-4 flex-1' : ''}`}>
                        <div className="card-content-main">
                          {/* Rating and Top Badge */}
                          <div className="rating-section">
                            <div className="flex items-center gap-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < Math.floor(product.averageRating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-600"
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 ml-1">
                                ({product.commentCount})
                              </span>
                            </div>
                            {product.averageRating >= 4.5 && (
                              <Badge className="bg-yellow-900 text-yellow-300 text-xs px-1 py-0">
                                <Award className="h-3 w-3 mr-1" />
                                Top
                              </Badge>
                            )}
                          </div>

                          {/* Product Name */}
                          <Link to={`/products/${product.id}`} style={{height: '3.5rem', overflow: 'hidden'}}>
                            <h3 className="product-title hover:text-purple-400 transition-colors font-bold mb-2" style={{color: '#333', fontSize: '1.5rem'}}>
                              {product.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="price-section">
                            {product.khuyenMaiMax && product.khuyenMaiMax > 0 ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl line-through text-gray-500">
                                  {product.price.toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-2xl font-bold text-red-400">
                                  {(product.price * (1 - product.khuyenMaiMax / 100)).toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            ) : (
                              <span className="text-2xl font-bold text-red-400">
                                {product.price.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>

                          {/* Brand and Material */}
                          <div className="brand-material-row">
                            <Badge className="compact-badge bg-green-400 text-black border-green-400">
                              {product.thuongHieu}
                            </Badge>
                            <Badge className="compact-badge bg-purple-400 text-black-300 border-purple-400">
                              {product.chatLieu}
                            </Badge>
                          </div>

                          {/* Colors and Sizes Row */}
                          <div className="colors-sizes-row">
                            <div className="colors-display">
                              <span className="text-xs text-gray-400 mr-2">Màu:</span>
                              {product.mauSac.slice(0, 3).map((color) => (
                                <div
                                  key={color}
                                  className="color-dot"
                                  style={{ backgroundColor: `#${color}` }}
                                  title={`Màu #${color}`}
                                />
                              ))}
                              {product.mauSac.length > 3 && (
                                <div className="color-counter">
                                  +{product.mauSac.length - 3}
                                </div>
                              )}
                            </div>
                            <div className="sizes-display">
                              <span className="text-xs text-gray-400 mr-2">Size:</span>
                              {product.kichThuoc.slice(0, 2).map((size) => (
                                <span key={size} className="size-badge">
                                  {size}
                                </span>
                              ))}
                              {product.kichThuoc.length > 2 && (
                                <span className="size-badge">
                                  +{product.kichThuoc.length - 2}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hashtags */}
                          <div className="hashtags-row">
                            {product.hashtags.slice(0, 3).map((hashtag) => (
                              <Badge
                                key={hashtag.id}
                                className="compact-badge bg-blue-400 text-black border-blue-400"
                              >
                                #{hashtag.name}
                              </Badge>
                            ))}
                            {product.hashtags.length > 3 && (
                              <Badge className="compact-badge bg-gray-600 text-white border-gray-600">
                                +{product.hashtags.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Category and Gender */}
                          <div className="category-gender-row">
                            <Badge className="compact-badge bg-indigo-400 text-black border-indigo-400">
                              {product.category}
                            </Badge>
                            <Badge className="compact-badge bg-pink-400 text-black border-pink-400">
                              {product.gioiTinh}
                            </Badge>
                          </div>
                        </div>

                        {/* Hover Overlay with Detail Button */}
                        <div className="card-hover-overlay">
                          <Link to={`/products/${product.id}`} className="hover-detail-button">
                            <Search className="h-4 w-4 mr-2 inline" />
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-16 flex justify-center gap-4">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  variant="outline"
                  className="rounded-full border-gray-600 text-black hover:bg-gray-700 px-6 py-2"
                >
                  Trước
                </Button>
                <span className="flex items-center text-gray-300 bg-gray-800 px-6 py-2 rounded-full">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  variant="outline"
                  className="rounded-full border-gray-600 text-black hover:bg-gray-700 px-6 py-2"
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}

        {filteredProducts.length > 0 && (
          <div className="mt-24 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 rounded-3xl p-12 shadow-xl border border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Thống Kê Sản Phẩm</h2>
              <p className="text-gray-300">Khám phá những con số thú vị về bộ sưu tập của chúng tôi</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900 rounded-full mb-4">
                  <Package className="h-8 w-8 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-2">{filteredProducts.length}</div>
                <div className="text-gray-300 font-medium">Sản phẩm hiện có</div>
              </div>
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-900 rounded-full mb-4">
                  <Star className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="text-3xl font-bold text-indigo-400 mb-2">
                  {filteredProducts.length > 0 ?
                    Math.round(filteredProducts.reduce((sum, product) => sum + product.averageRating, 0) / filteredProducts.length * 10) / 10 : 0}
                </div>
                <div className="text-gray-300 font-medium">Đánh giá trung bình</div>
              </div>
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900 rounded-full mb-4">
                  <Award className="h-8 w-8 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {uniqueBrands.length}
                </div>
                <div className="text-gray-300 font-medium">Thương hiệu</div>
              </div>
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-900 rounded-full mb-4">
                  <TrendingUp className="h-8 w-8 text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {filteredProducts.filter(p => p.hot).length}
                </div>
                <div className="text-gray-300 font-medium">Sản phẩm hot</div>
              </div>
            </div>

            {/* Additional Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-900 rounded-full mb-4">
                  <Users className="h-8 w-8 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-cyan-400 mb-2">
                  {uniqueCategories.length}
                </div>
                <div className="text-gray-300 font-medium">Danh mục</div>
              </div>
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-yellow-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-900 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {filteredProducts.filter(p => p.khuyenMaiMax && p.khuyenMaiMax > 0).length}
                </div>
                <div className="text-gray-300 font-medium">Đang khuyến mãi</div>
              </div>
              <div className="text-center bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-rose-500/20 transition-shadow border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-900 rounded-full mb-4">
                  <Heart className="h-8 w-8 text-rose-400" />
                </div>
                <div className="text-3xl font-bold text-rose-400 mb-2">
                  {filteredProducts.filter(p => p.isFavorite).length}
                </div>
                <div className="text-gray-300 font-medium">Yêu thích</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListing;