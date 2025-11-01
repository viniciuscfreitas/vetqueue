import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QueueEntry, Status, Role } from "@/lib/api";

interface QueueHeaderProps {
  entries: QueueEntry[];
  isLoading: boolean;
  isError: boolean;
  waitingCount: number;
  userRole?: Role;
  onAddClick: () => void;
  onCallNextClick: () => void;
  callNextPending: boolean;
}

export function QueueHeader({
  entries,
  isLoading,
  isError,
  waitingCount,
  userRole,
  onAddClick,
  onCallNextClick,
  callNextPending,
}: QueueHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">Fila Atual</h2>
        {!isLoading && !isError && (
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} {entries.length === 1 ? "entrada" : "entradas"} na fila
            {waitingCount > 0 && (
              <span 
                className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(183, 136, 68, 0.15)', color: '#B78844' }}
              >
                {waitingCount} aguardando
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {userRole === Role.RECEPCAO && (
          <Button
            onClick={onAddClick}
            variant="outline"
            size="lg"
            className="px-6 py-6 text-base"
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar
          </Button>
        )}
        <Button
          onClick={onCallNextClick}
          disabled={callNextPending || waitingCount === 0}
          size="lg"
          className="font-semibold px-6 py-6 text-base shadow-lg hover:shadow-xl transition-all"
        >
          {callNextPending ? (
            "Chamando..."
          ) : waitingCount > 0 ? (
            <span className="flex items-center gap-2">
              <span>Chamar Próximo</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
                {waitingCount}
              </span>
            </span>
          ) : (
            "Nenhum aguardando"
          )}
        </Button>
      </div>
    </div>
  );
}

