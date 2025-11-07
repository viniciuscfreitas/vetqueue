"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Clock, UserCircle2, Users, DollarSign, FileText, Settings } from "lucide-react";
import { ModuleKey } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const moduleCards = [
    {
      title: "Fila",
      ariaLabel: "Gerenciar fila de atendimento e chamar pacientes",
      href: "/queue",
      icon: Clock,
      requiredModule: ModuleKey.QUEUE,
    },
    {
      title: "Pacientes",
      ariaLabel: "Cadastrar e gerenciar pacientes e prontuários",
      href: "/patients",
      icon: UserCircle2,
      requiredModule: ModuleKey.PATIENTS,
    },
    {
      title: "Tutores",
      ariaLabel: "Cadastrar e gerenciar tutores",
      href: "/tutors",
      icon: Users,
      requiredModule: ModuleKey.TUTORS,
    },
    {
      title: "Financeiro",
      ariaLabel: "Controle financeiro e pagamentos",
      href: "/financial",
      icon: DollarSign,
      requiredModule: ModuleKey.FINANCIAL,
    },
    {
      title: "Auditoria",
      ariaLabel: "Visualizar ações registradas no sistema",
      href: "/audit",
      icon: FileText,
      requiredModule: ModuleKey.AUDIT,
    },
  ];

  const adminModuleKeys = [
    ModuleKey.ADMIN_USERS,
    ModuleKey.ADMIN_ROOMS,
    ModuleKey.ADMIN_SERVICES,
    ModuleKey.PERMISSIONS,
  ];

  const hasAdminAccess = adminModuleKeys.some((module) => canAccess(module));

  if (hasAdminAccess) {
    moduleCards.unshift({
      title: "Administração",
      ariaLabel: "Configurar usuários, salas, serviços e permissões",
      href: "/admin",
      icon: Settings,
    });
  }

  const modules = moduleCards.filter(
    (module) => !module.requiredModule || canAccess(module.requiredModule),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                aria-label={module.ariaLabel}
              >
                <Card className="transition-colors hover:bg-accent h-full min-h-[120px] md:min-h-[140px] flex items-center justify-center hover:border-primary/50">
                  <CardContent className="p-6 md:p-8 w-full">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <Icon className="h-12 w-12 md:h-14 md:w-14 text-primary" aria-hidden="true" />
                      <CardTitle className="text-lg md:text-xl font-semibold">
                        {module.title}
                      </CardTitle>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
