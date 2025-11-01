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
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight">
              Fila de Atendimento
            </h1>
            <div className="text-4xl md:text-5xl font-mono text-gray-900 bg-white border-2 border-gray-400 px-6 py-3 rounded-lg shadow-md tracking-tight">
              {formatTime(currentTime)}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-5xl md:text-6xl py-32 text-gray-600 tracking-tight">
              Carregando...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-700 tracking-tight">
                  Chamados
                </h2>
                <div className="space-y-5">
                  {called.length === 0 ? (
                    <div className="text-3xl md:text-4xl text-gray-600 p-10 text-center bg-white border-2 border-gray-300 rounded-xl tracking-tight shadow-sm">
                      Nenhum chamado no momento
                    </div>
                  ) : (
                    called.map((entry) => {
                      const roomName = getRoomName(entry.roomId);
                      return (
                        <div
                          key={entry.id}
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-blue-600 rounded-xl p-7 shadow-lg transition-all duration-500 hover:shadow-xl animate-[pulse-subtle_3s_ease-in-out_infinite]"
                        >
                          <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                            {entry.patientName}
                          </div>
                          <div className="text-2xl md:text-3xl text-gray-800 mb-2 font-medium">
                            Tutor: {entry.tutorName}
                          </div>
                          <div className="text-2xl md:text-3xl text-blue-800 mb-2 font-semibold">
                            {entry.serviceType}
                          </div>
                          {roomName && (
                            <div className="text-3xl md:text-4xl font-bold text-blue-700 mt-3">
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
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-amber-700 tracking-tight">
                  Aguardando
                </h2>
                <div className="space-y-5">
                  {waiting.length === 0 ? (
                    <div className="text-3xl md:text-4xl text-gray-600 p-10 text-center bg-white border-2 border-gray-300 rounded-xl tracking-tight shadow-sm">
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
                            className="bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-600 rounded-xl p-7 shadow-lg transition-all duration-300 hover:shadow-xl"
                          >
                            <div className="text-3xl md:text-4xl font-bold text-amber-800 mb-3 tracking-tight">
                              {position}º na fila
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                              {entry.patientName}
                            </div>
                            <div className="text-2xl md:text-3xl text-gray-800 mb-2 font-medium">
                              Tutor: {entry.tutorName}
                            </div>
                            <div className="text-2xl md:text-3xl text-amber-800 font-semibold">
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

