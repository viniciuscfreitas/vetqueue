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
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold hover:opacity-80">
            VetQueue
          </Link>
          
          <div className="flex items-center gap-4">
            <RoomSelector />
            {user.role === "RECEPCAO" && (
              <>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">Usuários</Button>
                </Link>
                <Link href="/admin/rooms">
                  <Button variant="outline" size="sm">Salas</Button>
                </Link>
              </>
            )}
            <div className="text-right text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
            </div>
            <Link href="/display">
              <Button variant="outline" size="sm">Display</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

