"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vaccinationApi, Vaccination, Patient, CreateVaccinationData, UpdateVaccinationData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface VaccinationFormProps {
  patient: Patient;
  vaccination?: Vaccination;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VaccinationForm({
  patient,
  vaccination,
  onSuccess,
  onCancel,
}: VaccinationFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [formData, setFormData] = useState({
    vaccineName: "",
    appliedDate: new Date().toISOString().split("T")[0],
    batchNumber: "",
    nextDoseDate: "",
    notes: "",
  });

  const [useSuggestion, setUseSuggestion] = useState(false);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["vaccine-suggestions"],
    queryFn: () => vaccinationApi.getSuggestions().then((res) => res.data),
    enabled: !vaccination,
  });

  useEffect(() => {
    if (vaccination) {
      setFormData({
        vaccineName: vaccination.vaccineName || "",
        appliedDate: vaccination.appliedDate ? vaccination.appliedDate.split("T")[0] : new Date().toISOString().split("T")[0],
        batchNumber: vaccination.batchNumber || "",
        nextDoseDate: vaccination.nextDoseDate ? vaccination.nextDoseDate.split("T")[0] : "",
        notes: vaccination.notes || "",
      });
    }
  }, [vaccination]);

  const calculateNextDose = (days: number) => {
    const appliedDate = new Date(formData.appliedDate);
    appliedDate.setDate(appliedDate.getDate() + days);
    setFormData({ ...formData, nextDoseDate: appliedDate.toISOString().split("T")[0] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateVaccinationData) => vaccinationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["vaccine-suggestions"] });
      toast({
        title: "Sucesso",
        description: "Vacina registrada com sucesso",
      });
      onSuccess();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: UpdateVaccinationData }) =>
      vaccinationApi.update(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations", patient.id] });
      toast({
        title: "Sucesso",
        description: "Vacina atualizada com sucesso",
      });
      onSuccess();
    },
    onError: handleError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      patientId: patient.id,
      vaccineName: formData.vaccineName,
      appliedDate: formData.appliedDate ? `${formData.appliedDate}T00:00:00.000Z` : undefined,
      batchNumber: formData.batchNumber || undefined,
      vetId: user?.id || vaccination?.vetId || undefined,
      nextDoseDate: formData.nextDoseDate ? `${formData.nextDoseDate}T00:00:00.000Z` : undefined,
      notes: formData.notes || undefined,
    };

    if (vaccination) {
      updateMutation.mutate({
        id: vaccination.id,
        data: {
          vaccineName: data.vaccineName,
          appliedDate: data.appliedDate,
          batchNumber: data.batchNumber,
          nextDoseDate: data.nextDoseDate,
          notes: data.notes,
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
          <CardTitle>{vaccination ? "Editar Vacina" : "Nova Vacina"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vaccineName">Nome da Vacina *</Label>
            {!vaccination && suggestions.length > 0 && (
              <div className="mb-2">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Sugestões:
                </Label>
                <Select
                  value={useSuggestion ? formData.vaccineName : ""}
                  onValueChange={(value) => {
                    setFormData({ ...formData, vaccineName: value });
                    setUseSuggestion(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma vacina já usada" />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestions.map((suggestion) => (
                      <SelectItem key={suggestion} value={suggestion}>
                        {suggestion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setUseSuggestion(false)}
                >
                  Ou digite um novo nome
                </Button>
              </div>
            )}
            <Input
              id="vaccineName"
              value={formData.vaccineName}
              onChange={(e) => {
                setFormData({ ...formData, vaccineName: e.target.value });
                setUseSuggestion(false);
              }}
              placeholder="Ex: V10, Antirrábica, etc."
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appliedDate">Data de Aplicação *</Label>
              <Input
                id="appliedDate"
                type="date"
                value={formData.appliedDate}
                onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="batchNumber">Lote</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="Ex: 123456"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="nextDoseDate">Próxima Dose</Label>
            <div className="flex gap-2">
              <Input
                id="nextDoseDate"
                type="date"
                value={formData.nextDoseDate}
                onChange={(e) => setFormData({ ...formData, nextDoseDate: e.target.value })}
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => calculateNextDose(30)}
                  title="+30 dias"
                >
                  +30d
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => calculateNextDose(90)}
                  title="+90 dias"
                >
                  +90d
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => calculateNextDose(365)}
                  title="+1 ano"
                >
                  +1a
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Reações, lembretes para retorno, orientações ao tutor..."
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : vaccination
                ? "Salvar Alterações"
                : "Registrar Vacina"}
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

