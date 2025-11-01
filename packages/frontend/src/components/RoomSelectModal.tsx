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
  const isRecepcao = user?.role === "RECEPCAO";
  
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.list().then((res) => res.data),
  });

  const { data: occupations = {} } = useQuery({
    queryKey: ["room-occupations"],
    queryFn: () => queueApi.getRoomOccupations().then((res) => res.data),
    enabled: (isVet || isRecepcao) && open,
  });

  if (!open) return null;

  const roomsWithVets = Object.keys(occupations);
  const availableRooms = isRecepcao 
    ? rooms.filter(room => roomsWithVets.includes(room.id))
    : rooms;

  const handleConfirm = () => {
    if (selectedRoomId) {
      const occupation = occupations[selectedRoomId];
      if (isVet && occupation) {
        return;
      }
      if (isRecepcao && !occupations[selectedRoomId]) {
        return;
      }
      onSelect(selectedRoomId);
    }
  };

  const sortedRooms = [...availableRooms].sort((a, b) => {
    const aOccupied = isVet && !!occupations[a.id];
    const bOccupied = isVet && !!occupations[b.id];
    if (aOccupied === bOccupied) return a.name.localeCompare(b.name);
    return aOccupied ? 1 : -1;
  });

  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);
  const selectedOccupation = selectedRoom ? occupations[selectedRoomId] : null;
  const isSelectedDisabled = (isVet && !!selectedOccupation) || (isRecepcao && !selectedOccupation);

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
                          <Badge 
                            variant="outline" 
                            className="ml-auto text-xs"
                            style={{
                              backgroundColor: 'rgba(214, 39, 39, 0.1)',
                              color: '#D62727',
                              borderColor: '#D62727',
                            }}
                          >
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
              <div 
                className="mt-3 p-3 border rounded-md flex items-start gap-2"
                style={{
                  backgroundColor: 'rgba(214, 39, 39, 0.1)',
                  borderColor: '#D62727',
                }}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#D62727' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#D62727' }}>Sala ocupada</p>
                  <p className="text-xs mt-0.5" style={{ color: '#D62727' }}>
                    A sala {selectedRoom.name} está ocupada por {selectedOccupation.vetName}
                  </p>
                </div>
              </div>
            )}
            {selectedRoom && !selectedOccupation && isVet && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">
                  Sala {selectedRoom.name} disponível
                </p>
              </div>
            )}
            {selectedRoom && selectedOccupation && isRecepcao && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">
                  Sala {selectedRoom.name} com veterinário {selectedOccupation.vetName}
                </p>
              </div>
            )}
            {isRecepcao && availableRooms.length === 0 && (
              <div 
                className="mt-3 p-3 border rounded-md flex items-start gap-2"
                style={{
                  backgroundColor: 'rgba(183, 136, 68, 0.1)',
                  borderColor: '#B78844',
                }}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#B78844' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#B78844' }}>Nenhuma sala disponível</p>
                  <p className="text-xs mt-0.5" style={{ color: '#B78844' }}>
                    Não há salas com veterinários ativos no momento
                  </p>
                </div>
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

