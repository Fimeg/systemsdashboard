const express = require('express');
const si = require('systeminformation');
const cors = require('cors');
const os = require('os');
const { exec } = require('child_process');
const dns = require('dns').promises;
const fs = require('fs').promises;
const path = require('path');
const { getSecurityMetrics } = require('./services/securityService');
const deviceService = require('./services/deviceService');

const app = express();
app.use(cors());
app.use(express.json());

// Cache for system metrics
let metricsCache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 2000; // 2 seconds cache

// Helper function to execute shell commands with timeout
const execCommand = (cmd, timeout = 1000) => {
  return new Promise((resolve) => {
    const child = exec(cmd, { timeout }, (error, stdout, stderr) => {
      if (error) resolve('');
      resolve(stdout.trim());
    });
    
    // Ensure process is killed if it takes too long
    setTimeout(() => {
      try {
        child.kill();
      } catch (e) {
        console.error('Error killing process:', e);
      }
    }, timeout);
  });
};

// Helper function to get CPU governor and TDP with caching
const cpuPowerCache = {
  data: null,
  timestamp: 0
};

const getCpuPowerInfo = async () => {
  const now = Date.now();
  if (cpuPowerCache.data && (now - cpuPowerCache.timestamp) < 5000) {
    return cpuPowerCache.data;
  }

  try {
    const [governor, tdp] = await Promise.all([
      execCommand('cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor'),
      execCommand('cat /sys/class/powercap/intel-rapl/intel-rapl:0/constraint_0_power_limit_uw')
    ]);

    const data = {
      cpuGovernor: governor || 'unknown',
      tdpCurrent: tdp ? (parseInt(tdp) / 1000000).toFixed(1) : '0'
    };

    cpuPowerCache.data = data;
    cpuPowerCache.timestamp = now;
    return data;
  } catch (error) {
    console.error('Error getting CPU power info:', error);
    return {
      cpuGovernor: 'unknown',
      tdpCurrent: '0'
    };
  }
};

// Helper function to check connection health
const checkConnection = async (host) => {
  try {
    const startTime = process.hrtime();
    await dns.resolve4(host);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return Math.round((seconds * 1000) + (nanoseconds / 1000000));
  } catch (error) {
    return -1;
  }
};

// Helper function to extract credentials from authorization header
const extractCredentials = (authHeader) => {
  if (!authHeader) return null;

  try {
    // Handle API Token
    const tokenMatch = authHeader.match(/PVEAPIToken=([^=]+)=(.+)/);
    if (tokenMatch) {
      return {
        tokenId: tokenMatch[1],
        tokenSecret: tokenMatch[2]
      };
    }

    // Handle Basic Auth
    if (authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const [username, password] = Buffer.from(base64Credentials, 'base64')
        .toString('utf-8')
        .split(':');
      return {
        username,
        password,
        realm: 'pam'  // Default to PAM realm
      };
    }
  } catch (error) {
    console.error('Error extracting credentials:', error);
  }
  return null;
};

// Device management endpoints
app.post('/devices', async (req, res) => {
  try {
    const deviceConfig = req.body;
    const credentials = extractCredentials(req.headers.authorization);
    if (credentials) {
      deviceConfig.credentials = credentials;
    }

    if (deviceConfig.test) {
      await deviceService.getMetrics(deviceConfig);
      res.json({ 
        success: true, 
        message: 'Device connection successful',
        device: {
          id: deviceConfig.id || `${deviceConfig.type}-${Date.now()}`,
          name: deviceConfig.name,
          type: deviceConfig.type,
          address: deviceConfig.address
        }
      });
    } else {
      const metrics = await deviceService.getMetrics(deviceConfig);
      res.json({ 
        success: true,
        message: 'Device added successfully',
        device: {
          id: deviceConfig.id || `${deviceConfig.type}-${Date.now()}`,
          name: deviceConfig.name,
          type: deviceConfig.type,
          address: deviceConfig.address
        },
        metrics
      });
    }
  } catch (error) {
    console.error('Device connection error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to connect to device'
    });
  }
});

app.get('/devices/:deviceId/metrics', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type, node, address, ...otherParams } = req.query;
    
    const deviceConfig = {
      id: deviceId,
      type,
      node,
      address,
      ...otherParams
    };

    const credentials = extractCredentials(req.headers.authorization);
    if (credentials) {
      deviceConfig.credentials = credentials;
    } else if (type === 'proxmox') {
      throw new Error('Authentication required for Proxmox devices');
    }

    const metrics = await deviceService.getMetrics(deviceConfig);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching device metrics:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch device metrics'
    });
  }
});

