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
import { ServiceType, Priority, queueApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants";

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await queueApi.add({
        patientName: formData.patientName,
        tutorName: formData.tutorName,
        serviceType: formData.serviceType as ServiceType,
        priority: formData.priority,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        scheduledAt: formData.hasScheduledAppointment && formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
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
      <div>
        <Label htmlFor="patientName">Nome do Paciente</Label>
        <Input
          id="patientName"
          value={formData.patientName}
          onChange={(e) =>
            setFormData({ ...formData, patientName: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="tutorName">Nome do Tutor</Label>
        <Input
          id="tutorName"
          value={formData.tutorName}
          onChange={(e) =>
            setFormData({ ...formData, tutorName: e.target.value })
          }
          required
        />
      </div>

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
            type="datetime-local"
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

