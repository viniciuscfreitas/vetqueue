"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleDefinition, ModuleKey, Role, permissionsApi } from "@/lib/api";
import { createErrorHandler } from "@/lib/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

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

  const modulesByKey = useMemo(() => {
    const map = new Map<ModuleKey, ModuleDefinition>();
    modulesData?.forEach((module) => map.set(module.key, module));
    return map;
  }, [modulesData]);

  const validModuleKeys = useMemo(() => {
    return new Set(modulesData?.map((module) => module.key) ?? []);
  }, [modulesData]);

  const updateMutation = useMutation({
    mutationFn: ({ role, modules }: { role: Role; modules: ModuleKey[] }) =>
      permissionsApi.updateRole(role, modules).then((res) => res.data.modules),
  });

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Permissões por perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Defina quais módulos cada perfil pode acessar. Alterações são aplicadas imediatamente.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-dashed border-muted-foreground/40 bg-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold uppercase tracking-wide text-muted-foreground">
                Administrador
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sempre possui acesso total a todos os módulos.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {modulesData?.map((module) => (
                  <li key={module.key}>• {module.label}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {MANAGEABLE_ROLES.map((role) => {
            const assignedModules = new Set(rolePermissions[role] ?? []);

            return (
              <Card key={role} className="border border-muted-foreground/30">
                <CardHeader>
                  <CardTitle className="text-base font-semibold uppercase tracking-wide">
                    {role === Role.RECEPCAO ? "Recepção" : "Veterinário"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modulesData?.map((module) => (
                    <label
                      key={module.key}
                      className="flex items-start gap-3 rounded-lg border border-muted-foreground/20 p-3 transition hover:border-muted-foreground/40 hover:bg-muted/30"
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
                        <Label className="text-sm font-medium leading-none">{module.label}</Label>
                        {module.description && (
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}


