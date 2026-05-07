import { create } from "zustand";
import { offersService } from "@/lib/api/offers.service";
import type {
  IOffer,
  MakeOfferPayload,
  CounterOfferPayload,
  OfferDetailResponse,
} from "@vaultkix/types";
import { getErrorMessage } from "@/lib/utils";

interface OfferState {
  sentOffers: IOffer[];
  receivedOffers: IOffer[];
  selectedOffer: OfferDetailResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface OfferActions {
  makeOffer: (productId: string, payload: MakeOfferPayload) => Promise<IOffer>;
  counterOffer: (
    offerId: string,
    payload: CounterOfferPayload,
  ) => Promise<void>;
  acceptOffer: (offerId: string) => Promise<void>;
  rejectOffer: (offerId: string) => Promise<void>;
  fetchOffer: (offerId: string) => Promise<void>;
  fetchSentOffers: () => Promise<void>;
  fetchReceivedOffers: () => Promise<void>;
  clearError: () => void;
}

export const useOfferStore = create<OfferState & OfferActions>()((set) => ({
  sentOffers: [],
  receivedOffers: [],
  selectedOffer: null,
  isLoading: false,
  error: null,

  makeOffer: async (productId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const offer = await offersService.makeOffer(productId, payload);
      set({ isLoading: false });
      return offer;
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  counterOffer: async (offerId, payload) => {
    set({ isLoading: true, error: null });
    try {
      await offersService.counterOffer(offerId, payload);
      set({ isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  acceptOffer: async (offerId) => {
    set({ isLoading: true, error: null });
    try {
      await offersService.acceptOffer(offerId);
      set({ isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  rejectOffer: async (offerId) => {
    set({ isLoading: true, error: null });
    try {
      await offersService.rejectOffer(offerId);
      set({ isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  fetchOffer: async (offerId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await offersService.getOffer(offerId);
      set({ selectedOffer: result, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
    }
  },

  fetchSentOffers: async () => {
    set({ isLoading: true, error: null });
    try {
      const offers = await offersService.getSentOffers();
      set({ sentOffers: offers, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
    }
  },

  fetchReceivedOffers: async () => {
    set({ isLoading: true, error: null });
    try {
      const offers = await offersService.getReceivedOffers();
      set({ receivedOffers: offers, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
    }
  },

  clearError: () => set({ error: null }),
}));
