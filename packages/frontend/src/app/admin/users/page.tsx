"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, Role, User } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("[UsersPage] Render - authLoading:", authLoading, "user:", user?.username, "role:", user?.role);
    }
  }, [authLoading, user]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: Role.VET as Role,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "RECEPCAO")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const isAuthorized = !authLoading && user && user.role === "RECEPCAO";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.list().then((res) => res.data),
    enabled: isAuthorized,
  });

  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; name: string; role: Role }) =>
      userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; role?: Role; password?: string }) =>
      userApi.update(data.id, { name: data.name, role: data.role, password: data.password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });
    },
    onError: handleError,
  });

  if (authLoading || !user || user.role !== "RECEPCAO") {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser && formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Senha deve ter no mínimo 6 caracteres",
      });
      return;
    }
    
    if (editingUser && formData.password && formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Senha deve ter no mínimo 6 caracteres",
      });
      return;
    }
    
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        name: formData.name,
        role: formData.role,
        password: formData.password || undefined,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (usr: User) => {
    setEditingUser(usr);
    setFormData({
      username: usr.username,
      password: "",
      name: usr.name,
      role: usr.role,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: Role.VET,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Usuários</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              Novo Usuário
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                  )}
                  {editingUser && (
                    <div>
                      <Label>Username</Label>
                      <Input value={editingUser.username} disabled />
                    </div>
                  )}
                  <div>
                    <Label>{editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      placeholder={editingUser ? "Deixe em branco para não alterar" : ""}
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Role.VET}>Veterinário</SelectItem>
                        <SelectItem value={Role.RECEPCAO}>Recepção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Salvando..." 
                      : editingUser 
                      ? "Salvar Alterações" 
                      : "Criar Usuário"}
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
            {users.map((usr) => (
              <Card key={usr.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{usr.name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{usr.username} • {usr.role === Role.VET ? "Veterinário" : "Recepção"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(usr)}>
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
