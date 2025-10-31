"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, Status } from "@/lib/api";

export default function DisplayPage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["queue", "active"],
    queryFn: () => queueApi.listActive().then((res) => res.data),
    refetchInterval: 3000,
  });

  const inProgress = entries.filter((e) => e.status === Status.IN_PROGRESS);
  const called = entries.filter((e) => e.status === Status.CALLED);
  const waiting = entries.filter((e) => e.status === Status.WAITING);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-12 text-gray-900">
          Fila de Atendimento
        </h1>

        {isLoading ? (
          <div className="text-center text-4xl py-20 text-gray-600">
            Carregando...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-green-700">
                Em Atendimento
              </h2>
              <div className="space-y-4">
                {inProgress.length === 0 ? (
                  <div className="text-2xl text-gray-400 p-8 text-center">
                    Nenhum atendimento em andamento
                  </div>
                ) : (
                  inProgress.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-green-100 border-4 border-green-500 rounded-lg p-6 shadow-lg"
                    >
                      <div className="text-3xl font-bold text-green-900 mb-2">
                        {entry.patientName}
                      </div>
                      <div className="text-xl text-green-800 mb-1">
                        Tutor: {entry.tutorName}
                      </div>
                      <div className="text-xl text-green-700">
                        {entry.serviceType}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-6 text-blue-700">
                Chamados
              </h2>
              <div className="space-y-4">
                {called.length === 0 ? (
                  <div className="text-2xl text-gray-400 p-8 text-center">
                    Nenhum chamado no momento
                  </div>
                ) : (
                  called.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-blue-100 border-4 border-blue-500 rounded-lg p-6 shadow-lg animate-pulse"
                    >
                      <div className="text-3xl font-bold text-blue-900 mb-2">
                        {entry.patientName}
                      </div>
                      <div className="text-xl text-blue-800 mb-1">
                        Tutor: {entry.tutorName}
                      </div>
                      <div className="text-xl text-blue-700">
                        {entry.serviceType}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-6 text-yellow-700">
                Aguardando
              </h2>
              <div className="space-y-4">
                {waiting.length === 0 ? (
                  <div className="text-2xl text-gray-400 p-8 text-center">
                    Nenhum aguardando
                  </div>
                ) : (
                  waiting.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-yellow-100 border-4 border-yellow-500 rounded-lg p-6 shadow-lg"
                    >
                      <div className="text-3xl font-bold text-yellow-900 mb-2">
                        {entry.patientName}
                      </div>
                      <div className="text-xl text-yellow-800 mb-1">
                        Tutor: {entry.tutorName}
                      </div>
                      <div className="text-xl text-yellow-700">
                        {entry.serviceType}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

