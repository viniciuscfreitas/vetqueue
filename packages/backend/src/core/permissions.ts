import { ModuleDefinition, ModuleKey, Role } from "./types";

export const MODULES: ModuleDefinition[] = [
  { key: ModuleKey.QUEUE, label: "Fila", description: "Gerenciar fila de atendimento" },
  { key: ModuleKey.PATIENTS, label: "Pacientes", description: "Acessar e atualizar dados de pacientes" },
  { key: ModuleKey.TUTORS, label: "Tutores", description: "Gerenciar tutores" },
  { key: ModuleKey.FINANCIAL, label: "Financeiro", description: "Visualizar e editar informações financeiras" },
  { key: ModuleKey.ADMIN_USERS, label: "Usuários", description: "Administrar usuários do sistema" },
  { key: ModuleKey.ADMIN_ROOMS, label: "Salas", description: "Gerenciar salas" },
  { key: ModuleKey.ADMIN_SERVICES, label: "Serviços", description: "Manter catálogo de serviços" },
  { key: ModuleKey.REPORTS, label: "Relatórios", description: "Acessar relatórios e métricas" },
  { key: ModuleKey.AUDIT, label: "Auditoria", description: "Consultar logs de auditoria" },
  { key: ModuleKey.PERMISSIONS, label: "Permissões", description: "Configurar acesso por perfil" },
];

const ALL_MODULE_KEYS = MODULES.map((module) => module.key);

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, ModuleKey[]> = {
  [Role.ADMIN]: ALL_MODULE_KEYS,
  [Role.RECEPCAO]: [
    ModuleKey.QUEUE,
    ModuleKey.PATIENTS,
    ModuleKey.TUTORS,
    ModuleKey.FINANCIAL,
    ModuleKey.ADMIN_USERS,
    ModuleKey.ADMIN_ROOMS,
    ModuleKey.ADMIN_SERVICES,
    ModuleKey.REPORTS,
    ModuleKey.AUDIT,
    ModuleKey.PERMISSIONS,
  ],
  [Role.VET]: [
    ModuleKey.QUEUE,
    ModuleKey.PATIENTS,
    ModuleKey.REPORTS,
  ],
};

export function getDefaultModulesForRole(role: Role): ModuleKey[] {
  return ROLE_DEFAULT_PERMISSIONS[role] ?? [];
}

export function isValidModuleKey(value: string): value is ModuleKey {
  return ALL_MODULE_KEYS.includes(value as ModuleKey);
}

export function ensureUniqueModules(modules: ModuleKey[]): ModuleKey[] {
  return Array.from(new Set(modules));
}


