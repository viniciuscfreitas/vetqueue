import { ArrowRight, Lock } from 'lucide-react';

export const PropertyCard = ({ property, onClick }) => (
  <article className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full" onClick={() => onClick(property)}>
    <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
      <img src={property.image} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
        {property.tags.map(tag => (
          <span key={tag} className="bg-white text-[#0f172a] text-[11px] font-bold px-3 py-1 rounded-full uppercase shadow-md">{tag}</span>
        ))}
      </div>
      <div className="absolute inset-0 bg-[#0f172a]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
        <span className="bg-white text-[#0f172a] px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
          <Lock size={14} className="text-[#856404]" /> Ver Preço e Fotos
        </span>
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <h3 className="font-serif font-bold text-xl text-[#0f172a] mb-2 group-hover:text-[#a18225] transition-colors leading-tight">{property.title}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{property.subtitle}</p>
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{property.specs}</span>
        <button className="text-[#a18225] text-xs font-bold uppercase flex items-center gap-1 hover:underline">
          Detalhes <ArrowRight size={12}/>
        </button>
      </div>
    </div>
  </article>
);

