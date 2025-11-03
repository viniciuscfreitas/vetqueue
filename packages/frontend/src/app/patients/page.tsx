"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientApi, Patient } from "@/lib/api";
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
import { Spinner } from "@/components/ui/spinner";
import { Search, History } from "lucide-react";
import { PatientHistoryDialog } from "@/components/PatientHistoryDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    birthDate: "",
    gender: "",
    tutorName: "",
    tutorPhone: "",
    tutorEmail: "",
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

  const patients = searchTerm.trim()
    ? allPatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tutorName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allPatients;

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      species?: string;
      breed?: string;
      birthDate?: string;
      gender?: string;
      tutorName: string;
      tutorPhone?: string;
      tutorEmail?: string;
      notes?: string;
    }) => patientApi.create({
      ...data,
      species: data.species || undefined,
      breed: data.breed || undefined,
      birthDate: data.birthDate ? `${data.birthDate}T00:00:00.000Z` : undefined,
      gender: data.gender || undefined,
      tutorPhone: data.tutorPhone || undefined,
      tutorEmail: data.tutorEmail || undefined,
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
    mutationFn: (data: { id: string; name: string; species?: string; breed?: string; birthDate?: string; gender?: string; tutorName: string; tutorPhone?: string; tutorEmail?: string; notes?: string }) =>
      patientApi.update(data.id, {
        name: data.name,
        species: data.species || undefined,
        breed: data.breed || undefined,
        birthDate: data.birthDate ? `${data.birthDate}T00:00:00.000Z` : undefined,
        gender: data.gender || undefined,
        tutorName: data.tutorName,
        tutorPhone: data.tutorPhone || undefined,
        tutorEmail: data.tutorEmail || undefined,
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
      tutorName: "",
      tutorPhone: "",
      tutorEmail: "",
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
      tutorName: patient.tutorName || "",
      tutorPhone: patient.tutorPhone || "",
      tutorEmail: patient.tutorEmail || "",
      notes: patient.notes || "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              Novo Paciente
            </Button>
          )}
        </div>

        {!showForm && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por paciente ou tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label>Nome do Tutor *</Label>
                    <Input
                      value={formData.tutorName}
                      onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                      placeholder="Ex: João Silva"
                      required
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
                </div>
                <div>
                  <Label>Prontuário / Observações</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Anotações e informações sobre o paciente..."
                  />
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
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-lg">{patient.name}</p>
                          {patient.species && (
                            <span className="text-sm text-muted-foreground">
                              ({patient.species})
                            </span>
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
                          {patient.notes && (
                            <p className="text-muted-foreground mt-2 border-t pt-2">
                              <span className="font-medium">Prontuário:</span> {patient.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPatient(patient)}
                        >
                          <History className="h-4 w-4 mr-1" />
                          Histórico
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deseja deletar o paciente ${patient.name}?`)) {
                              deleteMutation.mutate(patient.id);
                            }
                          }}
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
      </main>

      {historyPatient && (
        <PatientHistoryDialog
          patient={historyPatient}
          open={!!historyPatient}
          onOpenChange={(open) => !open && setHistoryPatient(null)}
        />
      )}
    </div>
  );
}

