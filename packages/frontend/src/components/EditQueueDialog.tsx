"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
import { QueueEntry, Priority, queueApi, userApi, serviceApi, Role } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

interface EditQueueDialogProps {
  entry: QueueEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditQueueDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: EditQueueDialogProps) {
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

  useEffect(() => {
    if (open && entry) {
      const scheduledTime = entry.scheduledAt
        ? new Date(entry.scheduledAt).toTimeString().slice(0, 5)
        : "";
      
      setFormData({
        patientName: entry.patientName,
        tutorName: entry.tutorName,
        serviceType: entry.serviceType,
        priority: entry.priority,
        assignedVetId: entry.assignedVetId || "NONE",
        hasScheduledAppointment: entry.hasScheduledAppointment || false,
        scheduledAt: scheduledTime,
      });
    }
  }, [open, entry]);

  const { data: vets = [] } = useQuery({
    queryKey: ["users", "active-vets"],
    queryFn: () => userApi.getActiveVets().then((res) => res.data),
    enabled: isRecepcao && open,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceApi.list().then((res) => res.data),
    enabled: open,
  });

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

      await queueApi.updateEntry(entry.id, {
        patientName: formData.patientName,
        tutorName: formData.tutorName,
        serviceType: formData.serviceType,
        priority: formData.priority,
        assignedVetId: formData.assignedVetId === "NONE" ? null : formData.assignedVetId,
        hasScheduledAppointment: formData.hasScheduledAppointment,
        scheduledAt: scheduledDateTime?.toISOString(),
      });

      toast({
        title: "Sucesso",
        description: "Atendimento atualizado com sucesso",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Atendimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-patientName" className="text-sm font-medium">
                Paciente
              </Label>
              <Input
                id="edit-patientName"
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
              <Label htmlFor="edit-tutorName" className="text-sm font-medium">
                Tutor
              </Label>
              <Input
                id="edit-tutorName"
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
              <Label htmlFor="edit-serviceType" className="text-sm font-medium">
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
              <Label htmlFor="edit-priority" className="text-sm font-medium">
                Prioridade
              </Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(value) as Priority,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.NORMAL.toString()}>
                    Normal
                  </SelectItem>
                  <SelectItem value={Priority.HIGH.toString()}>Alta</SelectItem>
                  <SelectItem value={Priority.EMERGENCY.toString()}>
                    Emergência
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRecepcao && (
              <div className="space-y-2">
                <Label htmlFor="edit-assignedVetId" className="text-sm font-medium">
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
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-hasScheduledAppointment"
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
            <Label
              htmlFor="edit-hasScheduledAppointment"
              className="text-sm font-normal cursor-pointer"
            >
              Tem hora marcada
            </Label>
          </div>

          {formData.hasScheduledAppointment && (
            <div className="space-y-2">
              <Label htmlFor="edit-scheduledAt" className="text-sm font-medium">
                Hora Agendada (hoje)
              </Label>
              <Input
                id="edit-scheduledAt"
                type="time"
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledAt: e.target.value })
                }
                required={formData.hasScheduledAppointment}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                A prioridade será aumentada automaticamente se o horário passou
                há mais de 15 minutos.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

