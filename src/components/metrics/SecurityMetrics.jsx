import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { FaShieldAlt, FaExclamationTriangle, FaBug } from 'react-icons/fa';
import { BiError } from 'react-icons/bi';
import { RiComputerLine } from 'react-icons/ri';

const SecurityMetrics = ({ securityData = {} }) => {
  // Provide default values for all security data
  const {
    events = [],
    stats = {
      critical: 0,
      errors: 0,
      warnings: 0
    },
    sources = {
      system: 0,
      network: 0,
      hardware: 0
    },
    recentEvents = []
  } = securityData || {};

  return (
    <MetricCard title="Security & System Events" icon={<FaShieldAlt className="text-conky-purple" />}>
      <div className="grid grid-cols-2 gap-4">
        {/* Security Events */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-purple">
            <FaShieldAlt />
            <span>Last 24h Events: {events.length}</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm">
              <span className="text-conky-red">•</span> Critical: {stats.critical}
            </p>
            <p className="text-sm">
              <span className="text-conky-pink">•</span> Errors: {stats.errors}
            </p>
            <p className="text-sm">
              <span className="text-conky-green">•</span> Warnings: {stats.warnings}
            </p>
          </div>
        </div>

        {/* Error Sources */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-conky-pink">
            <BiError />
            <span>Error Sources</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm">
              <span className="text-conky-pink">•</span> System: {sources.system}
            </p>
            <p className="text-sm">
              <span className="text-conky-pink">•</span> Network: {sources.network}
            </p>
            <p className="text-sm">
              <span className="text-conky-pink">•</span> Hardware: {sources.hardware}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-conky-pink">
          <FaExclamationTriangle />
          <span>Recent Events</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {recentEvents.map((event, index) => (
            <div key={index} className="pl-6 text-sm flex items-start gap-2">
              {event.severity === 'CRIT' && (
                <span className="text-conky-red mt-1">•</span>
              )}
              {event.severity === 'ERR' && (
                <span className="text-conky-pink mt-1">•</span>
              )}
              {event.severity === 'WARN' && (
                <span className="text-conky-green mt-1">•</span>
              )}
              <div>
                <span className="text-conky-blue">{event.severity}</span>
                <span className="mx-2 text-conky-pink">{event.service}</span>
                <span>{event.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiComputerLine className="text-conky-purple" />
          <span className="text-sm">System Status</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${stats.critical > 0 ? 'bg-conky-red' : 'bg-conky-green'}`} />
            <span className="text-sm">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${stats.errors > 0 ? 'bg-conky-pink' : 'bg-conky-green'}`} />
            <span className="text-sm">Errors</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${stats.warnings > 0 ? 'bg-conky-orange' : 'bg-conky-green'}`} />
            <span className="text-sm">Warnings</span>
          </div>
        </div>
      </div>
    </MetricCard>
  );
};

export default SecurityMetrics;
