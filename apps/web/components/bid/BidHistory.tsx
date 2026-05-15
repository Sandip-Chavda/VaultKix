"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { bidsService } from "@/lib/api/bids.service";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth.store";
import type {
  IBidHistoryEntry,
  BidUpdatedEvent,
  SafeUser,
} from "@vaultkix/types";

interface BidHistoryProps {
  productId: string;
  totalBidsCount: number;
}

export function BidHistory({ productId, totalBidsCount }: BidHistoryProps) {
  const { isAuthenticated } = useAuthStore();
  const [history, setHistory] = useState<IBidHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bidsService.getBidHistory(productId);
      setHistory(data.bidsHistory ?? []);
    } catch {
      setError("Failed to load bid history");
    }
    setIsLoading(false);
  }, [productId]);

  // Fix 1 — wrap loadHistory call in startTransition
  useEffect(() => {
    if (expanded && history.length === 0) {
      startTransition(() => {
        loadHistory();
      });
    }
  }, [expanded, loadHistory, history.length]);

  // Fix 2 — don't return socket from cleanup
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();

    const handleBidUpdate = (_data: BidUpdatedEvent) => {
      if (expanded) loadHistory();
    };

    socket.on("bid:updated", handleBidUpdate);

    return () => {
      socket.off("bid:updated", handleBidUpdate);
      // void return — no socket returned
    };
  }, [isAuthenticated, expanded, loadHistory]);

  if (totalBidsCount === 0) return null;

  // Fix 3 — proper bidder name extraction
  const getBidderLabel = (bidderId: IBidHistoryEntry["bidderId"]): string => {
    if (typeof bidderId === "object" && bidderId !== null) {
      const user = bidderId as SafeUser;
      if (user.username) return user.username;
      if (user._id) return String(user._id).slice(-6);
    }
    return String(bidderId).slice(-6);
  };

  const getBidderInitial = (bidderId: IBidHistoryEntry["bidderId"]): string => {
    const label = getBidderLabel(bidderId);
    return label[0]?.toUpperCase() ?? "?";
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-3 hover:bg-section transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-dark">Bid History</span>
          <span className="bg-primary-light text-primary text-xs font-medium rounded-full px-2 py-0.5">
            {totalBidsCount}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* History list */}
      {expanded && (
        <div className="border-t border-border">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {error}
            </p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No bids yet
            </p>
          ) : (
            <div className="divide-y divide-border max-h-60 overflow-y-auto">
              {/* Header */}
              <div className="grid grid-cols-3 px-3 py-2 bg-section">
                <p className="text-xs font-semibold text-muted-foreground">
                  Bidder
                </p>
                <p className="text-xs font-semibold text-muted-foreground text-center">
                  Amount
                </p>
                <p className="text-xs font-semibold text-muted-foreground text-right">
                  Time
                </p>
              </div>

              {/* Rows */}
              {history.map((entry, index) => {
                const label = getBidderLabel(entry.bidderId);
                const initial = getBidderInitial(entry.bidderId);
                const isHighest = index === 0;

                return (
                  <div
                    key={index}
                    className={`grid grid-cols-3 px-3 py-2.5 items-center ${
                      isHighest ? "bg-primary-light/50" : ""
                    }`}
                  >
                    {/* Bidder */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary font-bold">
                          {initial}
                        </span>
                      </div>
                      <span className="text-xs text-dark font-medium truncate">
                        {label.length > 10 ? `${label.slice(0, 8)}...` : label}
                      </span>
                      {isHighest && (
                        <span className="text-[9px] bg-primary text-white rounded px-1 shrink-0">
                          Top
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <p
                      className={`text-sm font-bold text-center ${
                        isHighest ? "text-primary" : "text-dark"
                      }`}
                    >
                      {formatCurrency(entry.amount)}
                    </p>

                    {/* Time */}
                    <p className="text-xs text-muted-foreground text-right">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
