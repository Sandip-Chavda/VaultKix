"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Archive,
  Check,
  Package,
  Truck,
  Vault,
} from "lucide-react";
import { useOrderStore } from "@/stores/order.store";
import { ordersService } from "@/lib/api/orders.service";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import type { IOffer, IProduct, IAddress, OrderType } from "@vaultkix/types";

// ── Address selector ──────────────────────────────────────────────────────────

interface AddressSelectorProps {
  addresses: IAddress[];
  selected: IAddress | null;
  onSelect: (address: IAddress) => void;
  onManual: () => void;
}

function AddressSelector({
  addresses,
  selected,
  onSelect,
  onManual,
}: AddressSelectorProps) {
  if (addresses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No saved addresses.{" "}
        <button
          type="button"
          onClick={onManual}
          className="text-primary underline"
        >
          Enter manually
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {addresses.map((address) => (
        <button
          key={address._id}
          type="button"
          onClick={() => onSelect(address)}
          className={`w-full text-left rounded-xl border p-3 transition-all ${
            selected?._id === address._id
              ? "border-primary bg-primary-light"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-dark text-sm">{address.label}</p>
            {address.isDefault && (
              <span className="text-xs text-primary font-medium">Default</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {address.street}, {address.city}, {address.zip}, {address.country}
          </p>
        </button>
      ))}
      <button
        type="button"
        onClick={onManual}
        className="w-full text-sm text-primary hover:underline text-left py-1"
      >
        + Enter a different address
      </button>
    </div>
  );
}

// ── Manual address form ───────────────────────────────────────────────────────

interface ManualAddressProps {
  value: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  onChange: (field: string, value: string) => void;
}

function ManualAddressForm({ value, onChange }: ManualAddressProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Street</Label>
        <Input
          placeholder="123 Main Street"
          value={value.street}
          onChange={(e) => onChange("street", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input
            placeholder="New York"
            value={value.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>ZIP</Label>
          <Input
            placeholder="10001"
            value={value.zip}
            onChange={(e) => onChange("zip", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Country</Label>
        <Input
          placeholder="United States"
          value={value.country}
          onChange={(e) => onChange("country", e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  offer: IOffer;
}

export function CreateOrderModal({
  open,
  onClose,
  offer,
}: CreateOrderModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchBuyerOrders } = useOrderStore();

  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(
    user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0] ?? null,
  );
  const [showManual, setShowManual] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: "",
    city: "",
    zip: "",
    country: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();

  const product =
    typeof offer.productId === "object" ? (offer.productId as IProduct) : null;

  const updateManual = (field: string, value: string) =>
    setManualAddress((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError(null);

    // Validate shipping address for delivery
    if (orderType === "delivery") {
      const addr = showManual ? manualAddress : selectedAddress;
      if (
        !addr ||
        !("street" in addr) ||
        !addr.street ||
        !addr.city ||
        !addr.zip ||
        !addr.country
      ) {
        setError("A complete shipping address is required for delivery");
        return;
      }
    }

    setIsLoading(true);
    try {
      const shippingAddress =
        orderType === "delivery"
          ? showManual
            ? manualAddress
            : selectedAddress
              ? {
                  street: selectedAddress.street,
                  city: selectedAddress.city,
                  zip: selectedAddress.zip,
                  country: selectedAddress.country,
                }
              : undefined
          : undefined;

      await ordersService.createOrder({
        offerId: offer._id,
        type: orderType,
        shippingAddress,
      });

      startTransition(() => setSuccess(true));
      await fetchBuyerOrders();

      setTimeout(() => {
        onClose();
        router.push("/orders");
      }, 1500);
    } catch (err) {
      const msg = getErrorMessage(err);
      // Order already exists for this offer
      if (msg.toLowerCase().includes("already exists")) {
        startTransition(() => setSuccess(true));
        setTimeout(() => {
          onClose();
          router.push("/orders");
        }, 1500);
      } else {
        setError(msg);
      }
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-success" />
            </div>
            <p className="font-bold text-dark text-lg">Order Created!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Redirecting to your orders...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Offer summary */}
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">
                    {product?.name ?? "Product"}
                  </p>
                  <p className="text-purple-200 text-xs">
                    Size {offer.variant.size || "—"} · Qty {offer.quantity}
                  </p>
                </div>
              </div>
              <div className="mt-3 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-purple-200 text-xs">Agreed price</p>
                <p className="font-bold text-xl">
                  {formatCurrency(offer.finalAmount ?? 0)}
                </p>
              </div>
            </div>

            {/* Order type */}
            <div className="space-y-2">
              <Label>Fulfilment Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    orderType === "delivery"
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Truck
                    className={`w-5 h-5 mb-1.5 ${
                      orderType === "delivery"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <p className="font-semibold text-dark text-sm">Delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ship to your address
                  </p>
                </button>

                {product?.isVaultEligible && (
                  <button
                    type="button"
                    onClick={() => setOrderType("position")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      orderType === "position"
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Archive
                      className={`w-5 h-5 mb-1.5 ${
                        orderType === "position"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <p className="font-semibold text-dark text-sm">
                      Vault Position
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Store in vault
                    </p>
                  </button>
                )}

                {!product?.isVaultEligible && (
                  <div className="rounded-xl border border-border p-3 opacity-40">
                    <Vault className="w-5 h-5 mb-1.5 text-muted-foreground" />
                    <p className="font-semibold text-dark text-sm">
                      Vault Position
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Not eligible
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping address — only for delivery */}
            {orderType === "delivery" && (
              <div className="space-y-2">
                <Label>Shipping Address</Label>
                {showManual ? (
                  <>
                    <ManualAddressForm
                      value={manualAddress}
                      onChange={updateManual}
                    />

                    {
                      // @ts-expect-error - addresses can be null
                      user?.addresses?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowManual(false)}
                          className="text-sm text-primary hover:underline"
                        >
                          ← Use saved address
                        </button>
                      )
                    }
                  </>
                ) : (
                  <AddressSelector
                    addresses={user?.addresses ?? []}
                    selected={selectedAddress}
                    onSelect={setSelectedAddress}
                    onManual={() => setShowManual(true)}
                  />
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
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
                {isLoading ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
