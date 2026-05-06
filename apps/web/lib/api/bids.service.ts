import { api } from "@/lib/axios";
import type {
  ApiResponse,
  IAuction,
  AuctionTimeRemaining,
  CreateAuctionPayload,
} from "@vaultkix/types";

type AuctionData = { auction: IAuction };

type AuctionDetailData = {
  auction: IAuction;
  timeRemaining: AuctionTimeRemaining;
  isExpired: boolean;
};

type BidHistoryData = {
  auctionId: string;
  productId: string;
  currentHighestBid: number;
  totalBidsCount: number;
  status: string;
  bidsHistory: IAuction["bidsHistory"];
};

type MyAuctionsData = { auctions: IAuction[] };

export const bidsService = {
  async getAuction(productId: string): Promise<AuctionDetailData> {
    const { data } = await api.get<ApiResponse<AuctionDetailData>>(
      `/bids/${productId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async createAuction(
    productId: string,
    payload: CreateAuctionPayload,
  ): Promise<IAuction> {
    const { data } = await api.post<ApiResponse<AuctionData>>(
      `/bids/${productId}/auction`,
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.auction;
  },

  async placeBid(productId: string, amount: number): Promise<IAuction> {
    const { data } = await api.post<ApiResponse<AuctionData>>(
      `/bids/${productId}`,
      { amount },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.auction;
  },

  async getBidHistory(productId: string): Promise<BidHistoryData> {
    const { data } = await api.get<ApiResponse<BidHistoryData>>(
      `/bids/${productId}/history`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async cancelAuction(productId: string): Promise<void> {
    await api.patch(`/bids/${productId}/cancel`);
  },

  async getMyAuctions(): Promise<IAuction[]> {
    const { data } =
      await api.get<ApiResponse<MyAuctionsData>>("/bids/my-auctions");
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.auctions;
  },
};
