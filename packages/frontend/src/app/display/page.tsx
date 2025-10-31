"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, Priority } from "@/lib/api";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["queue", "active"],
    queryFn: () => queueApi.listActive().then((res) => res.data),
    refetchInterval: 3000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const inProgress = entries.filter((e) => e.status === Status.IN_PROGRESS);
  const called = entries.filter((e) => e.status === Status.CALLED);
  const waiting = entries.filter((e) => e.status === Status.WAITING);

  return (
    <div className="min-h-screen bg-gray-900 p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-7xl font-bold text-white">
            Fila de Atendimento
          </h1>
          <div className="text-5xl font-mono text-white bg-gray-800 px-8 py-4 rounded-lg">
            {formatTime(currentTime)}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-6xl py-32 text-gray-400">
            Carregando...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-12">
            <div>
              <h2 className="text-5xl font-bold mb-8 text-green-400">
                Em Atendimento
              </h2>
              <div className="space-y-6">
                {inProgress.length === 0 ? (
                  <div className="text-4xl text-gray-500 p-12 text-center bg-gray-800 rounded-lg">
                    Nenhum atendimento em andamento
                  </div>
                ) : (
                  inProgress.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-green-800 border-4 border-green-400 rounded-xl p-8 shadow-2xl"
                    >
                      <div className="text-5xl font-bold text-white mb-3">
                        {entry.patientName}
                      </div>
                      <div className="text-3xl text-green-200 mb-2">
                        Tutor: {entry.tutorName}
                      </div>
                      <div className="text-3xl text-green-300">
                        {entry.serviceType}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-5xl font-bold mb-8 text-blue-400">
                Chamados
              </h2>
              <div className="space-y-6">
                {called.length === 0 ? (
                  <div className="text-4xl text-gray-500 p-12 text-center bg-gray-800 rounded-lg">
                    Nenhum chamado no momento
                  </div>
                ) : (
                  called.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-blue-800 border-4 border-blue-400 rounded-xl p-8 shadow-2xl animate-pulse"
                    >
                      <div className="text-5xl font-bold text-white mb-3">
                        {entry.patientName}
                      </div>
                      <div className="text-3xl text-blue-200 mb-2">
                        Tutor: {entry.tutorName}
                      </div>
                      <div className="text-3xl text-blue-300">
                        {entry.serviceType}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-5xl font-bold mb-8 text-yellow-400">
                Aguardando
              </h2>
              <div className="space-y-6">
                {waiting.length === 0 ? (
                  <div className="text-4xl text-gray-500 p-12 text-center bg-gray-800 rounded-lg">
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
                          className="bg-yellow-800 border-4 border-yellow-400 rounded-xl p-8 shadow-2xl"
                        >
                          <div className="text-4xl font-bold text-yellow-300 mb-3">
                            {position}º na fila
                          </div>
                          <div className="text-5xl font-bold text-white mb-3">
                            {entry.patientName}
                          </div>
                          <div className="text-3xl text-yellow-200 mb-2">
                            Tutor: {entry.tutorName}
                          </div>
                          <div className="text-3xl text-yellow-300">
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
    </div>
  );
}

