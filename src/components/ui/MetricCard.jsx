import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

const CircularGauge = ({ value, max = 100, size = 120, label }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (value / max) * circumference;
  const rotation = progress - circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          className="text-blue-950/30"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-blue-400"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={rotation}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Value and label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-blue-100">{value}</span>
        {label && <span className="text-sm text-blue-300">{label}</span>}
      </div>
    </div>
  );
};

export const MetricCard = ({ 
  title, 
  icon, 
  children, 
  className = '',
  headerClassName = '',
  value,
  maxValue,
  showGauge = false
}) => {
  const { state } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  const cardClassName = isCardView
    ? `
      relative overflow-hidden rounded-xl
      backdrop-blur-md bg-gray-900/40
      border border-gray-700/50
      shadow-lg shadow-black/20
      ${className}
    `
    : `
      relative overflow-hidden
      ${className}
    `;

  const headerClassNameFinal = isCardView
    ? `
      flex items-center justify-between
      p-4 border-b border-gray-700/50
      bg-gradient-to-r from-gray-800/50 to-transparent
      ${headerClassName}
    `
    : `
      flex items-center justify-between
      mb-4
      ${headerClassName}
    `;

  const renderContent = () => {
    if (!isCardView && showGauge && typeof value !== 'undefined') {
      return (
        <div className="flex items-start space-x-6">
          <CircularGauge value={value} max={maxValue} label={title} />
          <div className="flex-1 pt-2">
            {children}
          </div>
        </div>
      );
    }
    return children;
  };

  return (
    <div className={cardClassName}>
      {isCardView && (
        <>
          {/* Glow effect - only in card view */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50" />
          
          {/* Grid pattern overlay - only in card view */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-[0.03]" />
        </>
      )}

      {/* Content */}
      <div className="relative">
        {/* Header - only show in card view */}
        {isCardView && (
          <div className={headerClassNameFinal}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isCardView ? 'bg-gray-800/50' : ''} text-gray-300`}>
                {icon}
              </div>
              <h2 className="text-lg font-medium text-gray-300">{title}</h2>
            </div>
          </div>
        )}

        {/* Body */}
        <div className={`${isCardView ? 'p-4' : ''} relative`}>
          {renderContent()}
        </div>

        {isCardView && (
          /* Bottom highlight - only in card view */
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/20 to-transparent" />
        )}
      </div>
    </div>
  );
};
