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
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants";

interface AddQueueFormInlineProps {
  onSuccess?: () => void;
}

export function AddQueueFormInline({ onSuccess }: AddQueueFormInlineProps) {
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    tutorName: "",
    serviceType: "" as ServiceType | "",
    priority: Priority.NORMAL as Priority,
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
      });
      setFormData({
        patientName: "",
        tutorName: "",
        serviceType: "" as ServiceType | "",
        priority: Priority.NORMAL as Priority,
      });
      toast({
        title: "Sucesso",
        description: "Entrada adicionada à fila",
      });
      onSuccess?.();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-4 rounded-lg border space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
        <div className="sm:col-span-2 space-y-2">
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
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
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
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="serviceType" className="text-sm font-medium">
            Serviço
          </Label>
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

        <div className="sm:col-span-1 space-y-2">
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
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adicionando..." : "Adicionar à Fila"}
      </Button>
    </form>
  );
}

