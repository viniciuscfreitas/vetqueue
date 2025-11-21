import { Lock, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';

export const LeadModal = ({ isOpen, onClose, property, type = "gate", onSuccess }) => {
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhoneValue(formatted);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
      setPhoneValue(''); // Reset phone ao abrir modal
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isExitIntent = type === "exit";
  const isTimed = type === "timed";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extrair valores do form usando FormData
      const formData = new FormData(e.target);
      const name = formData.get('name') || '';
      // Remover formatação do telefone antes de enviar (apenas números)
      const phone = phoneValue.replace(/\D/g, '') || '';

      // Usar mesma lógica de URL do useProperties (dev vs prod)
      const isDev = import.meta.env.DEV;
      const apiUrl = import.meta.env.VITE_API_URL
          || (isDev ? 'http://localhost:3001' : '');
      const endpoint = apiUrl ? `${apiUrl}/api/leads` : '/api/leads';

      // Preparar dados para enviar
      const leadData = {
        name: name.trim(),
        phone: phone.trim(),
        property_id: property?.id || null,
        property_title: property?.title || null,
        type: type || 'gate'
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao salvar lead');
      }

      // Sucesso - manter feedback visual via onSuccess
      onSuccess("Acesso liberado! Enviando detalhes...");
      onClose();
    } catch (err) {
      console.error('Erro ao salvar lead:', err);
      alert(err.message || 'Erro ao salvar seus dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-300 outline-none">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-[#0f172a] bg-gray-100 rounded-full p-2 transition-colors" aria-label="Fechar">
          <X size={20} />
        </button>
        <div className="bg-[#f8fafc] p-6 text-center border-b border-gray-100">
          <div className="w-12 h-12 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-3">
            {isExitIntent || isTimed ? <Star className="text-[#856404]" size={20} /> : <Lock className="text-[#856404]" size={20} />}
          </div>
          <h2 className="text-lg font-serif font-bold text-[#0f172a] leading-tight">
            {isExitIntent ? "Antes de você ir..." : isTimed ? "Imóveis Off-Market" : "Desbloquear Preço & Fotos"}
          </h2>
          <p className="text-sm text-gray-600 mt-2 px-4 leading-relaxed">
            {isExitIntent ? "Tenho uma lista de imóveis exclusivos que não estão no site." : "Cadastre-se para ver o valor, tour virtual e endereço exato."}
          </p>
        </div>
        <div className="p-6">
          {property && type === 'gate' && (
            <div className="flex items-center gap-3 mb-6 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
               <img src={property.image} className="w-12 h-12 object-cover rounded-md" alt={property.title} />
               <div>
                  <p className="text-xs font-bold text-[#0f172a]">{property.title}</p>
                  <p className="text-[10px] text-gray-600 uppercase">{property.specs}</p>
               </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
             <input ref={firstInputRef} type="text" name="name" className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/20 outline-none text-base" placeholder="Seu nome" required disabled={loading} />
             <input type="tel" name="phone" inputMode="numeric" value={phoneValue} onChange={handlePhoneChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/20 outline-none text-base" placeholder="(11) 99999-9999" required disabled={loading} />
             <Button variant="gold" fullWidth={true} className="mt-2 shadow-xl shadow-[#d4af37]/20 text-base" disabled={loading}>
                {loading ? 'Enviando...' : (isExitIntent ? "Sim, Quero a Lista VIP" : "Ver Preço Agora")}
            </Button>
             <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1 mt-2"><Lock size={12} /> Seus dados estão seguros.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

