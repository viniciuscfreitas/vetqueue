/**
 * Estado vazio quando nenhum imóvel corresponde aos filtros
 * Grug gosta: componente pequeno para mostrar mensagem quando não tem resultados
 * 
 * @param {Object} props
 * @param {Function} props.onClearFilters - Callback para limpar filtros
 */
export const PortfolioEmptyState = ({ onClearFilters }) => {
    return (
        <div className="text-center py-20">
            <p className="text-xl text-gray-500 font-serif">
                Nenhum imóvel encontrado com esses filtros.
            </p>
            <button
                onClick={onClearFilters}
                className="mt-4 text-[#d4af37] font-bold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded px-2 py-1"
                aria-label="Limpar filtros e ver todos os imóveis"
            >
                Limpar Filtros e ver todos
            </button>
        </div>
    );
};
