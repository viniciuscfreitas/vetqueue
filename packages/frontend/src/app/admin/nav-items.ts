import { ModuleKey } from "@/lib/api";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: ModuleKey;
  description?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Visão geral",
    icon: LayoutDashboard,
    description: "Atalhos e destaques para gestão do sistema.",
  },
  {
    href: "/admin/users",
    label: "Usuários",
    icon: Users,
    module: ModuleKey.ADMIN_USERS,
    description: "Gerencie contas, perfis e credenciais da equipe.",
  },
  {
    href: "/admin/rooms",
    label: "Salas",
    icon: Building2,
    module: ModuleKey.ADMIN_ROOMS,
    description: "Configure salas, disponibilidade e alocação de profissionais.",
  },
  {
    href: "/admin/services",
    label: "Serviços",
    icon: ClipboardList,
    module: ModuleKey.ADMIN_SERVICES,
    description: "Organize serviços, procedimentos e preços oferecidos.",
  },
  {
    href: "/admin/permissions",
    label: "Permissões",
    icon: ShieldCheck,
    module: ModuleKey.PERMISSIONS,
    description: "Defina módulos acessíveis para cada perfil.",
  },
];


