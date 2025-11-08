"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PawPrint, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type HeaderActionVariant = "primary" | "outline";

export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: HeaderActionVariant;
}

export interface HeaderAlert {
  label: string;
  tone?: "default" | "warning" | "critical";
  icon?: React.ReactNode;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  defaultSearchValue?: string;
  onSearch?: (term: string) => void;
  isSearching?: boolean;
  actions?: HeaderAction[];
  alerts?: HeaderAlert[];
  children?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  searchPlaceholder = "Buscar…",
  defaultSearchValue = "",
  onSearch,
  isSearching,
  actions = [],
  alerts = [],
  children,
}: HeaderProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(defaultSearchValue);

  useEffect(() => {
    setSearchTerm(defaultSearchValue);
  }, [defaultSearchValue]);

  const greeting = useMemo(() => {
    if (!user?.name) return "Olá";
    const firstName = user.name.split(" ")[0];
    return `Olá, ${firstName}`;
  }, [user]);

  const effectiveTitle = title ?? greeting;
  const effectiveSubtitle =
    subtitle ?? "Aqui está o resumo do seu hospital hoje — mantenha o ritmo das filas e consultas.";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <h1 className="truncate text-left text-xl font-semibold text-foreground">
            {effectiveTitle}
          </h1>
          <p className="text-left text-sm text-muted-foreground">{effectiveSubtitle}</p>
        </div>

        {(alerts.length > 0 || onSearch || actions.length > 0) && (
          <div className="flex flex-col gap-2 sm:max-w-md sm:flex-none">
            {alerts.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {alerts.map((alert, index) => (
                  <span key={`${alert.label}-${index}`} className="inline-flex items-center gap-1">
                    {alert.icon ?? <PawPrint className="h-3 w-3 text-muted-foreground/80" />}
                    {alert.label}
                  </span>
                ))}
              </div>
            )}

            {(onSearch || actions.length > 0) && (
              <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                {onSearch && (
                  <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-border pb-1">
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-8 w-28 border-none bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-44"
                    />
                    <Button type="submit" size="sm" variant="ghost" className="px-2">
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Buscar</span>
                    </Button>
                  </form>
                )}

                {actions.length > 0 &&
                  actions.map((action) => (
                    <Button
                      key={action.label}
                      onClick={action.onClick}
                      size="sm"
                      variant={action.variant === "outline" ? "secondary" : "ghost"}
                      className="gap-1 px-2 text-sm"
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}