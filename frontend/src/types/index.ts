// --- TYPESCRIPT INTERFACES ---
// Define a estrutura de dados para um paciente.
export interface Paciente {
  id: string;
  nome_pet: string;
  nome_tutor: string;
  status: 'Aguardando' | 'Em Atendimento';
  sala_atendimento?: string | null;
}

// Define o estado geral da fila.
export interface FilaState {
  aguardando: Paciente[];
  em_atendimento: Paciente[];
}

// Define a estrutura para uma chamada recente no painel de exibição.
export interface ChamadaRecente extends Paciente {
  timestamp: number;
}

// Interface para autenticação
export interface AuthUser {
  nome: string;
  token: string;
}

// Interface para contexto de autenticação
export interface AuthContextType {
  user: { nome: string } | null;
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

// Interface para contexto da fila
export interface FilaContextType {
  fila: FilaState;
  loading: boolean;
  adicionarPaciente: (nome_pet: string, nome_tutor: string) => Promise<void>;
  chamarParaAtendimento: (id: string, sala: string) => Promise<Paciente>;
  finalizarAtendimento: (id: string) => Promise<void>;
}

// --- WEBSOCKET TYPES ---

// Tipos de eventos WebSocket
export type WebSocketEventType =
  | 'FILA_ATUALIZADA'
  | 'PACIENTE_CHAMADO'
  | 'PACIENTE_ADICIONADO'
  | 'PACIENTE_FINALIZADO';

// Estrutura base das mensagens WebSocket
export interface WebSocketMessage<T = any> {
  event_type: WebSocketEventType;
  timestamp: string;
  fila_id: string;
  trigger?: string;
  payload?: T;
}

// Payload específico para PACIENTE_CHAMADO
export interface PacienteChamadoPayload {
  paciente: Paciente;
  sala: string;
}

// Payload específico para PACIENTE_ADICIONADO
export interface PacienteAdicionadoPayload {
  paciente: Paciente;
}

// Payload específico para PACIENTE_FINALIZADO
export interface PacienteFinalizadoPayload {
  paciente_id: string;
}

// Status da conexão WebSocket
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';