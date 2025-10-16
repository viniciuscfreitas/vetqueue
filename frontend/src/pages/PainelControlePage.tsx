import { useState, FormEvent } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFilaQuery, useAdicionarPacienteMutation, useChamarPacienteMutation, useFinalizarAtendimentoMutation } from '../hooks/useFilaQuery';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PacienteCard } from '../components/domain/PacienteCard';
import { toast } from '../components/ui/Toast';

const PainelControlePage = () => {
    const { user, logout } = useAuth();
    const { data: fila, isLoading: loading } = useFilaQuery();
    const adicionarPacienteMutation = useAdicionarPacienteMutation();
    const chamarPacienteMutation = useChamarPacienteMutation();
    const finalizarAtendimentoMutation = useFinalizarAtendimentoMutation();
    
    // Conecta ao WebSocket para receber atualizações em tempo real
    useWebSocket({
        filaId: 'default',
        enableToasts: true,  // Painel de Controle mostra notificações
        enableSound: false,  // Mas não toca som (opcional)
    });

    const [nomePet, setNomePet] = useState('');
    const [nomeTutor, setNomeTutor] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [pacienteParaChamar, setPacienteParaChamar] = useState<string | null>(null);
    const [sala, setSala] = useState('');

    const handleAddPaciente = async (e: FormEvent) => {
        e.preventDefault();
        if (!nomePet || !nomeTutor) {
            toast.warning('Campos obrigatórios', 'Nome do pet e tutor são obrigatórios.');
            return;
        }
        setIsAdding(true);
        try {
            await adicionarPacienteMutation.mutateAsync({ nome_pet: nomePet, nome_tutor: nomeTutor });
            toast.success('Paciente adicionado', `${nomePet} foi adicionado à fila com sucesso.`);
            setNomePet('');
            setNomeTutor('');
        } finally {
            setIsAdding(false);
        }
    };

    const handleOpenChamarModal = (id: string) => {
        setPacienteParaChamar(id);
        setModalOpen(true);
    };

    const handleConfirmarChamada = async (e: FormEvent) => {
        e.preventDefault();
        if (pacienteParaChamar && sala) {
            try {
                await chamarPacienteMutation.mutateAsync({ id: pacienteParaChamar, sala });
                const paciente = fila?.aguardando.find(p => p.id === pacienteParaChamar);
                toast.success('Paciente chamado', `${paciente?.nome_pet} foi chamado para a sala ${sala}.`);
                setModalOpen(false);
                setPacienteParaChamar(null);
                setSala('');
            } catch (error) {
                console.error('Erro ao chamar paciente:', error);
            }
        }
    };
    
    return (
        <div className="min-h-screen bg-bg-0">
            {/* Header */}
            <header className="bg-white shadow-elev-1 p-4 flex justify-between items-center">
                <h1 className="text-title-1 text-primary">VetQueue</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-body">{user?.nome}</span>
                    <Button onClick={logout} variant="secondary" className="text-semantic-danger">
                        <LogOut className="h-4 w-4"/>
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
                {/* Coluna 1: Adicionar Paciente */}
                <div className="lg:w-1/4">
                    <Card>
                        <CardHeader><CardTitle>Adicionar Novo Paciente</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddPaciente} className="space-y-4">
                                <Input 
                                    placeholder="Nome do Pet"
                                    value={nomePet}
                                    onChange={(e) => setNomePet(e.target.value)}
                                    disabled={isAdding}
                                />
                                <Input 
                                    placeholder="Nome do Tutor"
                                    value={nomeTutor}
                                    onChange={(e) => setNomeTutor(e.target.value)}
                                    disabled={isAdding}
                                />
                                <Button type="submit" className="w-full" disabled={isAdding}>
                                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Adicionar à Fila
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna 2: Aguardando */}
                <div className="flex-1">
                    <h2 className="text-title-1 mb-4 text-semantic-warning">Aguardando Atendimento</h2>
                    <div className="bg-bg-1 p-4 rounded-card h-[70vh] overflow-y-auto">
                        {loading && <p className="text-body">Carregando...</p>}
                        {!loading && fila?.aguardando.length === 0 && <p className="text-body">Nenhum paciente aguardando.</p>}
                        {fila?.aguardando.map(p => (
                            <PacienteCard key={p.id} paciente={p} onChamar={handleOpenChamarModal} onFinalizar={() => {}} />
                        ))}
                    </div>
                </div>

                {/* Coluna 3: Em Atendimento */}
                <div className="flex-1">
                    <h2 className="text-title-1 mb-4 text-semantic-success">Em Atendimento</h2>
                    <div className="bg-bg-1 p-4 rounded-card h-[70vh] overflow-y-auto">
                        {loading && <p className="text-body">Carregando...</p>}
                        {!loading && fila?.em_atendimento.length === 0 && <p className="text-body">Nenhum paciente em atendimento.</p>}
                        {fila?.em_atendimento.map(p => (
                            <PacienteCard key={p.id} paciente={p} onChamar={() => {}} onFinalizar={(id) => finalizarAtendimentoMutation.mutate(id)} />
                        ))}
                    </div>
                </div>
            </main>

            {/* Modal para chamar paciente */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Chamar Paciente">
                <form onSubmit={handleConfirmarChamada} className="space-y-4">
                    <Input 
                        placeholder="Ex: Consultório 1" 
                        value={sala}
                        onChange={e => setSala(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                        <Button type="button" onClick={() => setModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button type="submit">Confirmar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export { PainelControlePage };
