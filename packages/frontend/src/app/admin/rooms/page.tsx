"use client";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ActiveVet, ModuleKey, Room, roomApi, userApi } from "@/lib/api";
import { createErrorHandler } from "@/lib/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState("");
  const [vetToRelease, setVetToRelease] = useState<ActiveVet | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [roomToDeactivate, setRoomToDeactivate] = useState<Room | null>(null);

  const canManageRooms = canAccess(ModuleKey.ADMIN_ROOMS);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && !canManageRooms) {
      router.push("/");
    }
  }, [user, authLoading, canManageRooms, router]);

  const isAuthorized = !authLoading && !!user && canManageRooms;

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: () => roomApi.listAll().then((res) => res.data),
    enabled: isAuthorized,
  });

  const { data: activeVets = [], isLoading: isLoadingVets } = useQuery({
    queryKey: ["users", "active-vets"],
    queryFn: () => userApi.getActiveVets().then((res) => res.data),
    enabled: isAuthorized,
  });

  const releaseVetMutation = useMutation({
    mutationFn: (vetId: string) => userApi.checkOutRoomForVet(vetId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "active-vets"] });
      setShowReleaseDialog(false);
      setVetToRelease(null);
      toast({
        title: "Sucesso",
        description: "Veterinário liberado da sala",
      });
    },
    onError: handleError,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => roomApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowForm(false);
      setRoomName("");
      toast({
        title: "Sucesso",
        description: "Sala criada com sucesso",
      });
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      roomApi.update(data.id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setEditingRoom(null);
      setShowForm(false);
      setRoomName("");
      toast({
        title: "Sucesso",
        description: "Sala atualizada com sucesso",
      });
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Sucesso",
        description: "Sala desativada com sucesso",
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

  if (!canManageRooms) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Você não possui acesso ao módulo de salas.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, name: roomName });
    } else {
      createMutation.mutate(roomName);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
    setRoomName("");
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre novas salas e acompanhe ocupações em tempo real.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            Nova sala
          </Button>
        )}
      </header>

      {showForm && (
        <Card className="border border-muted-foreground/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
            <CardTitle>{editingRoom ? "Editar sala" : "Nova sala"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
              ×
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da sala</Label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Consultório 1"
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
                    : editingRoom
                    ? "Salvar alterações"
                    : "Criar sala"}
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
      ) : rooms.length === 0 ? (
        <Card className="border border-dashed border-muted-foreground/40">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma sala cadastrada por enquanto.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="border border-muted-foreground/30 transition hover:border-muted-foreground/50"
            >
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <p className="font-semibold text-base">{room.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {room.isActive ? "Ativa" : "Desativada"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {room.isActive && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRoomToDeactivate(room)}
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

      <Card className="border border-muted-foreground/30">
        <CardHeader>
          <CardTitle>Veterinários ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingVets ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activeVets.length === 0 ? (
            <p className="text-muted-foreground">Nenhum veterinário em sala no momento.</p>
          ) : (
            <div className="space-y-4">
              {activeVets.map((vet) => (
                <div
                  key={vet.vetId}
                  className="flex items-center justify-between rounded-lg border border-muted-foreground/30 p-4"
                >
                  <div>
                    <p className="font-semibold">{vet.vetName}</p>
                    <p className="text-sm text-muted-foreground">Sala: {vet.roomName}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setVetToRelease(vet);
                      setShowReleaseDialog(true);
                    }}
                  >
                    Liberar sala
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!roomToDeactivate} onOpenChange={(open) => {
        if (!open) {
          setRoomToDeactivate(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar sala?</AlertDialogTitle>
            <AlertDialogDescription>
              {roomToDeactivate && (
                <>Essa ação irá desativar <strong>{roomToDeactivate.name}</strong>. Você pode reativá-la mais tarde.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roomToDeactivate) {
                  deleteMutation.mutate(roomToDeactivate.id);
                  setRoomToDeactivate(null);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar veterinário?</AlertDialogTitle>
            <AlertDialogDescription>
              {vetToRelease && (
                <>
                  Deseja liberar <strong>{vetToRelease.vetName}</strong> da sala{" "}
                  <strong>{vetToRelease.roomName}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVetToRelease(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (vetToRelease) {
                  releaseVetMutation.mutate(vetToRelease.vetId);
                }
              }}
              disabled={releaseVetMutation.isPending}
            >
              {releaseVetMutation.isPending ? "Processando..." : "Liberar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
