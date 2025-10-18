import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContextType } from '../types';

// --- AUTHENTICATION CONTEXT ---
const AuthContext = createContext<AuthContextType | null>(null);

// --- AUTHENTICATION PROVIDER ---
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<{ nome: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Inicializa o token do localStorage quando a aplicação carrega
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      // Verifica se o token ainda é válido (opcional)
      // Por enquanto, apenas assume que é válido
    }
  }, []);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await api.login(username, pass);
      setUser({ nome: userData.nome });
      setToken(userData.token);
      // Salva o token no localStorage para persistência
      localStorage.setItem('auth_token', userData.token);
      navigate('/painel');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Remove o token do localStorage
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading, error, token }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- AUTHENTICATION HOOK ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
