"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultationApi, Consultation, Patient, CreateConsultationData, UpdateConsultationData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

interface ConsultationFormProps {
  patient: Patient;
  queueEntryId?: string;
  consultation?: Consultation;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ConsultationForm({
  patient,
  queueEntryId,
  consultation,
  onSuccess,
  onCancel,
}: ConsultationFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment: "",
    prescription: "",
    weightInKg: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (consultation) {
      setFormData({
        diagnosis: consultation.diagnosis || "",
        treatment: consultation.treatment || "",
        prescription: consultation.prescription || "",
        weightInKg: consultation.weightInKg?.toString() || "",
        notes: consultation.notes || "",
        date: consultation.date ? consultation.date.split("T")[0] : new Date().toISOString().split("T")[0],
      });
    }
  }, [consultation]);

  const createMutation = useMutation({
    mutationFn: (data: CreateConsultationData) => consultationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations", patient.id] });
      toast({
        title: "Sucesso",
        description: "Consulta criada com sucesso",
      });
      onSuccess();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: UpdateConsultationData }) =>
      consultationApi.update(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations", patient.id] });
      toast({
        title: "Sucesso",
        description: "Consulta atualizada com sucesso",
      });
      onSuccess();
    },
    onError: handleError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      patientId: patient.id,
      queueEntryId: queueEntryId || consultation?.queueEntryId || undefined,
      vetId: user?.id || consultation?.vetId || undefined,
      diagnosis: formData.diagnosis || undefined,
      treatment: formData.treatment || undefined,
      prescription: formData.prescription || undefined,
      weightInKg: formData.weightInKg ? parseFloat(formData.weightInKg) : undefined,
      notes: formData.notes || undefined,
      date: formData.date ? `${formData.date}T00:00:00.000Z` : undefined,
    };

    if (consultation) {
      updateMutation.mutate({
        id: consultation.id,
        data: {
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          prescription: data.prescription,
          weightInKg: data.weightInKg,
          notes: data.notes,
          date: data.date,
        },
      });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card className="mb-4 border-2">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center justify-between">
          <CardTitle>{consultation ? "Editar Consulta" : "Nova Consulta"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="weightInKg">Peso (kg)</Label>
              <Input
                id="weightInKg"
                type="number"
                step="0.1"
                min="0"
                value={formData.weightInKg}
                onChange={(e) => setFormData({ ...formData, weightInKg: e.target.value })}
                placeholder="Ex: 25.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Diagnóstico do paciente"
            />
          </div>
          <div>
            <Label htmlFor="treatment">Tratamento</Label>
            <Input
              id="treatment"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="Tratamento prescrito"
            />
          </div>
          <div>
            <Label htmlFor="prescription">Prescrição</Label>
            <Input
              id="prescription"
              value={formData.prescription}
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
              placeholder="Medicamentos prescritos"
            />
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : consultation
                ? "Salvar Alterações"
                : "Criar Consulta"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

