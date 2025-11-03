"use client";

import { useState } from "react";
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
import { ServiceType, Priority, queueApi, Patient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants";
import { PatientAutocomplete } from "./PatientAutocomplete";
import { TutorAutocomplete } from "./TutorAutocomplete";

export function AddQueueForm() {
  const router = useRouter();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    tutorName: "",
    serviceType: "" as ServiceType | "",
    priority: Priority.NORMAL as Priority,
    hasScheduledAppointment: false,
    scheduledAt: "",
    patientId: undefined as string | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const today = new Date();
      const [hours, minutes] = formData.hasScheduledAppointment && formData.scheduledAt ? formData.scheduledAt.split(':') : ['00', '00'];
      const scheduledDateTime = formData.hasScheduledAppointment && formData.scheduledAt
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes))
        : undefined;

      await queueApi.add({
        patientName: formData.patientName,
        tutorName: formData.tutorName,
        serviceType: formData.serviceType as ServiceType,
        priority: formData.priority,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        scheduledAt: scheduledDateTime?.toISOString(),
        patientId: formData.patientId,
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <TutorAutocomplete
        value={formData.tutorName}
        onChange={(tutorName) => {
          setFormData({
            ...formData,
            tutorName,
            patientName: "",
            patientId: undefined,
          });
        }}
        label="Tutor"
        placeholder="Buscar tutor ou digite..."
        required
      />

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
      />

      <div>
        <Label htmlFor="serviceType">Tipo de Serviço</Label>
        <Select
          value={formData.serviceType}
          onValueChange={(value) =>
            setFormData({ ...formData, serviceType: value as ServiceType })
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

      <div>
        <Label htmlFor="priority">Prioridade</Label>
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

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hasScheduledAppointment"
          checked={formData.hasScheduledAppointment}
          onChange={(e) =>
            setFormData({
              ...formData,
              hasScheduledAppointment: e.target.checked,
              scheduledAt: e.target.checked ? formData.scheduledAt : "",
            })
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="hasScheduledAppointment" className="font-normal cursor-pointer">
          Tem hora marcada
        </Label>
      </div>

      {formData.hasScheduledAppointment && (
        <div>
          <Label htmlFor="scheduledAt">Hora Agendada</Label>
          <Input
            id="scheduledAt"
            type="time"
            value={formData.scheduledAt}
            onChange={(e) =>
              setFormData({ ...formData, scheduledAt: e.target.value })
            }
            required={formData.hasScheduledAppointment}
          />
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adicionando..." : "Adicionar à Fila"}
      </Button>
    </form>
  );
}

