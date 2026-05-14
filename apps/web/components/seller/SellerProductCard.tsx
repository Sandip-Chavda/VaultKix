import { Package, Pencil, Trash2, Eye, Tag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CreateAuctionModal } from "@/components/seller/CreateAuctionModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IProduct, ProductStatus } from "@vaultkix/types";

const STATUS_MAP: Record<
  ProductStatus,
  { label: string; variant: "success" | "destructive" | "default" }
> = {
  active: { label: "Active", variant: "success" },
  sold_out: { label: "Sold Out", variant: "destructive" },
  archived: { label: "Archived", variant: "default" },
};

interface SellerProductCardProps {
  product: IProduct;
  onEdit: (product: IProduct) => void;
  onDelete: (product: IProduct) => void;
}

export function SellerProductCard({
  product,
  onEdit,
  onDelete,
}: SellerProductCardProps) {
  const { label, variant } = STATUS_MAP[product.status];
  const [auctionOpen, setAuctionOpen] = useState(false);

  return (
    <>
      <div className="bg-background rounded-xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
        {/* Image */}
        <div className="aspect-video bg-section relative overflow-hidden">
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
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
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <p className="font-semibold text-dark text-sm leading-snug line-clamp-2 mt-0.5 mb-2">
            {product.name}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-bold text-dark">
                {formatCurrency(product.basePrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Min offer</p>
              <p className="font-semibold text-primary text-sm">
                {formatCurrency(product.minimumOfferAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Tag className="w-3 h-3" />
            {product.variants.length} variant
            {product.variants.length !== 1 ? "s" : ""} ·{" "}
            <Eye className="w-3 h-3 ml-1" />
            {product.viewCount} views · {formatDate(product.createdAt)}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 flex-wrap">
            <Link href={`/products/${product._id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1">
                <Eye className="w-3.5 h-3.5" /> View
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onEdit(product)}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-primary border-primary hover:bg-primary-light"
              onClick={() => setAuctionOpen(true)}
              title="Create Auction"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-red-50 px-2"
              onClick={() => onDelete(product)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <CreateAuctionModal
        open={auctionOpen}
        onClose={() => setAuctionOpen(false)}
        product={product}
        onSuccess={() => setAuctionOpen(false)}
      />
    </>
  );
}
