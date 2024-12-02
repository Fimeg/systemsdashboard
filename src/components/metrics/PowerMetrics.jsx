import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { FaBatteryThreeQuarters, FaMicrochip } from 'react-icons/fa';
import { BsLightningCharge } from 'react-icons/bs';

const PowerMetrics = ({ powerData }) => {
  // Add default values for when powerData is null/undefined
  const {
    cpuGovernor = 'N/A',
    tdpCurrent = 0,
    batteryTime = 'N/A',
    powerDraw = 0,
    batteryCapacity = 0,
    batteryPercentage = 0,
  } = powerData || {};

  const getBatteryColor = (percentage) => {
    if (!percentage || percentage <= 20) return 'text-conky-red';
    if (percentage <= 50) return 'text-conky-orange';
    return 'text-conky-green';
  };

  const batteryColorClass = getBatteryColor(batteryPercentage);

  return (
    <MetricCard title="Power Management" icon={<BsLightningCharge className="text-conky-blue" />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* CPU Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-conky-blue">
              <FaMicrochip />
              <span>CPU Settings</span>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-sm">
                <span className="text-conky-blue">•</span> Governor: {cpuGovernor}
              </p>
              <p className="text-sm">
                <span className="text-conky-blue">•</span> TDP Current: {tdpCurrent}W
              </p>
            </div>
          </div>

          {/* Battery Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-conky-blue">
              <FaBatteryThreeQuarters />
              <span>Battery Status</span>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-sm">
                <span className="text-conky-blue">•</span> Time Remaining: {batteryTime}
              </p>
              <p className="text-sm">
                <span className="text-conky-blue">•</span> Power Draw: {powerDraw}W
              </p>
              <p className="text-sm">
                <span className="text-conky-blue">•</span> Capacity: {batteryCapacity}Wh
              </p>
            </div>
          </div>
        </div>

        {/* Battery Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FaBatteryThreeQuarters className={batteryColorClass} />
            <span className={`${batteryColorClass} font-medium`}>
              Battery Status: {batteryPercentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-conky-dark-bg rounded-full overflow-hidden">
            <div
              className={`h-full ${batteryColorClass} bg-current transition-all duration-300 ease-in-out`}
              style={{ width: `${Math.max(0, Math.min(100, batteryPercentage))}%` }}
            />
          </div>
        </div>
      </div>
    </MetricCard>
  );
};

export default PowerMetrics;
