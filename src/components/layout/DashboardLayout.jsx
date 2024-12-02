import React from 'react';
import { Header } from './Header';
import { useDashboard } from '../../contexts/DashboardContext';

export const DashboardSection = ({ title, children, className = '' }) => (
  <section className={`${className}`}>
    {title && (
      <h2 className="text-xl font-semibold text-gray-200 mb-4">{title}</h2>
    )}
    {children}
  </section>
);

export const DashboardGrid = ({ children, className = '' }) => (
  <div className={`grid gap-6 ${className}`}>
    {children}
  </div>
);

export const DashboardContainer = ({ children, className = '' }) => (
  <div className={`min-h-screen ${className}`}>
    {children}
  </div>
);

export const DashboardLayout = ({ 
  systemData,
  children,
  sidebarContent,
  showSidebar = false,
  onSettingsClick
}) => {
  const { state } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isCardView ? 'bg-[#080721]' : 'bg-[#0a1929]'
    }`}>
      {/* Background effects */}
      <div className="fixed inset-0">
        {/* Gradient background */}
        {isCardView ? (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900/20" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-blue-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.15),transparent_50%)]" />
          </>
        )}
        
        {/* Grid pattern */}
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNjAgMTAgTSAxMCAwIEwgMTAgNjAgTSAwIDIwIEwgNjAgMjAgTSAyMCAwIEwgMjAgNjAgTSAwIDMwIEwgNjAgMzAgTSAzMCAwIEwgMzAgNjAgTSAwIDQwIEwgNjAgNDAgTSA0MCAwIEwgNDAgNjAgTSAwIDUwIEwgNjAgNTAgTSA1MCAwIEwgNTAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjA0MCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] ${
          isCardView ? 'opacity-[0.15]' : 'opacity-[0.05]'
        }`} />
        
        {/* Animated glow effects */}
        {isCardView ? (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse delay-1000" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full mix-blend-multiply filter blur-[160px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-blue-600/20 rounded-full mix-blend-multiply filter blur-[180px] animate-pulse delay-1000" />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header 
          systemData={systemData} 
          onSettingsClick={onSettingsClick}
          showActions={true}
        />
        
        <div className="flex">
          {showSidebar && (
            <aside className="fixed right-0 top-0 bottom-0 w-80 backdrop-blur-md bg-gray-900/40 shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto border-l border-gray-700/50">
              {sidebarContent}
            </aside>
          )}
          
          <main className={`flex-1 transition-all duration-300 ease-in-out ${showSidebar ? 'mr-80' : ''}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

// Optional: Compound components pattern
DashboardLayout.Section = DashboardSection;
DashboardLayout.Grid = DashboardGrid;
DashboardLayout.Container = DashboardContainer;
