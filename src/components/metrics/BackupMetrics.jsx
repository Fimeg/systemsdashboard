import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { FaDatabase, FaSync } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';

const BackupMetrics = ({ backupData = {} }) => {
  const {
    timeshiftLastBackup = 'No backups',
    timeshiftTotalSnapshots = 0,
    timeshiftBackupSpace = 'N/A',
    rsyncStatus = 'inactive',
    rsyncActiveSyncs = [],
  } = backupData || {};

  return (
    <MetricCard title="Backup Status" icon={<FaDatabase className="text-conky-blue" />}>
      <div className="space-y-4">
        {/* TimeShift Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-blue">
            <BiTime />
            <span>TimeShift</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm">
              <span className="text-conky-blue">•</span> Last Backup: {timeshiftLastBackup}
            </p>
            <p className="text-sm">
              <span className="text-conky-blue">•</span> Total Snapshots: {timeshiftTotalSnapshots}
            </p>
            <p className="text-sm">
              <span className="text-conky-blue">•</span> Backup Space: {timeshiftBackupSpace}
            </p>
          </div>
        </div>

        {/* Rsync Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-blue">
            <FaSync />
            <span>Rsync Status</span>
          </div>
          <div className="pl-6">
            {rsyncActiveSyncs.length > 0 ? (
              rsyncActiveSyncs.map((sync, index) => (
                <p key={index} className="text-sm">
                  <span className="text-conky-blue">•</span> Active: {sync}
                </p>
              ))
            ) : (
              <p className="text-sm">
                <span className="text-conky-blue">•</span> No active syncs
              </p>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${rsyncStatus === 'active' ? 'bg-conky-green' : 'bg-conky-blue'}`} />
          <span className="text-sm">
            {rsyncStatus === 'active' ? 'Sync in Progress' : 'System Up to Date'}
          </span>
        </div>
      </div>
    </MetricCard>
  );
};

export default BackupMetrics;
