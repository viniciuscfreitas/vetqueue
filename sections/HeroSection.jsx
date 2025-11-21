import { ChevronDown, MapPin } from 'lucide-react';
import { BROKER_INFO } from '../data/constants.js';
import { Button } from '../components/Button.jsx';

export const HeroSection = ({ navigateTo }) => (
  <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0 flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 bg-[#f0f4f8] h-1/2 md:h-full"></div>
          <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
              <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=90" className="w-full h-full object-cover" alt="Orla de Santos" />
              <div className="absolute inset-0 bg-[#0f172a]/20"></div>
          </div>
      </div>
      <div className="container mx-auto px-6 relative z-10">
          <div className="bg-white/95 md:bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-4 mb-6">
                  <img src={BROKER_INFO.intro_video} className="w-14 h-14 rounded-full object-cover border-2 border-[#d4af37] p-0.5" alt="Marcelo Braz" />
                  <div>
                      <p className="text-xs font-bold text-[#856404] uppercase tracking-wider">Olá, eu sou o Marcelo</p>
                      <p className="text-sm text-gray-700 font-medium">Especialista em morar bem em Santos.</p>
                  </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#0f172a] leading-[1.1] mb-6">Encontre seu refúgio <br/><span className="text-[#a18225] italic">de frente para o mar.</span></h1>
              <p className="text-gray-700 text-lg font-normal mb-8 leading-relaxed">Uma curadoria de imóveis que não estão nos portais comuns. Acesso direto a proprietários.</p>
              <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); navigateTo('portfolio'); }}>
                  <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={18} className="text-[#0f172a]" /></div>
                          <select className="w-full pl-12 pr-10 py-4 bg-gray-50 rounded-xl border border-gray-300 text-gray-900 text-base focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/20 appearance-none cursor-pointer">
                              <option>Bairro (Gonzaga, Boqueirão...)</option>
                              <option>Gonzaga</option>
                              <option>Ponta da Praia</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><ChevronDown size={18} className="text-gray-500" /></div>
                      </div>
                      <Button variant="primary" className="px-8 py-4 rounded-xl text-base">Buscar Imóveis</Button>
                  </div>
              </form>
          </div>
      </div>
  </section>
);

