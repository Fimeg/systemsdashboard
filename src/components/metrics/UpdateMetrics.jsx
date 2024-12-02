import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { FaBox } from 'react-icons/fa';
import { BiPackage } from 'react-icons/bi';
import { BsClockHistory } from 'react-icons/bs';

const UpdateMetrics = ({ updateData = {} }) => {
  const {
    systemUpdates = [],
    flatpakUpdates = [],
    lastCheck = 'Never',
    heldPackages = 0
  } = updateData || {};

  return (
    <MetricCard title="System Updates" icon={<BiPackage className="text-conky-blue" />}>
      <div className="grid grid-cols-2 gap-4">
        {/* System Updates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-blue">
            <FaBox />
            <span>Available: {systemUpdates.length}</span>
          </div>
          <div className="pl-6 space-y-1 max-h-40 overflow-y-auto">
            {systemUpdates.length > 0 ? (
              systemUpdates.slice(0, 5).map((update, index) => (
                <p key={index} className="text-sm">
                  <span className="text-conky-blue">•</span>{' '}
                  <span className="text-white">{update?.package || 'Unknown'}</span>{' '}
                  <span className="text-conky-pink">{update?.version || 'N/A'}</span>{' '}
                  <span className="text-conky-blue">({update?.repo || 'unknown'})</span>
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-400">No system updates available</p>
            )}
          </div>
        </div>

        {/* Flatpak Updates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-blue">
            <BiPackage />
            <span>Flatpak: {flatpakUpdates.length}</span>
          </div>
          <div className="pl-6 space-y-1 max-h-40 overflow-y-auto">
            {flatpakUpdates.length > 0 ? (
              flatpakUpdates.slice(0, 5).map((update, index) => (
                <p key={index} className="text-sm">
                  <span className="text-conky-blue">•</span>{' '}
                  <span className="text-white">{update?.name || 'Unknown'}</span>{' '}
                  <span className="text-conky-pink">{update?.version || 'N/A'}</span>
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-400">No Flatpak updates available</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <BsClockHistory className="text-conky-blue" />
          <span>Last Check: {lastCheck}</span>
        </div>
        <div className="flex items-center gap-2">
          <BiPackage className="text-conky-purple" />
          <span>Held Packages: {heldPackages}</span>
        </div>
      </div>
    </MetricCard>
  );
};

export default UpdateMetrics;
