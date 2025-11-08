"use client";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ActiveVet, ModuleKey, Patient, Priority, queueApi, ServiceType, userApi } from "@/lib/api";
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants";
import { createErrorHandler } from "@/lib/errors";
import { loadQueueFormPreferences, saveQueueFormPreferences } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PatientAutocomplete } from "./PatientAutocomplete";
import { TutorAutocomplete } from "./TutorAutocomplete";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function AddQueueForm() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const buildInitialFormData = () => {
    const preferences = loadQueueFormPreferences();

    return {
      patientName: "",
      tutorName: "",
      tutorId: undefined as string | undefined,
      serviceType: (preferences.serviceType as ServiceType | "") || "",
      priority: preferences.priority ?? Priority.NORMAL,
      assignedVetId: "NONE",
      hasScheduledAppointment: false,
      scheduledAt: "",
      patientId: undefined as string | undefined,
    };
  };

  const [formData, setFormData] = useState(buildInitialFormData);
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

  useEffect(() => {
    if (!formData.serviceType && SERVICE_TYPE_OPTIONS.length > 0) {
      setFormData((prev) => ({
        ...prev,
        serviceType: SERVICE_TYPE_OPTIONS[0].value as ServiceType,
      }));
    }
  }, [formData.serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              parseInt(hours),
              parseInt(minutes)
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
      });
      const createdEntry = response.data;

      saveQueueFormPreferences({
        serviceType: formData.serviceType,
        priority: formData.priority,
      });

      setFormData(buildInitialFormData());
      setShowAdvanced(false);
      toast({
        title: "Sucesso",
        description: createdEntry.systemMessage
          ? `Entrada adicionada à fila. ${createdEntry.systemMessage}`
          : "Entrada adicionada à fila",
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData((prev) => ({
      ...prev,
      patientName: "",
      tutorName: "",
      tutorId: undefined,
      patientId: undefined,
      serviceType: (loadQueueFormPreferences()?.serviceType as ServiceType | "") || "",
      priority: loadQueueFormPreferences()?.priority ?? Priority.NORMAL,
      hasScheduledAppointment: false,
      scheduledAt: "",
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
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
        }}
        label="Tutor"
        placeholder="Buscar tutor ou digite..."
        required
      />

      <PatientAutocomplete
        tutorName={formData.tutorName}
        value={formData.patientName}
        onChange={(patient: Patient | null) => {
          setFormData((prev) => ({
            ...prev,
            patientId: patient?.id,
            patientName: patient?.name || prev.patientName,
          }));
        }}
        onPatientNameChange={(name) => {
          setFormData((prev) => ({
            ...prev,
            patientName: name,
            patientId: undefined,
          }));
        }}
        label="Pet"
        placeholder={
          formData.tutorName ? "Buscar pet ou digite..." : "Digite o tutor primeiro"
        }
        required
      />

      <div className="space-y-2">
        <Label htmlFor="serviceType" className="text-sm font-medium">
          Tipo de Serviço
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
            {SERVICE_TYPE_OPTIONS.map((option) => (
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

      <div className="border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="w-full justify-between"
        >
          <span className="text-sm font-medium">Opções avançadas</span>
          <span>{showAdvanced ? "▲" : "▼"}</span>
        </Button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Prioridade
              </Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: parseInt(value) as Priority }))
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasScheduledAppointment"
                checked={formData.hasScheduledAppointment}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasScheduledAppointment: e.target.checked,
                    scheduledAt: e.target.checked ? prev.scheduledAt : "",
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label
                htmlFor="hasScheduledAppointment"
                className="text-sm font-normal cursor-pointer"
              >
                Tem hora marcada
              </Label>
            </div>

            {formData.hasScheduledAppointment && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt" className="text-sm font-medium">
                  Hora Agendada
                </Label>
                <Input
                  id="scheduledAt"
                  type="time"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))
                  }
                  required={formData.hasScheduledAppointment}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adicionando..." : "Adicionar à Fila"}
      </Button>
    </form>
  );
}

