import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { Cpu, Thermometer, Activity, Layers } from 'lucide-react';

const CoreStats = ({ coreLoads = [] }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
    {coreLoads.map((core, index) => (
      <div key={`core-${index}`} className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Core {index + 1}</span>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400">{core?.load || 0}%</span>
          </div>
        </div>
        <div className="relative h-2 bg-gray-700 rounded">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded"
            style={{ width: `${core?.load || 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Thermometer className="w-4 h-4 text-red-400" />
          <span className="text-red-400">{core?.temp || 0}°C</span>
        </div>
      </div>
    ))}
  </div>
);

const ProcessList = ({ processes = { list: [] } }) => (
  <div className="mt-4">
    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
      <h3 className="text-gray-400 mb-3 font-medium">Top Processes</h3>
      <div className="space-y-3">
        {(processes.list || []).slice(0, 5).map((process, index) => (
          <div key={`process-${index}`} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">{process?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400">{(process?.cpu || 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">{(process?.mem || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CpuInfo = ({ cpuData = {} }) => (
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-2 font-medium">Specifications</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Model</span>
          <span className="text-blue-400">{cpuData.brand || 'Unknown'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Cores</span>
          <span className="text-blue-400">{cpuData.cores || 0} ({cpuData.physicalCores || 0} physical)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Base Speed</span>
          <span className="text-blue-400">{cpuData.speedMin || 0} GHz</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Max Speed</span>
          <span className="text-blue-400">{cpuData.speedMax || 0} GHz</span>
        </div>
      </div>
    </div>
    <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-2 font-medium">Current Status</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Usage</span>
            <span className="text-blue-400">{cpuData.usage || 0}%</span>
          </div>
          <div className="relative h-2 bg-gray-700 rounded">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded"
              style={{ width: `${cpuData.usage || 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Temperature</span>
            <span className={`text-${(cpuData.temp || 0) > 80 ? 'red' : (cpuData.temp || 0) > 60 ? 'yellow' : 'green'}-400`}>
              {cpuData.temp || 0}°C
            </span>
          </div>
          <div className="relative h-2 bg-gray-700 rounded">
            <div
              className={`absolute top-0 left-0 h-full rounded ${
                (cpuData.temp || 0) > 80 ? 'bg-red-500' : (cpuData.temp || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${((cpuData.temp || 0) / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const CpuMetrics = ({ cpuData = {}, processes = { list: [] } }) => {
  return (
    <MetricCard
      title="CPU"
      icon={<Layers className="w-5 h-5" />}
      className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20"
    >
      <CpuInfo cpuData={cpuData} />
      <CoreStats coreLoads={cpuData.coreLoads || []} />
      <ProcessList processes={processes} />
    </MetricCard>
  );
};
