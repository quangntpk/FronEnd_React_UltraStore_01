
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

interface ComboFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  minItems: string;
  setMinItems: (value: string) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  occasionType: string;
  setOccasionType: (value: string) => void;
  resetFilters: () => void;
  applyFilters: () => void;
}

export const ComboFilters = ({
  searchTerm,
  setSearchTerm,
  minItems,
  setMinItems,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  occasionType,
  setOccasionType,
  resetFilters,
  applyFilters
}: ComboFiltersProps) => {
  const [open, setOpen] = useState(false);
  const occasions = ["Casual", "Office", "Weekend", "Evening", "Athletic", "Complete"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Input
            placeholder="Search combos..."
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
              <SelectItem value="items_desc">Most Items</SelectItem>
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
      <div className="hidden md:flex flex-wrap gap-4 items-center">
        {/* Occasion type filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Occasion
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search occasion..." />
              <CommandEmpty>No occasion found.</CommandEmpty>
              <CommandGroup>
                {occasions.map((occasion) => (
                  <CommandItem
                    key={occasion}
                    value={occasion}
                    onSelect={() => setOccasionType(occasionType === occasion ? "" : occasion)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        occasionType === occasion ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {occasion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Min items filter */}
        <Select value={minItems} onValueChange={setMinItems}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Min Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_items">All Combos</SelectItem>
            <SelectItem value="2">2+ Items</SelectItem>
            <SelectItem value="3">3+ Items</SelectItem>
            <SelectItem value="4">4+ Items</SelectItem>
            <SelectItem value="5">5+ Items</SelectItem>
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
        {/* Occasion type filter */}
        <Select value={occasionType} onValueChange={setOccasionType}>
          <SelectTrigger>
            <SelectValue placeholder="Occasion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_occasions">All Occasions</SelectItem>
            {occasions.map((occasion) => (
              <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Min items filter */}
        <Select value={minItems} onValueChange={setMinItems}>
          <SelectTrigger>
            <SelectValue placeholder="Min Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_items">All Combos</SelectItem>
            <SelectItem value="2">2+ Items</SelectItem>
            <SelectItem value="3">3+ Items</SelectItem>
            <SelectItem value="4">4+ Items</SelectItem>
            <SelectItem value="5">5+ Items</SelectItem>
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
