import { PageErrorBoundary } from './components/ui/PageErrorBoundary';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AppRouter } from './app/AppRouter';
import { ToastProvider, ConfirmDialogProvider } from './components/ui';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ConfirmDialogProvider>
            <PageErrorBoundary><AppRouter /></PageErrorBoundary>
          </ConfirmDialogProvider>
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
