import { useEffect, useState } from 'react';

/**
 * Hook para buscar imóveis da API
 * Grug gosta: tudo vem da API, sem dados mockados
 */
export const useProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Grug gosta: URL relativa em produção, localhost apenas em dev
                // NPM roteia /api para marcelobraz-backend:3001 (container do backend)
                const isDev = import.meta.env.DEV;
                const apiUrl = import.meta.env.VITE_API_URL
                    || (isDev ? 'http://localhost:3001' : '');
                const endpoint = apiUrl ? `${apiUrl}/api/properties` : '/api/properties';

                const res = await fetch(endpoint);
                if (!res.ok) throw new Error('Falha ao buscar imóveis');

                const data = await res.json();
                setProperties(data);
            } catch (err) {
                console.error('Erro na API:', err);
                setError(err);
                setProperties([]); // Grug gosta: se API falhar, array vazio
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    return { properties, loading, error };
};
