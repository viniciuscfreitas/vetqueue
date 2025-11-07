"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, Role, User, ModuleKey } from "@/lib/api";
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
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: Role.VET as Role,
  });

  const canManageUsers = canAccess(ModuleKey.ADMIN_USERS);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && !canManageUsers) {
      router.push("/");
    }
  }, [user, authLoading, canManageUsers, router]);

  const isAuthorized = !authLoading && !!user && canManageUsers;

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

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Você não possui acesso ao módulo de usuários.
      </div>
    );
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
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie contas, perfis e credenciais da equipe.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            Novo Usuário
          </Button>
        )}
      </header>

      {showForm && (
        <Card className="border border-muted-foreground/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
            <CardTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
              ×
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={editingUser.username} disabled />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{editingUser ? "Nova Senha (opcional)" : "Senha"}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? "Deixe em branco para não alterar" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.VET}>Veterinário</SelectItem>
                      <SelectItem value={Role.RECEPCAO}>Recepção</SelectItem>
                      <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="sm:min-w-[160px]"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingUser
                    ? "Salvar alterações"
                    : "Criar usuário"}
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-muted-foreground/20">
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {users.map((usr) => (
            <Card key={usr.id} className="border border-muted-foreground/30 transition hover:border-muted-foreground/50">
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <p className="font-semibold text-base">{usr.name}</p>
                  <p className="text-sm text-muted-foreground">@{usr.username}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {usr.role === Role.VET ? "Veterinário" : usr.role === Role.RECEPCAO ? "Recepção" : "Admin"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(usr)}>
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
