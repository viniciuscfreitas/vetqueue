"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, User, Room } from "@/lib/api";

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
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const response = await authApi.me();
          setUser(response.data.user);
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
    localStorage.setItem("auth_token", response.data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCurrentRoom(null);
    localStorage.removeItem("auth_token");
  }, []);

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

