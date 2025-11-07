import { ModuleKey, Role } from "../core/types";
import { prisma } from "../lib/prisma";

export class PermissionRepository {
  async getModulesForRole(role: Role): Promise<ModuleKey[]> {
    const permissions = await prisma.roleModulePermission.findMany({
      where: { role },
      orderBy: { module: "asc" },
    });

    return permissions.map((item) => item.module as ModuleKey);
  }

  async replaceModulesForRole(role: Role, modules: ModuleKey[]): Promise<ModuleKey[]> {
    await prisma.$transaction(async (tx) => {
      await tx.roleModulePermission.deleteMany({ where: { role } });

      if (modules.length === 0) {
        return;
      }

      await tx.roleModulePermission.createMany({
        data: modules.map((module) => ({ role, module })),
        skipDuplicates: true,
      });
    });

    return this.getModulesForRole(role);
  }

  async getAllRolePermissions(): Promise<Record<Role, ModuleKey[]>> {
    const permissions = await prisma.roleModulePermission.findMany();

    const aggregated: Partial<Record<Role, ModuleKey[]>> = {};

    for (const item of permissions) {
      const role = item.role as Role;
      if (!aggregated[role]) {
        aggregated[role] = [];
      }
      aggregated[role]!.push(item.module as ModuleKey);
    }

    return aggregated as Record<Role, ModuleKey[]>;
  }
}


