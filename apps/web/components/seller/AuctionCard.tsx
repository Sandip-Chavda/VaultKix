"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Clock, Eye, X, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { bidsService } from "@/lib/api/bids.service";
import { getErrorMessage } from "@/lib/utils";
import type { IAuction, IProduct } from "@vaultkix/types";

// ── Countdown ─────────────────────────────────────────────────────────────────

function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      expired: false,
    };
  });

  useState(() => {
    const id = setInterval(() => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true });
        clearInterval(id);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        expired: false,
      });
    }, 60000); // update every minute
    return () => clearInterval(id);
  });

  return timeLeft;
}

// ── Status map ────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  active: { label: "Active", variant: "success" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  expired: { label: "Expired", variant: "default" },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface AuctionCardProps {
  auction: IAuction;
  onCancelled: () => void;
}

export function AuctionCard({ auction, onCancelled }: AuctionCardProps) {
  const product =
    typeof auction.productId === "object"
      ? (auction.productId as IProduct)
      : null;

  const timeLeft = useCountdown(auction.auctionEndsAt);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { label, variant } =
    STATUS_MAP[auction.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.expired;

  const handleCancel = async () => {
    if (!product) return;
    setCancelling(true);
    setError(null);
    try {
      await bidsService.cancelAuction(product._id);
      onCancelled();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setCancelling(false);
  };

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-section relative overflow-hidden">
        {product?.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge label={label} variant={variant} />
        </div>
        {auction.status === "active" && !timeLeft.expired && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs rounded-lg px-2 py-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {timeLeft.hours}h {timeLeft.minutes}m left
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{product?.brand}</p>
          <p className="font-semibold text-dark text-sm line-clamp-1 mt-0.5">
            {product?.name ?? "Product"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-section rounded-lg p-2 text-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <p className="font-bold text-dark text-sm">
              {formatCurrency(auction.currentHighestBid)}
            </p>
            <p className="text-[10px] text-muted-foreground">Current bid</p>
          </div>
          <div className="bg-section rounded-lg p-2 text-center">
            <Users className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <p className="font-bold text-dark text-sm">
              {auction.totalBidsCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Bids</p>
          </div>
          <div className="bg-section rounded-lg p-2 text-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <p className="font-bold text-dark text-sm">
              +{formatCurrency(auction.bidIncrement)}
            </p>
            <p className="text-[10px] text-muted-foreground">Increment</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Ends: {formatDate(auction.auctionEndsAt)}
        </p>

        {error && <p className="text-destructive text-xs">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          {product && (
            <Link href={`/products/${product._id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1">
                <Eye className="w-3.5 h-3.5" /> View
              </Button>
            </Link>
          )}
          {auction.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-destructive text-destructive hover:bg-red-50 gap-1"
              onClick={handleCancel}
              disabled={cancelling}
            >
              <X className="w-3.5 h-3.5" />
              {cancelling ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
