import { Priority } from "@/lib/api";
import { Badge } from "./ui/badge";
import { AlertTriangle, ArrowUp, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig = {
  [Priority.EMERGENCY]: {
    label: "Emergência",
    className: "bg-red-600 text-white border-red-700 shadow-sm",
    icon: AlertTriangle,
  },
  [Priority.HIGH]: {
    label: "Alta",
    className: "bg-orange-500 text-white border-orange-600 shadow-sm",
    icon: ArrowUp,
  },
  [Priority.NORMAL]: {
    label: "Normal",
    className: "bg-blue-500 text-white border-blue-600 shadow-sm",
    icon: Minus,
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} border flex items-center gap-1 font-semibold`} variant="default">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

