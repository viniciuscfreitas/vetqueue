"use client";

import { useQuery } from "@tanstack/react-query";
import { roomApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface RoomSelectModalProps {
  open: boolean;
  onSelect: (roomId: string) => void;
  onCancel: () => void;
}

export function RoomSelectModal({ open, onSelect, onCancel }: RoomSelectModalProps) {
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.list().then((res) => res.data),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Selecione a Sala</h2>
        <div className="space-y-4">
          <div>
            <Label>Sala:</Label>
            <Select onValueChange={onSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma sala" />
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
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

