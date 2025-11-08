"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientApi, Patient } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import type { HeaderAction, HeaderAlert } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { History, AlertCircle, PawPrint, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PatientRecordDialog } from "@/components/PatientRecordDialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function calculateAge(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

export default function PatientsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    birthDate: "",
    gender: "",
    microchip: "",
    color: "",
    currentWeight: "",
    allergies: "",
    ongoingMedications: "",
    temperament: "",
    neutered: false,
    photoUrl: "",
    tutorName: "",
    tutorPhone: "",
    tutorEmail: "",
    tutorCpfCnpj: "",
    tutorAddress: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const isAuthorized = !authLoading && !!user;

  const { data: allPatients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientApi.list().then((res) => res.data),
    enabled: isAuthorized,
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const patients = normalizedSearch
    ? allPatients.filter((p) => {
        const patientName = p.name?.toLowerCase() ?? "";
        const tutorName = p.tutorName?.toLowerCase() ?? "";
        return patientName.includes(normalizedSearch) || tutorName.includes(normalizedSearch);
      })
    : allPatients;

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      species?: string;
      breed?: string;
      birthDate?: string;
      gender?: string;
      microchip?: string;
      color?: string;
      currentWeight?: string;
      allergies?: string;
      ongoingMedications?: string;
      temperament?: string;
      neutered?: boolean;
      photoUrl?: string;
      tutorName: string;
      tutorPhone?: string;
      tutorEmail?: string;
      tutorCpfCnpj?: string;
      tutorAddress?: string;
      notes?: string;
    }) => patientApi.create({
      ...data,
      species: data.species || undefined,
      breed: data.breed || undefined,
      birthDate: data.birthDate ? `${data.birthDate}T00:00:00.000Z` : undefined,
      gender: data.gender || undefined,
      microchip: data.microchip || undefined,
      color: data.color || undefined,
      currentWeight: data.currentWeight ? parseFloat(data.currentWeight) : undefined,
      allergies: data.allergies || undefined,
      ongoingMedications: data.ongoingMedications || undefined,
      temperament: data.temperament || undefined,
      neutered: data.neutered,
      photoUrl: data.photoUrl || undefined,
      tutorPhone: data.tutorPhone || undefined,
      tutorEmail: data.tutorEmail || undefined,
      tutorCpfCnpj: data.tutorCpfCnpj || undefined,
      tutorAddress: data.tutorAddress || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso",
      });
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; species?: string; breed?: string; birthDate?: string; gender?: string; microchip?: string; color?: string; currentWeight?: string; allergies?: string; ongoingMedications?: string; temperament?: string; neutered?: boolean; photoUrl?: string; tutorName: string; tutorPhone?: string; tutorEmail?: string; tutorCpfCnpj?: string; tutorAddress?: string; notes?: string }) =>
      patientApi.update(data.id, {
        name: data.name,
        species: data.species || undefined,
        breed: data.breed || undefined,
        birthDate: data.birthDate ? `${data.birthDate}T00:00:00.000Z` : undefined,
        gender: data.gender || undefined,
        microchip: data.microchip || undefined,
        color: data.color || undefined,
        currentWeight: data.currentWeight ? parseFloat(data.currentWeight) : undefined,
        allergies: data.allergies || undefined,
        ongoingMedications: data.ongoingMedications || undefined,
        temperament: data.temperament || undefined,
        neutered: data.neutered,
        photoUrl: data.photoUrl || undefined,
        tutorName: data.tutorName,
        tutorPhone: data.tutorPhone || undefined,
        tutorEmail: data.tutorEmail || undefined,
        tutorCpfCnpj: data.tutorCpfCnpj || undefined,
        tutorAddress: data.tutorAddress || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setEditingPatient(null);
      setShowForm(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso",
      });
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Sucesso",
        description: "Paciente deletado com sucesso",
      });
    },
    onError: handleError,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      species: "",
      breed: "",
      birthDate: "",
      gender: "",
      microchip: "",
      color: "",
      currentWeight: "",
      allergies: "",
      ongoingMedications: "",
      temperament: "",
      neutered: false,
      photoUrl: "",
      tutorName: "",
      tutorPhone: "",
      tutorEmail: "",
      tutorCpfCnpj: "",
      tutorAddress: "",
      notes: "",
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name || "",
      species: patient.species || "",
      breed: patient.breed || "",
      birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : "",
      gender: patient.gender || "",
      microchip: patient.microchip || "",
      color: patient.color || "",
      currentWeight: patient.currentWeight?.toString() || "",
      allergies: patient.allergies || "",
      ongoingMedications: patient.ongoingMedications || "",
      temperament: patient.temperament || "",
      neutered: patient.neutered || false,
      photoUrl: patient.photoUrl || "",
      tutorName: patient.tutorName || "",
      tutorPhone: patient.tutorPhone || "",
      tutorEmail: patient.tutorEmail || "",
      tutorCpfCnpj: patient.tutorCpfCnpj || "",
      tutorAddress: patient.tutorAddress || "",
      notes: patient.notes || "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
    resetForm();
  };

  const headerAlerts: HeaderAlert[] = [
    {
      label: `${patients.length} pacientes`,
      icon: <PawPrint className="h-3.5 w-3.5" />,
    },
  ];

  const headerActions: HeaderAction[] = [
    {
      label: showForm ? "Fechar formulário" : "Novo paciente",
      icon: <Plus className="h-4 w-4" />,
      variant: showForm ? "outline" : undefined,
      onClick: () => {
        if (showForm) {
          handleCancel();
        } else {
          setShowForm(true);
        }
      },
    },
  ];

  return (
    <AppShell
      header={
        <Header
          title="Pacientes"
          subtitle="Cadastre pets, mantenha dados atualizados e deixe o prontuário sempre pronto para o próximo atendimento."
          onSearch={(term) => setSearchTerm(term)}
          defaultSearchValue={searchTerm}
          actions={headerActions}
          alerts={headerAlerts}
        />
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">

        {showForm && (
          <Card className="mb-6 border-2 transition-all">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle>{editingPatient ? "Editar Paciente" : "Novo Paciente"}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados do Paciente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Paciente *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Rex"
                        required
                      />
                    </div>
                    <div>
                      <Label>Espécie</Label>
                      <Select
                        value={formData.species}
                        onValueChange={(value) => setFormData({ ...formData, species: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cão">Cão</SelectItem>
                          <SelectItem value="Gato">Gato</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Raça</Label>
                      <Input
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                        placeholder="Ex: Labrador"
                      />
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Ex: Preto e Branco"
                      />
                    </div>
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Gênero</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Macho">Macho</SelectItem>
                          <SelectItem value="Fêmea">Fêmea</SelectItem>
                          <SelectItem value="Indefinido">Indefinido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Microchip</Label>
                      <Input
                        value={formData.microchip}
                        onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                        placeholder="Ex: 123456789012345"
                      />
                    </div>
                    <div>
                      <Label>Peso Atual (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.currentWeight}
                        onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                        placeholder="Ex: 15.5"
                      />
                    </div>
                    <div>
                      <Label>URL da Foto</Label>
                      <Input
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="neutered"
                        checked={formData.neutered}
                        onCheckedChange={(checked) => setFormData({ ...formData, neutered: checked as boolean })}
                      />
                      <Label htmlFor="neutered" className="cursor-pointer">Castrado</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados do Tutor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Tutor *</Label>
                      <Input
                        value={formData.tutorName}
                        onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                        placeholder="Ex: João Silva"
                        required
                      />
                    </div>
                    <div>
                      <Label>CPF/CNPJ</Label>
                      <Input
                        value={formData.tutorCpfCnpj}
                        onChange={(e) => setFormData({ ...formData, tutorCpfCnpj: e.target.value })}
                        placeholder="Ex: 123.456.789-00"
                      />
                    </div>
                    <div>
                      <Label>Telefone do Tutor</Label>
                      <Input
                        value={formData.tutorPhone}
                        onChange={(e) => setFormData({ ...formData, tutorPhone: e.target.value })}
                        placeholder="Ex: (11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label>Email do Tutor</Label>
                      <Input
                        type="email"
                        value={formData.tutorEmail}
                        onChange={(e) => setFormData({ ...formData, tutorEmail: e.target.value })}
                        placeholder="Ex: joao@email.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Endereço</Label>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.tutorAddress}
                        onChange={(e) => setFormData({ ...formData, tutorAddress: e.target.value })}
                        placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo, SP"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações de Saúde</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2 text-red-600 font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        Alergias
                      </Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border-2 border-red-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        placeholder="Liste todas as alergias conhecidas..."
                      />
                    </div>
                    <div>
                      <Label>Medicações em Uso</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.ongoingMedications}
                        onChange={(e) => setFormData({ ...formData, ongoingMedications: e.target.value })}
                        placeholder="Liste medicações contínuas..."
                      />
                    </div>
                    <div>
                      <Label>Temperamento</Label>
                      <Select
                        value={formData.temperament}
                        onValueChange={(value) => setFormData({ ...formData, temperament: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Calmo">Calmo</SelectItem>
                          <SelectItem value="Agitado">Agitado</SelectItem>
                          <SelectItem value="Agressivo">Agressivo</SelectItem>
                          <SelectItem value="Medroso">Medroso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Prontuário / Observações</h3>
                  <div>
                    <Label>Observações Gerais</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Anotações e informações sobre o paciente..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Salvando..." 
                      : editingPatient 
                      ? "Salvar Alterações" 
                      : "Criar Paciente"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {patients.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhum paciente cadastrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              patients.map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-lg">{patient.name}</p>
                          {patient.species && (
                            <span className="text-sm text-muted-foreground">
                              {patient.species}
                            </span>
                          )}
                          {patient.gender && (
                            <span className="text-sm text-muted-foreground">
                              • {patient.gender}
                            </span>
                          )}
                          {calculateAge(patient.birthDate) && (
                            <span className="text-sm text-muted-foreground">
                              • {calculateAge(patient.birthDate)}
                            </span>
                          )}
                          {patient.allergies && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              ALERGIAS
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          {patient.breed && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Raça:</span> {patient.breed}
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            <span className="font-medium">Tutor:</span> {patient.tutorName}
                          </p>
                          {patient.tutorPhone && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Telefone:</span> {patient.tutorPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPatient(patient)}
                          className="flex-1 sm:flex-none"
                        >
                          <History className="h-4 w-4 mr-1" />
                          Prontuário
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                          className="flex-1 sm:flex-none"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletePatient(patient)}
                          className="flex-1 sm:flex-none"
                        >
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {historyPatient && (
        <PatientRecordDialog
          patient={historyPatient}
          open={!!historyPatient}
          onOpenChange={(open) => !open && setHistoryPatient(null)}
          initialTab="consultations"
        />
      )}

      <AlertDialog open={!!deletePatient} onOpenChange={(open) => !open && setDeletePatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o paciente <strong>{deletePatient?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePatient) {
                  deleteMutation.mutate(deletePatient.id);
                  setDeletePatient(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

