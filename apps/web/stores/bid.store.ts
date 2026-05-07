import { create } from "zustand";
import { bidsService } from "@/lib/api/bids.service";
import type {
  IAuction,
  AuctionTimeRemaining,
  BidUpdatedEvent,
} from "@vaultkix/types";
import { getErrorMessage } from "@/lib/utils";

interface BidState {
  auction: IAuction | null;
  timeRemaining: AuctionTimeRemaining | null;
  isExpired: boolean;
  isLoading: boolean;
  error: string | null;
}

interface BidActions {
  fetchAuction: (productId: string) => Promise<void>;
  placeBid: (productId: string, amount: number) => Promise<void>;
  updateBidRealtime: (data: BidUpdatedEvent) => void;
  clearAuction: () => void;
  clearError: () => void;
}

export const useBidStore = create<BidState & BidActions>()((set, get) => ({
  auction: null,
  timeRemaining: null,
  isExpired: false,
  isLoading: false,
  error: null,

  fetchAuction: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await bidsService.getAuction(productId);
      set({
        auction: result.auction,
        timeRemaining: result.timeRemaining,
        isExpired: result.isExpired,
        isLoading: false,
      });
    } catch {
      // No auction is a valid state — not an error to surface
      set({ auction: null, isLoading: false });
    }
  },

  placeBid: async (productId, amount) => {
    set({ isLoading: true, error: null });
    try {
      const auction = await bidsService.placeBid(productId, amount);
      set({ auction, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  updateBidRealtime: (data) => {
    const current = get().auction;
    if (!current) return;
    set({
      auction: {
        ...current,
        currentHighestBid: data.currentHighestBid,
        totalBidsCount: data.totalBidsCount,
        bidIncrement: data.bidIncrement,
        auctionEndsAt: data.auctionEndsAt,
      },
    });
  },

  clearAuction: () =>
    set({ auction: null, timeRemaining: null, isExpired: false }),
  clearError: () => set({ error: null }),
}));
