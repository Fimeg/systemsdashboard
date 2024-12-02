import React, { useState, useEffect } from 'react';
import { MetricCard } from '../ui/MetricCard';
import { Network, Activity, Wifi, Signal, Download, Upload, Globe, Zap } from 'lucide-react';
import { formatBytes, formatSpeed } from '../../utils/format';

const NetworkGraph = ({ data = [], color, height = 40 }) => {
  // Ensure data is an array and contains only valid numbers
  const validData = data.map(val => typeof val === 'number' && !isNaN(val) ? val : 0);
  const max = Math.max(...validData, 1); // Ensure max is at least 1 to avoid division by zero

  // Only create points if we have valid data
  const points = validData.length > 1 
    ? validData.map((value, i) => [
        (i / (validData.length - 1)) * 100,
        ((max - value) / max) * height
      ])
    : [[0, height], [100, height]]; // Default flat line if no valid data

  // Create SVG path
  const path = `M 0,${height} ` +
    points.map(([x, y]) => `L ${x},${y}`).join(' ') +
    ` L 100,${height} Z`;

  return (
    <div className="relative w-full h-10">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 100 ${height}`}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={`rgb(var(--${color}-500))`} stopOpacity="0.2" />
            <stop offset="100%" stopColor={`rgb(var(--${color}-500))`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill={`url(#gradient-${color})`}
          stroke={`rgb(var(--${color}-500))`}
          strokeWidth="2"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
};

const ConnectionHealth = ({ network = {} }) => {
  const { connectionHealth = {}, primaryInterface = 'N/A', ipAddress = 'N/A' } = network;
  const { google = 0, cloudflare = 0 } = connectionHealth;

  return (
    <div className="mt-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-3 font-medium flex items-center">
        <Signal className="w-4 h-4 mr-2" />
        Connection Health
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Google DNS</span>
            <span className={`flex items-center ${
              google < 50 ? 'text-green-400' :
              google < 100 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              <Zap className="w-4 h-4 mr-1" />
              {google}ms
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Cloudflare</span>
            <span className={`flex items-center ${
              cloudflare < 50 ? 'text-green-400' :
              cloudflare < 100 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              <Zap className="w-4 h-4 mr-1" />
              {cloudflare}ms
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Interface</span>
            <span className="text-blue-400">{primaryInterface}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">IP Address</span>
            <span className="text-blue-400">{ipAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NetworkActivity = ({ network = {} }) => {
  const [downloadHistory, setDownloadHistory] = useState([0]);
  const [uploadHistory, setUploadHistory] = useState([0]);
  const maxDataPoints = 30;
  const interfaces = network.interfaces || [];
  const primaryInterface = interfaces[0] || {};

  useEffect(() => {
    if (interfaces[0]) {
      const rxSec = typeof primaryInterface.rx_sec === 'number' ? primaryInterface.rx_sec : 0;
      const txSec = typeof primaryInterface.tx_sec === 'number' ? primaryInterface.tx_sec : 0;
      
      setDownloadHistory(prev => [...prev.slice(-maxDataPoints + 1), rxSec]);
      setUploadHistory(prev => [...prev.slice(-maxDataPoints + 1), txSec]);
    }
  }, [primaryInterface]);

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Download className="w-4 h-4 mr-2 text-green-400" />
            <span className="text-gray-400">Download</span>
          </div>
          <span className="text-green-400">{formatSpeed(primaryInterface.rx_sec || 0)}</span>
        </div>
        <NetworkGraph data={downloadHistory} color="green" />
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-gray-400">Total: {formatBytes(primaryInterface.rx_bytes || 0)}</span>
          <span className="text-gray-400">Dropped: {primaryInterface.rx_dropped || 0}</span>
        </div>
      </div>

      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Upload className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-gray-400">Upload</span>
          </div>
          <span className="text-blue-400">{formatSpeed(primaryInterface.tx_sec || 0)}</span>
        </div>
        <NetworkGraph data={uploadHistory} color="blue" />
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-gray-400">Total: {formatBytes(primaryInterface.tx_bytes || 0)}</span>
          <span className="text-gray-400">Dropped: {primaryInterface.tx_dropped || 0}</span>
        </div>
      </div>
    </div>
  );
};

const ConnectionsList = ({ network = {} }) => {
  const connections = network.connections || [];

  return (
    <div className="mt-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-3 font-medium flex items-center">
        <Globe className="w-4 h-4 mr-2" />
        Active Connections
      </h3>
      <div className="space-y-2">
        {connections.length > 0 ? (
          connections.slice(0, 5).map((conn, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">{conn.process || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-blue-400">{conn.localPort}</span>
                <span className="text-purple-400">{conn.state}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">No active connections</div>
        )}
      </div>
    </div>
  );
};

export const NetworkMetrics = ({ network = {} }) => {
  return (
    <MetricCard
      title="Network"
      icon={<Network className="w-5 h-5" />}
      className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20"
    >
      <ConnectionHealth network={network} />
      <NetworkActivity network={network} />
      <ConnectionsList network={network} />
    </MetricCard>
  );
};
