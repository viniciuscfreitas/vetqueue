import { PaymentStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  [PaymentStatus.PAID]: {
    label: "Pago",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  [PaymentStatus.PENDING]: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  [PaymentStatus.PARTIAL]: {
    label: "Parcial",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[PaymentStatus.PENDING];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

