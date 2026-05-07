import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "success"
  | "destructive"
  | "pending"
  | "warning"
  | "default";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "bg-green-100 text-success border-green-200",
  destructive: "bg-red-100 text-destructive border-red-200",
  pending: "bg-primary-light text-primary border-primary/20",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  default: "bg-section text-muted-foreground border-border",
};

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  className?: string;
}

export function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(VARIANT_CLASSES[variant], "font-medium", className)}
    >
      {label}
    </Badge>
  );
}
