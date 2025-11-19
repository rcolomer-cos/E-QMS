import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandingProvider } from './contexts/BrandingContext';
import { ToastProvider } from './contexts/ToastContext';
import { ModuleVisibilityProvider } from './contexts/ModuleVisibilityContext';
import ToastContainer from './components/ToastContainer';
import App from './App';
import './i18n'; // Import i18n configuration
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BrandingProvider>
          <ToastProvider>
            <ModuleVisibilityProvider>
              <App />
              <ToastContainer />
            </ModuleVisibilityProvider>
          </ToastProvider>
        </BrandingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
