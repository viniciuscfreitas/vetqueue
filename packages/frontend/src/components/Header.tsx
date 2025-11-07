import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ModuleKey } from "@/lib/api";
import { RoomSelector } from "./RoomSelector";
import { User, Settings, Monitor, LogOut, ChevronDown, Users, Shield } from "lucide-react";
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
              const adminMenuItems = [
                canAccess(ModuleKey.ADMIN_USERS) && {
                  href: "/admin/users",
                  label: "Usuários",
                  icon: User,
                },
                canAccess(ModuleKey.ADMIN_ROOMS) && {
                  href: "/admin/rooms",
                  label: "Salas",
                  icon: Settings,
                },
                canAccess(ModuleKey.ADMIN_SERVICES) && {
                  href: "/admin/services",
                  label: "Serviços",
                  icon: Settings,
                },
                canAccess(ModuleKey.PERMISSIONS) && {
                  href: "/admin/permissions",
                  label: "Permissões",
                  icon: Shield,
                },
              ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof User }>;

              const supportingLinks = [
                canAccess(ModuleKey.TUTORS) && {
                  href: "/tutors",
                  label: "Tutores",
                  icon: Users,
                },
              ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Users }>;

              if (adminMenuItems.length === 0 && supportingLinks.length === 0) {
                return null;
              }

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Administração</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {adminMenuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center cursor-pointer">
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {supportingLinks.length > 0 && <DropdownMenuSeparator />}
                    {supportingLinks.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center cursor-pointer">
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  <ChevronDown className="h-3 w-3 hidden sm:block" />
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
                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer text-red-600 focus:text-red-600">
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

