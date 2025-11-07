"use client";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleKey, Service, serviceApi } from "@/lib/api";
import { createErrorHandler } from "@/lib/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ServicesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState("");

  const canManageServices = canAccess(ModuleKey.ADMIN_SERVICES);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && !canManageServices) {
      router.push("/");
    }
  }, [user, authLoading, canManageServices, router]);

  const isAuthorized = !authLoading && !!user && canManageServices;

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", "all"],
    queryFn: () => serviceApi.listAll().then((res) => res.data),
    enabled: isAuthorized,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => serviceApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowForm(false);
      setServiceName("");
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso",
      });
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      serviceApi.update(data.id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditingService(null);
      setShowForm(false);
      setServiceName("");
      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso",
      });
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Sucesso",
        description: "Serviço desativado com sucesso",
      });
    },
    onError: handleError,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canManageServices) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, name: serviceName });
    } else {
      createMutation.mutate(serviceName);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setServiceName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Serviços</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              Novo Serviço
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6 border-2 transition-all">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</CardTitle>
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
                <div>
                  <Label>Nome do Serviço</Label>
                  <Input
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ex: Consulta"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingService
                      ? "Salvar Alterações"
                      : "Criar Serviço"}
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
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.isActive ? "Ativo" : "Desativado"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {service.isActive && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Deseja desativar o serviço ${service.name}?`)) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                          >
                            Desativar
                          </Button>
                        </>
                      )}
                    </div>
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

