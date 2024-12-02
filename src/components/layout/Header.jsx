import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatTime, formatDate } from '../../utils/format';
import { Settings, Monitor, Clock, Calendar, Power, LayoutGrid, Layout, ChevronDown, Server, Box, Database, HardDrive, AlertCircle, Cog } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { fetchProxmoxStats } from '../../api/systemApi';

const NodeSelector = ({ nodes, onSelect, selectedNode, isLoading }) => {
  const { state } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  if (isLoading) {
    return (
      <div className={`flex items-center px-3 py-1 rounded-lg ${
        isCardView
          ? 'bg-gray-800/50 border-gray-700/50'
          : 'bg-blue-900/30 border-blue-800/30'
      } backdrop-blur-sm border min-w-[200px]`}>
        <HardDrive className="h-4 w-4 mr-2 text-gray-400 animate-pulse" />
        <span className="text-gray-400">Loading nodes...</span>
      </div>
    );
  }

  if (!nodes?.length) return null;

  return (
    <div className={`flex items-center px-3 py-1 rounded-lg ${
      isCardView
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-blue-900/30 border-blue-800/30'
    } backdrop-blur-sm border min-w-[200px]`}>
      <HardDrive className="h-4 w-4 mr-2 text-purple-400" />
      <select
        value={selectedNode || ''}
        onChange={(e) => onSelect(e.target.value)}
        className={`bg-transparent border-none text-gray-300 text-sm focus:ring-0 ${
          !selectedNode ? 'text-gray-400' : ''
        } w-full`}
      >
        <option value="" disabled>Select Node</option>
        {nodes.map((node) => (
          <option key={node.node} value={node.node}>
            {node.node} ({node.status || 'Unknown'})
          </option>
        ))}
      </select>
    </div>
  );
};

