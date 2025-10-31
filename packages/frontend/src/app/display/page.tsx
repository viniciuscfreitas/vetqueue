"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, Priority, roomApi } from "@/lib/api";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function playBeep() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

export default function DisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousCalledIdsRef = useRef<Set<string>>(new Set());

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["queue", "active"],
    queryFn: () => queueApi.listActive(null).then((res) => res.data),
    refetchInterval: 3000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.list().then((res) => res.data),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const called = entries.filter((e) => e.status === Status.CALLED);
  const waiting = entries.filter((e) => e.status === Status.WAITING);

  const getRoomName = (roomId?: string | null) => {
    if (!roomId) return null;
    return rooms.find((r) => r.id === roomId)?.name || null;
  };

  useEffect(() => {
    if (isLoading) return;

    const currentCalledIds = new Set(called.map((e) => e.id));
    const hasNewCalled = Array.from(currentCalledIds).some(
      (id) => !previousCalledIdsRef.current.has(id)
    );

    if (hasNewCalled && previousCalledIdsRef.current.size > 0) {
      playBeep();
    }

    previousCalledIdsRef.current = currentCalledIds;
  }, [called, isLoading]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-7xl font-bold text-gray-800 tracking-tight">
            Fila de Atendimento
          </h1>
          <div className="text-5xl font-mono text-gray-800 bg-gray-50 border-2 border-gray-300 px-8 py-4 rounded-lg tracking-tight">
            {formatTime(currentTime)}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-6xl py-32 text-gray-600 tracking-tight">
            Carregando...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h2 className="text-5xl font-bold mb-8 text-blue-600 tracking-tight">
                Chamados
              </h2>
              <div className="space-y-6">
                {called.length === 0 ? (
                  <div className="text-4xl text-gray-500 p-12 text-center bg-gray-50 border-2 border-gray-200 rounded-lg tracking-tight">
                    Nenhum chamado no momento
                  </div>
                ) : (
                  called.map((entry) => {
                    const roomName = getRoomName(entry.roomId);
                    return (
                      <div
                        key={entry.id}
                        className="bg-blue-50 border-4 border-blue-600 rounded-xl p-8 shadow-[0_10px_20px_rgba(0,0,0,0.1)] animate-pulse"
                      >
                        <div className="text-5xl font-bold text-gray-800 mb-3 tracking-tight">
                          {entry.patientName}
                        </div>
                        <div className="text-3xl text-gray-700 mb-2">
                          Tutor: {entry.tutorName}
                        </div>
                        <div className="text-3xl text-blue-700 mb-2">
                          {entry.serviceType}
                        </div>
                        {roomName && (
                          <div className="text-4xl font-bold text-blue-600">
                            → {roomName}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h2 className="text-5xl font-bold mb-8 text-amber-600 tracking-tight">
                Aguardando
              </h2>
              <div className="space-y-6">
                {waiting.length === 0 ? (
                  <div className="text-4xl text-gray-500 p-12 text-center bg-gray-50 border-2 border-gray-200 rounded-lg tracking-tight">
                    Nenhum aguardando
                  </div>
                ) : (
                  (() => {
                    const sortedWaiting = [...waiting].sort((a, b) => {
                      if (a.priority !== b.priority) {
                        return a.priority - b.priority;
                      }
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    });
                    
                    return sortedWaiting.map((entry, index) => {
                      const position = index + 1;
                      return (
                        <div
                          key={entry.id}
                          className="bg-amber-50 border-4 border-amber-600 rounded-xl p-8 shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                        >
                          <div className="text-4xl font-bold text-amber-700 mb-3 tracking-tight">
                            {position}º na fila
                          </div>
                          <div className="text-5xl font-bold text-gray-800 mb-3 tracking-tight">
                            {entry.patientName}
                          </div>
                          <div className="text-3xl text-gray-700 mb-2">
                            Tutor: {entry.tutorName}
                          </div>
                          <div className="text-3xl text-amber-700">
                            {entry.serviceType}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

