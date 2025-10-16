import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { FilaState, Paciente, FilaContextType } from '../types';

// --- QUEUE HOOK (useFila) ---

const FilaContext = createContext<FilaContextType | null>(null);

export const FilaProvider = ({ children }: { children: ReactNode }) => {
    const [fila, setFila] = useState<FilaState>({ aguardando: [], em_atendimento: [] });
    const [loading, setLoading] = useState(true);

    const carregarFila = async () => {
        setLoading(true);
        const data = await api.getFila();
        setFila(data);
        setLoading(false);
    };

    useEffect(() => {
        carregarFila();
    }, []);

    const adicionarPaciente = async (nome_pet: string, nome_tutor: string) => {
        await api.addPaciente({ nome_pet, nome_tutor });
        await carregarFila();
    };

    const chamarParaAtendimento = async (id: string, sala: string): Promise<Paciente> => {
        const pacienteChamado = await api.chamarPaciente(id, sala);
        await carregarFila();
        // Dispara um evento customizado para o display
        window.dispatchEvent(new CustomEvent('NOVA_CHAMADA', { detail: pacienteChamado }));
        return pacienteChamado;
    };

    const finalizarAtendimento = async (id: string) => {
        await api.finalizarAtendimento(id);
        await carregarFila();
    };

    return (
        <FilaContext.Provider value={{ fila, loading, adicionarPaciente, chamarParaAtendimento, finalizarAtendimento }}>
            {children}
        </FilaContext.Provider>
    );
};

export const useFila = () => {
    const context = useContext(FilaContext);
    if (!context) {
        throw new Error('useFila deve ser usado dentro de um FilaProvider');
    }
    return context;
};
