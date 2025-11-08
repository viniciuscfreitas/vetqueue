"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type HeaderActionVariant = "primary" | "outline";

export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: HeaderActionVariant;
  ariaLabel?: string;
}

export interface HeaderAlert {
  label: string;
  tone?: "default" | "warning" | "critical";
  icon?: React.ReactNode;
}

type HeaderActionsPlacement = "right" | "below";

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
  alerts?: HeaderAlert[];
  children?: React.ReactNode;
  showGreeting?: boolean;
  actionsPlacement?: HeaderActionsPlacement;
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
  alerts = [],
  children,
  showGreeting = true,
  actionsPlacement = "right",
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
    return `Olá, ${firstName}`;
  }, [user]);

  const effectiveTitle = title ?? (showGreeting ? greeting : "");
  const effectiveSubtitle =
    subtitle ??
    (showGreeting
      ? "Aqui está o resumo do seu hospital hoje — mantenha o ritmo das filas e consultas."
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

  const renderActions = (items: HeaderAction[], alignment: string) => {
    if (items.length === 0) return null;

    const mapVariant = (variant?: HeaderActionVariant) => {
      switch (variant) {
        case "primary":
          return "default";
        case "outline":
          return "secondary";
        default:
          return "ghost";
      }
    };

    return (
      <div className={`flex flex-wrap items-center gap-2 ${alignment}`}>
        {items.map((action) => (
          <Button
            key={action.label}
            type="button"
            onClick={action.onClick}
            size="sm"
            variant={mapVariant(action.variant)}
            className="gap-1 px-2 py-1.5 text-sm"
            aria-label={action.ariaLabel}
          >
            {action.icon}
            <span className="leading-none">{action.label}</span>
          </Button>
        ))}
      </div>
    );
  };

  const topActions = actionsPlacement === "right" ? actions : [];
  const bottomActions = actionsPlacement === "below" ? actions : [];
  const hasAlerts = alerts.length > 0;
  const hasSearch = Boolean(onSearch || onSearchChange);
  const hasLowerRow = hasAlerts || hasSearch || bottomActions.length > 0;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 py-3">
        <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:py-3">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            {effectiveTitle && (
              <h1 className="truncate text-left text-xl font-semibold text-foreground">
                {effectiveTitle}
              </h1>
            )}
            {effectiveSubtitle && (
              <p className="max-w-xl text-left text-sm text-muted-foreground">{effectiveSubtitle}</p>
            )}
          </div>
          {renderActions(topActions, "justify-end")}
        </div>

        {hasLowerRow && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {hasAlerts && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                {alerts.map((alert, index) => (
                  <span key={`${alert.label}-${index}`} className="inline-flex items-center gap-1">
                    {alert.icon ?? <span className="text-muted-foreground/60">•</span>}
                    {alert.label}
                  </span>
                ))}
              </div>
            )}

            {(hasSearch || bottomActions.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {hasSearch && (
                  <form
                    onSubmit={handleSubmit}
                    className="group flex items-center gap-2 border-b border-transparent focus-within:border-foreground"
                  >
                    <label htmlFor={searchInputId} className="sr-only">
                      {searchLabel ?? "Buscar"}
                    </label>
                    <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <Input
                      id={searchInputId}
                      value={currentSearchValue}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-8 w-28 border-none bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-44"
                    />
                    {onSearch && (
                      <Button type="submit" size="sm" variant="ghost" className="px-2">
                        {isSearching ? "Buscando…" : "Buscar"}
                      </Button>
                    )}
                  </form>
                )}

                {renderActions(bottomActions, "justify-end")}
              </div>
            )}
          </div>
        )}
      </div>

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}