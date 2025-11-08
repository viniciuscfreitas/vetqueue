"use client";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ModuleKey,
  Patient,
  Priority,
  queueApi,
  serviceApi,
  userApi
} from "@/lib/api";
import { createErrorHandler } from "@/lib/errors";
import { loadQueueFormPreferences, saveQueueFormPreferences } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
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

interface AddQueueFormInlineProps {
  onSuccess?: () => void;
  onClose?: () => void;
  inline?: boolean;
}

export function AddQueueFormInline({ onSuccess, onClose, inline = true }: AddQueueFormInlineProps) {
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
      serviceType: preferences.serviceType ?? "",
      priority: preferences.priority ?? Priority.NORMAL,
      assignedVetId: "NONE",
      hasScheduledAppointment: false,
      scheduledAt: "",
      patientId: undefined as string | undefined,
      simplesVetId: "",
    };
  };
  const [formData, setFormData] = useState(buildInitialFormData);

  const canManageQueue = canAccess(ModuleKey.QUEUE);

  const { data: vets = [] } = useQuery({
    queryKey: ["users", "active-vets"],
    queryFn: () => userApi.getActiveVets().then((res) => res.data),
    enabled: canManageQueue,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceApi.list().then((res) => res.data),
  });

  useEffect(() => {
    if (services.length > 0 && !formData.serviceType) {
      setFormData((prev) => ({ ...prev, serviceType: services[0].name }));
    }
  }, [services, formData.serviceType]);

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
        serviceType: formData.serviceType,
        priority: formData.priority,
        assignedVetId: formData.assignedVetId === "NONE" ? undefined : formData.assignedVetId,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        scheduledAt: scheduledDateTime?.toISOString(),
        patientId: formData.patientId,
        simplesVetId: formData.simplesVetId || undefined,
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
      onSuccess?.();
      onClose?.();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={inline ? "bg-card p-5 rounded-lg border space-y-5" : "space-y-5"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <TutorAutocomplete
            value={formData.tutorName}
            onChange={(tutorName, tutorId) => {
              setFormData({
                ...formData,
                tutorName,
                tutorId,
                patientName: "",
                patientId: undefined,
              });
            }}
            label="Tutor"
            placeholder="Buscar tutor ou digite..."
            required
            id="tutorAutocomplete"
          />
        </div>

        <div className="space-y-2">
          <PatientAutocomplete
            tutorName={formData.tutorName}
            value={formData.patientName}
            onChange={(patient: Patient | null) => {
              setFormData({
                ...formData,
                patientId: patient?.id,
                patientName: patient?.name || formData.patientName,
              });
            }}
            onPatientNameChange={(name) => {
              setFormData({
                ...formData,
                patientName: name,
                patientId: undefined,
              });
            }}
            label="Pet"
            placeholder={formData.tutorName ? "Buscar pet ou digite..." : "Digite o tutor primeiro"}
            required
            id="patientAutocomplete"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceType" className="text-sm font-medium">
          Serviço
        </Label>
        <Select
          value={formData.serviceType}
          onValueChange={(value) =>
            setFormData({ ...formData, serviceType: value })
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o serviço" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.name}>
                {service.name}
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
              setFormData({ ...formData, assignedVetId: value })
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
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between"
        >
          <span className="text-sm font-medium">Opções avançadas</span>
          <span>{showAdvanced ? "▲" : "▼"}</span>
        </Button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Prioridade
                </Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: parseInt(value) as Priority })
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
                  Número da Ficha (SimplesVet)
                </Label>
                <Input
                  id="simplesVetId"
                  type="text"
                  value={formData.simplesVetId}
                  onChange={(e) =>
                    setFormData({ ...formData, simplesVetId: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full"
                />
              </div>
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
              <Label htmlFor="hasScheduledAppointment" className="text-sm font-normal cursor-pointer">
                Tem hora marcada
              </Label>
            </div>

            {formData.hasScheduledAppointment && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt" className="text-sm font-medium">
                  Hora Agendada (hoje)
                </Label>
                <Input
                  id="scheduledAt"
                  type="time"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))
                  }
                  required={formData.hasScheduledAppointment}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  A prioridade será aumentada automaticamente se o horário passou há mais de 15 minutos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto"
          size="lg"
        >
          {loading ? "Adicionando..." : "Adicionar à Fila"}
        </Button>
      </div>
    </form>
  );
}

