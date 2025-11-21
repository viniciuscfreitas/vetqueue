"use client";

import { FormEvent, useEffect, useId, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeaderActionVariant = "primary" | "outline";

export type HeaderActionsPlacement = "right" | "below";

export type HeaderHelperVariant = "default" | "warning" | "success" | "info";

export interface HeaderHelper {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: HeaderHelperVariant;
}

export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: HeaderActionVariant;
  ariaLabel?: string;
  badgeCount?: number;
  badgeTone?: "default" | "info" | "success" | "warning" | "destructive";
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchLabel?: string;
  defaultSearchValue?: string;
  searchValue?: string;
  onSearchChange?: (term: string) => void;
  onSearch?: (term: string) => void;
  isSearching?: boolean;
  actions?: HeaderAction[];
  children?: ReactNode;
  showGreeting?: boolean;
  actionsPlacement?: HeaderActionsPlacement;
  subtitleClassName?: string;
  helper?: HeaderHelper;
}

export function Header({
  title,
  subtitle,
  searchPlaceholder = "Buscar…",
  searchLabel,
  defaultSearchValue = "",
  searchValue,
  onSearchChange,
  onSearch,
  isSearching,
  actions = [],
  children,
  showGreeting = true,
  actionsPlacement = "right",
  subtitleClassName,
  helper,
}: HeaderProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(defaultSearchValue);
  const searchInputId = useId();

  useEffect(() => {
    setSearchTerm(defaultSearchValue);
  }, [defaultSearchValue]);

  const greeting = useMemo(() => {
    if (!user?.name) return "Olá";
    const firstName = user.name.split(" ")[0];
    return `Olá, ${user.role === 'VET' ? 'Dr(a). ' : ''}${firstName}!`;
  }, [user]);

  const effectiveTitle = title ?? (showGreeting ? greeting : "");
  const effectiveSubtitle =
    subtitle ??
    (showGreeting
      ? "Aqui está o resumo do seu hospital hoje"
      : undefined);

  const isSearchControlled = searchValue !== undefined;
  const currentSearchValue = isSearchControlled ? searchValue : searchTerm;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(currentSearchValue.trim());
    }
  };

  const handleSearchChange = (value: string) => {
    if (!isSearchControlled) {
      setSearchTerm(value);
    }
    onSearchChange?.(value);
  };

  // Extract specific actions for the new layout
  const addAction = actions.find(a => a.label.toLowerCase().includes("adicionar") || a.label.toLowerCase().includes("novo"));
  const otherActions = actions.filter(a => a !== addAction);

  return (
    <header className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          {effectiveTitle} <span className="animate-wave">👋</span>
        </h1>
        <p className="text-gray-500 mt-1">{effectiveSubtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Button (Visual only for now, or functional if needed) */}
        <button className="p-3 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
          <Search className="w-5 h-5 text-gray-600" />
        </button>

        {/* Notification Bell */}
        <button className="p-3 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100 relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Primary Action (New Appointment) */}
        {addAction && (
          <button
            onClick={addAction.onClick}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
            {addAction.label}
          </button>
        )}

        {/* Render other actions if any (fallback) */}
        {otherActions.map((action, idx) => (
          <Button
            key={idx}
            onClick={action.onClick}
            variant={action.variant === 'outline' ? 'outline' : 'default'}
            size="sm"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </header>
  );
}