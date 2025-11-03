"use client";

import { useState, useEffect, useCallback } from "react";
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
import { CheckCircle2, AlertCircle } from "lucide-react";

interface RoomSelectModalProps {
  open: boolean;
  onSelect: (roomId: string) => void;
  onCancel: () => void;
}

export function RoomSelectModal({ open, onSelect, onCancel }: RoomSelectModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const { user, currentRoom } = useAuth();
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

  const roomsWithVets = Object.keys(occupations);
  const availableRooms = isRecepcao 
    ? rooms.filter(room => roomsWithVets.includes(room.id))
    : isVet
    ? rooms.filter(room => room.isActive && !occupations[room.id])
    : rooms.filter(room => room.isActive);

  const sortedRooms = [...availableRooms].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);
  const selectedOccupation = selectedRoom ? occupations[selectedRoomId] : null;
  const isSelectedDisabled = isRecepcao && !selectedOccupation;

  const handleConfirm = useCallback(() => {
    if (selectedRoomId) {
      if (isVet) {
        const occupation = occupations[selectedRoomId];
        if (occupation) {
          return;
        }
      }
      if (isRecepcao && !occupations[selectedRoomId]) {
        return;
      }
      onSelect(selectedRoomId);
    }
  }, [selectedRoomId, isVet, isRecepcao, occupations, onSelect]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedRoomId && !isSelectedDisabled) {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedRoomId, isSelectedDisabled, handleConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-1">
          {isVet ? "Fazer Check-in na Sala" : "Selecione a Sala para Chamar"}
        </h2>
        {isVet && (
          <p className="text-sm text-muted-foreground mb-4">
            Escolha uma sala disponível para atender pacientes
          </p>
        )}
        {!isVet && (
          <p className="text-sm text-muted-foreground mb-4">
            Escolha uma sala onde o paciente será chamado
          </p>
        )}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Sala</Label>
            <Select onValueChange={setSelectedRoomId} value={selectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma sala" />
              </SelectTrigger>
              <SelectContent>
                {sortedRooms.map((room) => {
                  return (
                    <SelectItem 
                      key={room.id} 
                      value={room.id}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{room.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
                    {rooms.length === 0 
                      ? "Primeiro, crie salas em Administração > Salas e peça aos veterinários para fazerem check-in."
                      : "Não há veterinários com check-in ativo no momento. Peça aos veterinários para fazerem check-in em uma sala."}
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

