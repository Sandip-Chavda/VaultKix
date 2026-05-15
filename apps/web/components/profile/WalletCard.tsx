import { TrendingUp, TrendingDown, Wallet, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { IWallet } from "@vaultkix/types";

export function WalletCard({ wallet }: { wallet: IWallet }) {
  const stats = [
    {
      label: "Balance",
      value: formatCurrency(wallet.balance),
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary-light",
    },
    {
      label: "Escrow Hold",
      value: formatCurrency(wallet.escrowHold),
      icon: Lock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Total Spent",
      value: formatCurrency(wallet.totalSpent),
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-red-50",
    },
    {
      label: "Total Earned",
      value: formatCurrency(wallet.totalEarned),
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="bg-background rounded-2xl border border-border p-4 md:p-5">
      <h2 className="font-bold text-dark mb-3 md:mb-4">Wallet</h2>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-2.5 md:p-3`}>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
              <p className="text-xs text-muted-foreground truncate">{label}</p>
            </div>
            <p className={`text-base md:text-lg font-bold ${color} truncate`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
