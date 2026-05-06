import { api } from "@/lib/axios";
import type {
  ApiResponse,
  IOrder,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  OrderType,
} from "@vaultkix/types";

type OrderData = { order: IOrder };
type OrdersData = { orders: IOrder[] };

export const ordersService = {
  async createOrder(payload: CreateOrderPayload): Promise<IOrder> {
    const { data } = await api.post<ApiResponse<OrderData>>("/orders", payload);
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.order;
  },

  async getOrders(role: "buyer" | "seller"): Promise<IOrder[]> {
    const { data } = await api.get<ApiResponse<OrdersData>>("/orders", {
      params: { role },
    });
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.orders;
  },

  async getOrder(orderId: string): Promise<IOrder> {
    const { data } = await api.get<ApiResponse<OrderData>>(
      `/orders/${orderId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.order;
  },

  async updateOrderStatus(
    orderId: string,
    payload: UpdateOrderStatusPayload,
  ): Promise<IOrder> {
    const { data } = await api.patch<ApiResponse<OrderData>>(
      `/orders/${orderId}/status`,
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.order;
  },

  async confirmOrderType(orderId: string, type: OrderType): Promise<IOrder> {
    const { data } = await api.patch<ApiResponse<OrderData>>(
      `/orders/${orderId}/confirm-type`,
      { type },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.order;
  },

  async cancelOrder(orderId: string): Promise<IOrder> {
    const { data } = await api.patch<ApiResponse<OrderData>>(
      `/orders/${orderId}/cancel`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.order;
  },
};
