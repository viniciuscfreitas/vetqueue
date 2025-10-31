import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RoomSelector } from "./RoomSelector";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="text-xl sm:text-2xl font-semibold hover:opacity-80 whitespace-nowrap">
            VetQueue
          </Link>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <RoomSelector />
            {user.role === "RECEPCAO" && (
              <>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">Usuários</Button>
                </Link>
                <Link href="/admin/rooms">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">Salas</Button>
                </Link>
              </>
            )}
            <div className="text-right text-xs sm:text-sm hidden sm:block">
              <p className="font-medium truncate max-w-[100px] sm:max-w-none">{user.name}</p>
              <p className="text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
            </div>
            <div className="text-right text-xs sm:text-sm block sm:hidden">
              <p className="font-medium truncate">{user.name}</p>
            </div>
            <Link href="/display">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">Display</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

