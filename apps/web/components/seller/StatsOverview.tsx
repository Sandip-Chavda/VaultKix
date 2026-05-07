import { TrendingUp, Package, ShoppingBag, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SafeUser } from "@vaultkix/types";

interface StatsOverviewProps {
  user: SafeUser;
}

export function StatsOverview({ user }: StatsOverviewProps) {
  const stats = [
    {
      label: "Total Earned",
      value: formatCurrency(user.wallet.totalEarned),
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-green-50",
    },
    {
      label: "Wallet Balance",
      value: formatCurrency(user.wallet.balance),
      icon: Tag,
      color: "text-primary",
      bg: "bg-primary-light",
    },
    {
      label: "Offers Received",
      value: user.stats.offersReceived,
      icon: ShoppingBag,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Trades Made",
      value: user.stats.tradesMade,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-background rounded-xl border border-border p-4"
        >
          <div
            className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}
          >
            <Icon className={`w-4.5 h-4.5 ${color}`} />
          </div>
          <p className="text-xl font-bold text-dark">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
