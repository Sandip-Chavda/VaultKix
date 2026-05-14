import {
  Check,
  Clock,
  Package,
  Truck,
  Vault,
  X,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import type { OrderStatus } from "@vaultkix/types";

// ── Step definitions ──────────────────────────────────────────────────────────

interface TimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const DELIVERY_STEPS: TimelineStep[] = [
  {
    status: "pending_payment",
    label: "Awaiting Payment",
    description: "Waiting for buyer to complete payment",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    status: "paid",
    label: "Payment Confirmed",
    description: "Payment received, awaiting verification",
    icon: <Check className="w-4 h-4" />,
  },
  {
    status: "verified",
    label: "Verified",
    description: "Product verified by seller",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    status: "shipped",
    label: "Shipped",
    description: "Order is on its way",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Order successfully delivered",
    icon: <Package className="w-4 h-4" />,
  },
];

const POSITION_STEPS: TimelineStep[] = [
  {
    status: "pending_payment",
    label: "Awaiting Payment",
    description: "Waiting for buyer to complete payment",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    status: "paid",
    label: "Payment Confirmed",
    description: "Payment received, awaiting verification",
    icon: <Check className="w-4 h-4" />,
  },
  {
    status: "verified",
    label: "Verified",
    description: "Product verified by seller",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    status: "vaulted",
    label: "Vaulted",
    description: "Product secured in vault",
    icon: <Vault className="w-4 h-4" />,
  },
];

// ── Status order for comparison ───────────────────────────────────────────────

const STATUS_ORDER: OrderStatus[] = [
  "pending_payment",
  "paid",
  "verified",
  "vaulted",
  "shipped",
  "delivered",
];

function getStepState(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus,
): "completed" | "current" | "upcoming" {
  if (currentStatus === "cancelled") return "upcoming";
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OrderTimelineProps {
  status: OrderStatus;
  type: "delivery" | "position";
}

export function OrderTimeline({ status, type }: OrderTimelineProps) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-destructive/20 rounded-xl p-3">
        <div className="w-9 h-9 rounded-full bg-destructive flex items-center justify-center shrink-0">
          <X className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-destructive text-sm">
            Order Cancelled
          </p>
          <p className="text-xs text-muted-foreground">
            This order has been cancelled
          </p>
        </div>
      </div>
    );
  }

  const steps = type === "position" ? POSITION_STEPS : DELIVERY_STEPS;

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const state = getStepState(step.status, status);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="flex gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  state === "completed"
                    ? "bg-success text-white"
                    : state === "current"
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-section text-muted-foreground border border-border"
                }`}
              >
                {state === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 my-1 min-h-[20px] ${
                    state === "completed" ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-semibold leading-none mt-2 ${
                  state === "current"
                    ? "text-primary"
                    : state === "completed"
                      ? "text-success"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
                {state === "current" && (
                  <span className="ml-2 text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5 align-middle">
                    Current
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
