import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Paciente } from '../types';
import { toast } from '../components/ui/Toast';

// Query Keys
const QUERY_KEYS = {
  fila: ['fila'] as const,
} as const;

// --- HOOKS COM TANSTACK QUERY ---

export const useFilaQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.fila,
    queryFn: api.getFila,
    staleTime: Infinity, // WebSocket invalida quando necessário
  });
};

export const useAdicionarPacienteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.addPaciente,
    onSuccess: () => {
      // Invalida e refetch da fila
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fila });
    },
    onError: (error) => {
      console.error('Erro ao adicionar paciente:', error);
      toast.error('Erro ao adicionar paciente', 'Verifique os dados e tente novamente.');
    },
  });
};

export const useChamarPacienteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sala }: { id: string; sala: string }) => api.chamarPaciente(id, sala),
    onSuccess: () => {
      // WebSocket cuida da invalidação automática via eventos
      // Mas fazemos invalidação local também para garantir atualização imediata
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fila });
    },
    onError: (error) => {
      console.error('Erro ao chamar paciente:', error);
      toast.error('Erro ao chamar paciente', 'Verifique a sala e tente novamente.');
    },
  });
};

export const useFinalizarAtendimentoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.finalizarAtendimento,
    onSuccess: () => {
      // Invalida e refetch da fila
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fila });
    },
    onError: (error) => {
      console.error('Erro ao finalizar atendimento:', error);
      toast.error('Erro ao finalizar atendimento', 'Tente novamente em alguns instantes.');
    },
  });
};
