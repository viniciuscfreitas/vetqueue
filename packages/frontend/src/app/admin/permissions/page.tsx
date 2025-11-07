"use client";

import { Header } from "@/components/Header";
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
  const canConfigurePermissions = canAccess(ModuleKey.PERMISSIONS);
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canConfigurePermissions) {
    return null;
  }

  const isLoading = modulesLoading || permsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Permissões por Perfil</h1>
            <p className="text-sm text-muted-foreground">
              Defina quais módulos cada perfil pode acessar. Alterações são aplicadas imediatamente.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Administrador</CardTitle>
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
                <Card key={role}>
                  <CardHeader>
                    <CardTitle>{role}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {modulesData?.map((module) => (
                      <label
                        key={module.key}
                        className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition"
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
                          <Label className="text-sm font-medium leading-none">
                            {module.label}
                          </Label>
                          {module.description && (
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
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
      </main>
    </div>
  );
}


