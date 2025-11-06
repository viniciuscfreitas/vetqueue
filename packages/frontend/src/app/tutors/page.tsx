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
import { Search, Plus, Edit, Trash2, Users } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tutores</h1>
          <Button onClick={() => { setEditingTutor(null); resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tutor
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Nenhum tutor encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <Card key={tutor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{tutor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {tutor.phone && <p>📞 {tutor.phone}</p>}
                    {tutor.email && <p>✉️ {tutor.email}</p>}
                    {tutor.cpfCnpj && <p>🆔 {tutor.cpfCnpj}</p>}
                    {tutor.address && <p>📍 {tutor.address}</p>}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPets(tutor)}
                      className="flex-1"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Pets
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tutor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.role === "RECEPCAO" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTutor(tutor)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTutor ? "Editar Tutor" : "Novo Tutor"}
              </DialogTitle>
              <DialogDescription>
                {editingTutor ? "Atualize as informações do tutor" : "Preencha os dados do tutor"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); setEditingTutor(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTutor ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
                <p className="text-center text-gray-500 py-4">Nenhum pet cadastrado</p>
              ) : (
                tutorPets.map((pet) => (
                  <Card key={pet.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{pet.name}</p>
                          <p className="text-sm text-gray-600">
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
                Tem certeza que deseja deletar o tutor "{deleteTutor?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTutor && deleteMutation.mutate(deleteTutor.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

