const { exec } = require('child_process');
const si = require('systeminformation');
const https = require('https');
const axios = require('axios');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DeviceService {
  constructor() {
    this.devices = new Map();
    this.clients = new Map();
  }

  validateConfig(config) {
    if (!config) {
      throw new Error('Device configuration is required');
    }

    if (!config.type) {
      throw new Error('Device type is required');
    }

    if (!config.address && config.type !== 'host') {
      throw new Error('Device address is required');
    }

    if (config.type === 'proxmox') {
      if (!config.credentials) {
        throw new Error('Proxmox credentials are required');
      }

      if (!config.credentials.tokenId && !config.credentials.username) {
        throw new Error('Either API token or username/password is required');
      }

      if (config.credentials.tokenId && !config.credentials.tokenSecret) {
        throw new Error('Token secret is required when using API token');
      }

      if (config.credentials.username && !config.credentials.password) {
        throw new Error('Password is required when using username authentication');
      }

      // Ensure the address has the correct protocol
      config.address = config.address.startsWith('http') ? 
        config.address : 
        `https://${config.address}`;
    }

    return config;
  }

  // Create Proxmox API client with authentication
  async createProxmoxClient(config) {
    try {
      config = this.validateConfig(config);
      console.log('Creating Proxmox client for:', config.address); // Debug log

      // Check if we already have a client for this device
      const clientKey = `${config.address}-${config.credentials?.tokenId || config.credentials?.username}`;
      if (this.clients.has(clientKey)) {
        console.log('Using cached client for:', config.address); // Debug log
        return this.clients.get(clientKey);
      }

      const client = axios.create({
        baseURL: config.address,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Required for self-signed certificates
        }),
        timeout: 10000 // 10 second timeout
      });

      // Add authentication headers based on auth method
      if (config.credentials.tokenId && config.credentials.tokenSecret) {
        console.log('Using token authentication for:', config.address); // Debug log
        client.defaults.headers.common['Authorization'] = `PVEAPIToken=${config.credentials.tokenId}=${config.credentials.tokenSecret}`;
      } else if (config.credentials.username && config.credentials.password) {
        console.log('Using password authentication for:', config.address); // Debug log
        // For username/password auth, we need to get a ticket first
        const ticket = await this.getProxmoxTicket(client, config.credentials);
        client.defaults.headers.common['Cookie'] = `PVEAuthCookie=${ticket}`;
      }

      // Test the client with a version check
      await client.get('/api2/json/version');
      console.log('Successfully tested client for:', config.address); // Debug log

      // Store the client for reuse
      this.clients.set(clientKey, client);
      return client;
    } catch (error) {
      console.error('Error creating Proxmox client:', error.response?.data || error);
      if (error.response?.data?.message) {
        throw new Error(`Failed to create Proxmox client: ${error.response.data.message}`);
      }
      throw error;
    }
  }

  // Get Proxmox authentication ticket
  async getProxmoxTicket(client, credentials) {
    try {
      console.log('Getting Proxmox ticket for user:', credentials.username); // Debug log
      const response = await client.post('/api2/json/access/ticket', new URLSearchParams({
        username: credentials.username,
        password: credentials.password,
        realm: credentials.realm || 'pam'
      }));

      if (!response.data?.data?.ticket) {
        throw new Error('No ticket received from Proxmox API');
      }

      console.log('Successfully obtained ticket for:', credentials.username); // Debug log
      return response.data.data.ticket;
    } catch (error) {
      console.error('Proxmox authentication failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(`Proxmox authentication failed: ${error.response.data.message}`);
      }
      throw new Error('Proxmox authentication failed: Invalid credentials or server unreachable');
    }
  }

  // Helper to execute Proxmox API calls
  async executeProxmoxCommand(config) {
    try {
      config = this.validateConfig(config);
      console.log('Executing Proxmox command for:', config.address, 'node:', config.node); // Debug log

      const client = await this.createProxmoxClient(config);
      
      // Test connection with version endpoint
      const versionResponse = await client.get('/api2/json/version');
      console.log('Proxmox version:', versionResponse.data); // Debug log

      // If no specific node is requested, get all nodes
      if (!config.node) {
        console.log('Fetching all nodes for:', config.address); // Debug log
        // Get nodes
        const nodesResponse = await client.get('/api2/json/nodes');
        const nodes = nodesResponse.data.data;
        console.log('Found nodes:', nodes.map(n => n.node).join(', ')); // Debug log

        // Get resources for each node
        const resources = await Promise.all(nodes.map(async node => {
          try {
            console.log('Fetching resources for node:', node.node); // Debug log
            const [vms, containers] = await Promise.all([
              client.get(`/api2/json/nodes/${node.node}/qemu`),
              client.get(`/api2/json/nodes/${node.node}/lxc`)
            ]);

            return {
              node: node.node,
              vms: vms.data.data,
              containers: containers.data.data
            };
          } catch (error) {
            console.error(`Error fetching resources for node ${node.node}:`, error);
            return {
              node: node.node,
              error: error.message,
              vms: [],
              containers: []
            };
          }
        }));

        return {
          nodes,
          resources
        };
      }

      // If a specific node is requested, get detailed node stats
      console.log('Fetching stats for specific node:', config.node); // Debug log
      const [nodeStatus, rrddata, vms, containers] = await Promise.all([
        client.get(`/api2/json/nodes/${config.node}/status`),
        client.get(`/api2/json/nodes/${config.node}/rrddata`, {
          params: {
            timeframe: 'hour'
          }
        }),
        client.get(`/api2/json/nodes/${config.node}/qemu`),
        client.get(`/api2/json/nodes/${config.node}/lxc`)
      ]);

      console.log('Successfully fetched node stats for:', config.node); // Debug log
      return {
        node: config.node,
        status: nodeStatus.data.data,
        rrddata: rrddata.data.data,
        vms: vms.data.data,
        containers: containers.data.data
      };
    } catch (error) {
      console.error('Error executing Proxmox command:', error.response?.data || error);
      if (error.response?.data?.message) {
        throw new Error(`Proxmox API error: ${error.response.data.message}`);
      }
      throw error;
    }
  }

  async getProxmoxMetrics(config) {
    try {
      config = this.validateConfig(config);
      console.log('Fetching Proxmox metrics for:', config.address, 'node:', config.node); // Debug log
      
      const data = await this.executeProxmoxCommand(config);
      console.log('Successfully fetched Proxmox metrics:', {
        hasNodes: !!data.nodes,
        hasStatus: !!data.status,
        hasRRDData: !!data.rrddata
      }); // Debug log
      
      return {
        type: 'proxmox',
        ...data
      };
    } catch (error) {
      console.error(`Error fetching Proxmox metrics:`, error);
      throw error;
    }
  }

  async getMetrics(deviceConfig) {
    try {
      deviceConfig = this.validateConfig(deviceConfig);
      console.log('Getting metrics for device:', {
        id: deviceConfig.id,
        type: deviceConfig.type,
        address: deviceConfig.address,
        hasCredentials: !!deviceConfig.credentials
      }); // Debug log

      switch (deviceConfig.type) {
        case 'proxmox':
          return await this.getProxmoxMetrics(deviceConfig);
        case 'vm':
          return await this.getVMMetrics(deviceConfig.address);
        case 'lxc':
          return await this.getLXCMetrics(deviceConfig.address);
        case 'docker':
          return await this.getDockerMetrics(deviceConfig.address);
        case 'host':
        default:
          if (deviceConfig.address === 'localhost') {
            return await this.getLocalMetrics();
          }
          return await this.getVMMetrics(deviceConfig.address);
      }
    } catch (error) {
      console.error(`Error fetching metrics for device ${deviceConfig.id}:`, error);
      throw error;
    }
  }

  // Other methods remain unchanged...
  async executeRemoteCommand(host, command) {
    try {
      const { stdout } = await execAsync(`ssh ${host} '${command}'`);
      return stdout.trim();
    } catch (error) {
      console.error(`Error executing remote command on ${host}:`, error);
      throw new Error(`Failed to execute command on ${host}: ${error.message}`);
    }
  }

  async executeDockerCommand(host, command) {
    try {
      const cmd = host === 'localhost' ? 
        `docker ${command}` : 
        `ssh ${host} 'docker ${command}'`;
      const { stdout } = await execAsync(cmd);
      return stdout.trim();
    } catch (error) {
      console.error(`Error executing docker command on ${host}:`, error);
      throw new Error(`Failed to execute Docker command: ${error.message}`);
    }
  }

  async getVMMetrics(host) {
    try {
      const [cpu, mem, disk, net] = await Promise.all([
        this.executeRemoteCommand(host, "top -bn1 | grep 'Cpu(s)'"),
        this.executeRemoteCommand(host, "free -m"),
        this.executeRemoteCommand(host, "df -h"),
        this.executeRemoteCommand(host, "netstat -i")
      ]);

      return {
        type: 'vm',
        cpu,
        memory: mem,
        disk,
        network: net
      };
    } catch (error) {
      console.error(`Error fetching VM metrics from ${host}:`, error);
      throw error;
    }
  }

  async getLXCMetrics(host) {
    try {
      const metrics = await this.executeRemoteCommand(host, `
        lxc-info -n ${host} -s && 
        lxc-info -n ${host} -S && 
        lxc-info -n ${host} -p
      `);

      return {
        type: 'lxc',
        ...metrics
      };
    } catch (error) {
      console.error(`Error fetching LXC metrics from ${host}:`, error);
      throw error;
    }
  }

  async getDockerMetrics(host) {
    try {
      const [containers, stats] = await Promise.all([
        this.executeDockerCommand(host, 'ps -a --format "{{json .}}"'),
        this.executeDockerCommand(host, 'stats --no-stream --format "{{json .}}"')
      ]);

      return {
        type: 'docker',
        containers: containers.split('\n').map(c => JSON.parse(c)),
        stats: stats.split('\n').map(s => JSON.parse(s))
      };
    } catch (error) {
      console.error(`Error fetching Docker metrics from ${host}:`, error);
      throw error;
    }
  }

  async getLocalMetrics() {
    try {
      const [cpu, mem, disk, net] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats()
      ]);

      return {
        type: 'host',
        cpu,
        memory: mem,
        disk,
        network: net
      };
    } catch (error) {
      console.error('Error fetching local metrics:', error);
      throw error;
    }
  }
}

module.exports = new DeviceService();
