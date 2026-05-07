import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IVariant } from "@vaultkix/types";

type VariantDraft = Omit<IVariant, "_id">;

interface VariantFormSectionProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

const EMPTY_VARIANT: VariantDraft = {
  type: "",
  size: "",
  color: "",
  style: "",
  sku: "",
  stockQuantity: 1,
};

export function VariantFormSection({
  variants,
  onChange,
}: VariantFormSectionProps) {
  const update = (
    index: number,
    field: keyof VariantDraft,
    value: string | number,
  ) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    onChange(updated);
  };

  const add = () => onChange([...variants, { ...EMPTY_VARIANT }]);

  const remove = (index: number) =>
    onChange(variants.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Variants <span className="text-destructive">*</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="gap-1.5 text-primary border-primary"
        >
          <Plus className="w-3.5 h-3.5" /> Add Variant
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 bg-section rounded-xl border border-dashed border-border">
          At least one variant is required
        </p>
      )}

      {variants.map((variant, index) => (
        <div
          key={index}
          className="border border-border rounded-xl p-3 space-y-3 relative"
        >
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-section flex items-center justify-center hover:bg-red-50 hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Variant {index + 1}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Input
                placeholder="e.g. TD, GS, PS"
                value={variant.type}
                onChange={(e) => update(index, "type", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Size</Label>
              <Input
                placeholder="e.g. 7, 8.5, 10"
                value={variant.size}
                onChange={(e) => update(index, "size", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input
                placeholder="e.g. Black/White"
                value={variant.color}
                onChange={(e) => update(index, "color", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Style</Label>
              <Input
                placeholder="e.g. High, Low"
                value={variant.style}
                onChange={(e) => update(index, "style", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input
                placeholder="e.g. AJ1-001"
                value={variant.sku}
                onChange={(e) => update(index, "sku", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock Qty</Label>
              <Input
                type="number"
                min={0}
                value={variant.stockQuantity}
                onChange={(e) =>
                  update(index, "stockQuantity", parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
