"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
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
  const [serviceToDeactivate, setServiceToDeactivate] = useState<Service | null>(null);

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
      setServiceToDeactivate(null);
      toast({
        title: "Sucesso",
        description: "Serviço desativado com sucesso",
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

  if (!canManageServices) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Você não possui acesso ao módulo de serviços.
      </div>
    );
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
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Estruture os serviços oferecidos e mantenha o catálogo atualizado.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            Novo serviço
          </Button>
        )}
      </header>

      {showForm && (
        <Card className="border border-muted-foreground/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
            <CardTitle>{editingService ? "Editar serviço" : "Novo serviço"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
              ×
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do serviço</Label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Consulta"
                  required
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="sm:min-w-[160px]"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingService
                    ? "Salvar alterações"
                    : "Criar serviço"}
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
      ) : services.length === 0 ? (
        <Card className="border border-dashed border-muted-foreground/40">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className="border border-muted-foreground/30 transition hover:border-muted-foreground/50"
            >
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <p className="font-semibold text-base">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.isActive ? "Ativo" : "Desativado"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {service.isActive && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setServiceToDeactivate(service)}
                        disabled={deleteMutation.isPending}
                      >
                        Desativar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!serviceToDeactivate} onOpenChange={(open) => {
        if (!open) {
          setServiceToDeactivate(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              {serviceToDeactivate && (
                <>Esta ação desativará <strong>{serviceToDeactivate.name}</strong>. Você poderá reativá-lo depois.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (serviceToDeactivate) {
                  deleteMutation.mutate(serviceToDeactivate.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