// Optimized system metrics collection with caching
const collectSystemMetrics = async () => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (metricsCache.data && (now - metricsCache.timestamp) < CACHE_DURATION) {
    return metricsCache.data;
  }

  try {
    const [
      cpu,
      temp,
      mem,
      fsSize,
      networkStats,
      processes,
      battery,
      diskIO,
      currentLoad,
      cpuPowerInfo
    ] = await Promise.all([
      si.cpu(),
      si.cpuTemperature(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.processes(),
      si.battery(),
      si.disksIO(),
      si.currentLoad(),
      getCpuPowerInfo()
    ]);

    // Get system uptime
    const uptime = os.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    // Get network interfaces
    const networkInterfaces = os.networkInterfaces();
    const mainInterface = Object.keys(networkInterfaces).find(iface => 
      networkInterfaces[iface].some(addr => !addr.internal && addr.family === 'IPv4')
    );
    const ipAddress = mainInterface ? 
      networkInterfaces[mainInterface].find(addr => !addr.internal && addr.family === 'IPv4').address : 
      'Unknown';

    // Calculate battery time remaining in human-readable format
    const formatBatteryTime = (minutes) => {
      if (!minutes || minutes <= 0) return 'Unknown';
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hrs}h ${mins}m`;
    };

    const metrics = {
      time: {
        current: now,
        uptime: `${hours}h ${minutes}m`
      },
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speedMin: cpu.speedMin,
        speedMax: cpu.speedMax,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        usage: currentLoad.currentLoad.toFixed(1),
        temp: temp.main || temp.cores[0],
        coreLoads: currentLoad.cpus.map(core => ({
          load: core.load.toFixed(1),
          temp: temp.cores[currentLoad.cpus.indexOf(core)]
        })),
        frequency: cpu.speed
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        swap: mem.swapused,
        swapTotal: mem.swaptotal,
        swapFree: mem.swapfree,
        buffers: mem.buffers,
        cached: mem.cached,
        available: mem.available,
        active: mem.active,
        slab: mem.slab
      },
      storage: fsSize.map(fs => ({
        fs: fs.fs,
        type: fs.type,
        size: fs.size,
        used: fs.used,
        available: fs.available,
        mount: fs.mount,
        usePercent: fs.use
      })),
      io: {
        read: diskIO.rIO,
        write: diskIO.wIO,
        tIO: diskIO.tIO,
        readSpeed: diskIO.rIO_sec,
        writeSpeed: diskIO.wIO_sec,
        iops: diskIO.tIO_sec
      },
      network: {
        interfaces: networkStats.map(iface => ({
          iface: iface.iface,
          operstate: iface.operstate,
          rx_bytes: iface.rx_bytes,
          tx_bytes: iface.tx_bytes,
          rx_sec: iface.rx_sec,
          tx_sec: iface.tx_sec,
          rx_dropped: iface.rx_dropped,
          tx_dropped: iface.tx_dropped,
          rx_errors: iface.rx_errors,
          tx_errors: iface.tx_errors
        })),
        primaryInterface: mainInterface,
        ipAddress: ipAddress
      },
      processes: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
        list: processes.list.slice(0, 10).map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: p.cpu,
          mem: p.mem,
          command: p.command,
          user: p.user,
          state: p.state
        })).sort((a, b) => b.cpu - a.cpu)
      },
      power: {
        ...cpuPowerInfo,
        charging: battery.isCharging,
        batteryTime: formatBatteryTime(battery.timeRemaining),
        powerDraw: (battery.voltage * battery.current / 1000000).toFixed(2),
        batteryCapacity: (battery.designedCapacity / 1000000).toFixed(2),
        batteryPercentage: battery.percent,
        acConnected: battery.acConnected,
        type: battery.type,
        model: battery.model,
        manufacturer: battery.manufacturer
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        distro: os.type(),
        loadavg: os.loadavg()
      }
    };

    // Update cache
    metricsCache = {
      data: metrics,
      timestamp: now
    };

    return metrics;
  } catch (error) {
    console.error('Error collecting system metrics:', error);
    throw error;
  }
};

// Endpoint to fetch all system metrics
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await collectSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
