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
  searchPlaceholder = "Buscar por pet, tutor ou atendimento...",
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
    if (!user?.name) return "Olá!";
    const firstName = user.name.split(" ")[0];
    const honorific = user.role === "VET" ? "Dr(a)." : "";
    return `Olá, ${honorific} ${firstName}!`.replace("  ", " ");
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
    <div className="mx-auto w-full max-w-6xl space-y-4 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{effectiveTitle}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{effectiveSubtitle}</p>
        </div>
        {alerts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {alerts.map((alert, index) => (
              <span
                key={`${alert.label}-${index}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
                  alert.tone === "critical"
                    ? "bg-rose-100 text-rose-700"
                    : alert.tone === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-primary/10 text-primary",
                )}
              >
                {alert.icon ?? <PawPrint className="h-3.5 w-3.5" />}
                {alert.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {(onSearch || actions.length > 0) && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {onSearch && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 items-center gap-2 rounded-xl border border-transparent bg-white px-3 py-2 shadow-sm transition focus-within:border-primary/40 focus-within:shadow-md"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="border-none bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="submit" size="sm" className="whitespace-nowrap">
                {isSearching ? "Buscando..." : "Buscar"}
              </Button>
            </form>
          )}
          {actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  size="sm"
                  variant={action.variant === "outline" ? "outline" : "default"}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {children && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4">{children}</div>
      )}
    </div>
  );
}