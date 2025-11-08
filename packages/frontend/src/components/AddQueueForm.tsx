"use client";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ActiveVet,
  ModuleKey,
  Patient,
  patientApi,
  Priority,
  queueApi,
  QueueEntry,
  QueueFormPreference,
  ServiceType,
  tutorApi,
  userApi,
} from "@/lib/api";
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants";
import { createErrorHandler } from "@/lib/errors";
import { recordQueueFormMetric } from "@/lib/metrics";
import { loadQueueFormPreferences, saveQueueFormPreferences } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PatientAutocomplete } from "./PatientAutocomplete";
import { TutorAutocomplete } from "./TutorAutocomplete";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type StepKey = "identify" | "details";

interface QueueFormState {
  tutorName: string;
  tutorId?: string;
  patientName: string;
  patientId?: string;
  serviceType: string;
  priority: Priority;
  assignedVetId: string;
  hasScheduledAppointment: boolean;
  scheduledAt: string;
  simplesVetId: string;
}

const steps: Array<{ key: StepKey; label: string }> = [
  { key: "identify", label: "Identificação" },
  { key: "details", label: "Atendimento" },
];

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

interface SessionState {
  startedAt: number;
  identifyCompletedAt: number | null;
  usedTutorQuickCreate: boolean;
  usedPatientQuickCreate: boolean;
  hasScheduledAppointment: boolean;
  submitted: boolean;
  interacted: boolean;
}

