import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './components/ui/Toast';
import { AppRoutes } from './routes';

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
      <AuthProvider>
          <ToastProvider>
          <AppRoutes />
          </ToastProvider>
      </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}