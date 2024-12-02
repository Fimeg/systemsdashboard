import React from 'react';
import { DashboardLayout } from './layout/DashboardLayout';
import { CpuMetrics } from './metrics/CpuMetrics';
import { MemoryMetrics } from './metrics/MemoryMetrics';
import { NetworkMetrics } from './metrics/NetworkMetrics';
import PowerMetrics from './metrics/PowerMetrics';
import BackupMetrics from './metrics/BackupMetrics';
import UpdateMetrics from './metrics/UpdateMetrics';
import StorageHealthMetrics from './metrics/StorageHealthMetrics';
import SecurityMetrics from './metrics/SecurityMetrics';
import { SettingsPanel } from './settings/SettingsPanel';
import { useSystemData } from '../hooks/useSystemData';
import { useDashboard } from '../contexts/DashboardContext';
import { AlertCircle, Server } from 'lucide-react';

const ProxmoxNodeSelector = ({ nodes }) => {
  const { state } = useDashboard();
  const isCardView = state.layout.viewMode === 'card';

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="col-span-12 p-6 bg-blue-950/20 backdrop-blur-sm rounded-2xl border border-blue-900/30">
      <div className="flex items-center mb-4">
        <Server className="h-5 w-5 mr-2 text-purple-400" />
        <h2 className="text-xl font-semibold text-blue-100">Available Nodes</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map(node => (
          <div key={`node-${node.node}`} className="p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
            <h3 className="text-lg font-medium text-blue-200">{node.node}</h3>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-gray-300">
                Status: <span className="text-purple-400">{node.status || 'Unknown'}</span>
              </div>
              {node.error && (
                <div className="text-sm text-red-400">
                  Error: {node.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProxmoxMetrics = ({ data }) => {
  if (!data) return null;

  // Format RRD data for display
  const formatMetrics = (rrddata) => {
    if (!rrddata || !Array.isArray(rrddata)) return {};
    const latest = rrddata[rrddata.length - 1];
    return {
      cpu: {
        usage: latest?.cpu || 0,
        temperature: latest?.cputemp || 0
      },
      memory: {
        total: latest?.maxmem || 0,
        used: latest?.mem || 0,
        free: (latest?.maxmem || 0) - (latest?.mem || 0)
      },
      network: {
        interfaces: [{
          iface: 'net0',
          rx_bytes: latest?.netin || 0,
          tx_bytes: latest?.netout || 0,
          rx_sec: latest?.netin_rate || 0,
          tx_sec: latest?.netout_rate || 0
        }]
      },
      storage: [{
        fs: 'root',
        size: latest?.maxdisk || 0,
        used: latest?.disk || 0,
        available: (latest?.maxdisk || 0) - (latest?.disk || 0),
        usePercent: latest?.disk ? (latest.disk / latest.maxdisk) * 100 : 0
      }]
    };
  };

  const metrics = formatMetrics(data.rrddata);

  return (
    <>
      <div className="col-span-12 xl:col-span-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* CPU & Memory Section */}
          <div className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-2 gap-6">
              <CpuMetrics cpuData={metrics.cpu} />
              <MemoryMetrics memory={metrics.memory} />
            </div>
          </div>
          
          {/* Storage & Network */}
          <div className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-2 gap-6">
              <StorageHealthMetrics 
                storageData={{
                  storage: metrics.storage,
                  io: {}
                }} 
              />
              <NetworkMetrics network={metrics.network} />
            </div>
          </div>

          {/* VMs & Containers */}
          <div className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-blue-950/20 backdrop-blur-sm rounded-2xl border border-blue-900/30">
                <h3 className="text-lg font-semibold text-blue-100 mb-4">Virtual Machines</h3>
                <div className="space-y-2">
                  {data.vms?.map(vm => (
                    <div key={`vm-${vm.vmid}`} className="flex justify-between items-center">
                      <span className="text-gray-300">{vm.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        vm.status === 'running' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {vm.status}
                      </span>
                    </div>
                  ))}
                  {(!data.vms || data.vms.length === 0) && (
                    <div className="text-gray-400">No virtual machines found</div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-blue-950/20 backdrop-blur-sm rounded-2xl border border-blue-900/30">
                <h3 className="text-lg font-semibold text-blue-100 mb-4">Containers</h3>
                <div className="space-y-2">
                  {data.containers?.map(container => (
                    <div key={`container-${container.vmid}`} className="flex justify-between items-center">
                      <span className="text-gray-300">{container.name}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        container.status === 'running' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {container.status}
                      </span>
                    </div>
                  ))}
                  {(!data.containers || data.containers.length === 0) && (
                    <div className="text-gray-400">No containers found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const SystemDashboard = () => {
  const { state, toggleSidebar } = useDashboard();
  const { systemData, error, loading } = useSystemData(state.refreshRate);
  const isCardView = state.layout.viewMode === 'card';
  const activeDevice = state.devices.list[state.devices.activeDevice];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-start to-background-end">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-300">Error</h2>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !systemData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background-start to-background-end">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading</h2>
          <p>Fetching system metrics...</p>
        </div>
      </div>
    );
  }

  const renderWidget = (widgetId) => {
    if (!state.widgets[widgetId]?.enabled) return null;

    const sectionClassName = isCardView 
      ? 'mb-6'
      : 'p-6 bg-blue-950/20 backdrop-blur-sm rounded-2xl border border-blue-900/30';

    const getWidget = () => {
      // If it's a Proxmox device with a selected node, use ProxmoxMetrics
      if (activeDevice?.type === 'proxmox') {
        if (!state.devices.selectedNode && systemData.nodes) {
          return <ProxmoxNodeSelector nodes={systemData.nodes} />;
        }
        return <ProxmoxMetrics data={systemData} />;
      }

      // For other devices or when no node is selected, use standard widgets
      switch (widgetId) {
        case 'cpu':
          return <CpuMetrics cpuData={systemData.cpu} processes={systemData.processes} />;
        case 'memory':
          return <MemoryMetrics memory={systemData.memory} />;
        case 'network':
          return <NetworkMetrics network={systemData.network} systemData={systemData} />;
        case 'power':
          return <PowerMetrics powerData={systemData.power} />;
        case 'backup':
          return <BackupMetrics backupData={systemData.backup} />;
        case 'updates':
          return <UpdateMetrics updateData={systemData.updates} />;
        case 'storage':
          return (
            <StorageHealthMetrics 
              storageData={{
                nvme: systemData.storage?.find(s => s.fs.includes('nvme')) || {},
                ssd: systemData.storage?.find(s => s.fs.includes('sd')) || {},
                io: systemData.io,
                smartInfo: systemData.smartInfo || []
              }} 
            />
          );
        case 'security':
          return <SecurityMetrics securityData={systemData.security} />;
        default:
          return null;
      }
    };

    return (
      <DashboardLayout.Section key={`widget-${widgetId}`} className={sectionClassName}>
        {getWidget()}
      </DashboardLayout.Section>
    );
  };

  if (!isCardView) {
    return (
      <DashboardLayout
        systemData={systemData}
        showSidebar={state.showSidebar}
        sidebarContent={<SettingsPanel onClose={toggleSidebar} />}
        onSettingsClick={toggleSidebar}
      >
        <DashboardLayout.Container className="p-8">
          <div className="grid grid-cols-12 gap-6 max-w-[2000px] mx-auto">
            {/* If it's a Proxmox device, handle node selection and metrics */}
            {activeDevice?.type === 'proxmox' ? (
              !state.devices.selectedNode && systemData.nodes ? (
                <ProxmoxNodeSelector nodes={systemData.nodes} />
              ) : (
                <ProxmoxMetrics data={systemData} />
              )
            ) : (
              <>
                {/* Main stats section */}
                <div className="col-span-12 xl:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* CPU & Memory Section */}
                    <div className="md:col-span-2 xl:col-span-3">
                      <div className="grid grid-cols-2 gap-6">
                        {renderWidget('cpu')}
                        {renderWidget('memory')}
                      </div>
                    </div>
                    
                    {/* Storage & Network */}
                    <div className="md:col-span-2 xl:col-span-3">
                      <div className="grid grid-cols-2 gap-6">
                        {renderWidget('storage')}
                        {renderWidget('network')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side stats */}
                <div className="col-span-12 xl:col-span-4 space-y-6">
                  {renderWidget('power')}
                  {renderWidget('backup')}
                  {renderWidget('updates')}
                  {renderWidget('security')}
                </div>
              </>
            )}
          </div>
        </DashboardLayout.Container>
      </DashboardLayout>
    );
  }

  // Card view layout
  return (
    <DashboardLayout
      systemData={systemData}
      showSidebar={state.showSidebar}
      sidebarContent={<SettingsPanel onClose={toggleSidebar} />}
      onSettingsClick={toggleSidebar}
    >
      <DashboardLayout.Container>
        <DashboardLayout.Grid className="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {activeDevice?.type === 'proxmox' ? (
            !state.devices.selectedNode && systemData.nodes ? (
              <ProxmoxNodeSelector nodes={systemData.nodes} />
            ) : (
              <ProxmoxMetrics data={systemData} />
            )
          ) : (
            state.layout.sections.map(sectionId => renderWidget(sectionId))
          )}
        </DashboardLayout.Grid>
      </DashboardLayout.Container>
    </DashboardLayout>
  );
};

export default SystemDashboard;
