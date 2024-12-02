import React from 'react';
import ReactDOM from 'react-dom/client';
import SystemDashboard from './components/SystemDashboard';
import { DashboardProvider } from './contexts/DashboardContext';
import './index.css';

const App = () => {
  return (
    <React.StrictMode>
      <DashboardProvider>
        <SystemDashboard />
      </DashboardProvider>
    </React.StrictMode>
  );
};

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(<App />);
