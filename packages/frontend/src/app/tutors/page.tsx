"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tutorApi, patientApi, Tutor, Patient } from "@/lib/api";
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
import { Search, Edit, Trash2, Users } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TutorsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTutor, setDeleteTutor] = useState<Tutor | null>(null);
  const [viewingTutor, setViewingTutor] = useState<Tutor | null>(null);
  const [tutorPets, setTutorPets] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpfCnpj: "",
    address: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const isAuthorized = !authLoading && !!user;

  const { data: allTutors = [], isLoading } = useQuery({
    queryKey: ["tutors"],
    queryFn: () => tutorApi.list().then((res) => res.data),
    enabled: isAuthorized,
  });

  const tutors = searchTerm.trim()
    ? allTutors.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cpfCnpj?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allTutors;

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      phone?: string;
      email?: string;
      cpfCnpj?: string;
      address?: string;
    }) => tutorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      setShowForm(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Tutor criado com sucesso",
      });
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; phone?: string; email?: string; cpfCnpj?: string; address?: string }) =>
      tutorApi.update(data.id, {
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        cpfCnpj: data.cpfCnpj || undefined,
        address: data.address || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      setShowForm(false);
      setEditingTutor(null);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Tutor atualizado com sucesso",
      });
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tutorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      setDeleteTutor(null);
      toast({
        title: "Sucesso",
        description: "Tutor deletado com sucesso",
      });
    },
    onError: handleError,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      cpfCnpj: "",
      address: "",
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
    if (editingTutor) {
      updateMutation.mutate({ id: editingTutor.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tutor: Tutor) => {
    setEditingTutor(tutor);
    setFormData({
      name: tutor.name,
      phone: tutor.phone || "",
      email: tutor.email || "",
      cpfCnpj: tutor.cpfCnpj || "",
      address: tutor.address || "",
    });
    setShowForm(true);
  };

  const handleViewPets = async (tutor: Tutor) => {
    setViewingTutor(tutor);
    try {
      const response = await tutorApi.getPatients(tutor.id);
      setTutorPets(response.data);
    } catch (error) {
      handleError(error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTutor(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Tutores</h1>
          {!showForm && (
            <Button onClick={() => { setEditingTutor(null); resetForm(); setShowForm(true); }}>
              Novo Tutor
            </Button>
          )}
        </div>

        {!showForm && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
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
                <CardTitle>{editingTutor ? "Editar Tutor" : "Novo Tutor"}</CardTitle>
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
                  <h3 className="text-lg font-semibold">Dados do Tutor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: João Silva"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ex: (11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Ex: joao@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                      <Input
                        id="cpfCnpj"
                        value={formData.cpfCnpj}
                        onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                        placeholder="Ex: 123.456.789-00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo, SP"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Salvando..." 
                      : editingTutor 
                      ? "Salvar Alterações" 
                      : "Criar Tutor"}
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
            {tutors.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nenhum tutor cadastrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              tutors.map((tutor) => (
                <Card key={tutor.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-lg">{tutor.name}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          {tutor.phone && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Telefone:</span> {tutor.phone}
                            </p>
                          )}
                          {tutor.email && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Email:</span> {tutor.email}
                            </p>
                          )}
                          {tutor.cpfCnpj && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">CPF/CNPJ:</span> {tutor.cpfCnpj}
                            </p>
                          )}
                          {tutor.address && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Endereço:</span> {tutor.address}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPets(tutor)}
                          className="flex-1 sm:flex-none"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Pets
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tutor)}
                          className="flex-1 sm:flex-none"
                        >
                          Editar
                        </Button>
                        {user.role === "RECEPCAO" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTutor(tutor)}
                            className="flex-1 sm:flex-none"
                          >
                            Deletar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      <Dialog open={!!viewingTutor} onOpenChange={(open) => !open && setViewingTutor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pets de {viewingTutor?.name}</DialogTitle>
            <DialogDescription>
              Lista de pets cadastrados para este tutor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {tutorPets.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum pet cadastrado</p>
            ) : (
              tutorPets.map((pet) => (
                <Card key={pet.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{pet.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pet.species} {pet.breed && `- ${pet.breed}`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/patients?patientId=${pet.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTutor} onOpenChange={(open) => !open && setDeleteTutor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o tutor <strong>{deleteTutor?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTutor) {
                  deleteMutation.mutate(deleteTutor.id);
                  setDeleteTutor(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

