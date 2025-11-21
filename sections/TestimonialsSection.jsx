import { Star } from 'lucide-react';
import { TESTIMONIALS } from '../data/content.js';

export const TestimonialsSection = () => (
  <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
          <h2 className="text-3xl font-serif font-bold text-center text-[#0f172a] mb-16">Histórias de quem já mora bem</h2>
          <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((dep) => (
                  <div key={dep.id} className="bg-[#f8fafc] p-8 rounded-2xl border border-gray-100">
                      <div className="text-[#d4af37] mb-4 flex gap-1">{[1,2,3,4,5].map(k=><Star key={k} size={14} fill="#d4af37"/>)}</div>
                      <p className="text-gray-600 italic mb-6 text-sm leading-relaxed">"{dep.text}"</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0f172a] text-[#d4af37] rounded-full flex items-center justify-center font-bold text-sm">{dep.name.charAt(0)}</div>
                          <div><p className="text-sm font-bold text-[#0f172a]">{dep.name}</p><p className="text-xs text-gray-400">{dep.loc}</p></div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  </section>
);

