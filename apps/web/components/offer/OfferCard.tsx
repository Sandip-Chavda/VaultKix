import { ShoppingBag, ChevronRight } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { OfferStatusBadge } from "./OfferStatusBadge";
import type { IOffer, IProduct, SafeUser } from "@vaultkix/types";

interface OfferCardProps {
  offer: IOffer;
  viewAs: "buyer" | "seller";
  onClick: (offer: IOffer) => void;
}

export function OfferCard({ offer, viewAs, onClick }: OfferCardProps) {
  const product =
    typeof offer.productId === "object" ? (offer.productId as IProduct) : null;

  const otherParty =
    viewAs === "buyer"
      ? typeof offer.sellerId === "object"
        ? (offer.sellerId as SafeUser)
        : null
      : typeof offer.buyerId === "object"
        ? (offer.buyerId as SafeUser)
        : null;

  const lastThread = offer.thread[offer.thread.length - 1];

  return (
    <button
      onClick={() => onClick(offer)}
      className="w-full bg-background rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        {/* Product image / icon */}
        <div className="w-12 h-12 rounded-lg bg-section flex items-center justify-center shrink-0 overflow-hidden">
          {product?.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-dark text-sm leading-snug line-clamp-1">
              {product?.name ?? "Product"}
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {viewAs === "buyer" ? "Seller" : "Buyer"}:{" "}
            <span className="font-medium text-dark">
              {otherParty?.username ?? "Unknown"}
            </span>
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <OfferStatusBadge status={offer.currentStatus} />
              {offer.currentStatus === "negotiating" && (
                <span className="text-xs text-muted-foreground">
                  {offer.offersLeft} left
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last offer</p>
              <p className="font-bold text-sm text-primary">
                {formatCurrency(lastThread?.amount ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {product?.brand ?? ""} · Qty {offer.quantity} · Size{" "}
          {offer.variant.size || "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(offer.updatedAt)}
        </p>
      </div>
    </button>
  );
}
