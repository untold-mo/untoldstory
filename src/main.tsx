import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import App from './app/App';
import LeadsImportRoute from './app/pages/LeadsImportRoute';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/index.css';
import './i18n';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/leads/import" element={<LeadsImportRoute />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AppRouter />
  </ErrorBoundary>
);
  