"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi, userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useToast } from "./ui/use-toast";

export function RoomSelector() {
  const { user, currentRoom, setCurrentRoom } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState<string | null>(null);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.list().then((res) => res.data),
  });

  const checkInMutation = useMutation({
    mutationFn: (roomId: string) => userApi.checkInRoom(roomId).then((res) => res.data),
    onSuccess: (updatedUser) => {
      const room = rooms.find((r) => r.id === updatedUser.currentRoomId);
      if (room) {
        setCurrentRoom(room);
      }
      queryClient.invalidateQueries({ queryKey: ["users", "active-vets"] });
      toast({
        title: "Check-in realizado",
        description: `Você entrou na ${room?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao fazer check-in",
        description: error.response?.data?.error || "Erro desconhecido",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => userApi.checkOutRoom().then((res) => res.data),
    onSuccess: () => {
      setCurrentRoom(null);
      queryClient.invalidateQueries({ queryKey: ["users", "active-vets"] });
      toast({
        title: "Check-out realizado",
        description: "Você saiu da sala",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao fazer check-out",
        description: error.response?.data?.error || "Erro desconhecido",
      });
    },
  });

  const changeRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      await userApi.checkOutRoom();
      const updatedUser = await userApi.checkInRoom(roomId);
      return updatedUser.data;
    },
    onSuccess: (updatedUser) => {
      const room = rooms.find((r) => r.id === updatedUser.currentRoomId);
      if (room) {
        setCurrentRoom(room);
      }
      queryClient.invalidateQueries({ queryKey: ["users", "active-vets"] });
      toast({
        title: "Sala alterada",
        description: `Você trocou para ${room?.name}`,
      });
      setShowChangeModal(false);
      setNewRoomId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao trocar de sala",
        description: error.response?.data?.error || "Erro desconhecido",
      });
    },
  });

  const handleRoomChange = (value: string) => {
    if (!currentRoom) {
      checkInMutation.mutate(value);
    } else if (value === currentRoom.id) {
      return;
    } else {
      setNewRoomId(value);
      setShowChangeModal(true);
    }
  };

  const confirmRoomChange = () => {
    if (newRoomId) {
      changeRoomMutation.mutate(newRoomId);
    }
  };

  if (user?.role !== "VET") return null;

  const newRoom = rooms.find((r) => r.id === newRoomId);

  return (
    <>
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        <Label className="hidden sm:block">Sala:</Label>
          <Select
          value={currentRoom?.id || ""}
          onValueChange={handleRoomChange}
          disabled={checkInMutation.isPending || checkOutMutation.isPending || changeRoomMutation.isPending}
        >
          <SelectTrigger className="w-32 sm:w-40">
            <SelectValue placeholder={currentRoom ? "Sala" : "Fazer check-in"} />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={showChangeModal} onOpenChange={setShowChangeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar de Sala?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentRoom && newRoom && (
                <>
                  Você está na <strong>{currentRoom.name}</strong>. Deseja trocar para{" "}
                  <strong>{newRoom.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewRoomId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoomChange}
              disabled={changeRoomMutation.isPending}
            >
              Trocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
