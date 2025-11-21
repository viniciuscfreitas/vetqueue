import { CheckCircle, Home } from 'lucide-react';
import { BROKER_INFO } from '../data/constants.js';
import { Button } from '../components/Button.jsx';

export const ValuationSection = () => (
  <section className="py-20 bg-white border-t border-gray-100" id="avaliacao">
      <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                  <h3 className="text-3xl font-serif font-bold text-[#0f172a] mb-4">Quer vender seu imóvel?</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">Faço uma avaliação técnica baseada em dados reais de vendas recentes (Sold Data).</p>
                  <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle size={16} className="text-green-600"/> Fotos profissionais e Tour Virtual</li>
                      <li className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle size={16} className="text-green-600"/> Marketing direcionado</li>
                      <li className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle size={16} className="text-green-600"/> Assessoria Jurídica Completa</li>
                  </ul>
                  <Button variant="outline" onClick={() => window.open(BROKER_INFO.whatsapp_link)}>Solicitar Avaliação Gratuita</Button>
              </div>
              <div className="md:w-1/2 bg-[#f0f4f8] p-8 rounded-3xl flex flex-col items-center text-center">
                  <Home size={48} className="text-[#d4af37] mb-4" />
                  <h4 className="text-xl font-bold text-[#0f172a] mb-2">Quanto vale meu imóvel?</h4>
                  <p className="text-sm text-gray-500 mb-6">Receba um estudo de mercado simplificado em 24h.</p>
                  <form className="w-full space-y-3" onSubmit={(e) => e.preventDefault()}>
                      <input type="text" placeholder="Endereço do Imóvel" className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f172a]" />
                      <Button variant="primary" fullWidth={true}>Enviar para Avaliação</Button>
                  </form>
              </div>
          </div>
      </div>
  </section>
);

