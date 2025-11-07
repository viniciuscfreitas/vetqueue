import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ModuleKey } from "@/lib/api";
import { RoomSelector } from "./RoomSelector";
import { User, Settings, Monitor, LogOut, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout, canAccess } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <Image
              src="/logo.png"
              alt="Fisiopet"
              width={379}
              height={130}
              className="h-8 w-auto sm:h-10"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <RoomSelector />

            {(() => {
              const adminModules = [
                ModuleKey.ADMIN_USERS,
                ModuleKey.ADMIN_ROOMS,
                ModuleKey.ADMIN_SERVICES,
                ModuleKey.PERMISSIONS,
              ];
              const hasAdminAccess = adminModules.some((module) => canAccess(module));
              const supportingLinks = [
                canAccess(ModuleKey.TUTORS) && {
                  href: "/tutors",
                  label: "Tutores",
                  icon: Users,
                },
              ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Users }>;

              return (
                <>
                  {hasAdminAccess && (
                    <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                      <Link href="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Administração
                      </Link>
                    </Button>
                  )}
                  {hasAdminAccess && (
                    <Button variant="outline" size="icon" asChild className="sm:hidden">
                      <Link href="/admin" className="flex items-center justify-center">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Administração</span>
                      </Link>
                    </Button>
                  )}
                  {supportingLinks.map((item) => (
                    <Button key={item.href} variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                  {supportingLinks.map((item) => (
                    <Button key={`${item.href}-mobile`} variant="ghost" size="icon" asChild className="sm:hidden">
                      <Link href={item.href} className="flex items-center justify-center">
                        <item.icon className="h-4 w-4" />
                        <span className="sr-only">{item.label}</span>
                      </Link>
                    </Button>
                  ))}
                </>
              );
            })()}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium truncate max-w-[100px]">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </div>
                  <User className="h-4 w-4 sm:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/display" className="flex items-center cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" />
                    Display
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

