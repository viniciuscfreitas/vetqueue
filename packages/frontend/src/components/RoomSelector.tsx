"use client";

import { useQuery } from "@tanstack/react-query";
import { roomApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

export function RoomSelector() {
  const { user, currentRoom, setCurrentRoom } = useAuth();
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.list().then((res) => res.data),
  });

  useEffect(() => {
    if (rooms.length > 0 && user?.role === "VET" && !currentRoom) {
      setCurrentRoom(rooms[0]);
    }
  }, [rooms, user, currentRoom]);

  if (user?.role !== "VET") return null;

  return (
    <div className="flex items-center gap-2">
      <Label>Sala:</Label>
      <Select
        value={currentRoom?.id || ""}
        onValueChange={(value) => {
          const room = rooms.find((r) => r.id === value);
          setCurrentRoom(room || null);
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Selecione a sala" />
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
  );
}

