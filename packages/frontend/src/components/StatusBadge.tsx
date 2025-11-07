import { PaymentStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  [PaymentStatus.PAID]: {
    label: "Pago",
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  [PaymentStatus.PENDING]: {
    label: "Pendente",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  },
  [PaymentStatus.PARTIAL]: {
    label: "Parcial",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
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

