"use client";

import { useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth.store";
import type { OfferUpdateEvent } from "@vaultkix/types";

type OfferEventType =
  | "offer:received"
  | "offer:countered"
  | "offer:accepted"
  | "offer:rejected";

interface UseOfferRealtimeOptions {
  offerId?: string | null;
  onEvent: (event: OfferUpdateEvent) => void;
}

export function useOfferRealtime({
  offerId,
  onEvent,
}: UseOfferRealtimeOptions) {
  const { isAuthenticated } = useAuthStore();

  // Stable callback ref to avoid re-subscribing on every render
  const handleEvent = useCallback(
    (data: OfferUpdateEvent) => {
      // If watching a specific offer, filter — otherwise accept all
      if (!offerId || data.offerId === offerId) {
        onEvent(data);
      }
    },
    [offerId, onEvent],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    // Join specific offer room if provided
    if (offerId) socket.emit("join:offer", offerId);

    const events: OfferEventType[] = [
      "offer:received",
      "offer:countered",
      "offer:accepted",
      "offer:rejected",
    ];

    events.forEach((event) => socket.on(event, handleEvent));

    return () => {
      if (offerId) socket.emit("leave:offer", offerId);
      events.forEach((event) => socket.off(event, handleEvent));
    };
  }, [isAuthenticated, offerId, handleEvent]);
}
