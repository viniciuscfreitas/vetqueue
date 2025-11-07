import { MODULES, ensureUniqueModules, getDefaultModulesForRole, isValidModuleKey } from "../core/permissions";
import { ModuleDefinition, ModuleKey, Role } from "../core/types";
import { PermissionRepository } from "../repositories/permissionRepository";
import { logger } from "../lib/logger";

export class PermissionService {
  constructor(private repository: PermissionRepository = new PermissionRepository()) {}

  listModules(): ModuleDefinition[] {
    return MODULES;
  }

  async getModulesForRole(role: Role): Promise<ModuleKey[]> {
    const storedModules = await this.repository.getModulesForRole(role);

    if (storedModules.length > 0) {
      return ensureUniqueModules(storedModules);
    }

    return getDefaultModulesForRole(role);
  }

  async setModulesForRole(role: Role, modules: string[]): Promise<ModuleKey[]> {
    const validModules = ensureUniqueModules(
      modules.filter(isValidModuleKey)
    );

    const invalidModules = modules.filter((module) => !isValidModuleKey(module));
    if (invalidModules.length > 0) {
      logger.warn("Ignoring invalid module keys", { role, invalidModules });
    }

    return this.repository.replaceModulesForRole(role, validModules);
  }

  async getAllRoleModules(): Promise<Record<Role, ModuleKey[]>> {
    const all = await this.repository.getAllRolePermissions();

    return {
      [Role.ADMIN]: ensureUniqueModules(all[Role.ADMIN] ?? getDefaultModulesForRole(Role.ADMIN)),
      [Role.RECEPCAO]: ensureUniqueModules(all[Role.RECEPCAO] ?? getDefaultModulesForRole(Role.RECEPCAO)),
      [Role.VET]: ensureUniqueModules(all[Role.VET] ?? getDefaultModulesForRole(Role.VET)),
    };
  }
}


