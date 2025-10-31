import { RoomRepository } from "../repositories/roomRepository";
import { Room } from "../core/types";

export class RoomService {
  constructor(private repository: RoomRepository) {}

  async listRooms(): Promise<Room[]> {
    return this.repository.findActive();
  }

  async getAllRooms(): Promise<Room[]> {
    return this.repository.findAll();
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.repository.findById(id);
    if (!room) {
      throw new Error("Sala não encontrada");
    }
    return room;
  }

  async createRoom(data: { name: string }): Promise<Room> {
    if (!data.name.trim()) {
      throw new Error("Nome da sala é obrigatório");
    }

    const existingRoom = await this.repository.findAll();
    const roomExists = existingRoom.some(
      (room) => room.name.toLowerCase() === data.name.toLowerCase()
    );

    if (roomExists) {
      throw new Error("Já existe uma sala com este nome");
    }

    return this.repository.create(data);
  }

  async updateRoom(id: string, data: { name?: string; isActive?: boolean }): Promise<Room> {
    const room = await this.repository.findById(id);
    if (!room) {
      throw new Error("Sala não encontrada");
    }

    if (data.name && !data.name.trim()) {
      throw new Error("Nome da sala é obrigatório");
    }

    return this.repository.update(id, data);
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await this.repository.findById(id);
    if (!room) {
      throw new Error("Sala não encontrada");
    }

    await this.repository.delete(id);
  }
}

