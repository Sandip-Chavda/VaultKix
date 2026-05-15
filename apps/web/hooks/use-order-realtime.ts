"use client";

import { useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth.store";
import type { OrderUpdatedEvent } from "@vaultkix/types";

interface UseOrderRealtimeOptions {
  onEvent: (event: OrderUpdatedEvent) => void;
}

export function useOrderRealtime({ onEvent }: UseOrderRealtimeOptions) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    socket.on("order:updated", onEvent);
    return () => {
      socket.off("order:updated", onEvent);
    };
  }, [isAuthenticated, onEvent]);
}
