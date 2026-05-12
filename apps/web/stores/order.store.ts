import { create } from "zustand";
import { ordersService } from "@/lib/api/orders.service";
import { paymentsService } from "@/lib/api/payments.service";
import { getErrorMessage } from "@/lib/utils";
import type { IOrder, UpdateOrderStatusPayload } from "@vaultkix/types";
import { toast } from "sonner";

interface OrderState {
  buyerOrders: IOrder[];
  sellerOrders: IOrder[];
  isLoading: boolean;
  error: string | null;
}

interface OrderActions {
  fetchBuyerOrders: () => Promise<void>;
  fetchSellerOrders: () => Promise<void>;
  updateStatus: (
    orderId: string,
    payload: UpdateOrderStatusPayload,
  ) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  initiatePayment: (
    orderId: string,
  ) => Promise<{ amount: number; platformFee: string; sellerPayout: string }>;
  confirmPayment: (orderId: string) => Promise<void>;
  clearError: () => void;
}

export const useOrderStore = create<OrderState & OrderActions>()(
  (set, get) => ({
    buyerOrders: [],
    sellerOrders: [],
    isLoading: false,
    error: null,

    fetchBuyerOrders: async () => {
      set({ isLoading: true, error: null });
      try {
        const orders = await ordersService.getOrders("buyer");
        set({ buyerOrders: orders, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: getErrorMessage(err) });
      }
    },

    fetchSellerOrders: async () => {
      set({ isLoading: true, error: null });
      try {
        const orders = await ordersService.getOrders("seller");
        set({ sellerOrders: orders, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: getErrorMessage(err) });
      }
    },

    updateStatus: async (orderId, payload) => {
      set({ error: null });
      try {
        const updated = await ordersService.updateOrderStatus(orderId, payload);
        set((state) => ({
          sellerOrders: state.sellerOrders.map((o) =>
            o._id === orderId ? updated : o,
          ),
        }));
        toast.success(`Order marked as ${payload.status}`);
      } catch (err) {
        set({ error: getErrorMessage(err) });
        throw err;
      }
    },

    cancelOrder: async (orderId) => {
      set({ error: null });
      try {
        const updated = await ordersService.cancelOrder(orderId);
        set((state) => ({
          buyerOrders: state.buyerOrders.map((o) =>
            o._id === orderId ? updated : o,
          ),
          sellerOrders: state.sellerOrders.map((o) =>
            o._id === orderId ? updated : o,
          ),
        }));
        toast.success("Order cancelled");
      } catch (err) {
        set({ error: getErrorMessage(err) });
        throw err;
      }
    },

    initiatePayment: async (orderId) => {
      set({ error: null });
      try {
        const result = await paymentsService.initiatePayment(orderId);
        return {
          amount: result.amount,
          platformFee: result.platformFee,
          sellerPayout: result.sellerPayout,
        };
      } catch (err) {
        set({ error: getErrorMessage(err) });
        throw err;
      }
    },

    confirmPayment: async (orderId) => {
      set({ error: null });
      try {
        await paymentsService.confirmPayment(orderId);
        // Refresh buyer orders after payment
        const orders = await ordersService.getOrders("buyer");
        set({ buyerOrders: orders });
        toast.success("Payment confirmed!");
      } catch (err) {
        set({ error: getErrorMessage(err) });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }),
);
