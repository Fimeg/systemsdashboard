import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { FaHdd, FaChartLine } from 'react-icons/fa';
import { BiMemoryCard } from 'react-icons/bi';

const StorageHealthMetrics = ({ storageData }) => {
  const {
    nvme = {},
    ssd = {},
    io = {},
    smartInfo = []
  } = storageData;

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <MetricCard title="Storage Health" icon={<FaHdd className="text-conky-green" />}>
      <div className="grid grid-cols-2 gap-4">
        {/* NVMe Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-green">
            <BiMemoryCard />
            <span>NVMe ({nvme.device || '/dev/nvme0n1'})</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm">
              <span className="text-conky-green">•</span> Model: {nvme.model || 'N/A'}
            </p>
            <p className="text-sm">
              <span className="text-conky-green">•</span> Used Space: {nvme.usedPercent || 0}% ({formatBytes(nvme.used || 0)})
            </p>
            <p className="text-sm">
              <span className="text-conky-green">•</span> I/O Stats:
            </p>
            <div className="pl-4">
              <p className="text-sm">
                <span className="text-conky-green">◦</span> Read: {formatBytes(io.nvmeRead || 0)}/s
              </p>
              <p className="text-sm">
                <span className="text-conky-green">◦</span> Write: {formatBytes(io.nvmeWrite || 0)}/s
              </p>
            </div>
          </div>
        </div>

        {/* SSD Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-green">
            <FaHdd />
            <span>SSD ({ssd.device || '/dev/sda'})</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm">
              <span className="text-conky-green">•</span> Model: {ssd.model || 'N/A'}
            </p>
            <p className="text-sm">
              <span className="text-conky-green">•</span> Used Space: {ssd.usedPercent || 0}% ({formatBytes(ssd.used || 0)})
            </p>
            <p className="text-sm">
              <span className="text-conky-green">•</span> I/O Stats:
            </p>
            <div className="pl-4">
              <p className="text-sm">
                <span className="text-conky-green">◦</span> Read: {formatBytes(io.ssdRead || 0)}/s
              </p>
              <p className="text-sm">
                <span className="text-conky-green">◦</span> Write: {formatBytes(io.ssdWrite || 0)}/s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* I/O Activity Graphs */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-conky-green">
          <FaChartLine />
          <span>Total I/O Activity</span>
        </div>
        
        {/* Read/Write Activity Bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm w-16">Read:</span>
            <div className="flex-1 h-2 bg-conky-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-conky-green transition-all duration-300 ease-in-out"
                style={{ width: `${Math.min((io.totalRead || 0) / (io.maxIO || 1) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm w-24 text-right">{formatBytes(io.totalRead || 0)}/s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm w-16">Write:</span>
            <div className="flex-1 h-2 bg-conky-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-conky-green transition-all duration-300 ease-in-out"
                style={{ width: `${Math.min((io.totalWrite || 0) / (io.maxIO || 1) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm w-24 text-right">{formatBytes(io.totalWrite || 0)}/s</span>
          </div>
        </div>
      </div>

      {/* SMART Information */}
      {smartInfo.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-conky-green">
            <FaHdd />
            <span>SMART Status</span>
          </div>
          <div className="pl-6 space-y-1">
            {smartInfo.map((info, index) => (
              <p key={index} className="text-sm">
                <span className="text-conky-green">•</span> {info.attribute}: {info.value}
              </p>
            ))}
          </div>
        </div>
      )}
    </MetricCard>
  );
};

export default StorageHealthMetrics;
