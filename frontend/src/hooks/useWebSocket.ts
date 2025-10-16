/**
 * useWebSocket Hook - Gerenciamento de Conexão WebSocket
 * 
 * Hook React que gerencia a conexão WebSocket e integra com TanStack Query
 * para invalidação automática de cache quando eventos são recebidos.
 */

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketService } from '../services/websocket';
import { WebSocketStatus, PacienteChamadoPayload } from '../types';
import { toast } from '../components/ui/Toast';

const QUERY_KEYS = {
  fila: ['fila'] as const,
} as const;

interface UseWebSocketOptions {
  filaId?: string;
  enableToasts?: boolean;
  enableSound?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    filaId = 'default',
    enableToasts = true,
    enableSound = true,
  } = options;

  const queryClient = useQueryClient();
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Toca um som de notificação quando paciente é chamado
   */
  const playChime = () => {
    if (!enableSound) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime); // A5
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 1);
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 1);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };

  useEffect(() => {
    // Cria e conecta o WebSocket Service
    const wsService = new WebSocketService(filaId);
    wsServiceRef.current = wsService;

    // Handler para mudanças de status
    wsService.on('status', () => {
      setStatus(wsService.getStatus());
    });

    // Handler para FILA_ATUALIZADA - Invalidação do cache
    wsService.on('FILA_ATUALIZADA', (message) => {
      console.log('🔄 FILA_ATUALIZADA recebido - Invalidando cache TanStack Query');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fila });
    });

    // Handler para PACIENTE_CHAMADO - Toast e Som
    wsService.on('PACIENTE_CHAMADO', (message) => {
      const payload = message.payload as PacienteChamadoPayload;
      
      if (payload && payload.paciente) {
        console.log(`🔔 Paciente chamado: ${payload.paciente.nome_pet} - ${payload.sala}`);
        
        // Toca som de notificação
        playChime();
        
        // Mostra toast de notificação
        if (enableToasts) {
          toast.success(
            `${payload.paciente.nome_pet} foi chamado!`,
            `Sala: ${payload.sala}`
          );
        }
      }
    });

    // Handler para PACIENTE_ADICIONADO - Log e Toast opcional
    wsService.on('PACIENTE_ADICIONADO', (message) => {
      console.log('➕ Novo paciente adicionado à fila');
      
      if (enableToasts) {
        // Toast sutil para novo paciente (opcional)
        // toast.info('Novo paciente adicionado à fila');
      }
    });

    // Handler para PACIENTE_FINALIZADO - Log
    wsService.on('PACIENTE_FINALIZADO', (message) => {
      console.log('✅ Atendimento finalizado');
    });

    // Conecta ao WebSocket
    wsService.connect().catch(err => {
      console.error('Erro ao conectar WebSocket:', err);
    });

    // Cleanup: desconecta ao desmontar componente
    return () => {
      console.log('🧹 Limpando conexão WebSocket');
      wsService.disconnect();
    };
  }, [filaId, queryClient, enableToasts, enableSound]);

  return {
    status,
    isConnected: status === 'connected',
  };
};

