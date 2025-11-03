"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { QueueEntry, Status, Priority, patientApi, Patient } from "@/lib/api";
import { Clock, CheckCircle2, XCircle, Stethoscope, UserCircle, Calendar, Phone, Mail, AlertCircle, MapPin } from "lucide-react";
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

function calculateAge(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}min`;
  }
  return `${minutes}min`;
}

function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case Priority.EMERGENCY:
      return "Emergência";
    case Priority.HIGH:
      return "Alta";
    case Priority.NORMAL:
      return "Normal";
    default:
      return "Normal";
  }
}

function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case Priority.EMERGENCY:
      return "bg-red-100 text-red-800 border-red-300";
    case Priority.HIGH:
      return "bg-orange-100 text-orange-800 border-orange-300";
    case Priority.NORMAL:
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
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
          <DialogDescription className="space-y-1">
            <div className="font-semibold text-foreground">
              {patient.name}
              {patient.species && ` - ${patient.species}`}
              {patient.breed && ` (${patient.breed})`}
            </div>
            <div className="text-sm">
              Tutor: {patient.tutorName}
              {patient.tutorPhone && (
                <span className="ml-2 text-muted-foreground">
                  <Phone className="inline h-3 w-3 mr-1" />
                  {patient.tutorPhone}
                </span>
              )}
              {patient.tutorEmail && (
                <span className="ml-2 text-muted-foreground">
                  <Mail className="inline h-3 w-3 mr-1" />
                  {patient.tutorEmail}
                </span>
              )}
            </div>
            {patient.birthDate && (
              <div className="text-xs text-muted-foreground">
                Idade: {calculateAge(patient.birthDate) || "N/A"}
              </div>
            )}
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
              
              const waitTime = entry.calledAt 
                ? new Date(entry.calledAt).getTime() - new Date(entry.createdAt).getTime()
                : null;
              
              const serviceTime = entry.calledAt && entry.completedAt
                ? new Date(entry.completedAt).getTime() - new Date(entry.calledAt).getTime()
                : null;

              const patientData = entry.patient || patient;

              return (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
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
                        <Badge variant="outline" className={`flex items-center gap-1 ${getPriorityColor(entry.priority)}`}>
                          <AlertCircle className="h-3 w-3" />
                          {getPriorityLabel(entry.priority)}
                        </Badge>
                        {entry.room && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {entry.room.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.createdAt)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-base">{entry.serviceType}</p>
                          {entry.patient?.notes && (
                            <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                              <strong>Prontuário:</strong> {entry.patient.notes}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            {entry.assignedVet && (
                              <p className="text-muted-foreground">
                                <UserCircle className="inline h-4 w-4 mr-1" />
                                <strong>Veterinário:</strong> {entry.assignedVet.name}
                              </p>
                            )}
                            
                            {patientData.species && (
                              <p className="text-muted-foreground">
                                <strong>Espécie:</strong> {patientData.species}
                              </p>
                            )}
                            
                            {patientData.breed && (
                              <p className="text-muted-foreground">
                                <strong>Raça:</strong> {patientData.breed}
                              </p>
                            )}
                            
                            {patientData.gender && (
                              <p className="text-muted-foreground">
                                <strong>Gênero:</strong> {patientData.gender}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            {patientData.tutorPhone && (
                              <p className="text-muted-foreground">
                                <Phone className="inline h-4 w-4 mr-1" />
                                <strong>Telefone:</strong> {patientData.tutorPhone}
                              </p>
                            )}
                            
                            {patientData.tutorEmail && (
                              <p className="text-muted-foreground">
                                <Mail className="inline h-4 w-4 mr-1" />
                                <strong>Email:</strong> {patientData.tutorEmail}
                              </p>
                            )}
                            
                            {patientData.birthDate && (
                              <p className="text-muted-foreground">
                                <strong>Idade:</strong> {calculateAge(patientData.birthDate) || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                          <p>
                            <strong>Registrado:</strong> {formatDate(entry.createdAt)}
                          </p>
                          {entry.calledAt && (
                            <p>
                              <strong>Chamado:</strong> {formatDate(entry.calledAt)}
                              {waitTime !== null && (
                                <span className="ml-2 text-orange-600">
                                  (Espera: {formatDuration(waitTime)})
                                </span>
                              )}
                            </p>
                          )}
                          {entry.completedAt && (
                            <p>
                              <strong>Concluído:</strong> {formatDate(entry.completedAt)}
                              {serviceTime !== null && (
                                <span className="ml-2 text-green-600">
                                  (Atendimento: {formatDuration(serviceTime)})
                                </span>
                              )}
                            </p>
                          )}
                          {entry.hasScheduledAppointment && entry.scheduledAt && (
                            <p>
                              <strong>Agendado para:</strong> {formatDate(entry.scheduledAt)}
                            </p>
                          )}
                        </div>
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

