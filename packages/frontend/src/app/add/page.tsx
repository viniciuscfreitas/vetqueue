import { AddQueueForm } from "@/components/AddQueueForm";
import { Header } from "@/components/Header";

export default function AddPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Adicionar à Fila</h2>
        <AddQueueForm />
      </main>
    </div>
  );
}

