import { MessageCircle } from 'lucide-react';
import { Button } from '../components/Button.jsx';

export const WhatsappCaptureSection = () => (
  <section className="py-20 bg-[#0f172a] text-white">
      <div className="container mx-auto px-6">
          <div className="bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-4 text-[#d4af37]">
                      <MessageCircle size={24} />
                      <span className="text-sm font-bold uppercase tracking-widest">Alerta de Oportunidade</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">Não achou o que procurava?</h3>
                  <p className="text-gray-400 leading-relaxed">Receba no seu WhatsApp uma seleção personalizada de imóveis "Off-Market".</p>
              </div>
              <form className="w-full md:w-auto flex flex-col gap-4 min-w-[350px]" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" placeholder="Bairro de preferência" className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
                  <input type="text" placeholder="Até qual valor? (Ex: 2M)" className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
                  <Button variant="gold" className="w-full text-base shadow-lg shadow-[#d4af37]/20">Receber Lista no WhatsApp</Button>
              </form>
          </div>
      </div>
  </section>
);

