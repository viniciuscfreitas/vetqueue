import { Priority } from "@/lib/api";
import { Badge } from "./ui/badge";
import { AlertTriangle, ArrowUp, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig = {
  [Priority.EMERGENCY]: {
    label: "Emergência",
    bgColor: "#D62727",
    borderColor: "#b91c1c",
    icon: AlertTriangle,
  },
  [Priority.HIGH]: {
    label: "Alta",
    bgColor: "#B78844",
    borderColor: "#a67c3d",
    icon: ArrowUp,
  },
  [Priority.NORMAL]: {
    label: "Normal",
    bgColor: "#259DE3",
    borderColor: "#1e7bb8",
    icon: Minus,
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge 
      className="border flex items-center gap-1 font-semibold text-white shadow-sm" 
      variant="default"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

