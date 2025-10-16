import axios, { AxiosError } from 'axios';
import { Paciente, FilaState, AuthUser } from '../types';

// --- REAL API SERVICE ---
// Cliente HTTP que se comunica com o backend FastAPI

// Configuração da base URL da API (usa variável de ambiente se disponível)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Instância configurada do axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000, // 10 segundos
});

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Extrai a mensagem de erro da resposta da API
    const errorMessage = 
      (error.response?.data as { detail?: string })?.detail || 
      error.message || 
      'Erro desconhecido ao comunicar com o servidor';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Interface dos responses da API (para type safety)
interface PacienteResponse {
  id: string;
  nome_pet: string;
  nome_tutor: string;
  status: 'Aguardando' | 'Em Atendimento';
  sala_atendimento: string | null;
}

interface FilaResponse {
  aguardando: PacienteResponse[];
  em_atendimento: PacienteResponse[];
}

// API Service
export const api = {
  /**
   * Realiza login no sistema
   */
  login: async (user: string, pass: string): Promise<AuthUser> => {
    const response = await apiClient.post<AuthUser>('/auth/login', {
      user,
      pass,
    });
    return response.data;
  },

  /**
   * Obtém o estado completo da fila
   */
  getFila: async (): Promise<FilaState> => {
    const response = await apiClient.get<FilaResponse>('/fila');
    
    // Mapeia o response para o formato esperado pelo frontend
    return {
      aguardando: response.data.aguardando.map(mapPacienteResponse),
      em_atendimento: response.data.em_atendimento.map(mapPacienteResponse),
    };
  },

  /**
   * Adiciona um novo paciente à fila
   */
  addPaciente: async (data: { nome_pet: string; nome_tutor: string }): Promise<Paciente> => {
    const response = await apiClient.post<PacienteResponse>('/pacientes', data);
    return mapPacienteResponse(response.data);
  },

  /**
   * Chama um paciente para atendimento
   */
  chamarPaciente: async (id: string, sala: string): Promise<Paciente> => {
    const response = await apiClient.put<PacienteResponse>(
      `/pacientes/${id}/chamar`,
      { sala }
    );
    return mapPacienteResponse(response.data);
  },

  /**
   * Finaliza o atendimento de um paciente
   */
  finalizarAtendimento: async (id: string): Promise<{ id: string }> => {
    const response = await apiClient.delete<{ id: string }>(`/pacientes/${id}`);
    return response.data;
  },
};

// Helper para mapear o response da API para o tipo Paciente do frontend
function mapPacienteResponse(response: PacienteResponse): Paciente {
  return {
    id: response.id,
    nome_pet: response.nome_pet,
    nome_tutor: response.nome_tutor,
    status: response.status,
    sala_atendimento: response.sala_atendimento,
  };
}
