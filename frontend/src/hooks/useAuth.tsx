import { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContextType } from '../types';

// --- AUTHENTICATION CONTEXT ---
const AuthContext = createContext<AuthContextType | null>(null);

// --- AUTHENTICATION PROVIDER ---
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<{ nome: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (username: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await api.login(username, pass);
      setUser({ nome: userData.nome });
      navigate('/painel');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading, error }}>
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
