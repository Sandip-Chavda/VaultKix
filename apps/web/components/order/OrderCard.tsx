import { Package, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { IOrder, IProduct, SafeUser } from "@vaultkix/types";

interface OrderCardProps {
  order: IOrder;
  viewAs: "buyer" | "seller";
  onClick: (order: IOrder) => void;
}

export function OrderCard({ order, viewAs, onClick }: OrderCardProps) {
  const product =
    typeof order.productId === "object" ? (order.productId as IProduct) : null;

  const otherParty =
    viewAs === "buyer"
      ? typeof order.sellerId === "object"
        ? (order.sellerId as SafeUser)
        : null
      : typeof order.buyerId === "object"
        ? (order.buyerId as SafeUser)
        : null;

  return (
    <button
      onClick={() => onClick(order)}
      className="w-full bg-background rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="w-14 h-14 rounded-xl bg-section flex items-center justify-center shrink-0 overflow-hidden border border-border">
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-dark text-sm line-clamp-1">
              {product?.name ?? "Order"}
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {viewAs === "buyer" ? "Seller" : "Buyer"}:{" "}
            <span className="font-medium text-dark">
              {otherParty?.username ?? "—"}
            </span>
          </p>

          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.status} />
            <p className="font-bold text-dark">
              {formatCurrency(order.finalPrice)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {product?.brand ?? ""} · Size {order.variant.size || "—"} · Qty{" "}
          {order.quantity} · {order.type}
        </span>
        <span>{formatDate(order.createdAt)}</span>
      </div>
    </button>
  );
}
