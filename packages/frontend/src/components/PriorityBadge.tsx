import { Priority } from "@/lib/api";
import { Badge } from "./ui/badge";

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig = {
  [Priority.EMERGENCY]: {
    label: "Emergência",
    className: "bg-red-500 text-gray-50",
  },
  [Priority.HIGH]: {
    label: "Alta",
    className: "bg-orange-500 text-gray-50",
  },
  [Priority.NORMAL]: {
    label: "Normal",
    className: "bg-blue-500 text-gray-50",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge className={config.className} variant="default">
      {config.label}
    </Badge>
  );
}

