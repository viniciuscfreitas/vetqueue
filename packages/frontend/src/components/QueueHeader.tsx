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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="w-full sm:w-auto">
        <h2 className="text-xl font-semibold">Fila Atual</h2>
        {!isLoading && !isError && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {entries.length} {entries.length === 1 ? "entrada" : "entradas"} na fila
            </p>
            {waitingCount > 0 && (
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit"
                style={{ backgroundColor: 'rgba(183, 136, 68, 0.15)', color: '#B78844' }}
              >
                {waitingCount} aguardando
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {userRole === Role.RECEPCAO && (
          <Button
            onClick={onAddClick}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-initial px-6 py-6 text-base"
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar
          </Button>
        )}
        <Button
          onClick={onCallNextClick}
          disabled={callNextPending || waitingCount === 0}
          size="lg"
          className="font-semibold flex-1 sm:flex-initial px-6 py-6 text-base shadow-lg hover:shadow-xl transition-all"
        >
          {callNextPending ? (
            "Chamando..."
          ) : waitingCount > 0 ? (
            "Chamar Próximo"
          ) : (
            "Nenhum aguardando"
          )}
        </Button>
      </div>
    </div>
  );
}

