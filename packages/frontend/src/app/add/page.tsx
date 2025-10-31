import { AddQueueForm } from "@/components/AddQueueForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AddPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">VetQueue</h1>
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Adicionar à Fila</h2>
        <AddQueueForm />
      </main>
    </div>
  );
}

