import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string;
    growth?: string;
    icon: LucideIcon;
    iconColor: string;
    bgColor: string;
    description?: string;
    isUrgent?: boolean;
}

export function KPICard({
    title,
    value,
    growth,
    icon: Icon,
    iconColor,
    bgColor,
    description,
    isUrgent,
}: KPICardProps) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start relative overflow-hidden group hover:shadow-md transition-all">
            <div className="z-10">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-gray-700">{title}</h3>
                    {isUrgent && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                            URGENTE
                        </span>
                    )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                    {value}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {growth && (
                        <span className="text-green-500 font-medium flex items-center">
                            ↗ {growth}
                        </span>
                    )}
                    {description && <span className="text-gray-400">{description}</span>}
                </div>
            </div>

            <div
                className={cn(
                    "w-24 h-24 rounded-2xl flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform duration-300 shadow-inner",
                    bgColor
                )}
            >
                <Icon className={cn("w-12 h-12", iconColor)} />
            </div>
        </div>
    );
}
