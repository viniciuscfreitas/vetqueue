"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, Priority, roomApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="min-h-screen bg-gray-50" role="application" aria-label="Tela de exibição da fila de atendimento">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg px-8 py-6 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex justify-center flex-1">
                <Image 
                  src="/logo.png" 
                  alt="Logo Fisiopet" 
                  width={379} 
                  height={130} 
                  className="h-20 w-auto md:h-28"
                  priority
                />
              </div>
              <div 
                className="text-4xl md:text-5xl font-mono text-gray-800 bg-gray-50 border-2 border-gray-300 px-6 py-3 rounded-lg shadow-sm tracking-tight"
                role="timer"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Horário atual: ${formatTime(currentTime)}`}
              >
                {formatTime(currentTime)}
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-center mt-6 text-gray-800">
              Fila de Atendimento
            </h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-16 w-48 mb-6" />
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
                      <Skeleton className="h-12 w-3/4 mb-3" />
                      <Skeleton className="h-8 w-1/2 mb-2" />
                      <Skeleton className="h-8 w-2/3 mb-2" />
                      <Skeleton className="h-10 w-1/3 mt-3" />
                    </div>
                  ))}
                </div>
              </section>
              <section className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-16 w-48 mb-6" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-6 shadow-md border-l-4 border-gray-400">
                      <Skeleton className="h-10 w-32 mb-3" />
                      <Skeleton className="h-12 w-3/4 mb-3" />
                      <Skeleton className="h-8 w-1/2 mb-2" />
                      <Skeleton className="h-8 w-2/3" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section aria-labelledby="chamados-heading" className="bg-white rounded-lg shadow-sm p-6">
                <h2 id="chamados-heading" className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-800 border-b-4 border-green-500 pb-3">
                  Chamados
                </h2>
                <div className="space-y-4">
                  {called.length === 0 ? (
                    <div className="text-3xl md:text-4xl p-10 text-center bg-gray-50 rounded-lg tracking-tight border-2 border-gray-200 text-gray-500">
                      Nenhum chamado no momento
                    </div>
                  ) : (
                    called.map((entry) => {
                      const roomName = getRoomName(entry.roomId);
                      return (
                        <article
                          key={entry.id}
                          className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500 transition-all duration-300 hover:shadow-lg animate-[pulse-subtle_3s_ease-in-out_infinite]"
                          aria-label={`Paciente ${entry.patientName} chamado para ${roomName || 'atendimento'}`}
                        >
                          <h3 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-900">
                            {entry.patientName}
                          </h3>
                          <div className="text-2xl md:text-3xl mb-2 font-medium text-gray-700">
                            Tutor: {entry.tutorName}
                          </div>
                          <div className="text-2xl md:text-3xl mb-2 font-semibold text-green-600">
                            {entry.serviceType}
                          </div>
                          {roomName && (
                            <div className="text-3xl md:text-4xl font-bold mt-3 text-green-600">
                              → {roomName}
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              <section aria-labelledby="aguardando-heading" className="bg-white rounded-lg shadow-sm p-6">
                <h2 id="aguardando-heading" className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-800 border-b-4 border-gray-400 pb-3">
                  Aguardando
                </h2>
                <div className="space-y-4">
                  {waiting.length === 0 ? (
                    <div className="text-3xl md:text-4xl p-10 text-center bg-gray-50 rounded-lg tracking-tight border-2 border-gray-200 text-gray-500">
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
                          <article
                            key={entry.id}
                            className="bg-white rounded-lg p-6 shadow-md border-l-4 border-gray-400 transition-all duration-300 hover:shadow-lg"
                            aria-label={`${entry.patientName} na posição ${position} da fila`}
                          >
                            <div className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-gray-600">
                              {position}º na fila
                            </div>
                            <h3 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-900">
                              {entry.patientName}
                            </h3>
                            <div className="text-2xl md:text-3xl mb-2 font-medium text-gray-700">
                              Tutor: {entry.tutorName}
                            </div>
                            <div className="text-2xl md:text-3xl font-semibold text-gray-600">
                              {entry.serviceType}
                            </div>
                          </article>
                        );
                      });
                    })()
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

