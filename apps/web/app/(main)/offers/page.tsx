"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useOfferStore } from "@/stores/offer.store";
import { OfferCard } from "@/components/offer/OfferCard";
import { OfferDetailSheet } from "@/components/offer/OfferDetailSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import type { IOffer, OfferUpdateEvent } from "@vaultkix/types";
import { useOfferRealtime } from "@/hooks/use-offer-realtime";

function EmptyOffers({ label }: { label: string }) {
  return (
    <div className="text-center py-20">
      <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-semibold text-dark">No {label} yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        {label === "sent offers"
          ? "Browse the marketplace and make an offer on a product."
          : "When buyers make offers on your products, they'll appear here."}
      </p>
    </div>
  );
}

function OfferListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function OffersPage() {
  const { user } = useAuthStore();
  const {
    sentOffers,
    receivedOffers,
    isLoading,
    fetchSentOffers,
    fetchReceivedOffers,
  } = useOfferStore();

  const isSeller = user?.role === "seller";
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [selectedOffer, setSelectedOffer] = useState<IOffer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadOffers = useCallback(() => {
    fetchSentOffers();
    if (isSeller) fetchReceivedOffers();
  }, [fetchSentOffers, fetchReceivedOffers, isSeller]);

  // Refresh list on any real-time offer event
  useOfferRealtime({
    offerId: null, // null = listen to all offer events for this user
    onEvent: useCallback(
      (_event: OfferUpdateEvent) => {
        loadOffers();
      },
      [loadOffers],
    ),
  });

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleOfferClick = (offer: IOffer) => {
    setSelectedOffer(offer);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedOffer(null);
  };

  const handleActionComplete = () => {
    loadOffers();
  };

  const currentOffers = activeTab === "sent" ? sentOffers : receivedOffers;
  const viewAs = activeTab === "sent" ? "buyer" : "seller";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">My Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage your offer negotiations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-section rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "sent"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-dark"
          }`}
        >
          Sent
          {sentOffers.length > 0 && (
            <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
              {sentOffers.length}
            </span>
          )}
        </button>

        {isSeller && (
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "received"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-dark"
            }`}
          >
            Received
            {receivedOffers.length > 0 && (
              <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {receivedOffers.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <OfferListSkeleton />
      ) : currentOffers.length === 0 ? (
        <EmptyOffers
          label={activeTab === "sent" ? "sent offers" : "received offers"}
        />
      ) : (
        <div className="space-y-3">
          {currentOffers.map((offer) => (
            <OfferCard
              key={offer._id}
              offer={offer}
              viewAs={viewAs as "buyer" | "seller"}
              onClick={handleOfferClick}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <OfferDetailSheet
        offer={selectedOffer}
        open={sheetOpen}
        onClose={handleSheetClose}
        viewAs={viewAs as "buyer" | "seller"}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
