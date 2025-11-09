"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type HeaderActionVariant = "primary" | "outline";

export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: HeaderActionVariant;
  ariaLabel?: string;
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
  children?: React.ReactNode;
  showGreeting?: boolean;
  actionsPlacement?: HeaderActionsPlacement;
  subtitleClassName?: string;
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
  const hasSearch = Boolean(onSearch || onSearchChange);
  const hasLowerRow = hasSearch || bottomActions.length > 0;

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
              <p
                className={cn(
                  "max-w-full text-left text-xs text-muted-foreground whitespace-nowrap truncate",
                  subtitleClassName,
                )}
              >
                {effectiveSubtitle}
              </p>
            )}
          </div>
          {renderActions(topActions, "justify-end")}
        </div>

        {hasLowerRow && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {(hasSearch || bottomActions.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {hasSearch && (
                  <form
                    onSubmit={handleSubmit}
                    className="group flex min-w-[220px] items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5 transition focus-within:border-foreground focus-within:bg-background focus-within:shadow-sm"
                  >
                    <label htmlFor={searchInputId} className="sr-only">
                      {searchLabel ?? "Buscar"}
                    </label>
                    <Search
                      className="h-4 w-4 text-muted-foreground transition group-focus-within:text-foreground"
                      aria-hidden
                    />
                    <Input
                      id={searchInputId}
                      value={currentSearchValue}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="flex-1 border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {onSearch && (
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-muted-foreground transition group-hover:text-foreground group-focus-within:text-foreground"
                      >
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