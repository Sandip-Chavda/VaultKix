"use client";

import { useState, useEffect, useTransition } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VariantFormSection } from "./VariantFormSection";
import { productsService } from "@/lib/api/products.service";
import { uploadService } from "@/lib/api/upload.service";
import { getErrorMessage } from "@/lib/utils";
import type { IProduct, IVariant } from "@vaultkix/types";

type VariantDraft = Omit<IVariant, "_id">;

interface FormState {
  name: string;
  brand: string;
  category: string;
  description: string;
  basePrice: string;
  minimumOfferAmount: string;
  isVaultEligible: boolean;
  variants: VariantDraft[];
  images: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  brand: "",
  category: "",
  description: "",
  basePrice: "",
  minimumOfferAmount: "",
  isVaultEligible: false,
  variants: [],
  images: [],
};

const CATEGORIES = [
  "Sneakers",
  "Running",
  "Basketball",
  "Lifestyle",
  "Training",
  "Skateboarding",
  "Sandals",
  "Boots",
];

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: IProduct | null;
  onSuccess: () => void;
}

export function ProductFormModal({
  open,
  onClose,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const isEditing = !!product;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [, startTransition] = useTransition();

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (product) {
        startTransition(() => {
          setForm({
            name: product.name,
            brand: product.brand,
            category: product.category,
            description: product.description,
            basePrice: String(product.basePrice),
            minimumOfferAmount: String(product.minimumOfferAmount),
            isVaultEligible: product.isVaultEligible,
            variants: product.variants.map(
              ({ type, size, color, style, sku, stockQuantity }) => ({
                type,
                size,
                color,
                style,
                sku,
                stockQuantity,
              }),
            ),
            images: product.images,
          });
          setError(null);
        });
      } else {
        startTransition(() => {
          setForm(EMPTY_FORM);
          setError(null);
        });
      }
    }
  }, [open, product]);

  const set = (field: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImage(true);
    try {
      if (files.length === 1) {
        const result = await uploadService.uploadSingle(files[0]);
        setForm((prev) => ({ ...prev, images: [...prev.images, result.url] }));
      } else {
        const result = await uploadService.uploadMultiple(files);
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...result.urls],
        }));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setUploadingImage(false);
  };

  const removeImage = (index: number) =>
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

  const handleSubmit = async () => {
    setError(null);

    if (!form.name || !form.brand || !form.category) {
      setError("Name, brand and category are required");
      return;
    }
    if (form.variants.length === 0) {
      setError("At least one variant is required");
      return;
    }
    if (form.variants.some((v) => !v.type || !v.size || !v.color)) {
      setError("Each variant must have type, size, and color");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        description: form.description,
        basePrice: parseFloat(form.basePrice),
        minimumOfferAmount: parseFloat(form.minimumOfferAmount),
        isVaultEligible: form.isVaultEligible,
        variants: form.variants,
        images: form.images,
      };

      if (isEditing && product) {
        await productsService.updateProduct(product._id, payload);
      } else {
        await productsService.createProduct(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "List a New Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pb-2">
          {error && (
            <div className="bg-red-50 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Air Jordan 1 Retro High OG"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Brand <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Nike, Jordan, Adidas"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Base Price ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="0.00"
                value={form.basePrice}
                onChange={(e) => set("basePrice", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Minimum Offer ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="0.00"
                value={form.minimumOfferAmount}
                onChange={(e) => set("minimumOfferAmount", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <textarea
                rows={3}
                placeholder="Describe your product..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          </div>

          {/* Vault eligible toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("isVaultEligible", !form.isVaultEligible)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                form.isVaultEligible
                  ? "bg-primary"
                  : "bg-section border border-border"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.isVaultEligible ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-dark">Vault Eligible</p>
              <p className="text-xs text-muted-foreground">
                Allow buyers to vault this product instead of delivery
              </p>
            </div>
          </label>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((url, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Product ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}

              {form.images.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {uploadingImage ? "Uploading..." : "Add photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Max 5 images · JPEG, PNG, WebP
            </p>
          </div>

          {/* Variants */}
          <VariantFormSection
            variants={form.variants}
            onChange={(variants) => set("variants", variants)}
          />

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleSubmit}
              disabled={isLoading || uploadingImage}
            >
              {isLoading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "List Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
