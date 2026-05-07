"use client";

import { useEffect, useState, useTransition } from "react";
import { ShoppingBag, Clock, AlertCircle, Check } from "lucide-react";
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
import { OfferThread } from "./OfferThread";
import { OfferStatusBadge } from "./OfferStatusBadge";
import { useOfferStore } from "@/stores/offer.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency } from "@/lib/utils";
import type { IOffer, IProduct } from "@vaultkix/types";

// ── Expiry Countdown ──────────────────────────────────────────────────────────

function useExpiryCountdown(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return timeLeft;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OfferDetailSheetProps {
  offer: IOffer | null;
  open: boolean;
  onClose: () => void;
  viewAs: "buyer" | "seller";
  onActionComplete?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OfferDetailSheet({
  offer,
  open,
  onClose,
  viewAs,
  onActionComplete,
}: OfferDetailSheetProps) {
  const {
    fetchOffer,
    selectedOffer,
    acceptOffer,
    rejectOffer,
    counterOffer,
    isLoading,
    error,
    clearError,
  } = useOfferStore();
  const { user } = useAuthStore();

  const [counterAmount, setCounterAmount] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const timeLeft = useExpiryCountdown(selectedOffer?.offer?.expiresAt ?? null);

  useEffect(() => {
    if (open && offer?._id) {
      fetchOffer(offer._id);
      startTransition(() => {
        setShowCounter(false);
        setActionSuccess(null);
        clearError();
      });
    }
  }, [open, offer?._id, fetchOffer, clearError]);

  const detail = selectedOffer;
  const fullOffer = detail?.offer ?? offer;
  const product =
    typeof fullOffer?.productId === "object"
      ? (fullOffer.productId as IProduct)
      : null;

  const isNegotiating = fullOffer?.currentStatus === "negotiating";
  const isExpired = detail?.isExpired ?? false;
  const canAct = isNegotiating && !isExpired;

  // Determine whose turn it is
  const lastFrom = fullOffer?.thread[fullOffer.thread.length - 1]?.from;
  const myRole = viewAs;
  const isMyTurn = lastFrom !== myRole;

  const handleAccept = async () => {
    if (!fullOffer) return;
    try {
      await acceptOffer(fullOffer._id);
      setActionSuccess("Offer accepted!");
      setTimeout(() => {
        onClose();
        onActionComplete?.();
      }, 1500);
    } catch {}
  };

  const handleReject = async () => {
    if (!fullOffer) return;
    try {
      await rejectOffer(fullOffer._id);
      setActionSuccess("Offer rejected.");
      setTimeout(() => {
        onClose();
        onActionComplete?.();
      }, 1500);
    } catch {}
  };

  const handleCounter = async () => {
    if (!fullOffer || !counterAmount) return;
    try {
      await counterOffer(fullOffer._id, { amount: parseFloat(counterAmount) });
      setCounterAmount("");
      setShowCounter(false);
      setActionSuccess("Counter offer sent!");
      setTimeout(() => {
        onActionComplete?.();
        setActionSuccess(null);
      }, 2000);
      fetchOffer(fullOffer._id);
    } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Offer Details</SheetTitle>
        </SheetHeader>

        {!fullOffer ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Product card */}
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  {product?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingBag className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug line-clamp-2">
                    {product?.name ?? "Product"}
                  </p>
                  <p className="text-purple-200 text-xs mt-0.5">
                    {product?.category} · Qty: {fullOffer.quantity}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-purple-200 text-xs">Size</p>
                  <p className="font-semibold text-sm">
                    {fullOffer.variant.size || "—"}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-purple-200 text-xs">List price</p>
                  <p className="font-semibold text-sm">
                    {formatCurrency(product?.basePrice ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status + expiry */}
            <div className="flex items-center justify-between">
              <OfferStatusBadge status={fullOffer.currentStatus} />
              {canAct && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Expires in{" "}
                  <span className="font-semibold text-dark">
                    {String(timeLeft.hours).padStart(2, "0")}:
                    {String(timeLeft.minutes).padStart(2, "0")}:
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>

            {/* Offer thread */}
            <div>
              <p className="text-sm font-semibold text-dark mb-3">
                Negotiation Thread
              </p>
              <OfferThread thread={fullOffer.thread} />
            </div>

            {/* Final amount if closed */}
            {fullOffer.finalAmount && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Agreed price</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(fullOffer.finalAmount)}
                </p>
              </div>
            )}

            {/* Feedback */}
            {error && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            {actionSuccess && (
              <p className="text-success text-sm flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {actionSuccess}
              </p>
            )}

            {/* Actions */}
            {canAct && isMyTurn && (
              <div className="space-y-2 pt-1">
                {showCounter ? (
                  <div className="space-y-2">
                    <Label>Counter offer amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={counterAmount}
                      onChange={(e) => {
                        clearError();
                        setCounterAmount(e.target.value);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCounter(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                        onClick={handleCounter}
                        disabled={isLoading || !counterAmount}
                      >
                        {isLoading ? "Sending..." : "Send Counter"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-destructive text-destructive hover:bg-red-50"
                      onClick={handleReject}
                      disabled={isLoading}
                    >
                      Reject
                    </Button>
                    {viewAs === "seller" && (
                      <Button
                        variant="outline"
                        className="flex-1 border-primary text-primary hover:bg-primary-light"
                        onClick={() => setShowCounter(true)}
                        disabled={isLoading}
                      >
                        Counter
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                      onClick={handleAccept}
                      disabled={isLoading}
                    >
                      Accept
                    </Button>
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  {fullOffer.offersLeft} offer exchanges remaining
                </p>
              </div>
            )}

            {/* Waiting state */}
            {canAct && !isMyTurn && (
              <div className="bg-section rounded-xl p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Waiting for the {viewAs === "buyer" ? "seller" : "buyer"} to
                  respond
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
