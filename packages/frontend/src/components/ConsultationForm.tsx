"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultationApi, Consultation, Patient, CreateConsultationData, UpdateConsultationData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";
import { recordQueueFormMetric } from "@/lib/metrics";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

interface ConsultationFormSession {
  startedAt: number;
  submitted: boolean;
  interacted: boolean;
}

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

  const createSession = (): ConsultationFormSession => ({
    startedAt: now(),
    submitted: false,
    interacted: false,
  });

  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment: "",
    prescription: "",
    weightInKg: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const sessionRef = useRef<ConsultationFormSession>(createSession());
  const latestFormRef = useRef(formData);

  useEffect(() => {
    latestFormRef.current = formData;
  }, [formData]);

  useEffect(() => {
    sessionRef.current = createSession();
  }, [consultation?.id, patient.id]);

  const registerMetric = (status: "submitted" | "abandoned") => {
    const session = sessionRef.current;
    const durationMs = now() - session.startedAt;
    recordQueueFormMetric({
      status,
      variant: "consultation",
      durationMs,
      usedTutorQuickCreate: false,
      usedPatientQuickCreate: false,
      hasScheduledAppointment: false,
      timestamp: new Date().toISOString(),
    });
  };

  const markInteracted = () => {
    sessionRef.current.interacted = true;
  };

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (!session.submitted && session.interacted) {
        registerMetric("abandoned");
      }
    };
  }, []);

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
    } else {
      setFormData({
        diagnosis: "",
        treatment: "",
        prescription: "",
        weightInKg: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
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
      sessionRef.current.submitted = true;
      registerMetric("submitted");
      sessionRef.current = createSession();
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
      sessionRef.current.submitted = true;
      registerMetric("submitted");
      sessionRef.current = createSession();
      onSuccess();
    },
    onError: handleError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markInteracted();

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
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Revise os campos essenciais antes de salvar; detalhes complementares podem ser adicionados depois.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  markInteracted();
                  setFormData((prev) => ({ ...prev, date: e.target.value }));
                }}
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
                onChange={(e) => {
                  markInteracted();
                  setFormData((prev) => ({ ...prev, weightInKg: e.target.value }));
                }}
                placeholder="Ex: 25.5"
              />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => {
                  markInteracted();
                  setFormData((prev) => ({ ...prev, diagnosis: e.target.value }));
                }}
                placeholder="Resumo do diagnóstico principal"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment">Plano terapêutico</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) => {
                  markInteracted();
                  setFormData((prev) => ({ ...prev, treatment: e.target.value }));
                }}
                placeholder="Condutas adotadas e orientações"
                rows={3}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prescription">Prescrição</Label>
              <Textarea
                id="prescription"
                value={formData.prescription}
                onChange={(e) => {
                  markInteracted();
                  setFormData((prev) => ({ ...prev, prescription: e.target.value }));
                }}
                placeholder="Medicamentos, dosagens e frequências"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações adicionais</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => {
                  markInteracted();
                  setFormData((prev) => ({ ...prev, notes: e.target.value }));
                }}
                placeholder="Comportamento, retorno, orientações ao tutor..."
                rows={3}
              />
            </div>
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

