import { useState, useEffect } from 'react';
import { Trash2, Users, Phone, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

export default function LeadsList({ searchTerm = '' }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, lead: null });
    const { token } = useAuth();
    const { toast, showToast, hideToast } = useToast();

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/leads`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Falha na conexão');
            const data = await res.json();
            setLeads(data);
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (lead) => {
        setDeleteConfirm({ isOpen: true, lead });
    };

    const handleDelete = async () => {
        const { lead } = deleteConfirm;
        if (!lead) return;

        try {
            const res = await fetch(`${API_URL}/api/leads/${lead.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setLeads(leads.filter(l => l.id !== lead.id));
                showToast('Lead excluído com sucesso!', 'success');
            } else {
                showToast('Erro ao excluir lead', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao excluir lead', 'error');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPhoneForWhatsApp = (phone) => {
        return phone.replace(/\D/g, '');
    };

    // Filtrar leads baseado no termo de busca - Grug gosta: simples e direto
    const filteredLeads = leads.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && leads.length === 0) return <div className="p-12 text-center text-gray-500" role="status">Carregando leads...</div>;

    return (
        <>
            {filteredLeads.length > 0 && (
                <div className="sr-only" aria-live="polite" aria-atomic="true">
                    {filteredLeads.length} {filteredLeads.length === 1 ? 'lead encontrado' : 'leads encontrados'}
                </div>
            )}

            {/* Desktop: Container com tabela */}
            <div className="hidden md:flex flex-col h-full min-h-0">
                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <caption className="sr-only">Lista de leads capturados</caption>
                        <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                <th scope="col" className="p-3">Nome</th>
                                <th scope="col" className="p-3">Telefone</th>
                                <th scope="col" className="p-3">Imóvel</th>
                                <th scope="col" className="p-3">Tipo</th>
                                <th scope="col" className="p-3">Data</th>
                                <th scope="col" className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="group hover:bg-gray-50/80 transition-colors">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-gray-400" aria-hidden="true" />
                                            <span className="font-bold text-primary text-base">{lead.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" aria-hidden="true" />
                                            <a
                                                href={`https://wa.me/55${formatPhoneForWhatsApp(lead.phone)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                                            >
                                                {lead.phone}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {lead.property_title ? (
                                            <span className="text-gray-700 text-sm font-medium">{lead.property_title}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Não especificado</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200">
                                            {lead.type || 'gate'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-gray-600 text-sm">{formatDate(lead.created_at)}</span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                            <button
                                                onClick={() => handleDeleteClick(lead)}
                                                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                title="Excluir"
                                                aria-label={`Excluir lead de ${lead.name}`}
                                            >
                                                <Trash2 size={18} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredLeads.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Users size={40} className="mb-3 opacity-20" aria-hidden="true" />
                                            <p className="text-base font-medium text-gray-600">
                                                {searchTerm ? 'Nenhum lead encontrado' : 'Nenhum lead encontrado'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {searchTerm ? 'Tente buscar por outro termo.' : 'Os leads capturados no site aparecerão aqui.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile: Cards diretos na tela */}
            <div className="md:hidden space-y-3">
                {filteredLeads.map((lead) => (
                    <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={16} className="text-gray-400" aria-hidden="true" />
                                    <span className="font-bold text-primary text-base">{lead.name}</span>
                                </div>
                                <a
                                    href={`https://wa.me/55${formatPhoneForWhatsApp(lead.phone)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                                >
                                    <Phone size={14} className="text-gray-400" aria-hidden="true" />
                                    {lead.phone}
                                </a>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(lead)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                aria-label={`Excluir lead de ${lead.name}`}
                            >
                                <Trash2 size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            {lead.property_title && (
                                <div>
                                    <span className="text-gray-500">Imóvel: </span>
                                    <span className="text-gray-700 font-medium">{lead.property_title}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                                    {lead.type || 'gate'}
                                </span>
                                <span className="text-gray-500 text-xs">{formatDate(lead.created_at)}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredLeads.length === 0 && !loading && (
                    <div className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <Users size={40} className="mb-3 opacity-20" aria-hidden="true" />
                            <p className="text-base font-medium text-gray-600">
                                {searchTerm ? 'Nenhum lead encontrado' : 'Nenhum lead encontrado'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {searchTerm ? 'Tente buscar por outro termo.' : 'Os leads capturados no site aparecerão aqui.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog de Confirmação */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, lead: null })}
                onConfirm={handleDelete}
                title="Excluir Lead"
                message={`Tem certeza que deseja excluir o lead de "${deleteConfirm.lead?.name}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </>
    );
}

