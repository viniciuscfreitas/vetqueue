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
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";

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

  const sortedRooms = [...rooms].sort((a, b) => {
    const aOccupied = isVet && !!occupations[a.id];
    const bOccupied = isVet && !!occupations[b.id];
    if (aOccupied === bOccupied) return a.name.localeCompare(b.name);
    return aOccupied ? 1 : -1;
  });

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedOccupation = selectedRoom ? occupations[selectedRoomId] : null;
  const isSelectedDisabled = isVet && !!selectedOccupation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Selecione a Sala</h2>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Sala</Label>
            <Select onValueChange={setSelectedRoomId} value={selectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma sala" />
              </SelectTrigger>
              <SelectContent>
                {sortedRooms.map((room) => {
                  const occupation = occupations[room.id];
                  const isDisabled = isVet && !!occupation;
                  return (
                    <SelectItem 
                      key={room.id} 
                      value={room.id}
                      disabled={isDisabled}
                      className={isDisabled ? "opacity-60 cursor-not-allowed" : ""}
                    >
                      <div className="flex items-center gap-2">
                        {isDisabled ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <span>{room.name}</span>
                        {isDisabled && (
                          <Badge variant="outline" className="ml-auto text-xs bg-red-50 text-red-700 border-red-300">
                            Ocupada
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedRoom && selectedOccupation && isVet && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Sala ocupada</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    A sala {selectedRoom.name} está ocupada por {selectedOccupation.vetName}
                  </p>
                </div>
              </div>
            )}
            {selectedRoom && !selectedOccupation && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">
                  Sala {selectedRoom.name} disponível
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedRoomId || isSelectedDisabled}
              className={isSelectedDisabled ? "opacity-50 cursor-not-allowed" : ""}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

