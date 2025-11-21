import { Play } from 'lucide-react';
import { BROKER_INFO } from '../data/constants.js';
import { Button } from '../components/Button.jsx';

export const AboutSection = () => (
  <section className="py-24 bg-[#f8fafc]" id="sobre">
      <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-5/12 relative">
                  <div className="absolute inset-0 border-2 border-[#d4af37] rounded-full transform translate-x-4 translate-y-4"></div>
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" alt="Marcelo Braz" className="w-full aspect-square object-cover rounded-full shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="w-full md:w-7/12">
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#0f172a] mb-6">Olá, eu sou o Marcelo. <br/>Vamos tomar um café?</h2>
                  <p className="text-gray-700 text-lg leading-relaxed font-normal mb-6">Não sou uma imobiliária, sou o seu parceiro de negócios em Santos. Moro aqui há 20 anos, crio meus filhos aqui e conheço cada rua do Gonzaga à Ponta da Praia.</p>
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-300 pt-8 mb-8">
                      {BROKER_INFO.stats.map((stat, i) => (
                          <div key={i}><span className="block text-3xl font-serif font-bold text-[#0f172a]">{stat.value}</span><span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{stat.label}</span></div>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-4">
                      <Button variant="primary" onClick={() => window.open(BROKER_INFO.whatsapp_link)}>Agendar uma Conversa</Button>
                      <button className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#0f172a] hover:text-[#a18225] transition-colors rounded-full border border-gray-200 hover:border-[#0f172a]"><Play size={16} /> Ver Vídeo</button>
                  </div>
              </div>
          </div>
      </div>
  </section>
);

