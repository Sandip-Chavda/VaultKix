"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFilters } from "@vaultkix/types";

const SIZES = ["5", "6", "7", "8", "9", "10", "11", "12", "13"];
const COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Grey",
  "Brown",
  "Multi",
];

interface ActiveFilters {
  minPrice: string;
  maxPrice: string;
  size: string;
  color: string;
}

interface FiltersPanelProps {
  onApply: (filters: Partial<ProductFilters>) => void;
  onClear: () => void;
}

export function FiltersPanel({ onApply, onClear }: FiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>({
    minPrice: "",
    maxPrice: "",
    size: "",
    color: "",
  });

  const activeCount = Object.values(filters).filter(Boolean).length;

  const update = (key: keyof ActiveFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply({
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      size: filters.size || undefined,
      color: filters.color || undefined,
    });
    setOpen(false);
  };

  const handleClear = () => {
    setFilters({ minPrice: "", maxPrice: "", size: "", color: "" });
    onClear();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`gap-1.5 ${
          activeCount > 0 ? "border-primary text-primary" : ""
        }`}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader className="mb-5">
            <SheetTitle>Filter Products</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto">
            {/* Price range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-dark">
                Price Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Min ($)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => update("minPrice", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Max ($)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Any"
                    value={filters.maxPrice}
                    onChange={(e) => update("maxPrice", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-dark">
                Size (UK)
              </Label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      update("size", filters.size === size ? "" : size)
                    }
                    className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-all ${
                      filters.size === size
                        ? "border-primary bg-primary text-white"
                        : "border-border text-dark hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-dark">Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      update("color", filters.color === color ? "" : color)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      filters.color === color
                        ? "border-primary bg-primary-light text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={handleClear}
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleApply}
            >
              Apply filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
