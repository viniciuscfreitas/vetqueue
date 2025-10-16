import { useState, useEffect, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';
import { ChamadaRecente } from '../types';
import { useFilaQuery } from '../hooks/useFilaQuery';
import { useWebSocket } from '../hooks/useWebSocket';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PainelDisplayPage = () => {
    const [chamadasRecentes, setChamadasRecentes] = useState<ChamadaRecente[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const { data: fila, isLoading } = useFilaQuery();
    
    // Conecta ao WebSocket para receber atualizações em tempo real
    useWebSocket({
        filaId: 'default',
        enableToasts: false, // Display não mostra toasts
        enableSound: true,   // Mas toca som nas chamadas
    });

    // Monitora mudanças na fila para detectar novas chamadas
    // (Como backup ao WebSocket, para sincronização inicial)
    const previousFilaRef = useRef(fila);
    
    useEffect(() => {
        if (!fila || !previousFilaRef.current) {
            previousFilaRef.current = fila;
            return;
        }

        // Detecta novos pacientes em atendimento
        const previousIds = new Set(previousFilaRef.current.em_atendimento.map(p => p.id));
        const newCalls = fila.em_atendimento.filter(p => !previousIds.has(p.id));

        newCalls.forEach(paciente => {
            setChamadasRecentes(prev => [
                { ...paciente, timestamp: Date.now() },
                ...prev
            ].slice(0, 4));

            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 10000);
        });

        previousFilaRef.current = fila;
    }, [fila]);

    const chamadaPrincipal = chamadasRecentes[0];

    if (isLoading) {
        return <div className="min-h-screen bg-bg-0 flex items-center justify-center">
            <div className="text-text-muted text-xl flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                Carregando fila...
            </div>
        </div>;
    }

    if (!fila) {
        return <div className="min-h-screen bg-bg-0 flex items-center justify-center">
            <div className="text-text-muted text-xl">Erro ao carregar fila</div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-bg-0 flex font-sans p-8">
            {/* Coluna 1: Chamadas */}
            <div className="w-2/3 pr-8 border-r-2 border-bg-3 flex flex-col">
                <h1 className="text-8xl font-bold mb-12 text-primary">Chamadas</h1>
                
                {chamadaPrincipal && (
                    <div className={cn(
                        "transition-all duration-500 p-10 rounded-card",
                        isAnimating ? "bg-primary shadow-elev-3" : "bg-white shadow-elev-1"
                    )}>
                        <p className="text-8xl lg:text-9xl font-extrabold text-white animate-[fadeIn_1s_ease-in-out]">{chamadaPrincipal.nome_pet}</p>
                        <p className="text-5xl lg:text-6xl font-semibold text-white mt-4 animate-[fadeIn_1s_ease-in-out_0.2s]">{chamadaPrincipal.sala_atendimento}</p>
                    </div>
                )}

                <div className="mt-auto pt-8">
                    {chamadasRecentes.slice(1).map(chamada => (
                        <div key={chamada.id} className="flex justify-between items-baseline text-3xl text-text-muted mb-4">
                            <span>{chamada.nome_pet}</span>
                            <span className="font-light">{chamada.sala_atendimento}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Coluna 2: Próximos */}
            <div className="w-1/3 pl-8">
                 <h2 className="text-6xl font-bold mb-12 text-semantic-warning">Aguardando</h2>
                 <ul className="space-y-6">
                    {fila?.aguardando.map(paciente => (
                        <li key={paciente.id} className="text-4xl font-medium text-text-2">
                            {paciente.nome_pet}
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
};

export { PainelDisplayPage };
