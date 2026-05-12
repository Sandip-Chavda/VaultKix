import { TrendingUp, ShoppingBag, Tag, Package, BarChart2 } from "lucide-react";
import type { IUserStats } from "@vaultkix/types";

export function UserStatsGrid({ stats }: { stats: IUserStats }) {
  const items = [
    { label: "Bids Placed", value: stats.bidsPlaced, icon: TrendingUp },
    { label: "Offers Made", value: stats.offersMade, icon: Tag },
    {
      label: "Offers Received",
      value: stats.offersReceived,
      icon: ShoppingBag,
    },
    { label: "Positions Held", value: stats.positionsHeld, icon: Package },
    { label: "Trades Made", value: stats.tradesMade, icon: BarChart2 },
  ];

  return (
    <div className="bg-background rounded-2xl border border-border p-5">
      <h2 className="font-bold text-dark mb-4">Activity</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-section rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-xl font-bold text-dark">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
