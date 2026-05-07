import { StatusBadge } from "@/components/shared/StatusBadge";
import type { OfferStatus } from "@vaultkix/types";

const STATUS_MAP: Record<
  OfferStatus,
  { label: string; variant: "success" | "destructive" | "pending" | "default" }
> = {
  negotiating: { label: "Negotiating", variant: "pending" },
  accepted: { label: "Accepted", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "default" },
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <StatusBadge label={label} variant={variant} />;
}