const DeviceSelector = ({ onOpenSettings }) => {
  const { state, setActiveDevice, setSelectedNode, setDeviceError } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const lastErrorRef = useRef(null);
  const isCardView = state.layout.viewMode === 'card';
  const fetchTimeoutRef = useRef(null);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'proxmox':
        return <Server className="h-4 w-4 mr-2 text-purple-400" />;
      case 'vm':
        return <Box className="h-4 w-4 mr-2 text-green-400" />;
      case 'lxc':
        return <Box className="h-4 w-4 mr-2 text-blue-400" />;
      case 'docker':
        return <Database className="h-4 w-4 mr-2 text-cyan-400" />;
      default:
        return <Monitor className="h-4 w-4 mr-2 text-blue-400" />;
    }
  };

  const activeDevice = state.devices.list[state.devices.activeDevice];

  const updateDeviceError = useCallback((error) => {
    if (error !== lastErrorRef.current) {
      setDeviceError(error);
      lastErrorRef.current = error;
    }
  }, [setDeviceError]);

  const fetchNodes = useCallback(async () => {
    if (!activeDevice?.type === 'proxmox' || !activeDevice?.id) return;
    
    try {
      setIsLoadingNodes(true);
      setFetchError(null);
      updateDeviceError(null);
      
      const data = await fetchProxmoxStats(activeDevice.id);
      if (data.nodes) {
        setNodes(data.nodes);
      }
    } catch (error) {
      console.error('Error fetching Proxmox nodes:', error);
      const errorMessage = error.message;
      setFetchError(errorMessage);
      if (errorMessage.includes('authentication')) {
        updateDeviceError('Device needs to be reconfigured. Click the settings button to update credentials.');
      } else {
        updateDeviceError(errorMessage);
      }
      setNodes([]);
    } finally {
      setIsLoadingNodes(false);
    }
  }, [activeDevice?.id, activeDevice?.type, updateDeviceError]);

  useEffect(() => {
    if (activeDevice?.type === 'proxmox') {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Set a new timeout for the fetch
      fetchTimeoutRef.current = setTimeout(() => {
        fetchNodes();
      }, 500);
    } else {
      setNodes([]);
      setIsLoadingNodes(false);
      setFetchError(null);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [activeDevice?.type, activeDevice?.id, fetchNodes]);

  const buttonClass = isCardView
    ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
    : 'bg-blue-900/30 border-blue-800/30 hover:bg-blue-800/30';

  const handleDeviceSelect = (device) => {
    setActiveDevice(device.id);
    setSelectedNode(null);
    setNodes([]);
    setFetchError(null);
    updateDeviceError(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center px-3 py-1 rounded-lg ${buttonClass} backdrop-blur-sm border transition-all duration-200`}
        >
          {getDeviceIcon(activeDevice.type)}
          <span className="text-gray-300 mr-2">
            {activeDevice.name}
            {activeDevice.type === 'proxmox' && state.devices.selectedNode && (
              <span className="text-gray-400 ml-2">({state.devices.selectedNode})</span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {activeDevice.type === 'proxmox' && (
          <>
            {fetchError ? (
              <div className="flex items-center justify-between px-3 py-1 rounded-lg bg-red-500/10 border-red-500/20 backdrop-blur-sm border min-w-[200px]">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
                  <span className="text-red-300">
                    {fetchError.includes('authentication') ? 'Authentication failed' : fetchError}
                  </span>
                </div>
                {fetchError.includes('authentication') && (
                  <button
                    onClick={onOpenSettings}
                    className="ml-2 p-1 text-red-400 hover:text-red-300"
                    title="Open Settings"
                  >
                    <Cog className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <NodeSelector
                nodes={nodes}
                selectedNode={state.devices.selectedNode}
                onSelect={setSelectedNode}
                isLoading={isLoadingNodes}
              />
            )}
          </>
        )}
      </div>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-64 rounded-lg border backdrop-blur-sm z-50 ${
          isCardView
            ? 'bg-gray-800/95 border-gray-700/50'
            : 'bg-blue-900/95 border-blue-800/30'
        }`}>
          <div className="py-2">
            {Object.values(state.devices.list).map((device) => (
              <button
                key={`device-${device.id}`}
                onClick={() => handleDeviceSelect(device)}
                className={`w-full flex items-center px-4 py-2 hover:bg-blue-400/10 ${
                  device.id === state.devices.activeDevice ? 'bg-blue-400/20' : ''
                }`}
              >
                {getDeviceIcon(device.type)}
                <div className="flex-1 text-left">
                  <div className="text-gray-200">{device.name}</div>
                  <div className="text-xs text-gray-400">{device.address}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TimeDisplay = ({ time }) => {
  const { state } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  return (
    <div className="relative">
      {/* Background glow effect */}
      <div className={`absolute -inset-4 ${
        isCardView 
          ? 'bg-blue-500/20'
          : 'bg-blue-600/10'
      } blur-xl rounded-full`} />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-baseline space-x-2">
          <h1 className={`text-7xl font-bold ${
            isCardView
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400'
              : 'text-blue-100'
          }`}>
            {formatTime(time.current)}
          </h1>
        </div>
        <div className="flex items-center mt-2 space-x-4">
          <div className="flex items-center text-blue-400">
            <Calendar className="h-4 w-4 mr-2" />
            <p className="text-lg">
              {formatDate(time.current)}
            </p>
          </div>
          <div className="flex items-center text-emerald-400">
            <Clock className="h-4 w-4 mr-2" />
            <p className="text-lg">
              Uptime: {time.uptime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemInfo = ({ system, updates, onOpenSettings }) => {
  const { state } = useDashboard();

  return (
    <div className="flex items-center space-x-6 text-sm">
      <DeviceSelector onOpenSettings={onOpenSettings} />
      {updates?.available > 0 && (
        <div className="flex items-center px-3 py-1 rounded-full bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20">
          <Power className="h-4 w-4 mr-2 text-yellow-400" />
          <span className="text-yellow-400">
            {updates.available} updates available
          </span>
        </div>
      )}
    </div>
  );
};

const HeaderActions = ({ onSettingsClick }) => {
  const { state, toggleViewMode } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  const buttonClass = isCardView
    ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50'
    : 'bg-blue-900/30 border-blue-800/30 hover:bg-blue-800/30 hover:border-blue-700/30';

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={toggleViewMode}
        className={`p-2 rounded-lg backdrop-blur-sm border 
                  transition-all duration-200
                  group ${buttonClass}`}
        title={isCardView ? "Switch to Full View" : "Switch to Card View"}
      >
        {isCardView ? (
          <Layout className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
        ) : (
          <LayoutGrid className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
        )}
      </button>
      <button
        onClick={onSettingsClick}
        className={`p-2 rounded-lg backdrop-blur-sm border
                  transition-all duration-200
                  group ${buttonClass}`}
        title="Settings"
      >
        <Settings className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
      </button>
    </div>
  );
};

export const Header = React.memo(({ 
  systemData,
  onSettingsClick = () => {},
  showActions = true 
}) => {
  const { state } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  if (!systemData) return null;

  return (
    <header className="relative">
      {/* Header background with blur effect */}
      <div className={`absolute inset-0 ${
        isCardView
          ? 'bg-gradient-to-b from-gray-900/90 to-gray-900/50'
          : 'bg-gradient-to-b from-blue-950/90 to-blue-950/50'
      } backdrop-blur-sm`} />
      
      {/* Content */}
      <div className="relative px-6 py-4">
        <div className="max-w-[2000px] mx-auto">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <TimeDisplay time={systemData.time} />
              <SystemInfo 
                system={systemData.system}
                updates={systemData.updates}
                onOpenSettings={onSettingsClick}
              />
            </div>
            {showActions && (
              <HeaderActions onSettingsClick={onSettingsClick} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom border with gradient */}
      <div className={`absolute bottom-0 left-0 right-0 h-px ${
        isCardView
          ? 'bg-gradient-to-r from-transparent via-gray-700/50 to-transparent'
          : 'bg-gradient-to-r from-transparent via-blue-800/50 to-transparent'
      }`} />
    </header>
  );
});

Header.displayName = 'Header';

export { TimeDisplay, SystemInfo, HeaderActions };
