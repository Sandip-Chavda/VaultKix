"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useOrderStore } from "@/stores/order.store";
import { OrderCard } from "@/components/order/OrderCard";

import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import type { IOrder, OrderUpdatedEvent } from "@vaultkix/types";
import { useOrderRealtime } from "@/hooks/use-order-realtime";

const OrderDetailSheet = dynamic(
  () =>
    import("@/components/order/OrderDetailSheet").then(
      (m) => m.OrderDetailSheet,
    ),
  { ssr: false },
);

function EmptyOrders({ label }: { label: string }) {
  return (
    <div className="text-center py-20">
      <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-semibold text-dark">No {label} yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        {label === "purchases"
          ? "Accept an offer to create your first order."
          : "Orders from buyers will appear here."}
      </p>
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const {
    buyerOrders,
    sellerOrders,
    isLoading,
    fetchBuyerOrders,
    fetchSellerOrders,
  } = useOrderStore();

  const isSeller = user?.role === "seller";
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Derive selectedOrder live from the store — auto-updates when store changes
  const selectedOrder = useMemo(
    () =>
      [...buyerOrders, ...sellerOrders].find(
        (o) => o._id === selectedOrderId,
      ) ?? null,
    [buyerOrders, sellerOrders, selectedOrderId],
  );

  const loadOrders = useCallback(() => {
    fetchBuyerOrders();
    if (isSeller) fetchSellerOrders();
  }, [fetchBuyerOrders, fetchSellerOrders, isSeller]);

  // Refresh orders on real-time status update
  useOrderRealtime({
    onEvent: useCallback(
      (_event: OrderUpdatedEvent) => {
        loadOrders();
      },
      [loadOrders],
    ),
  });

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOrderClick = (order: IOrder) => {
    setSelectedOrderId(order._id);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedOrderId(null);
  };

  const currentOrders = activeTab === "buying" ? buyerOrders : sellerOrders;
  const viewAs = activeTab === "buying" ? "buyer" : "seller";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your purchases and sales
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-section rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("buying")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "buying"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-dark"
          }`}
        >
          Buying
          {buyerOrders.length > 0 && (
            <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
              {buyerOrders.length}
            </span>
          )}
        </button>

        {isSeller && (
          <button
            onClick={() => setActiveTab("selling")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "selling"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-dark"
            }`}
          >
            Selling
            {sellerOrders.length > 0 && (
              <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {sellerOrders.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <OrderListSkeleton />
      ) : currentOrders.length === 0 ? (
        <EmptyOrders label={activeTab === "buying" ? "purchases" : "sales"} />
      ) : (
        <div className="space-y-3">
          {currentOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              viewAs={viewAs as "buyer" | "seller"}
              onClick={handleOrderClick}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onClose={handleSheetClose}
        viewAs={viewAs as "buyer" | "seller"}
        onActionComplete={loadOrders}
      />
    </div>
  );
}
