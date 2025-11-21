import { Instagram, Linkedin } from 'lucide-react';
import { BROKER_INFO } from '../data/constants.js';

export const Footer = () => (
  <footer className="bg-white border-t border-gray-200 pt-20 pb-10">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left mb-16">
        <div className="max-w-sm">
          <span className="text-2xl font-serif font-bold text-[#0f172a]">MARCELO<span className="text-[#a18225]">BRAZ</span></span>
          <p className="text-gray-600 mt-4 text-base">Design, conforto e exclusividade. Sua consultoria imobiliária de alto padrão na baixada santista.</p>
        </div>
        <div className="flex gap-6">
          <a href="https://instagram.com/marcelobraz" target="_blank" rel="noreferrer" className="p-3 bg-gray-100 rounded-full text-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all" aria-label="Instagram"><Instagram size={24}/></a>
          <a href="https://linkedin.com/in/marcelobraz" target="_blank" rel="noreferrer" className="p-3 bg-gray-100 rounded-full text-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all" aria-label="LinkedIn"><Linkedin size={24}/></a>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
        <p>{BROKER_INFO.creci} • Santos/SP</p>
        <div className="flex gap-4">
          <a href="/privacidade" className="hover:text-[#0f172a]">Política de Privacidade</a>
          <a href="/termos" className="hover:text-[#0f172a]">Termos de Uso</a>
        </div>
        <p>© 2025 Marcelo Braz.</p>
      </div>
    </div>
  </footer>
);

