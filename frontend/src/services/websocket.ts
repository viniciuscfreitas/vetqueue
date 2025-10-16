/**
 * WebSocket Service - Comunicação em Tempo Real
 * 
 * Gerencia a conexão WebSocket com o backend, incluindo:
 * - Reconexão automática com backoff exponencial
 * - Event emitter pattern para mensagens
 * - Heartbeat/ping para manter conexão viva
 */

import { WebSocketMessage, WebSocketEventType, WebSocketStatus } from '../types';

type EventCallback = (message: WebSocketMessage) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private filaId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 1 segundo inicial
  private maxReconnectDelay = 30000; // 30 segundos máximo
  private heartbeatInterval: number | null = null;
  private listeners: Map<WebSocketEventType | 'status', EventCallback[]> = new Map();
  private status: WebSocketStatus = 'disconnected';
  private shouldReconnect = true;

  constructor(filaId: string = 'default') {
    this.filaId = filaId;
  }

  /**
   * Conecta ao WebSocket do backend
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:8000/ws/fila/${this.filaId}`;
      
      console.log(`🔌 Conectando ao WebSocket: ${wsUrl}`);
      this.updateStatus('connecting');

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket conectado com sucesso!');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.updateStatus('connected');
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 Mensagem WebSocket recebida:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Erro ao parsear mensagem WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erro no WebSocket:', error);
          this.updateStatus('error');
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          this.updateStatus('disconnected');
          this.stopHeartbeat();

          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        console.error('❌ Erro ao criar WebSocket:', error);
        this.updateStatus('error');
        reject(error);
      }
    });
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    console.log('🔌 Desconectando WebSocket...');
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.updateStatus('disconnected');
  }

  /**
   * Inscreve-se para ouvir um tipo específico de evento
   */
  on(eventType: WebSocketEventType | 'status', callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  /**
   * Remove uma inscrição de evento
   */
  off(eventType: WebSocketEventType | 'status', callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Retorna o status atual da conexão
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Atualiza o status da conexão e notifica listeners
   */
  private updateStatus(newStatus: WebSocketStatus): void {
    this.status = newStatus;
    const statusListeners = this.listeners.get('status') || [];
    statusListeners.forEach(callback => {
      callback({ event_type: 'FILA_ATUALIZADA', timestamp: new Date().toISOString(), fila_id: this.filaId, trigger: `status:${newStatus}` });
    });
  }

  /**
   * Processa uma mensagem recebida e notifica listeners apropriados
   */
  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.event_type) || [];
    callbacks.forEach(callback => callback(message));
  }

  /**
   * Agenda uma tentativa de reconexão com backoff exponencial
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      this.updateStatus('error');
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch(err => {
        console.error('❌ Falha na reconexão:', err);
      });
    }, delay);
  }

  /**
   * Inicia o heartbeat (ping/pong) para manter a conexão viva
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Ping a cada 30 segundos
  }

  /**
   * Para o heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

