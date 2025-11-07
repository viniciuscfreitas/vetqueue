import { describe, expect, it, vi } from "vitest";
import { PermissionService } from "../services/permissionService";
import { ModuleKey, Role } from "../core/types";

function buildService(overrides?: Partial<{
  getModulesForRole: (role: Role) => Promise<ModuleKey[]>;
  replaceModulesForRole: (role: Role, modules: ModuleKey[]) => Promise<ModuleKey[]>;
  getAllRolePermissions: () => Promise<Record<Role, ModuleKey[]>>;
}>) {
  const repository = {
    getModulesForRole: vi.fn(async (role: Role) => overrides?.getModulesForRole?.(role) ?? []),
    replaceModulesForRole: vi.fn(async (role: Role, modules: ModuleKey[]) =>
      overrides?.replaceModulesForRole?.(role, modules) ?? modules
    ),
    getAllRolePermissions: vi.fn(async () => overrides?.getAllRolePermissions?.() ?? {}),
  };

  const service = new PermissionService(repository as any);

  return { service, repository };
}

describe("PermissionService", () => {
  it("retorna permissões padrão quando banco não possui registros", async () => {
    const { service, repository } = buildService();

    const modules = await service.getModulesForRole(Role.RECEPCAO);

    expect(modules.length).toBeGreaterThan(0);
    expect(repository.getModulesForRole).toHaveBeenCalledWith(Role.RECEPCAO);
  });

  it("ignora módulos inválidos ao atualizar permissões", async () => {
    const replaceSpy = vi.fn(async (_role: Role, modules: ModuleKey[]) => modules);
    const { service, repository } = buildService({ replaceModulesForRole: replaceSpy });

    const modules = await service.setModulesForRole(Role.RECEPCAO, [ModuleKey.QUEUE, "invalid" as ModuleKey]);

    expect(modules).toEqual([ModuleKey.QUEUE]);
    expect(replaceSpy).toHaveBeenCalledWith(Role.RECEPCAO, [ModuleKey.QUEUE]);
    expect(repository.getModulesForRole).not.toHaveBeenCalled();
  });

  it("combina permissões salvas com padrões", async () => {
    const { service } = buildService({
      getAllRolePermissions: async () => ({
        [Role.RECEPCAO]: [ModuleKey.QUEUE],
      }),
    });

    const all = await service.getAllRoleModules();

    expect(all[Role.RECEPCAO]).toContain(ModuleKey.QUEUE);
    expect(all[Role.ADMIN]).toContain(ModuleKey.PERMISSIONS);
    expect(all[Role.VET]).toContain(ModuleKey.QUEUE);
  });
});


