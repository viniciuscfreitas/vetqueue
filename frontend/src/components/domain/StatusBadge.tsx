import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusBadgeProps {
  status: 'Aguardando' | 'Em Atendimento';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
  const statusClasses = status === 'Em Atendimento'
    ? "badge-success"
    : "badge-warning";
  return <div className={cn(baseClasses, statusClasses)}>{status}</div>;
};

export { StatusBadge };
