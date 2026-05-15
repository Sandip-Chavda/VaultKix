"use client";

import { useState, useTransition } from "react";
import {
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useOrderStore } from "@/stores/order.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IOrder, IProduct, SafeUser, OrderStatus } from "@vaultkix/types";
import { OrderTimeline } from "./OrderTimeline";

// ── Status transition options for seller ─────────────────────────────────────

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ["verified", "cancelled"],
  verified: ["vaulted", "shipped"],
  shipped: ["delivered"],
};

// ── Payment Confirm Panel ─────────────────────────────────────────────────────

function PaymentPanel({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const { initiatePayment, confirmPayment, error, clearError } =
    useOrderStore();
  const [step, setStep] = useState<"idle" | "preview" | "done">("idle");
  const [preview, setPreview] = useState<{
    amount: number;
    platformFee: string;
    sellerPayout: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const data = await initiatePayment(orderId);
      setPreview(data);
      setStep("preview");
    } catch {}
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await confirmPayment(orderId);
      setStep("done");
      setTimeout(onSuccess, 1500);
    } catch {}
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <Check className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="font-semibold text-dark">Payment confirmed!</p>
      </div>
    );
  }

  if (step === "preview" && preview) {
    return (
      <div className="space-y-3">
        <div className="bg-section rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order total</span>
            <span className="font-semibold">
              {formatCurrency(preview.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee (2%)</span>
            <span className="text-destructive">−${preview.platformFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seller receives</span>
            <span className="text-success">${preview.sellerPayout}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>You pay</span>
            <span className="text-primary">
              {formatCurrency(preview.amount)}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setStep("idle");
              clearError();
            }}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      className="w-full bg-primary hover:bg-primary/90 text-white"
      onClick={handleInitiate}
      disabled={loading}
    >
      <CreditCard className="w-4 h-4 mr-2" />
      {loading ? "Loading..." : "Pay Now"}
    </Button>
  );
}

// ── Seller Actions Panel ──────────────────────────────────────────────────────

function SellerActionsPanel({
  order,
  onSuccess,
}: {
  order: IOrder;
  onSuccess: () => void;
}) {
  const { updateStatus, cancelOrder, error, clearError } = useOrderStore();
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const nextStatuses = NEXT_STATUS[order.status] ?? [];

  const handleUpdate = async (status: OrderStatus) => {
    setLoading(true);
    clearError();
    try {
      await updateStatus(order._id, {
        status,
        trackingNumber: status === "shipped" ? trackingNumber : undefined,
      });
      setSuccess(`Status updated to ${status}`);
      setTimeout(() => {
        onSuccess();
        setSuccess(null);
      }, 1500);
    } catch {}
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    clearError();
    try {
      await cancelOrder(order._id);
      setSuccess("Order cancelled");
      setTimeout(() => {
        onSuccess();
        setSuccess(null);
      }, 1500);
    } catch {}
    setLoading(false);
  };

  if (!nextStatuses.length && order.status !== "paid") return null;

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {success && (
        <p className="text-success text-sm flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> {success}
        </p>
      )}

      {/* Tracking number for shipping */}
      {nextStatuses.includes("shipped") && (
        <div className="space-y-1.5">
          <Label>Tracking Number (optional)</Label>
          <Input
            placeholder="Enter tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
      )}

      {/* Status transition buttons */}
      <div className="flex flex-wrap gap-2">
        {nextStatuses
          .filter((s) => s !== "cancelled")
          .map((status) => (
            <Button
              key={status}
              className="flex-1 bg-primary hover:bg-primary/90 text-white capitalize"
              onClick={() => handleUpdate(status)}
              disabled={loading}
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Mark as {status}
            </Button>
          ))}
      </div>

      {/* Cancel */}
      {!["shipped", "delivered", "vaulted", "cancelled"].includes(
        order.status,
      ) && (
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-red-50"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-1.5" />
          Cancel Order
        </Button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface OrderDetailSheetProps {
  order: IOrder | null;
  open: boolean;
  onClose: () => void;
  viewAs: "buyer" | "seller";
  onActionComplete?: () => void;
}

export function OrderDetailSheet({
  order,
  open,
  onClose,
  viewAs,
  onActionComplete,
}: OrderDetailSheetProps) {
  const { user } = useAuthStore();
  const { cancelOrder, error, clearError } = useOrderStore();
  const [, startTransition] = useTransition();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const product =
    order && typeof order.productId === "object"
      ? (order.productId as IProduct)
      : null;

  const seller =
    order && typeof order.sellerId === "object"
      ? (order.sellerId as SafeUser)
      : null;

  const buyer =
    order && typeof order.buyerId === "object"
      ? (order.buyerId as SafeUser)
      : null;

  const canBuyerCancel =
    viewAs === "buyer" &&
    order &&
    !["shipped", "delivered", "vaulted", "cancelled"].includes(order.status);

  const handleBuyerCancel = async () => {
    if (!order) return;
    setCancelLoading(true);
    clearError();
    try {
      await cancelOrder(order._id);
      startTransition(() => setSuccess("Order cancelled"));
      setTimeout(() => {
        onClose();
        onActionComplete?.();
      }, 1500);
    } catch {}
    setCancelLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-4 sm:px-6">
        <SheetHeader className="mb-4">
          <SheetTitle>Order Details</SheetTitle>
        </SheetHeader>

        {!order ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Product card */}
            <div className="bg-section rounded-xl border border-border overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {product?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark text-sm line-clamp-2">
                    {product?.name ?? "Order"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product?.brand} · {product?.category}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  { label: "Size", value: order.variant.size || "—" },
                  { label: "Color", value: order.variant.color || "—" },
                  { label: "Quantity", value: String(order.quantity) },
                  { label: "Type", value: order.type },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-section p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-dark text-sm capitalize">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price + Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Final price</p>
                <p className="text-2xl font-bold text-dark">
                  {formatCurrency(order.finalPrice)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Order timeline */}
            <div>
              <p className="text-sm font-semibold text-dark mb-3">
                Order Progress
              </p>
              <OrderTimeline status={order.status} type={order.type} />
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-section rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Buyer</p>
                <p className="font-semibold text-dark text-sm">
                  {buyer?.username ?? "—"}
                </p>
              </div>
              <div className="bg-section rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Seller</p>
                <p className="font-semibold text-dark text-sm">
                  {seller?.username ?? "—"}
                </p>
              </div>
            </div>

            {/* Tracking */}
            {order.trackingNumber && (
              <div className="bg-section rounded-xl p-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tracking</p>
                  <p className="font-semibold text-dark text-sm">
                    {order.trackingNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Shipping address */}
            {order.shippingAddress && (
              <div className="bg-section rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Shipping address
                </p>
                <p className="text-sm text-dark">
                  {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                  {order.shippingAddress.zip}, {order.shippingAddress.country}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Ordered: {formatDate(order.createdAt)}</p>
              {order.settledAt && <p>Settled: {formatDate(order.settledAt)}</p>}
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            {success && (
              <p className="text-success text-sm flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {success}
              </p>
            )}

            {/* ── Buyer Actions ── */}
            {viewAs === "buyer" && order.status === "pending_payment" && (
              <PaymentPanel
                orderId={order._id}
                onSuccess={() => {
                  onActionComplete?.();
                }}
              />
            )}

            {canBuyerCancel && order.status !== "pending_payment" && (
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-red-50"
                onClick={handleBuyerCancel}
                disabled={cancelLoading}
              >
                <X className="w-4 h-4 mr-1.5" />
                {cancelLoading ? "Cancelling..." : "Cancel Order"}
              </Button>
            )}

            {/* ── Seller Actions ── */}
            {viewAs === "seller" && (
              <SellerActionsPanel
                order={order}
                onSuccess={() => {
                  onActionComplete?.();
                }}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
