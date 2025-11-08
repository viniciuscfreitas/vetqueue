"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleKey, Role, permissionsApi } from "@/lib/api";
import { createErrorHandler } from "@/lib/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const MANAGEABLE_ROLES: Role[] = [Role.RECEPCAO, Role.VET];
const EMPTY_ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  [Role.ADMIN]: [],
  [Role.RECEPCAO]: [],
  [Role.VET]: [],
};
type RolePermissionsMap = Record<Role, ModuleKey[]>;

const CRITICAL_MODULES = new Set<ModuleKey>([ModuleKey.PERMISSIONS]);

function clonePermissions(data?: RolePermissionsMap): RolePermissionsMap {
  return {
    [Role.ADMIN]: [...(data?.[Role.ADMIN] ?? [])],
    [Role.RECEPCAO]: [...(data?.[Role.RECEPCAO] ?? [])],
    [Role.VET]: [...(data?.[Role.VET] ?? [])],
  };
}

function sanitizeModules(modules: ModuleKey[], validKeys: Set<ModuleKey>): ModuleKey[] {
  return modules.filter((module) => validKeys.has(module));
}

export default function PermissionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();
  const canConfigurePermissions = user?.role === Role.ADMIN && canAccess(ModuleKey.PERMISSIONS);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && !canConfigurePermissions) {
      router.push("/");
    }
  }, [authLoading, user, canConfigurePermissions, router]);

  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["permissions", "modules"],
    queryFn: () => permissionsApi.listModules().then((res) => res.data),
    enabled: !authLoading && !!user && canConfigurePermissions,
  });

  const { data: rolePermissions = EMPTY_ROLE_PERMISSIONS, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: () => permissionsApi.listAll().then((res) => res.data),
    enabled: !authLoading && !!user && canConfigurePermissions,
  });

  const validModuleKeys = useMemo(() => {
    return new Set(modulesData?.map((module) => module.key) ?? []);
  }, [modulesData]);

  const updateMutation = useMutation({
    mutationFn: ({ role, modules }: { role: Role; modules: ModuleKey[] }) =>
      permissionsApi.updateRole(role, modules).then((res) => res.data.modules),
  });

  const [expandedRoles, setExpandedRoles] = useState<Record<Role, boolean>>({
    [Role.ADMIN]: false,
    [Role.RECEPCAO]: true,
    [Role.VET]: false,
  });

  const roleCopy: Record<Role, { title: string; description: string }> = {
    [Role.ADMIN]: {
      title: "Administrador",
      description: "Acesso total a todos os módulos.",
    },
    [Role.RECEPCAO]: {
      title: "Recepção",
      description: "Rotinas de atendimento, cadastros básicos e suporte à operação.",
    },
    [Role.VET]: {
      title: "Veterinário",
      description: "Recursos assistenciais para acompanhar filas e prontuários.",
    },
  };

  const toggleRole = (role: Role) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleToggle = async (role: Role, moduleKey: ModuleKey, checked: boolean) => {
    if (!modulesData) {
      return;
    }

    if (!checked && CRITICAL_MODULES.has(moduleKey) && role === user?.role) {
      toast({
        variant: "destructive",
        title: "Permissão obrigatória",
        description: "Você não pode remover a própria permissão de gerenciar acessos.",
      });
      return;
    }

    const currentModules = rolePermissions[role] ?? [];
    const nextModules = checked
      ? Array.from(new Set([...currentModules, moduleKey]))
      : currentModules.filter((module) => module !== moduleKey);

    const filteredNextModules = sanitizeModules(nextModules, validModuleKeys);

    const previous =
      (queryClient.getQueryData<RolePermissionsMap>(["permissions", "roles"]) ??
        rolePermissions) as RolePermissionsMap;
    const previousClone = clonePermissions(previous);

    const optimistic = clonePermissions(previousClone);
    optimistic[role] = filteredNextModules;
    queryClient.setQueryData<RolePermissionsMap>(["permissions", "roles"], optimistic);

    try {
      const updatedModules = await updateMutation.mutateAsync({
        role,
        modules: filteredNextModules,
      });
      const sanitizedResponse = sanitizeModules(updatedModules, validModuleKeys);

      const confirmed = clonePermissions(optimistic);
      confirmed[role] = sanitizedResponse;
      queryClient.setQueryData<RolePermissionsMap>(["permissions", "roles"], confirmed);

      toast({
        title: "Permissões atualizadas",
        description: `Permissões de ${role} salvas com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ["permissions", "roles"] });
    } catch (error) {
      queryClient.setQueryData<RolePermissionsMap>(["permissions", "roles"], previousClone);
      handleError(error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canConfigurePermissions) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Você não possui acesso ao módulo de permissões.
      </div>
    );
  }

  const isLoading = modulesLoading || permsLoading;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Defina quais módulos cada perfil pode acessar. Alterações são aplicadas imediatamente.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {roleCopy[Role.ADMIN].title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  {roleCopy[Role.ADMIN].description}
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Acesso total
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-muted-foreground/30 bg-background shadow-sm">
            <div className="border-b border-muted-foreground/20 px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">Roles disponíveis</p>
              <p className="text-xs text-muted-foreground/80">
                Clique para expandir e ajustar os módulos de cada perfil.
              </p>
            </div>

            <div className="divide-y divide-muted-foreground/20">
              {MANAGEABLE_ROLES.map((role) => {
                const assignedModules = new Set(rolePermissions[role] ?? []);
                const isExpanded = expandedRoles[role];

                return (
                  <div key={role} className="bg-background/60">
                    <button
                      type="button"
                      onClick={() => toggleRole(role)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                            "bg-primary/10 text-primary",
                          )}
                        >
                          {role === Role.RECEPCAO ? "R" : "V"}
                        </span>
                        <div>
                          <p className="font-medium">{roleCopy[role].title}</p>
                          <p className="text-xs text-muted-foreground">
                            {roleCopy[role].description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{assignedModules.size} módulos ativos</span>
                        <ChevronRight
                          className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
                        />
                      </div>
                    </button>

                    <div
                      className={cn(
                        "space-y-2 border-t border-muted-foreground/10 px-4 pb-4 pt-3",
                        !isExpanded && "hidden",
                      )}
                    >
                      {modulesData?.map((module) => (
                        <label
                          key={module.key}
                          className={cn(
                            "group flex items-start gap-3 rounded-md border border-transparent px-3 py-2",
                            "hover:border-muted-foreground/40 hover:bg-muted/30",
                          )}
                        >
                          <Checkbox
                            checked={assignedModules.has(module.key)}
                            onCheckedChange={(checked) =>
                              void handleToggle(role, module.key, Boolean(checked))
                            }
                            disabled={
                              updateMutation.isPending ||
                              (CRITICAL_MODULES.has(module.key) && role === user?.role)
                            }
                          />
                          <div className="space-y-1">
                            <span className="text-sm font-medium leading-none">{module.label}</span>
                            {module.description && (
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
