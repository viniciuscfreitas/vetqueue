"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Consultation, Vaccination, QueueEntry, Status, Priority, Patient, patientApi, consultationApi, vaccinationApi } from "@/lib/api";
import { Clock, CheckCircle2, XCircle, Stethoscope, UserCircle, Calendar, Phone, Mail, AlertCircle, MapPin, Plus, FileText, Syringe, Ruler, CheckCircle } from "lucide-react";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import { Spinner } from "./ui/spinner";
import { ConsultationForm } from "./ConsultationForm";
import { VaccinationForm } from "./VaccinationForm";

interface PatientRecordDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "consultations" | "vaccinations" | "history";
  prefillQueueEntryId?: string;
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

function isVaccinationDue(nextDoseDate: string | null | undefined): boolean {
  if (!nextDoseDate) return false;
  const nextDate = new Date(nextDoseDate);
  const today = new Date();
  return nextDate <= today;
}

function isVaccinationSoon(nextDoseDate: string | null | undefined): boolean {
  if (!nextDoseDate) return false;
  const nextDate = new Date(nextDoseDate);
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  return nextDate > today && nextDate <= sevenDaysFromNow;
}

export function PatientRecordDialog({
  patient,
  open,
  onOpenChange,
  initialTab = "consultations",
  prefillQueueEntryId,
}: PatientRecordDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showConsultationForm, setShowConsultationForm] = useState(!!prefillQueueEntryId);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  useEffect(() => {
    if (prefillQueueEntryId && open) {
      setActiveTab("consultations");
      setShowConsultationForm(true);
    }
  }, [prefillQueueEntryId, open]);

  const { data: consultations = [], isLoading: consultationsLoading } = useQuery({
    queryKey: ["consultations", patient.id],
    queryFn: () => consultationApi.list({ patientId: patient.id }).then((res) => res.data),
    enabled: open,
  });

  const { data: vaccinations = [], isLoading: vaccinationsLoading } = useQuery({
    queryKey: ["vaccinations", patient.id],
    queryFn: () => vaccinationApi.list({ patientId: patient.id }).then((res) => res.data),
    enabled: open,
  });

  const { data: queueEntries = [], isLoading: historyLoading } = useQuery({
    queryKey: ["patient-history", patient.id],
    queryFn: () => patientApi.getQueueEntries(patient.id).then((res) => res.data),
    enabled: open,
  });

  const handleConsultationSuccess = () => {
    setShowConsultationForm(false);
    setEditingConsultation(null);
  };

  const handleVaccinationSuccess = () => {
    setShowVaccinationForm(false);
    setEditingVaccination(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Prontuário - {patient.name}</DialogTitle>
          <DialogDescription className="space-y-2">
            <div className="font-semibold text-foreground">
              {patient.name}
              {patient.species && ` - ${patient.species}`}
              {patient.breed && ` (${patient.breed})`}
              {patient.gender && ` - ${patient.gender}`}
              {patient.birthDate && calculateAge(patient.birthDate) && ` • ${calculateAge(patient.birthDate)}`}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {patient.microchip && (
                <Badge variant="outline">Microchip: {patient.microchip}</Badge>
              )}
              {patient.color && (
                <Badge variant="outline">Cor: {patient.color}</Badge>
              )}
              {patient.currentWeight && (
                <Badge variant="outline">
                  <Ruler className="h-3 w-3 mr-1" />
                  {patient.currentWeight} kg
                </Badge>
              )}
              {patient.neutered && (
                <Badge variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Castrado
                </Badge>
              )}
              {patient.temperament && (
                <Badge variant="outline">Temperamento: {patient.temperament}</Badge>
              )}
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
            {patient.allergies && (
              <Card className="border-red-300 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">Alergias Críticas</p>
                      <p className="text-xs text-red-700 dark:text-red-300">{patient.allergies}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {patient.ongoingMedications && (
              <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-3">
                  <div className="flex items-start gap-2">
                    <Syringe className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Medicações em Uso</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">{patient.ongoingMedications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start overflow-x-auto bg-background/60 p-1">
            <TabsTrigger value="consultations" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="vaccinations" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Syringe className="h-4 w-4" />
              Vacinas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="flex-1 overflow-y-auto mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Consultas Médicas</h3>
              <Button onClick={() => {
                setEditingConsultation(null);
                setShowConsultationForm(true);
              }} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Consulta
              </Button>
            </div>

            {showConsultationForm && (
              <ConsultationForm
                patient={patient}
                queueEntryId={prefillQueueEntryId}
                consultation={editingConsultation || undefined}
                onSuccess={handleConsultationSuccess}
                onCancel={() => {
                  setShowConsultationForm(false);
                  setEditingConsultation(null);
                }}
              />
            )}

            {consultationsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner />
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma consulta registrada para este paciente.
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(consultation.date)}
                          </Badge>
                          {consultation.vet && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              {consultation.vet.name}
                            </Badge>
                          )}
                          {consultation.weightInKg && (
                            <Badge variant="outline">
                              {consultation.weightInKg} kg
                            </Badge>
                          )}
                        </div>
                        {consultation.diagnosis && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Diagnóstico:</p>
                            <p className="text-sm">{consultation.diagnosis}</p>
                          </div>
                        )}
                        {consultation.treatment && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Tratamento:</p>
                            <p className="text-sm">{consultation.treatment}</p>
                          </div>
                        )}
                        {consultation.prescription && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Prescrição:</p>
                            <p className="text-sm">{consultation.prescription}</p>
                          </div>
                        )}
                        {consultation.notes && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Observações:</p>
                            <p className="text-sm">{consultation.notes}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingConsultation(consultation);
                          setShowConsultationForm(true);
                        }}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vaccinations" className="flex-1 overflow-y-auto mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Vacinas</h3>
              <Button onClick={() => {
                setEditingVaccination(null);
                setShowVaccinationForm(true);
              }} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Vacina
              </Button>
            </div>

            {showVaccinationForm && (
              <VaccinationForm
                patient={patient}
                vaccination={editingVaccination || undefined}
                onSuccess={handleVaccinationSuccess}
                onCancel={() => {
                  setShowVaccinationForm(false);
                  setEditingVaccination(null);
                }}
              />
            )}

            {vaccinationsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner />
              </div>
            ) : vaccinations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma vacina registrada para este paciente.
              </div>
            ) : (
              <div className="space-y-4">
                {vaccinations.map((vaccination) => {
                  const isDue = isVaccinationDue(vaccination.nextDoseDate);
                  const isSoon = isVaccinationSoon(vaccination.nextDoseDate);

                  return (
                    <div
                      key={vaccination.id}
                      className={`border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors ${
                        isDue ? "border-red-500 bg-red-50/50" : isSoon ? "border-orange-500 bg-orange-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="flex items-center gap-1 font-semibold">
                              <Syringe className="h-3 w-3" />
                              {vaccination.vaccineName}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Aplicada em {formatDate(vaccination.appliedDate)}
                            </Badge>
                            {vaccination.batchNumber && (
                              <Badge variant="outline">
                                Lote: {vaccination.batchNumber}
                              </Badge>
                            )}
                            {vaccination.vet && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <UserCircle className="h-3 w-3" />
                                {vaccination.vet.name}
                              </Badge>
                            )}
                            {vaccination.nextDoseDate && (
                              <Badge
                                variant={isDue ? "destructive" : isSoon ? "default" : "outline"}
                                className="flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Próxima: {formatDate(vaccination.nextDoseDate)}
                              </Badge>
                            )}
                          </div>
                          {vaccination.notes && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Observações:</p>
                              <p className="text-sm">{vaccination.notes}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingVaccination(vaccination);
                            setShowVaccinationForm(true);
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
            <h3 className="text-lg font-semibold mb-4">Histórico de Atendimentos</h3>

            {historyLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner />
              </div>
            ) : queueEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum atendimento registrado para este paciente.
              </div>
            ) : (
              <div className="space-y-4">
                {queueEntries.map((entry: QueueEntry) => {
                  const status = statusConfig[entry.status];
                  const StatusIcon = status.icon;
                  
                  const waitTime = entry.calledAt 
                    ? new Date(entry.calledAt).getTime() - new Date(entry.createdAt).getTime()
                    : null;
                  
                  const serviceTime = entry.calledAt && entry.completedAt
                    ? new Date(entry.completedAt).getTime() - new Date(entry.calledAt).getTime()
                    : null;

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
                              {entry.assignedVet && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <UserCircle className="inline h-4 w-4 mr-1" />
                                  <strong>Veterinário:</strong> {entry.assignedVet.name}
                                </p>
                              )}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

