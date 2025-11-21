import { Button } from '../components/Button.jsx';
import { PropertyCard } from '../components/PropertyCard.jsx';

/**
 * Seção de Curadoria da Semana
 * Grug gosta: usa apenas dados da API, sem fallback mockado
 */
export const CollectionSection = ({ onPropertyClick, navigateTo, properties = [] }) => {
  return (
    <section className="py-24 bg-white" id="colecao">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#856404] text-xs font-bold uppercase tracking-[0.2em]">Curadoria da Semana</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0f172a] mt-3 mb-6">Imóveis Selecionados</h2>
          <p className="text-gray-600 text-lg">Por questões de sigilo, o valor final e endereço exato são revelados apenas para clientes cadastrados.</p>
        </div>
        {(() => {
          const featuredProperties = properties.filter(p => p.featured).slice(0, 4);

          if (featuredProperties.length === 0) {
            return (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhum imóvel selecionado para Curadoria da Semana</p>
              </div>
            );
          }

          return (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} onClick={onPropertyClick} />
              ))}
            </div>
          );
        })()}
        <div className="mt-16 flex justify-center">
          <Button variant="outline" className="rounded-full px-10 hover:shadow-lg text-base" onClick={() => navigateTo('portfolio')}>Ver Portfólio Completo</Button>
        </div>
      </div>
    </section>
  );
};

