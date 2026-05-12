"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { authService } from "@/lib/api/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/lib/utils";

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY = {
  label: "",
  street: "",
  city: "",
  zip: "",
  country: "",
  isDefault: false,
};

export function AddressFormModal({
  open,
  onClose,
  onSuccess,
}: AddressFormModalProps) {
  const { setUser } = useAuthStore();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setForm(EMPTY);
        setError(null);
      });
    }
  }, [open]);

  const update = (field: keyof typeof EMPTY, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (
      !form.label ||
      !form.street ||
      !form.city ||
      !form.zip ||
      !form.country
    ) {
      setError("All fields are required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.addAddress(form);
      setUser(updatedUser);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input
              placeholder="e.g. Home, Office"
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Street</Label>
            <Input
              placeholder="123 Main Street"
              value={form.street}
              onChange={(e) => update("street", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                placeholder="New York"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ZIP</Label>
              <Input
                placeholder="10001"
                value={form.zip}
                onChange={(e) => update("zip", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input
              placeholder="United States"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => update("isDefault", !form.isDefault)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                form.isDefault
                  ? "bg-primary"
                  : "bg-section border border-border"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.isDefault ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <p className="text-sm font-medium text-dark">Set as default</p>
          </label>

          <div className="flex gap-2 pt-1">
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
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Add Address"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
