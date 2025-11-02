"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, User, Room, roomApi, userApi } from "@/lib/api";

async function loadUserRoom(userId: string | null | undefined, currentRoomId: string | null | undefined): Promise<Room | null> {
  if (!userId || !currentRoomId) {
    return null;
  }
  
  try {
    const roomsResponse = await roomApi.list();
    const room = roomsResponse.data.find(r => r.id === currentRoomId);
    return room || null;
  } catch (error) {
    console.error("Erro ao buscar sala:", error);
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  currentRoom: Room | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentRoom: (room: Room | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const response = await authApi.me();
          setUser(response.data.user);
          
          const room = await loadUserRoom(response.data.user.id, response.data.user.currentRoomId);
          if (room) {
            setCurrentRoom(room);
          }
        } catch (error) {
          localStorage.removeItem("auth_token");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    setUser(response.data.user);
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", response.data.token);
    }
    
    const room = await loadUserRoom(response.data.user.id, response.data.user.currentRoomId);
    if (room) {
      setCurrentRoom(room);
    }
  }, []);

  const logout = useCallback(async () => {
    if (user?.currentRoomId && user?.role === "VET") {
      try {
        await userApi.checkOutRoom();
      } catch (error) {
        console.error("Erro ao fazer checkout no logout:", error);
        // Continue with logout but show warning
        if (typeof window !== "undefined") {
          console.warn("Não foi possível liberar a sala. Contate a recepção se necessário.");
        }
      }
    }
    setUser(null);
    setCurrentRoom(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }, [user]);

  const setCurrentRoomCallback = useCallback((room: Room | null) => {
    setCurrentRoom(room);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRoom,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setCurrentRoom: setCurrentRoomCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

