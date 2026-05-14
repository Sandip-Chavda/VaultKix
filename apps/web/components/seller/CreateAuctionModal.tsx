"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, TrendingUp } from "lucide-react";
import { bidsService } from "@/lib/api/bids.service";
import { getErrorMessage, formatCurrency } from "@/lib/utils";
import type { IProduct } from "@vaultkix/types";

interface CreateAuctionModalProps {
  open: boolean;
  onClose: () => void;
  product: IProduct;
  onSuccess: () => void;
}

// ── Min datetime string for input ─────────────────────────────────────────────

function getMinDateTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30); // min 30 mins from now
  return now.toISOString().slice(0, 16);
}

function getDefaultEndDateTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3); // default 3 days
  return date.toISOString().slice(0, 16);
}

export function CreateAuctionModal({
  open,
  onClose,
  product,
  onSuccess,
}: CreateAuctionModalProps) {
  const [startingPrice, setStartingPrice] = useState(
    String(product.minimumOfferAmount),
  );
  const [bidIncrement, setBidIncrement] = useState("10");
  const [endsAt, setEndsAt] = useState(getDefaultEndDateTime());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();

  const handleSubmit = async () => {
    setError(null);

    const price = parseFloat(startingPrice);
    const increment = parseFloat(bidIncrement);

    if (!price || price <= 0) {
      setError("Starting price must be greater than 0");
      return;
    }
    if (!increment || increment <= 0) {
      setError("Bid increment must be greater than 0");
      return;
    }
    if (!endsAt) {
      setError("End date is required");
      return;
    }
    if (new Date(endsAt) <= new Date()) {
      setError("End date must be in the future");
      return;
    }

    setIsLoading(true);
    try {
      await bidsService.createAuction(product._id, {
        startingPrice: price,
        bidIncrement: increment,
        auctionEndsAt: new Date(endsAt).toISOString(),
      });
      startTransition(() => setSuccess(true));
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Auction</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-success" />
            </div>
            <p className="font-bold text-dark text-lg">Auction Created!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your auction is now live.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Product summary */}
            <div className="bg-section rounded-xl p-3 flex items-center gap-3 border border-border">
              <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-dark text-sm line-clamp-1">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.brand} · List price{" "}
                  {formatCurrency(product.basePrice)}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Starting price */}
            <div className="space-y-1.5">
              <Label>
                Starting Price ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="0.00"
                value={startingPrice}
                onChange={(e) => {
                  setError(null);
                  setStartingPrice(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Minimum offer amount is{" "}
                {formatCurrency(product.minimumOfferAmount)}
              </p>
            </div>

            {/* Bid increment */}
            <div className="space-y-1.5">
              <Label>
                Bid Increment ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="10"
                value={bidIncrement}
                onChange={(e) => {
                  setError(null);
                  setBidIncrement(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Each new bid must be at least this amount higher than the
                current bid
              </p>
            </div>

            {/* End date */}
            <div className="space-y-1.5">
              <Label>
                Auction End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="datetime-local"
                min={getMinDateTime()}
                value={endsAt}
                onChange={(e) => {
                  setError(null);
                  setEndsAt(e.target.value);
                }}
              />
            </div>

            {/* Preview */}
            {startingPrice && bidIncrement && endsAt && (
              <div className="bg-primary-light rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Auction Preview
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Starts at</p>
                    <p className="font-semibold text-dark">
                      {formatCurrency(parseFloat(startingPrice) || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Min next bid
                    </p>
                    <p className="font-semibold text-dark">
                      {formatCurrency(
                        (parseFloat(startingPrice) || 0) +
                          (parseFloat(bidIncrement) || 0),
                      )}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Ends</p>
                    <p className="font-semibold text-dark">
                      {endsAt ? new Date(endsAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                {isLoading ? "Creating..." : "Launch Auction"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
