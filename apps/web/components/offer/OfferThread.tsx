import { TrendingUp, RefreshCw, Check, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IOfferThread } from "@vaultkix/types";

const THREAD_ICONS = {
  offered: <TrendingUp className="w-3.5 h-3.5 text-primary" />,
  countered: <RefreshCw className="w-3.5 h-3.5 text-yellow-600" />,
  accepted: <Check className="w-3.5 h-3.5 text-success" />,
  rejected: <X className="w-3.5 h-3.5 text-destructive" />,
  pending: <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />,
};

interface OfferThreadProps {
  thread: IOfferThread[];
}

export function OfferThread({ thread }: OfferThreadProps) {
  if (!thread.length) return null;

  return (
    <div className="space-y-2">
      {thread.map((entry, i) => {
        const isBuyer = entry.from === "buyer";
        return (
          <div
            key={i}
            className={`flex items-center gap-3 ${isBuyer ? "" : "flex-row-reverse"}`}
          >
            {/* Icon */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isBuyer ? "bg-primary-light" : "bg-section"
              }`}
            >
              {THREAD_ICONS[entry.status] ?? THREAD_ICONS.pending}
            </div>

            {/* Bubble */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 ${
                isBuyer ? "bg-primary-light" : "bg-section"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {isBuyer ? "Offered Amount" : "Counter Offer"}
                  </p>
                  <p className="font-bold text-dark">
                    {formatCurrency(entry.amount)}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">
                  {formatDate(entry.timestamp)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
