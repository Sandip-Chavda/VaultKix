import { api } from "@/lib/axios";
import type {
  ApiResponse,
  IOffer,
  MakeOfferPayload,
  CounterOfferPayload,
  OfferDetailResponse,
} from "@vaultkix/types";

type OfferData = { offer: IOffer };
type OffersData = { offers: IOffer[] };

export const offersService = {
  async makeOffer(
    productId: string,
    payload: MakeOfferPayload,
  ): Promise<IOffer> {
    const { data } = await api.post<ApiResponse<OfferData>>(
      `/offers/${productId}`,
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.offer;
  },

  async counterOffer(
    offerId: string,
    payload: CounterOfferPayload,
  ): Promise<IOffer> {
    const { data } = await api.post<ApiResponse<OfferData>>(
      `/offers/${offerId}/counter`,
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.offer;
  },

  async acceptOffer(offerId: string): Promise<IOffer> {
    const { data } = await api.post<ApiResponse<OfferData>>(
      `/offers/${offerId}/accept`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.offer;
  },

  async rejectOffer(offerId: string): Promise<IOffer> {
    const { data } = await api.post<ApiResponse<OfferData>>(
      `/offers/${offerId}/reject`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.offer;
  },

  async getOffer(offerId: string): Promise<OfferDetailResponse> {
    const { data } = await api.get<ApiResponse<OfferDetailResponse>>(
      `/offers/${offerId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async getSentOffers(): Promise<IOffer[]> {
    const { data } = await api.get<ApiResponse<OffersData>>("/offers/sent");
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.offers;
  },

  async getReceivedOffers(filters?: {
    productId?: string;
    type?: string;
    size?: string;
  }): Promise<IOffer[]> {
    const { data } = await api.get<ApiResponse<OffersData>>(
      "/offers/received",
      { params: filters },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.offers;
  },
};
