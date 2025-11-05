"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, Priority, roomApi, QueueEntry } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Volume2 } from "lucide-react";
import { calculateServiceTime } from "@/lib/utils";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getWaitMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

export default function DisplayPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousCalledIdsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback(() => {
    try {
      const audioContext = getAudioContext();
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
    } catch (e) {
      console.error("Audio failed:", e);
    }
  }, [getAudioContext]);

  const playBeepSequence = useCallback(() => {
    try {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(), i * 600);
      }
    } catch (e) {
      console.error("Audio sequence failed:", e);
    }
  }, [playBeep]);

  const speakAnnouncement = useCallback((entry: QueueEntry, roomName: string | null) => {
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      playBeepSequence();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      
      const message = roomName 
        ? `Paciente ${entry.patientName}, sala ${roomName}`
        : `Paciente ${entry.patientName}`;
      
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt'));
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = ptVoice ? ptVoice.lang : 'pt-BR';
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        if (ttsTimeoutRef.current) {
          clearTimeout(ttsTimeoutRef.current);
          ttsTimeoutRef.current = null;
        }
        playBeepSequence();
      };
      
      utterance.onend = () => {
        isSpeakingRef.current = false;
        if (ttsTimeoutRef.current) {
          clearTimeout(ttsTimeoutRef.current);
          ttsTimeoutRef.current = null;
        }
      };
      
      utterance.onstart = () => {
        isSpeakingRef.current = true;
        if (ttsTimeoutRef.current) {
          clearTimeout(ttsTimeoutRef.current);
          ttsTimeoutRef.current = null;
        }
      };
      
      window.speechSynthesis.speak(utterance);
      
      ttsTimeoutRef.current = setTimeout(() => {
        if (!isSpeakingRef.current) {
          ttsTimeoutRef.current = null;
          playBeepSequence();
        }
      }, 500);
    } catch (e) {
      isSpeakingRef.current = false;
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      playBeepSequence();
    }
  }, [playBeepSequence]);

  const enableSound = useCallback(() => {
    getAudioContext();
    playBeepSequence();
    setSoundEnabled(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vetqueue_audio_enabled', 'true');
    }
  }, [getAudioContext, playBeepSequence]);

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
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem('vetqueue_audio_enabled') === 'true';
      setSoundEnabled(enabled);
    }
  }, []);

  const called = entries.filter((e) => e.status === Status.CALLED);
  const waiting = entries.filter((e) => e.status === Status.WAITING);
  const inProgress = entries.filter((e) => e.status === Status.IN_PROGRESS);

  const getRoomName = (roomId?: string | null) => {
    if (!roomId) return null;
    return rooms.find((r) => r.id === roomId)?.name || null;
  };

  useEffect(() => {
    if (isLoading) return;

    const currentCalledIds = new Set(called.map((e) => e.id));
    const newCalledEntries = called.filter(
      (e) => !previousCalledIdsRef.current.has(e.id)
    );

    if (newCalledEntries.length > 0 && previousCalledIdsRef.current.size > 0 && soundEnabled) {
      const latestEntry = newCalledEntries[newCalledEntries.length - 1];
      const roomName = latestEntry.roomId 
        ? rooms.find((r) => r.id === latestEntry.roomId)?.name || null
        : null;
      speakAnnouncement(latestEntry, roomName);
    }

    previousCalledIdsRef.current = currentCalledIds;
  }, [called, isLoading, soundEnabled, speakAnnouncement, rooms]);

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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
                <div 
                className="text-4xl md:text-5xl font-mono text-gray-800 bg-gray-50 border-2 border-gray-300 px-6 py-3 rounded-lg shadow-sm tracking-tight"
                role="timer"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Horário atual: ${currentTime ? formatTime(currentTime) : 'carregando...'}`}
              >
                {currentTime ? formatTime(currentTime) : '--:--:--'}
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-center mt-6 text-gray-800">
              Fila de Atendimento
            </h1>
          </div>

          {!isLoading && inProgress.length > 0 && (
            <section aria-labelledby="em-atendimento-heading" className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 id="em-atendimento-heading" className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-800 border-b-4 border-[#5B96B7] pb-3">
                Em Atendimento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgress.map((entry) => {
                  const roomName = getRoomName(entry.roomId);
                  const isEmergency = entry.priority === Priority.EMERGENCY;
                  const serviceTime = entry.calledAt 
                    ? calculateServiceTime(entry.calledAt, entry.completedAt || currentTime || null)
                    : null;
                  return (
                    <article
                      key={entry.id}
                      className={`bg-white rounded-lg p-6 shadow-md border-l-4 ${
                        isEmergency ? 'border-red-600 animate-pulse' : 'border-[#5B96B7]'
                      } transition-all duration-300 hover:shadow-lg`}
                      aria-label={`Paciente ${entry.patientName} em atendimento na ${roomName || 'sala'}`}
                    >
                      <h3 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-900 flex items-center gap-3">
                        {isEmergency && <AlertTriangle className="h-10 w-10 text-red-600" />}
                        {entry.patientName}
                      </h3>
                      <div className="text-2xl md:text-3xl mb-2 font-medium text-gray-700">
                        Tutor: {entry.tutorName}
                      </div>
                      <div className={`text-2xl md:text-3xl mb-2 font-semibold ${
                        isEmergency ? 'text-red-600' : 'text-[#5B96B7]'
                      }`}>
                        {entry.serviceType}
                      </div>
                      {roomName && (
                        <div className={`text-3xl md:text-4xl font-bold mt-3 ${
                          isEmergency ? 'text-red-600' : 'text-[#5B96B7]'
                        }`}>
                          → {roomName}
                        </div>
                      )}
                      {serviceTime && (
                        <div className="text-xl md:text-2xl mt-3 text-[#5B96B7]">
                          {serviceTime}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

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
                      const isEmergency = entry.priority === Priority.EMERGENCY;
                      return (
                        <article
                          key={entry.id}
                          className={`bg-white rounded-lg p-6 shadow-md border-l-4 ${
                            isEmergency ? 'border-red-600 animate-pulse' : 'border-green-500'
                          } transition-all duration-300 hover:shadow-lg`}
                          aria-label={`Paciente ${entry.patientName} chamado para ${roomName || 'atendimento'}`}
                        >
                          <h3 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-900 flex items-center gap-3">
                            {isEmergency && <AlertTriangle className="h-10 w-10 text-red-600" />}
                            {entry.patientName}
                          </h3>
                          <div className="text-2xl md:text-3xl mb-2 font-medium text-gray-700">
                            Tutor: {entry.tutorName}
                          </div>
                          <div className={`text-2xl md:text-3xl mb-2 font-semibold ${
                            isEmergency ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {entry.serviceType}
                          </div>
                          {roomName && (
                            <div className={`text-3xl md:text-4xl font-bold mt-3 ${
                              isEmergency ? 'text-red-600' : 'text-green-600'
                            }`}>
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
                      
                      const visibleWaiting = sortedWaiting.slice(0, 10);
                      
                      return (
                        <>
                          {visibleWaiting.map((entry, index) => {
                            const position = index + 1;
                            const isEmergency = entry.priority === Priority.EMERGENCY;
                            const waitMinutes = getWaitMinutes(entry.createdAt);
                            return (
                              <article
                                key={entry.id}
                                className={`bg-white rounded-lg p-6 shadow-md border-l-4 ${
                                  isEmergency ? 'border-red-600 animate-pulse' : 'border-gray-400'
                                } transition-all duration-300 hover:shadow-lg`}
                                aria-label={`${entry.patientName} na posição ${position} da fila`}
                              >
                                <div className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-gray-600">
                                  {position}º na fila
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-900 flex items-center gap-3">
                                  {isEmergency && <AlertTriangle className="h-10 w-10 text-red-600" />}
                                  {entry.patientName}
                                </h3>
                                <div className="text-2xl md:text-3xl mb-2 font-medium text-gray-700">
                                  Tutor: {entry.tutorName}
                                </div>
                                <div className={`text-2xl md:text-3xl font-semibold ${
                                  isEmergency ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {entry.serviceType}
                                </div>
                                <div className="text-xl md:text-2xl mt-3 text-gray-500">
                                  Aguardando: {waitMinutes} min
                                </div>
                              </article>
                            );
                          })}
                        </>
                      );
                    })()
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      {!soundEnabled && (
        <button 
          className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity z-50"
          onClick={enableSound}
          aria-label="Ativar som"
        >
          <Volume2 className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

