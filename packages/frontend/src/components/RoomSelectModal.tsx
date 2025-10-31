"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { roomApi, queueApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface RoomSelectModalProps {
  open: boolean;
  onSelect: (roomId: string) => void;
  onCancel: () => void;
}

export function RoomSelectModal({ open, onSelect, onCancel }: RoomSelectModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const { user } = useAuth();
  const isVet = user?.role === "VET";
  
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.list().then((res) => res.data),
  });

  const { data: occupations = {} } = useQuery({
    queryKey: ["room-occupations"],
    queryFn: () => queueApi.getRoomOccupations().then((res) => res.data),
    enabled: isVet && open,
  });

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedRoomId) {
      const occupation = occupations[selectedRoomId];
      if (isVet && occupation) {
        return;
      }
      onSelect(selectedRoomId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Selecione a Sala</h2>
        <div className="space-y-4">
          <div>
            <Label>Sala:</Label>
            <Select onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma sala" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => {
                  const occupation = occupations[room.id];
                  const isDisabled = isVet && !!occupation;
                  return (
                    <SelectItem 
                      key={room.id} 
                      value={room.id}
                      disabled={isDisabled}
                      className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {room.name}
                      {isDisabled && ` (Ocupada por ${occupation.vetName})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedRoomId}>
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

