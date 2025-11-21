import { PropertyCard } from './PropertyCard.jsx';

/**
 * Grid de imóveis do portfólio
 * Grug gosta: responsabilidade única - apenas mostrar grid de imóveis
 * 
 * @param {Object} props
 * @param {Array} props.properties - Lista de imóveis a serem exibidos
 * @param {Function} props.onPropertyClick - Callback quando imóvel é clicado
 */
export const PortfolioGrid = ({ properties, onPropertyClick }) => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {properties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} onClick={onPropertyClick} />
            ))}
        </div>
    );
};
