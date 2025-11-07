import {
  MODULES,
  ensureUniqueModules,
  getDefaultModulesForRole,
  isValidModuleKey,
} from "../core/permissions";
import { ModuleDefinition, ModuleKey, Role } from "../core/types";
import { PermissionRepository } from "../repositories/permissionRepository";
import { logger } from "../lib/logger";

interface CacheEntry {
  modules: ModuleKey[];
  expiresAt: number;
  fallback: boolean;
}

const CACHE_TTL_MS = 30_000;
const FALLBACK_TTL_MS = 5_000;
const MAX_CONSECUTIVE_FAILURES = 3;

export class PermissionService {
  private cache = new Map<Role, CacheEntry>();
  private failureCount = new Map<Role, number>();

  constructor(private repository: PermissionRepository = new PermissionRepository()) {}

  listModules(): ModuleDefinition[] {
    return MODULES;
  }

  invalidateRole(role: Role) {
    this.cache.delete(role);
    this.failureCount.delete(role);
  }

  invalidateAll() {
    this.cache.clear();
    this.failureCount.clear();
  }

  private isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
    return !!entry && entry.expiresAt > Date.now();
  }

  async getModulesForRole(role: Role): Promise<ModuleKey[]> {
    const cached = this.cache.get(role);
    if (this.isCacheValid(cached)) {
      return cached.modules;
    }

    try {
      const storedModules = await this.repository.getModulesForRole(role);
      const modules =
        storedModules.length > 0
          ? ensureUniqueModules(storedModules)
          : getDefaultModulesForRole(role);

      this.cache.set(role, {
        modules,
        expiresAt: Date.now() + CACHE_TTL_MS,
        fallback: false,
      });
      this.failureCount.delete(role);
      return modules;
    } catch (error) {
      const failures = (this.failureCount.get(role) ?? 0) + 1;
      this.failureCount.set(role, failures);
      logger.error("Permission lookup failed, using default modules", {
        role,
        failures,
        error: error instanceof Error ? error.message : String(error),
      });

      if (failures >= MAX_CONSECUTIVE_FAILURES) {
        throw new Error("Permission lookup failed repeatedly");
      }

      const fallbackModules = getDefaultModulesForRole(role);
      this.cache.set(role, {
        modules: fallbackModules,
        expiresAt: Date.now() + FALLBACK_TTL_MS,
        fallback: true,
      });
      return fallbackModules;
    }
  }

  async setModulesForRole(role: Role, modules: string[]): Promise<ModuleKey[]> {
    const validModules = ensureUniqueModules(modules.filter(isValidModuleKey));

    const invalidModules = modules.filter((module) => !isValidModuleKey(module));
    if (invalidModules.length > 0) {
      logger.warn("Ignoring invalid module keys", { role, invalidModules });
    }

    const updated = await this.repository.replaceModulesForRole(role, validModules);
    this.invalidateRole(role);
    return validateOrDefault(role, updated);
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

function validateOrDefault(role: Role, modules: ModuleKey[]): ModuleKey[] {
  const unique = ensureUniqueModules(modules);
  return unique.length > 0 ? unique : getDefaultModulesForRole(role);
}

