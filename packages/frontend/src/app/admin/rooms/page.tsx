"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi, Room, userApi, ActiveVet, ModuleKey } from "@/lib/api";
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canManageRooms) {
    return null;
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Salas</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              Nova Sala
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6 border-2 transition-all">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle>{editingRoom ? "Editar Sala" : "Nova Sala"}</CardTitle>
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
                  <Label>Nome da Sala</Label>
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Ex: Consultório 1"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingRoom
                      ? "Salvar Alterações"
                      : "Criar Sala"}
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
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{room.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.isActive ? "Ativa" : "Desativada"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {room.isActive && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(room)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Deseja desativar a sala ${room.name}?`)) {
                                deleteMutation.mutate(room.id);
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Veterinários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingVets ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activeVets.length === 0 ? (
              <p className="text-muted-foreground">Nenhum veterinário em sala no momento</p>
            ) : (
              <div className="space-y-4">
                {activeVets.map((vet) => (
                  <div
                    key={vet.vetId}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{vet.vetName}</p>
                      <p className="text-sm text-muted-foreground">
                        Sala: {vet.roomName}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setVetToRelease(vet);
                        setShowReleaseDialog(true);
                      }}
                    >
                      Liberar Sala
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Liberar Veterinário?</AlertDialogTitle>
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
              <AlertDialogCancel onClick={() => setVetToRelease(null)}>
                Cancelar
              </AlertDialogCancel>
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
      </main>
    </div>
  );
}
