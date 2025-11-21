import { Filter } from 'lucide-react';

/**
 * Componente de filtros para o portfólio de imóveis
 * Grug gosta: componente pequeno, faz só uma coisa (filtrar)
 * 
 * @param {Object} props
 * @param {Object} props.filters - Estado atual dos filtros {bairro, tipo}
 * @param {Function} props.onFilterChange - Callback para atualizar filtros
 * @param {Function} props.onClearFilters - Callback para limpar todos os filtros
 * @param {string[]} props.neighborhoods - Lista de bairros disponíveis
 * @param {string[]} props.types - Lista de tipos de imóveis disponíveis
 */
export const PortfolioFilters = ({ filters, onFilterChange, onClearFilters, neighborhoods, types }) => {
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex items-center gap-2 text-[#0f172a] font-bold whitespace-nowrap">
                    <Filter size={20} /> Filtros:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    <div className="relative">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block ml-1">
                            Bairro
                        </label>
                        <select
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                            value={filters.bairro}
                            onChange={(e) => onFilterChange({ ...filters, bairro: e.target.value })}
                            aria-label="Filtrar por bairro"
                        >
                            {neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block ml-1">
                            Tipo
                        </label>
                        <select
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
                            value={filters.tipo}
                            onChange={(e) => onFilterChange({ ...filters, tipo: e.target.value })}
                            aria-label="Filtrar por tipo de imóvel"
                        >
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="relative flex items-end">
                        <button
                            className="w-full p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f172a]"
                            onClick={onClearFilters}
                            aria-label="Limpar todos os filtros"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
