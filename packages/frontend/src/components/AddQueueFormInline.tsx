"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Priority, queueApi, userApi, serviceApi, Role } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

interface AddQueueFormInlineProps {
  onSuccess?: () => void;
  onClose?: () => void;
  inline?: boolean;
}

export function AddQueueFormInline({ onSuccess, onClose, inline = true }: AddQueueFormInlineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    tutorName: "",
    serviceType: "",
    priority: Priority.NORMAL as Priority,
    assignedVetId: "NONE",
    hasScheduledAppointment: false,
    scheduledAt: "",
  });

  const isRecepcao = user?.role === Role.RECEPCAO;

  const { data: vets = [] } = useQuery({
    queryKey: ["users", "vets"],
    queryFn: () => userApi.list().then((res) => res.data.filter((u) => u.role === Role.VET)),
    enabled: isRecepcao,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceApi.list().then((res) => res.data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await queueApi.add({
        patientName: formData.patientName,
        tutorName: formData.tutorName,
        serviceType: formData.serviceType,
        priority: formData.priority,
        assignedVetId: formData.assignedVetId === "NONE" ? undefined : formData.assignedVetId,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        scheduledAt: formData.hasScheduledAppointment && formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
      });
      setFormData({
        patientName: "",
        tutorName: "",
        serviceType: "",
        priority: Priority.NORMAL as Priority,
        assignedVetId: "NONE",
        hasScheduledAppointment: false,
        scheduledAt: "",
      });
      toast({
        title: "Sucesso",
        description: "Entrada adicionada à fila",
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
          <Label htmlFor="patientName" className="text-sm font-medium">
            Paciente
          </Label>
          <Input
            id="patientName"
            value={formData.patientName}
            onChange={(e) =>
              setFormData({ ...formData, patientName: e.target.value })
            }
            required
            placeholder="Nome do paciente"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tutorName" className="text-sm font-medium">
            Tutor
          </Label>
          <Input
            id="tutorName"
            value={formData.tutorName}
            onChange={(e) =>
              setFormData({ ...formData, tutorName: e.target.value })
            }
            required
            placeholder="Nome do tutor"
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {isRecepcao && (
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
                  <SelectItem key={vet.id} value={vet.id}>
                    {vet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
        <Label htmlFor="hasScheduledAppointment" className="text-sm font-normal cursor-pointer">
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
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) =>
              setFormData({ ...formData, scheduledAt: e.target.value })
            }
            required={formData.hasScheduledAppointment}
            className="w-full"
          />
        </div>
      )}

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

