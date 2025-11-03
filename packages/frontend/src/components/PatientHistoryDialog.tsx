"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { QueueEntry, Status, patientApi, Patient } from "@/lib/api";
import { Clock, CheckCircle2, XCircle, Stethoscope, UserCircle, Calendar } from "lucide-react";
import { Spinner } from "./ui/spinner";

interface PatientHistoryDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  [Status.WAITING]: {
    label: "Aguardando",
    bgColor: "rgba(183, 136, 68, 0.15)",
    textColor: "#B78844",
    borderColor: "#B78844",
    icon: Clock,
  },
  [Status.CALLED]: {
    label: "Chamado",
    bgColor: "rgba(37, 157, 227, 0.15)",
    textColor: "#259DE3",
    borderColor: "#259DE3",
    icon: UserCircle,
  },
  [Status.IN_PROGRESS]: {
    label: "Em Atendimento",
    bgColor: "rgba(91, 150, 183, 0.15)",
    textColor: "#5B96B7",
    borderColor: "#5B96B7",
    icon: Stethoscope,
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    bgColor: "rgba(34, 197, 94, 0.15)",
    textColor: "#22c55e",
    borderColor: "#22c55e",
    icon: CheckCircle2,
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    bgColor: "rgba(107, 114, 128, 0.15)",
    textColor: "#6b7280",
    borderColor: "#6b7280",
    icon: XCircle,
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientHistoryDialog({
  patient,
  open,
  onOpenChange,
}: PatientHistoryDialogProps) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["patient-history", patient.id],
    queryFn: () => patientApi.getQueueEntries(patient.id).then((res) => res.data),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Atendimentos</DialogTitle>
          <DialogDescription>
            {patient.name} - {patient.tutorName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum atendimento registrado para este paciente.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry: QueueEntry) => {
              const status = statusConfig[entry.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className="border flex items-center gap-1"
                          variant="outline"
                          style={{
                            backgroundColor: status.bgColor,
                            color: status.textColor,
                            borderColor: status.borderColor,
                          }}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.createdAt)}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{entry.serviceType}</p>
                        {entry.assignedVet && (
                          <p className="text-sm text-muted-foreground">
                            Veterinário: {entry.assignedVet.name}
                          </p>
                        )}
                        {entry.completedAt && entry.status === Status.COMPLETED && (
                          <p className="text-xs text-muted-foreground">
                            Concluído em: {formatDate(entry.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

