import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  fetchSystemData, 
  fetchDeviceMetrics, 
  fetchDockerStats, 
  fetchProxmoxStats,
  fetchLXCStats,
  fetchVMStats
} from '../api/systemApi';
import { useDashboard } from '../contexts/DashboardContext';

const MIN_INTERVAL = 2000; // Minimum 2 seconds between requests
const MAX_RETRIES = 3; // Maximum number of retry attempts

export const useSystemData = (interval = 2000) => {
  const [systemData, setSystemData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state, setDeviceError } = useDashboard();
  const activeDevice = state.devices.list[state.devices.activeDevice];
  const selectedNode = state.devices.selectedNode;
  const lastUpdateRef = useRef(0);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef(null);
  const updateInProgressRef = useRef(false);
  const lastErrorRef = useRef(null);

  // Ensure minimum interval
  const safeInterval = Math.max(interval, MIN_INTERVAL);

  const updateData = useCallback(async () => {
    // Prevent concurrent updates
    if (updateInProgressRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Skip update if not enough time has passed
    if (timeSinceLastUpdate < safeInterval) {
      return;
    }

    // For Proxmox devices, don't fetch data until a node is selected
    if (activeDevice?.type === 'proxmox' && !selectedNode) {
      // Set initial state for Proxmox without node selection
      setSystemData({
        type: 'proxmox',
        time: {
          current: new Date().getTime(),
          uptime: 'N/A'
        },
        system: {
          hostname: activeDevice.name,
          type: activeDevice.type,
          address: activeDevice.address
        }
      });
      setLoading(false);
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    updateInProgressRef.current = true;

    try {
      let data;
      
      if (!activeDevice || activeDevice.id === 'local') {
        data = await fetchSystemData();
      } else {
        if (!activeDevice.address) {
          throw new Error('Device address is not configured');
        }

        const deviceConfig = {
          id: activeDevice.id,
          type: activeDevice.type,
          address: activeDevice.address,
          selectedNode
        };

        switch (activeDevice.type) {
          case 'docker':
            data = await fetchDockerStats(activeDevice.id);
            break;
          case 'proxmox':
            data = await fetchProxmoxStats(activeDevice.id, selectedNode);
            // Handle initial node list fetch
            if (!selectedNode && data.nodes) {
              data = {
                type: 'proxmox',
                nodes: data.nodes,
                resources: data.resources,
                time: {
                  current: new Date().getTime(),
                  uptime: 'N/A'
                },
                system: {
                  hostname: activeDevice.name,
                  type: activeDevice.type,
                  address: activeDevice.address
                }
              };
            }
            break;
          case 'lxc':
            data = await fetchLXCStats(activeDevice.id);
            break;
          case 'vm':
            data = await fetchVMStats(activeDevice.id);
            break;
          default:
            data = await fetchDeviceMetrics(activeDevice.id, deviceConfig);
        }

        if (data && !data.nodes) {
          data = {
            ...data,
            time: {
              current: new Date().getTime(),
              uptime: data.uptime || 'N/A'
            },
            system: {
              hostname: activeDevice.name,
              type: activeDevice.type,
              address: activeDevice.address,
              node: selectedNode,
              ...data.system
            }
          };
        }
      }

      setSystemData(data);
      setError(null);
      // Only update device error if there was a previous error
      if (lastErrorRef.current !== null) {
        setDeviceError(null);
        lastErrorRef.current = null;
      }
      setLoading(false);
      lastUpdateRef.current = Date.now();
      retryCountRef.current = 0;
    } catch (err) {
      console.error('Error fetching system data:', err);
      const errorMessage = err.message;
      
      // Don't show errors for Proxmox devices without node selection
      if (!(activeDevice?.type === 'proxmox' && !selectedNode)) {
        setError(errorMessage);
        // Only update device error if it's different from the last error
        if (lastErrorRef.current !== errorMessage) {
          setDeviceError(errorMessage);
          lastErrorRef.current = errorMessage;
        }
      }
      
      setLoading(false);

      // Increment retry count for resource errors
      if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
        retryCountRef.current += 1;
      }
    } finally {
      updateInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  }, [activeDevice, selectedNode, safeInterval, setDeviceError]);

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    // Reset state when device or node changes
    setSystemData(null);
    setError(null);
    if (lastErrorRef.current !== null) {
      setDeviceError(null);
      lastErrorRef.current = null;
    }
    setLoading(true);
    lastUpdateRef.current = 0;
    retryCountRef.current = 0;
    updateInProgressRef.current = false;

    // Initial fetch with delay to prevent request flood
    const initialFetchTimeout = setTimeout(() => {
      if (isMounted) {
        updateData();
      }
    }, 500);

    // Only set up interval if:
    // 1. We have a valid device configuration
    // 2. Haven't exceeded retry attempts
    // 3. For Proxmox, we either have a selected node or we're fetching the initial node list
    if (activeDevice && 
        (activeDevice.id === 'local' || activeDevice.address) &&
        retryCountRef.current < MAX_RETRIES &&
        (activeDevice.type !== 'proxmox' || selectedNode)) {
      intervalId = setInterval(() => {
        if (isMounted && !updateInProgressRef.current) {
          updateData();
        }
      }, safeInterval);
    }

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(initialFetchTimeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      updateInProgressRef.current = false;
    };
  }, [updateData, activeDevice, selectedNode, safeInterval]);

  return { systemData, error, loading };
};

