"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Package,
  Clock,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  Check,
  LayoutDashboard,
} from "lucide-react";
import { useProductStore } from "@/stores/product.store";
import { useBidStore } from "@/stores/bid.store";
import { useOfferStore } from "@/stores/offer.store";
import { useAuthStore } from "@/stores/auth.store";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BidHistory } from "@/components/bid/BidHistory";
import { CreateAuctionModal } from "@/components/seller/CreateAuctionModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  IVariant,
  BidUpdatedEvent,
  IProduct,
  SafeUser,
} from "@vaultkix/types";
import Image from "next/image";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSellerName(product: IProduct): string {
  if (typeof product.sellerId === "object" && product.sellerId !== null) {
    return (product.sellerId as SafeUser).username;
  }
  return "Unknown seller";
}

// ── Countdown Timer ───────────────────────────────────────────────────────────

function useCountdown(endsAt: string | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!endsAt) return;
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0)
        return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return timeLeft;
}

// ── Auction Section (buyer only) ──────────────────────────────────────────────

function AuctionSection({ productId }: { productId: string }) {
  const { auction, isLoading, error, placeBid, clearError } = useBidStore();
  const { isAuthenticated } = useAuthStore();
  const [bidAmount, setBidAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const timeLeft = useCountdown(auction?.auctionEndsAt ?? null);

  const minimumBid = auction
    ? auction.currentHighestBid + auction.bidIncrement
    : 0;

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) return;
    try {
      await placeBid(productId, amount);
      setBidAmount("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {}
  };

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!auction) return null;

  return (
    <div className="border border-primary/20 bg-primary-light rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-dark flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Live Auction
        </h3>
        <Badge className="bg-primary text-white">
          {auction.totalBidsCount} bids
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Current bid</p>
          <p className="font-bold text-xl text-dark">
            {formatCurrency(auction.currentHighestBid)}
          </p>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Bid increment</p>
          <p className="font-bold text-xl text-dark">
            +{formatCurrency(auction.bidIncrement)}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Time remaining
        </p>
        <div className="flex gap-2">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hrs", value: timeLeft.hours },
            { label: "Min", value: timeLeft.minutes },
            { label: "Sec", value: timeLeft.seconds },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex-1 bg-primary text-white rounded-lg py-2 text-center"
            >
              <p className="font-bold text-lg leading-none">
                {String(value).padStart(2, "0")}
              </p>
              <p className="text-[10px] text-purple-200 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {isAuthenticated ? (
        <div className="space-y-2">
          {error && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
          {success && (
            <p className="text-success text-sm flex items-center gap-1">
              <Check className="w-3 h-3" /> Bid placed successfully!
            </p>
          )}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={`Min $${minimumBid}`}
              value={bidAmount}
              onChange={(e) => {
                clearError();
                setBidAmount(e.target.value);
              }}
              className="bg-background"
            />
            <Button
              onClick={handlePlaceBid}
              className="bg-primary hover:bg-primary/90 text-white shrink-0"
              disabled={isLoading || !bidAmount}
            >
              Place Bid
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum bid: {formatCurrency(minimumBid)}
          </p>
        </div>
      ) : (
        <Link href="/login">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
            Sign in to bid
          </Button>
        </Link>
      )}
    </div>
  );
}

// ── Make Offer Modal ──────────────────────────────────────────────────────────

