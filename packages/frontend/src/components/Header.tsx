import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RoomSelector } from "./RoomSelector";
import { User, Settings, Monitor, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();
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
            <img 
              src="/logo.png" 
              alt="Fisiopet" 
              className="h-8 w-auto sm:h-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error('Erro ao carregar logo. Src:', target.src, 'Natural width:', target.naturalWidth, 'Natural height:', target.naturalHeight);
                console.error('HTTP Status pode ser verificado no Network tab');
              }}
            />
          </Link>
          
          <div className="flex items-center gap-3">
            <RoomSelector />
            
            {user.role === "RECEPCAO" && (
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
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Usuários
                </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/rooms" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Salas
                </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/services" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Serviços
                </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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