export function AddQueueForm() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const localPreferences = loadQueueFormPreferences();

  const buildInitialFormState = (): QueueFormState => ({
    tutorName: "",
    tutorId: undefined,
    patientName: "",
    patientId: undefined,
    serviceType: (localPreferences.serviceType as ServiceType | "") || "",
    priority: localPreferences.priority ?? Priority.NORMAL,
    assignedVetId: "NONE",
    hasScheduledAppointment: false,
    scheduledAt: "",
    simplesVetId: "",
  });

  const [formData, setFormData] = useState<QueueFormState>(buildInitialFormState);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTutorDialog, setShowTutorDialog] = useState(false);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTutor, setNewTutor] = useState({ name: "", phone: "" });
  const [newPatient, setNewPatient] = useState({ name: "", species: "", notes: "" });

  const createSession = () => ({
    startedAt: now(),
    identifyCompletedAt: null,
    usedTutorQuickCreate: false,
    usedPatientQuickCreate: false,
    hasScheduledAppointment: false,
    submitted: false,
    interacted: false,
  });

  const sessionRef = useRef<SessionState>(createSession());

  const preferenceApplied = useRef(false);

  const canManageQueue = canAccess(ModuleKey.QUEUE);

  const { data: vets = [] } = useQuery<ActiveVet[]>({
    queryKey: ["users", "active-vets"],
    queryFn: async () => {
      const response = await userApi.getActiveVets();
      return response.data;
    },
    enabled: canManageQueue,
    staleTime: 30_000,
  });

  const { data: preference } = useQuery<QueueFormPreference | null>({
    queryKey: ["queue", "form-preference"],
    queryFn: async () => {
      const response = await queueApi.getFormPreference();
      return response.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (preferenceApplied.current || !preference) {
      return;
    }

    preferenceApplied.current = true;
    setFormData((prev) => ({
      ...prev,
      tutorName: preference.lastTutorName ?? prev.tutorName,
      tutorId: preference.lastTutorId ?? prev.tutorId,
      patientName: preference.lastPatientName ?? prev.patientName,
      patientId: preference.lastPatientId ?? prev.patientId,
      serviceType: preference.lastServiceType ?? prev.serviceType,
      priority: preference.lastPriority ?? prev.priority,
      assignedVetId: preference.lastAssignedVetId ?? prev.assignedVetId,
      hasScheduledAppointment: preference.lastHasAppointment ?? prev.hasScheduledAppointment,
      simplesVetId: preference.lastSimplesVetId ?? prev.simplesVetId,
    }));
  }, [preference]);

  useEffect(() => {
    if (!formData.serviceType && SERVICE_TYPE_OPTIONS.length > 0) {
      setFormData((prev) => ({
        ...prev,
        serviceType: SERVICE_TYPE_OPTIONS[0].value,
      }));
    }
  }, [formData.serviceType]);

  useEffect(() => {
    sessionRef.current.hasScheduledAppointment = formData.hasScheduledAppointment;
  }, [formData.hasScheduledAppointment]);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (!session.submitted && session.interacted) {
        recordQueueFormMetric({
          status: "abandoned",
          variant: "page",
          durationMs: now() - session.startedAt,
          identifyStepMs:
            session.identifyCompletedAt !== null
              ? session.identifyCompletedAt - session.startedAt
              : undefined,
          usedTutorQuickCreate: session.usedTutorQuickCreate,
          usedPatientQuickCreate: session.usedPatientQuickCreate,
          hasScheduledAppointment: session.hasScheduledAppointment,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, []);

  const serviceOptions = useMemo(() => SERVICE_TYPE_OPTIONS, []);

  const tutorMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string }) =>
      tutorApi.quickCreate(data).then((res) => res.data),
    onSuccess: (tutor) => {
      setFormData((prev) => ({
        ...prev,
        tutorName: tutor.name,
        tutorId: tutor.id,
        patientName: "",
        patientId: undefined,
      }));
      sessionRef.current.usedTutorQuickCreate = true;
      sessionRef.current.interacted = true;
      setNewTutor({ name: "", phone: "" });
      setShowTutorDialog(false);
      toast({
        title: "Tutor cadastrado",
        description: "Tutor criado rapidamente para continuar o atendimento.",
      });
    },
    onError: handleError,
  });

  const patientMutation = useMutation({
    mutationFn: (data: { tutorId: string; name: string; species?: string; notes?: string }) =>
      patientApi.quickCreate(data).then((res) => res.data),
    onSuccess: (patient) => {
      setFormData((prev) => ({
        ...prev,
        patientName: patient.name,
        patientId: patient.id,
      }));
      sessionRef.current.usedPatientQuickCreate = true;
      sessionRef.current.interacted = true;
      setNewPatient({ name: "", species: "", notes: "" });
      setShowPatientDialog(false);
      toast({
        title: "Pet cadastrado",
        description: "Pet criado rapidamente para continuar o atendimento.",
      });
    },
    onError: handleError,
  });

  const canAdvanceIdentify =
    formData.tutorName.trim().length > 0 && formData.patientName.trim().length > 0;

  const handleNextStep = () => {
    if (!canAdvanceIdentify) {
      toast({
        variant: "destructive",
        title: "Completar informações",
        description: "Informe tutor e pet para avançar.",
      });
      return;
    }
    sessionRef.current.interacted = true;
    if (sessionRef.current.identifyCompletedAt === null) {
      sessionRef.current.identifyCompletedAt = now();
    }

    setCurrentStepIndex(1);
  };

  const handleBackStep = () => {
    setCurrentStepIndex(0);
  };

  const handleTutorQuickCreate = () => {
    if (!newTutor.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Informe ao menos o nome do tutor.",
      });
      return;
    }
    tutorMutation.mutate({
      name: newTutor.name.trim(),
      phone: newTutor.phone?.trim() || undefined,
    });
  };

  const handlePatientQuickCreate = () => {
    if (!formData.tutorId) {
      toast({
        variant: "destructive",
        title: "Tutor obrigatório",
        description: "Selecione ou crie um tutor antes de cadastrar o pet.",
      });
      return;
    }
    if (!newPatient.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome do pet obrigatório",
        description: "Informe ao menos o nome do pet.",
      });
      return;
    }
    patientMutation.mutate({
      tutorId: formData.tutorId,
      name: newPatient.name.trim(),
      species: newPatient.species.trim() || undefined,
      notes: newPatient.notes.trim() || undefined,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentStepIndex === 0) {
      handleNextStep();
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const [hours, minutes] =
        formData.hasScheduledAppointment && formData.scheduledAt
          ? formData.scheduledAt.split(":")
          : ["00", "00"];

      const scheduledDateTime =
        formData.hasScheduledAppointment && formData.scheduledAt
          ? new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              parseInt(hours, 10),
              parseInt(minutes, 10)
            )
          : undefined;

      const response = await queueApi.add({
        patientName: formData.patientName,
        tutorName: formData.tutorName,
        serviceType: formData.serviceType as ServiceType,
        priority: formData.priority,
        assignedVetId: formData.assignedVetId === "NONE" ? undefined : formData.assignedVetId,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        scheduledAt: scheduledDateTime?.toISOString(),
        patientId: formData.patientId,
        simplesVetId: formData.simplesVetId || undefined,
      });

      const createdEntry: QueueEntry = response.data;

      saveQueueFormPreferences({
        serviceType: formData.serviceType,
        priority: formData.priority,
      });

      queueApi
        .saveFormPreference({
          lastTutorId: formData.tutorId ?? null,
          lastTutorName: formData.tutorName ?? null,
          lastPatientId: formData.patientId ?? null,
          lastPatientName: formData.patientName ?? null,
          lastServiceType: formData.serviceType ?? null,
          lastPriority: formData.priority ?? null,
          lastAssignedVetId:
            formData.assignedVetId === "NONE" ? null : formData.assignedVetId ?? null,
          lastHasAppointment: formData.hasScheduledAppointment,
          lastSimplesVetId: formData.simplesVetId || null,
        })
        .catch((error) => {
          console.warn("Failed to save queue form preference", error);
        });

      const session = sessionRef.current;
      session.submitted = true;
      recordQueueFormMetric({
        status: "submitted",
        variant: "page",
        durationMs: now() - session.startedAt,
        identifyStepMs:
          session.identifyCompletedAt !== null
            ? session.identifyCompletedAt - session.startedAt
            : undefined,
        usedTutorQuickCreate: session.usedTutorQuickCreate,
        usedPatientQuickCreate: session.usedPatientQuickCreate,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        timestamp: new Date().toISOString(),
      });

      setFormData({
        tutorName: "",
        tutorId: undefined,
        patientName: "",
        patientId: undefined,
        serviceType: formData.serviceType,
        priority: formData.priority,
        assignedVetId: "NONE",
        hasScheduledAppointment: false,
        scheduledAt: "",
        simplesVetId: "",
      });
      sessionRef.current = createSession();
      setShowAdvanced(false);
      setCurrentStepIndex(0);

      toast({
        title: "Sucesso",
        description: createdEntry.systemMessage
          ? `Entrada adicionada à fila. ${createdEntry.systemMessage}`
          : "Entrada adicionada à fila.",
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      isActive || isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-3 h-px w-12 sm:w-16 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {currentStepIndex === 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tutor</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTutorDialog(true)}
                >
                  Cadastro rápido
                </Button>
              </div>
              <TutorAutocomplete
                value={formData.tutorName}
                onChange={(tutorName, tutorId) => {
                  setFormData((prev) => ({
                    ...prev,
                    tutorName,
                    tutorId,
                    patientName: "",
                    patientId: undefined,
                  }));
                  sessionRef.current.interacted = true;
                }}
                placeholder="Buscar tutor ou digitar nome..."
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Pet</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPatientDialog(true)}
                  disabled={!formData.tutorId}
                >
                  Cadastro rápido
                </Button>
              </div>
              <PatientAutocomplete
                tutorName={formData.tutorName}
                value={formData.patientName}
                onChange={(patient: Patient | null) => {
                  setFormData((prev) => ({
                    ...prev,
                    patientId: patient?.id,
                    patientName: patient?.name || prev.patientName,
                  }));
                  sessionRef.current.interacted = true;
                }}
                onPatientNameChange={(name) => {
                  setFormData((prev) => ({
                    ...prev,
                    patientName: name,
                    patientId: undefined,
                  }));
                  sessionRef.current.interacted = true;
                }}
                placeholder={
                  formData.tutorName ? "Buscar pet ou digite..." : "Digite o tutor primeiro"
                }
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Button type="button" onClick={handleNextStep} disabled={!canAdvanceIdentify}>
                Avançar
              </Button>
            </div>
          </div>
        )}

        {currentStepIndex === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={handleBackStep}>
                Voltar
              </Button>
              <span className="text-sm text-muted-foreground">
                Confirme os detalhes antes de finalizar
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType" className="text-sm font-medium">
                Tipo de serviço
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, serviceType: value as ServiceType }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canManageQueue && (
              <div className="space-y-2">
                <Label htmlFor="assignedVetId" className="text-sm font-medium">
                  Veterinário
                </Label>
                <Select
                  value={formData.assignedVetId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, assignedVetId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fila geral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Fila geral</SelectItem>
                    {vets.map((vet) => (
                      <SelectItem key={vet.vetId} value={vet.vetId}>
                        {vet.vetName} - {vet.roomName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border rounded-md p-4 space-y-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                <span className="text-sm font-medium">Opções avançadas</span>
                <span>{showAdvanced ? "▲" : "▼"}</span>
              </Button>

              {showAdvanced && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">
                      Prioridade
                    </Label>
                    <Select
                      value={formData.priority.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(value, 10) as Priority,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Priority.NORMAL.toString()}>Normal</SelectItem>
                        <SelectItem value={Priority.HIGH.toString()}>Alta</SelectItem>
                        <SelectItem value={Priority.EMERGENCY.toString()}>
                          Emergência
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="simplesVetId" className="text-sm font-medium">
                      Número da ficha (SimplesVet)
                    </Label>
                    <Input
                      id="simplesVetId"
                      value={formData.simplesVetId}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          simplesVetId: event.target.value,
                        }))
                      }
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasScheduledAppointment"
                      checked={formData.hasScheduledAppointment}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          hasScheduledAppointment: checked,
                          scheduledAt: checked ? prev.scheduledAt : "",
                        }));
                        sessionRef.current.hasScheduledAppointment = checked;
                        sessionRef.current.interacted = true;
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label
                      htmlFor="hasScheduledAppointment"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Tem hora marcada hoje
                    </Label>
                  </div>

                  {formData.hasScheduledAppointment && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt" className="text-sm font-medium">
                        Horário agendado
                      </Label>
                      <Input
                        id="scheduledAt"
                        type="time"
                        value={formData.scheduledAt}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            scheduledAt: event.target.value,
                          }))
                        }
                        required={formData.hasScheduledAppointment}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adicionando..." : "Adicionar à fila"}
            </Button>
          </div>
        )}
      </form>

      <Dialog open={showTutorDialog} onOpenChange={setShowTutorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro rápido de tutor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quickTutorName">Nome *</Label>
              <Input
                id="quickTutorName"
                value={newTutor.name}
                onChange={(event) =>
                  setNewTutor((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quickTutorPhone">Telefone</Label>
              <Input
                id="quickTutorPhone"
                value={newTutor.phone}
                onChange={(event) =>
                  setNewTutor((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTutorDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleTutorQuickCreate}
              disabled={tutorMutation.isPending}
            >
              {tutorMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro rápido de pet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quickPatientName">Nome *</Label>
              <Input
                id="quickPatientName"
                value={newPatient.name}
                onChange={(event) =>
                  setNewPatient((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ex: Thor"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quickPatientSpecies">Espécie</Label>
              <Input
                id="quickPatientSpecies"
                value={newPatient.species}
                onChange={(event) =>
                  setNewPatient((prev) => ({ ...prev, species: event.target.value }))
                }
                placeholder="Ex: Canino"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quickPatientNotes">Observações</Label>
              <Input
                id="quickPatientNotes"
                value={newPatient.notes}
                onChange={(event) =>
                  setNewPatient((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPatientDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handlePatientQuickCreate}
              disabled={patientMutation.isPending}
            >
              {patientMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
