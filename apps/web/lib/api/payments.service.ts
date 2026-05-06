import { api } from "@/lib/axios";
import type {
  ApiResponse,
  IOrder,
  PaymentInitiateResponse,
  PaymentStatusResponse,
} from "@vaultkix/types";

type ConfirmPaymentData = {
  order: IOrder;
  payout: { sellerPayout: string; platformFee: string };
};

export const paymentsService = {
  async initiatePayment(orderId: string): Promise<PaymentInitiateResponse> {
    const { data } = await api.post<ApiResponse<PaymentInitiateResponse>>(
      "/payments/initiate",
      { orderId },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async confirmPayment(orderId: string): Promise<ConfirmPaymentData> {
    const { data } = await api.post<ApiResponse<ConfirmPaymentData>>(
      `/payments/confirm/${orderId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    const { data } = await api.get<ApiResponse<PaymentStatusResponse>>(
      `/payments/status/${orderId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },
};