function MakeOfferModal({
  open,
  onClose,
  product,
  selectedVariant,
  quantity,
}: {
  open: boolean;
  onClose: () => void;
  product: IProduct;
  selectedVariant: IVariant | null;
  quantity: number;
}) {
  const { makeOffer, isLoading, error, clearError } = useOfferStore();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const offerAmount = parseFloat(amount);
    if (isNaN(offerAmount)) return;
    try {
      await makeOffer(product._id, {
        amount: offerAmount,
        variant: {
          type: selectedVariant?.type ?? "",
          size: selectedVariant?.size ?? "",
          color: selectedVariant?.color ?? "",
        },
        quantity,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/offers");
      }, 1500);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-primary rounded-xl p-4 text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight line-clamp-2">
                  {product.name}
                </p>
                <p className="text-purple-200 text-xs mt-0.5">
                  {product.category} · Qty: {quantity}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-purple-200 text-xs">Size</p>
                <p className="font-semibold text-sm">
                  {selectedVariant?.size ?? "—"}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-purple-200 text-xs">List price</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(product.basePrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-section rounded-lg px-3 py-2 text-sm">
            Minimum offer:{" "}
            <span className="font-semibold text-primary">
              {formatCurrency(product.minimumOfferAmount)}
            </span>
          </div>

          {error && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}

          {success ? (
            <div className="text-center py-4">
              <Check className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="font-semibold text-dark">Offer sent!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to your offers...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Your offer amount</Label>
                <Input
                  type="number"
                  placeholder={`$${product.minimumOfferAmount}+`}
                  value={amount}
                  onChange={(e) => {
                    clearError();
                    setAmount(e.target.value);
                  }}
                />
              </div>
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
                  disabled={isLoading || !amount}
                >
                  {isLoading ? "Sending..." : "Send Offer"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const {
    selectedProduct: product,
    isLoading,
    fetchProduct,
  } = useProductStore();
  const { fetchAuction, updateBidRealtime, clearAuction, auction } =
    useBidStore();
  const { isAuthenticated, user } = useAuthStore();
  const { sentOffers, fetchSentOffers } = useOfferStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [offerOpen, setOfferOpen] = useState(false);
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);

  const selectedVariant = product?.variants?.[selectedVariantIdx] ?? null;

  // Single effect — no duplicates
  useEffect(() => {
    fetchProduct(productId);
    fetchAuction(productId);
    if (isAuthenticated) fetchSentOffers();
    return () => clearAuction();
  }, [
    productId,
    fetchProduct,
    fetchAuction,
    clearAuction,
    isAuthenticated,
    fetchSentOffers,
  ]);

  // Socket — live bid updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    socket.emit("join:product", productId);
    socket.on("bid:updated", (data: BidUpdatedEvent) => {
      updateBidRealtime(data);
    });
    return () => {
      socket.emit("leave:product", productId);
      socket.off("bid:updated");
    };
  }, [productId, isAuthenticated, updateBidRealtime]);

  if (isLoading || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isOwnProduct =
    user &&
    product &&
    (typeof product.sellerId === "object"
      ? (product.sellerId as SafeUser)._id === user._id
      : product.sellerId === user._id);

  const hasImages = product.images?.length > 0;
  const uniqueTypes = [...new Set(product.variants.map((v) => v.type))];
  const uniqueSizes = [
    ...new Set(
      product.variants
        .filter((v) => !selectedVariant || v.type === selectedVariant.type)
        .map((v) => v.size),
    ),
  ];

  const existingOffer = sentOffers.find(
    (o) =>
      (typeof o.productId === "string" ? o.productId : o.productId._id) ===
        productId && o.currentStatus === "negotiating",
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── Left: Images ── */}
        <div className="space-y-3">
          <div className="aspect-square bg-section rounded-2xl overflow-hidden border border-border relative">
            {hasImages ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Package className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No images yet</p>
              </div>
            )}
          </div>

          {hasImages && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === i
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`View ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Info + Actions ── */}
        <div className="space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <Badge className="bg-primary-light text-primary">
                {product.brand}
              </Badge>
              <Badge
                variant="outline"
                className="text-muted-foreground text-xs"
              >
                {product.viewCount} views
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-dark mt-2 leading-snug">
              {product.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {product.category}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-end gap-4">
            <div>
              <p className="text-xs text-muted-foreground">List price</p>
              <p className="text-3xl font-bold text-dark">
                {formatCurrency(product.basePrice)}
              </p>
            </div>
            <div className="pb-1">
              <p className="text-xs text-muted-foreground">Min offer</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(product.minimumOfferAmount)}
              </p>
            </div>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">
                {getSellerName(product)[0]?.toUpperCase()}
              </span>
            </div>
            Sold by{" "}
            <span className="font-medium text-dark">
              {getSellerName(product)}
            </span>
          </div>

          {/* Type */}
          {uniqueTypes.length > 0 && (
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const idx = product.variants.findIndex(
                        (v) => v.type === type,
                      );
                      if (idx !== -1) setSelectedVariantIdx(idx);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedVariant?.type === type
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {uniqueSizes.length > 0 && (
            <div className="space-y-2">
              <Label>Size (UK)</Label>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      const idx = product.variants.findIndex(
                        (v) =>
                          v.size === size && v.type === selectedVariant?.type,
                      );
                      if (idx !== -1) setSelectedVariantIdx(idx);
                    }}
                    className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-all ${
                      selectedVariant?.size === size
                        ? "border-primary bg-primary text-white"
                        : "border-border text-dark hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-dark hover:border-primary transition-colors font-bold"
              >
                −
              </button>
              <span className="font-semibold text-dark w-6 text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(selectedVariant?.stockQuantity ?? 10, q + 1),
                  )
                }
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-dark hover:border-primary transition-colors font-bold"
              >
                +
              </button>
              {selectedVariant && (
                <span className="text-xs text-muted-foreground">
                  {selectedVariant.stockQuantity} in stock
                </span>
              )}
            </div>
          </div>

          {/* ── Auction section — seller vs buyer ── */}
          {isOwnProduct ? (
            <div className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="font-semibold text-dark text-sm">Auction</p>
              </div>
              {auction ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-section rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">
                        Current bid
                      </p>
                      <p className="font-bold text-dark">
                        {formatCurrency(auction.currentHighestBid)}
                      </p>
                    </div>
                    <div className="bg-section rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">
                        Total bids
                      </p>
                      <p className="font-bold text-dark">
                        {auction.totalBidsCount}
                      </p>
                    </div>
                  </div>
                  <Link href="/seller">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Manage in Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    No active auction for this product
                  </p>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                    onClick={() => setAuctionModalOpen(true)}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Create Auction
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <AuctionSection productId={productId} />
              {auction && (
                <BidHistory
                  productId={productId}
                  totalBidsCount={auction.totalBidsCount}
                />
              )}
            </>
          )}

          {/* ── CTA Buttons ── */}
          <div className="flex flex-col gap-2 pt-1">
            {isOwnProduct ? (
              <div className="bg-section rounded-xl p-3 text-center border border-border">
                <p className="text-sm text-muted-foreground">
                  This is your product listing
                </p>
              </div>
            ) : isAuthenticated ? (
              existingOffer ? (
                <div className="space-y-2">
                  <div className="bg-section rounded-xl p-3 border border-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-dark">
                        Active Offer
                      </p>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Negotiating
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      You have an open offer on this product
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Your last offer
                        </p>
                        <p className="font-bold text-primary">
                          {formatCurrency(
                            existingOffer.thread[
                              existingOffer.thread.length - 1
                            ]?.amount ?? 0,
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {existingOffer.offersLeft} offers left
                      </p>
                    </div>
                  </div>
                  <Link href="/offers">
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary"
                    >
                      View Offer Thread
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white h-11"
                  onClick={() => setOfferOpen(true)}
                >
                  Make an Offer
                </Button>
              )
            ) : (
              <Link href="/login">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                  Sign in to Make an Offer
                </Button>
              </Link>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold text-dark mb-1">
                Description
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Color</p>
              <p className="font-medium text-dark">
                {selectedVariant?.color ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">SKU</p>
              <p className="font-medium text-dark">
                {selectedVariant?.sku || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Listed</p>
              <p className="font-medium text-dark">
                {formatDate(product.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Vault eligible</p>
              <p className="font-medium text-dark">
                {product.isVaultEligible ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
      />

      {/* Create Auction Modal — seller only */}
      {isOwnProduct && (
        <CreateAuctionModal
          open={auctionModalOpen}
          onClose={() => setAuctionModalOpen(false)}
          product={product}
          onSuccess={() => {
            setAuctionModalOpen(false);
            fetchAuction(productId);
          }}
        />
      )}
    </div>
  );
}
