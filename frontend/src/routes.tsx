import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PainelControlePage } from './pages/PainelControlePage';
import { PainelDisplayPage } from './pages/PainelDisplayPage';
import { useAuth } from './hooks/useAuth';

// --- ROUTING ---
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
                path="/painel" 
                element={
                    <PrivateRoute>
                        <PainelControlePage />
                    </PrivateRoute>
                } 
            />
            <Route path="/display" element={<PainelDisplayPage />} />
            <Route path="*" element={<Navigate to="/painel" />} />
        </Routes>
    );
};
