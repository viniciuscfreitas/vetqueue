import { ModuleKey } from "@/lib/api";
import { PawPrint, ClipboardList, Wallet, Users, ShieldCheck, LucideIcon } from "lucide-react";

type ModuleGroup = "core" | "admin";

export interface ShellModule {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  requiredModules?: ModuleKey[];
  requireAll?: boolean;
  group?: ModuleGroup;
}

export const shellModules: ShellModule[] = [
  {
    id: ModuleKey.QUEUE,
    label: "Fila",
    description: "Gestão de atendimentos ativos",
    href: "/queue",
    icon: ClipboardList,
    requiredModules: [ModuleKey.QUEUE],
    group: "core",
  },
  {
    id: ModuleKey.PATIENTS,
    label: "Pacientes",
    description: "Prontuários e histórico dos pets",
    href: "/patients",
    icon: PawPrint,
    requiredModules: [ModuleKey.PATIENTS],
    group: "core",
  },
  {
    id: ModuleKey.TUTORS,
    label: "Tutores",
    description: "Cadastro e relacionamento",
    href: "/tutors",
    icon: Users,
    requiredModules: [ModuleKey.TUTORS],
    group: "core",
  },
  {
    id: ModuleKey.FINANCIAL,
    label: "Financeiro",
    description: "Cobranças, MRR e ARPU",
    href: "/financial",
    icon: Wallet,
    requiredModules: [ModuleKey.FINANCIAL],
    group: "core",
  },
  {
    id: "admin",
    label: "Administração",
    description: "Permissões e infraestrutura",
    href: "/admin",
    icon: ShieldCheck,
    requiredModules: [
      ModuleKey.ADMIN_USERS,
      ModuleKey.ADMIN_ROOMS,
      ModuleKey.ADMIN_SERVICES,
      ModuleKey.PERMISSIONS,
    ],
    requireAll: false,
    group: "admin",
  },
];

