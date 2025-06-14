
import { useState } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  selectedSize: string;
  setSelectedSize: (value: string) => void;
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  uniqueColors: string[];
  uniqueSizes: string[];
  minPrice: number;
  maxPrice: number;
  resetFilters: () => void;
  applyFilters: () => void;
}

export const ProductFilters = ({
  searchTerm,
  setSearchTerm,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  selectedBrand,
  setSelectedBrand,
  selectedType,
  setSelectedType,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  uniqueColors,
  uniqueSizes,
  minPrice,
  maxPrice,
  resetFilters,
  applyFilters
}: ProductFiltersProps) => {
  const [open, setOpen] = useState(false);
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  
  // Ensure these arrays always exist, even if empty
  const brands = ["Crocus", "Summer Breeze", "Winter Luxe", "Urban Style", "Eco Fashion"];
  const types = ["Dress", "Top", "Bottom", "Outerwear", "Accessory", "Footwear"];
  
  // Ensure uniqueColors and uniqueSizes are always arrays
  const safeUniqueColors = Array.isArray(uniqueColors) ? uniqueColors : [];
  const safeUniqueSizes = Array.isArray(uniqueSizes) ? uniqueSizes : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </div>

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="price_asc">Price (Low to High)</SelectItem>
              <SelectItem value="price_desc">Price (High to Low)</SelectItem>
              <SelectItem value="rating_desc">Top Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filter button for mobile */}
        <Button 
          variant="outline" 
          className="md:hidden flex items-center gap-2"
          onClick={() => setOpen(!open)}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Desktop filters */}
      <div className="hidden md:flex flex-wrap gap-4">
        {/* Brand filter */}
        <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Brand
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search brand..." />
              <CommandEmpty>No brand found.</CommandEmpty>
              <CommandGroup>
                {brands.map((brand) => (
                  <CommandItem
                    key={brand}
                    value={brand}
                    onSelect={() => {
                      setSelectedBrand(selectedBrand === brand ? "all_brands" : brand);
                      setBrandPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedBrand === brand ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {brand}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Product type filter */}
        <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Type
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search type..." />
              <CommandEmpty>No type found.</CommandEmpty>
              <CommandGroup>
                {types.map((type) => (
                  <CommandItem
                    key={type}
                    value={type}
                    onSelect={() => {
                      setSelectedType(selectedType === type ? "all_types" : type);
                      setTypePopoverOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedType === type ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {type}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Color filter */}
        <Select value={selectedColor} onValueChange={setSelectedColor}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_colors">All Colors</SelectItem>
            {safeUniqueColors.map((color) => (
              <SelectItem key={color} value={color}>{color}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Size filter */}
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_sizes">All Sizes</SelectItem>
            {safeUniqueSizes.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Price:</span>
          <Input
            type="number"
            placeholder="Min"
            className="w-20"
            value={priceRange[0] || ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([val, priceRange[1]]);
            }}
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-20"
            value={priceRange[1] || ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([priceRange[0], val]);
            }}
          />
        </div>

        {/* Reset filters */}
        <Button variant="ghost" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {/* Mobile filter panel */}
      <div className={`md:hidden space-y-4 ${open ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-2 gap-3">
          {/* Brand filter */}
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_brands">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Color filter */}
          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger>
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_colors">All Colors</SelectItem>
              {safeUniqueColors.map((color) => (
                <SelectItem key={color} value={color}>{color}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size filter */}
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger>
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_sizes">All Sizes</SelectItem>
              {safeUniqueSizes.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Price:</span>
          <Input
            type="number"
            placeholder="Min"
            className="w-20"
            value={priceRange[0] || ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([val, priceRange[1]]);
            }}
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-20"
            value={priceRange[1] || ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([priceRange[0], val]);
            }}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={applyFilters}>
            Apply Filters
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
