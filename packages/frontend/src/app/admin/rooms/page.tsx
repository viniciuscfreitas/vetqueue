"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi, Room } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";

export default function RoomsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("[RoomsPage] Render - authLoading:", authLoading, "user:", user?.username, "role:", user?.role);
    }
  }, [authLoading, user]);

  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "RECEPCAO")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const isAuthorized = !authLoading && user && user.role === "RECEPCAO";

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: () => roomApi.listAll().then((res) => res.data),
    enabled: isAuthorized,
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

  if (authLoading || !user || user.role !== "RECEPCAO") {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingRoom ? "Editar Sala" : "Nova Sala"}</CardTitle>
            </CardHeader>
            <CardContent>
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
      </main>
    </div>
  );
}
