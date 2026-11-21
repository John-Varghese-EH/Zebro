import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const Analytics = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.Analytics }))
);
const ExecutiveDashboard = lazy(() =>
  import('./pages/ExecutiveDashboard').then((m) => ({ default: m.ExecutiveDashboard }))
);

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="w-screen h-screen bg-black text-chalk flex items-center justify-center font-mono text-xs">
              <span className="text-sky animate-pulse">Initializing orbital console...</span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/overview" element={<ExecutiveDashboard />} />
            <Route path="/fleet" element={<ExecutiveDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hud" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
