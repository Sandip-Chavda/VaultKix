import { StatusBadge } from "@/components/shared/StatusBadge";
import type { OrderStatus } from "@vaultkix/types";

const STATUS_MAP: Record<
  OrderStatus,
  {
    label: string;
    variant: "success" | "destructive" | "pending" | "warning" | "default";
  }
> = {
  pending_payment: { label: "Pending Payment", variant: "warning" },
  paid: { label: "Paid", variant: "pending" },
  verified: { label: "Verified", variant: "pending" },
  vaulted: { label: "Vaulted", variant: "success" },
  shipped: { label: "Shipped", variant: "pending" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <StatusBadge label={label} variant={variant} />;
}
