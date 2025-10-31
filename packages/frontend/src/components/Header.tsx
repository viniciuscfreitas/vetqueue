import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  showNavigation?: boolean;
}

export function Header({ showNavigation = false }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">VetQueue</h1>
          {showNavigation ? (
            <nav className="flex gap-4">
              <Link href="/add">
                <Button variant="outline">Adicionar à Fila</Button>
              </Link>
              <Link href="/history">
                <Button variant="outline">Histórico</Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline">Relatórios</Button>
              </Link>
            </nav>
          ) : (
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

