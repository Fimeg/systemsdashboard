import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { CircuitBoard, Database, HardDrive, Activity } from 'lucide-react';
import { formatBytes } from '../../utils/format';

const MemoryDistribution = ({ memory = {} }) => {
  const categories = [
    { label: 'Used', value: memory.used || 0, color: 'blue' },
    { label: 'Cached', value: memory.cached || 0, color: 'purple' },
    { label: 'Buffers', value: memory.buffers || 0, color: 'green' },
    { label: 'Free', value: memory.free || 0, color: 'gray' }
  ];

  const total = memory.total || 1; // Prevent division by zero
  let accumulated = 0;

  return (
    <div className="mt-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-3 font-medium">Memory Distribution</h3>
      <div className="relative h-4 bg-gray-700 rounded overflow-hidden mb-4">
        {categories.map(({ label, value, color }) => {
          const width = (value / total) * 100;
          const left = (accumulated / total) * 100;
          accumulated += value;
          return (
            <div
              key={`dist-${label}`}
              className={`absolute top-0 h-full bg-${color}-500`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {categories.map(({ label, value, color }) => (
          <div key={`cat-${label}`} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
              <span className="text-gray-400">{label}</span>
            </div>
            <span className={`text-${color}-400`}>{formatBytes(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SwapUsage = ({ memory = {} }) => (
  <div className="mt-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg">
    <h3 className="text-gray-400 mb-3 font-medium">Swap Memory</h3>
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Usage</span>
          <span className="text-purple-400">
            {formatBytes(memory.swap || 0)} / {formatBytes(memory.swapTotal || 0)}
          </span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded"
            style={{ width: `${((memory.swap || 0) / (memory.swapTotal || 1)) * 100}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Free</span>
          <span className="text-green-400">{formatBytes(memory.swapFree || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Used</span>
          <span className="text-purple-400">{formatBytes(memory.swap || 0)}</span>
        </div>
      </div>
    </div>
  </div>
);

const MemoryStatus = ({ memory = {} }) => {
  const usedPercent = ((memory.used || 0) / (memory.total || 1)) * 100;
  const activePercent = ((memory.active || 0) / (memory.total || 1)) * 100;

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
        <h3 className="text-gray-400 mb-2 font-medium">Current Usage</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Used</span>
              <span className="text-blue-400">{usedPercent.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Active</span>
              <span className="text-green-400">{activePercent.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded"
                style={{ width: `${activePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
        <h3 className="text-gray-400 mb-2 font-medium">Overview</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total</span>
            <span className="text-blue-400">{formatBytes(memory.total || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Available</span>
            <span className="text-green-400">{formatBytes(memory.available || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Used</span>
            <span className="text-purple-400">{formatBytes(memory.used || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Free</span>
            <span className="text-gray-400">{formatBytes(memory.free || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MemoryMetrics = ({ memory = {} }) => {
  return (
    <MetricCard
      title="Memory"
      icon={<CircuitBoard className="w-5 h-5" />}
      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20"
    >
      <MemoryStatus memory={memory} />
      <MemoryDistribution memory={memory} />
      <SwapUsage memory={memory} />
    </MetricCard>
  );
};
