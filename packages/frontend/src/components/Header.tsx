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
    <div className="mx-auto w-full max-w-6xl px-2 sm:px-0">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/90 px-3 py-3 shadow-sm ring-1 ring-slate-100/60 backdrop-blur-sm sm:px-4 lg:gap-4 lg:px-6">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <h1 className="truncate text-left text-2xl font-semibold tracking-tight text-slate-900">
            {effectiveTitle}
          </h1>
          <p className="text-left text-sm text-muted-foreground lg:max-w-xl">{effectiveSubtitle}</p>
        </div>

        {(alerts.length > 0 || onSearch || actions.length > 0) && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {alerts.length > 0 &&
              alerts.map((alert, index) => (
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

            {onSearch && (
              <form
                onSubmit={handleSubmit}
                className="flex h-11 w-full max-w-[320px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 shadow transition focus-within:border-primary/40 focus-within:shadow-md sm:w-auto"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-auto w-full border-none bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button type="submit" size="sm" className="whitespace-nowrap">
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </form>
            )}

            {actions.length > 0 && (
              <div className="flex flex-wrap items-center justify-end gap-2">
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
      </div>

      {children && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/70 p-4">{children}</div>
      )}
    </div>
  );
}