export const useNetworkHistory = (systemData, maxDataPoints = 100) => {
  const [networkHistory, setNetworkHistory] = useState({ up: [], down: [] });

  useEffect(() => {
    if (systemData?.network) {
      const networkData = Array.isArray(systemData.network.interfaces) 
        ? systemData.network.interfaces.reduce((acc, iface) => ({
            up: acc.up + (iface.tx_sec || 0),
            down: acc.down + (iface.rx_sec || 0)
          }), { up: 0, down: 0 })
        : { up: 0, down: 0 };

      setNetworkHistory(prev => ({
        up: [...prev.up.slice(-maxDataPoints + 1), networkData.up],
        down: [...prev.down.slice(-maxDataPoints + 1), networkData.down]
      }));
    }
  }, [systemData, maxDataPoints]);

  return networkHistory;
};

export const useMetricHistory = (value, maxDataPoints = 100) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (value !== undefined) {
      setHistory(prev => [...prev.slice(-maxDataPoints + 1), value]);
    }
  }, [value, maxDataPoints]);

  return history;
};

export const useDeviceData = (deviceId, type) => {
  const [deviceData, setDeviceData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state, setDeviceError } = useDashboard();
  const selectedNode = state.devices.selectedNode;
  const lastUpdateRef = useRef(0);
  const lastErrorRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      if (timeSinceLastUpdate < MIN_INTERVAL) {
        return;
      }

      // Don't fetch for Proxmox without node selection
      if (type === 'proxmox' && !selectedNode) {
        setLoading(false);
        return;
      }

      try {
        let data;
        const device = state.devices.list[deviceId];
        if (!device) {
          throw new Error('Device not found');
        }

        const deviceConfig = {
          id: deviceId,
          type,
          address: device.address,
          selectedNode
        };

        switch (type) {
          case 'docker':
            data = await fetchDockerStats(deviceId);
            break;
          case 'proxmox':
            data = await fetchProxmoxStats(deviceId, selectedNode);
            break;
          case 'lxc':
            data = await fetchLXCStats(deviceId);
            break;
          case 'vm':
            data = await fetchVMStats(deviceId);
            break;
          default:
            data = await fetchDeviceMetrics(deviceId, deviceConfig);
        }

        if (isMounted) {
          setDeviceData(data);
          setError(null);
          if (lastErrorRef.current !== null) {
            setDeviceError(null);
            lastErrorRef.current = null;
          }
          setLoading(false);
          lastUpdateRef.current = now;
        }
      } catch (err) {
        console.error('Error fetching device data:', err);
        if (isMounted) {
          const errorMessage = err.message;
          setError(errorMessage);
          if (lastErrorRef.current !== errorMessage) {
            setDeviceError(errorMessage);
            lastErrorRef.current = errorMessage;
          }
          setLoading(false);
        }
      }
    };

    // Initial fetch with delay
    const initialFetchTimeout = setTimeout(() => {
      if (isMounted) {
        fetchData();
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(initialFetchTimeout);
    };
  }, [deviceId, type, selectedNode, setDeviceError, state.devices.list]);

  return { deviceData, error, loading };
};
