const API_URL = 'http://localhost:3001';

// Generate consistent device ID for Proxmox
const generateProxmoxId = (address) => {
  return `proxmox-${address.replace(/[^a-zA-Z0-9]/g, '-')}`;
};

// Helper to get stored auth token
const getStoredAuthToken = (deviceId) => {
  try {
    return localStorage.getItem(`device_${deviceId}_auth`);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

// Helper to store auth token
const storeAuthToken = (deviceId, token) => {
  try {
    localStorage.setItem(`device_${deviceId}_auth`, token);
    return true;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
};

export const fetchSystemData = async () => {
  try {
    const response = await fetch(`${API_URL}/metrics`);
    if (!response.ok) {
      throw new Error('Failed to fetch system metrics');
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching system data: ${error.message}`);
  }
};

export const fetchDeviceMetrics = async (deviceId, config) => {
  try {
    const authToken = getStoredAuthToken(deviceId);
    if (!authToken) {
      throw new Error('Device authentication not found. Please reconfigure the device.');
    }

    const queryParams = new URLSearchParams({
      type: config.type,
      address: config.address,
      ...(config.selectedNode && { node: config.selectedNode })
    });
    
    const response = await fetch(`${API_URL}/devices/${deviceId}/metrics?${queryParams}`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch device metrics');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching device metrics: ${error.message}`);
  }
};

export const addDevice = async (deviceConfig) => {
  try {
    // Ensure Proxmox devices have the correct protocol
    if (deviceConfig.type === 'proxmox' && deviceConfig.address) {
      deviceConfig.address = deviceConfig.address.startsWith('http') ? 
        deviceConfig.address : 
        `https://${deviceConfig.address}`;
      
      // Generate consistent device ID
      deviceConfig.id = generateProxmoxId(deviceConfig.address.replace(/^https?:\/\//, ''));
    }

    // Set authorization header based on auth method
    let authToken = '';
    if (deviceConfig.credentials) {
      if (deviceConfig.credentials.tokenId && deviceConfig.credentials.tokenSecret) {
        authToken = `PVEAPIToken=${deviceConfig.credentials.tokenId}=${deviceConfig.credentials.tokenSecret}`;
      } else if (deviceConfig.credentials.username && deviceConfig.credentials.password) {
        authToken = `Basic ${btoa(`${deviceConfig.credentials.username}:${deviceConfig.credentials.password}`)}`;
      }
    }

    const response = await fetch(`${API_URL}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify(deviceConfig),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to add device');
    }
    
    // Store auth token for future requests
    if (authToken) {
      const stored = storeAuthToken(deviceConfig.id, authToken);
      if (!stored) {
        throw new Error('Failed to store device authentication. Please try again.');
      }
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Error adding device: ${error.message}`);
  }
};

export const testDeviceConnection = async (deviceConfig) => {
  try {
    // Ensure Proxmox devices have the correct protocol
    if (deviceConfig.type === 'proxmox' && deviceConfig.address) {
      deviceConfig.address = deviceConfig.address.startsWith('http') ? 
        deviceConfig.address : 
        `https://${deviceConfig.address}`;
      
      // Generate consistent device ID
      deviceConfig.id = generateProxmoxId(deviceConfig.address.replace(/^https?:\/\//, ''));
    }

    // Set authorization header based on auth method
    let authToken = '';
    if (deviceConfig.credentials) {
      if (deviceConfig.credentials.tokenId && deviceConfig.credentials.tokenSecret) {
        authToken = `PVEAPIToken=${deviceConfig.credentials.tokenId}=${deviceConfig.credentials.tokenSecret}`;
      } else if (deviceConfig.credentials.username && deviceConfig.credentials.password) {
        authToken = `Basic ${btoa(`${deviceConfig.credentials.username}:${deviceConfig.credentials.password}`)}`;
      }
    }

    const response = await fetch(`${API_URL}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({ ...deviceConfig, test: true }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Connection test failed');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Connection test failed: ${error.message}`);
  }
};

export const fetchProxmoxStats = async (deviceId, node = null) => {
  try {
    // Get stored auth token
    const authToken = getStoredAuthToken(deviceId);
    if (!authToken) {
      throw new Error('Device authentication not found. Please reconfigure the device.');
    }

    // Get device from localStorage
    const device = JSON.parse(localStorage.getItem(`device_${deviceId}`));
    if (!device?.address) {
      throw new Error('Device configuration not found. Please reconfigure the device.');
    }

    const queryParams = new URLSearchParams({
      type: 'proxmox',
      address: device.address
    });
    
    // Only add node parameter if it exists
    if (node) {
      queryParams.append('node', node);
    }

    const response = await fetch(`${API_URL}/devices/${deviceId}/metrics?${queryParams}`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.message?.includes('authentication') || errorData.message?.includes('unauthorized')) {
        // Clear invalid auth token
        localStorage.removeItem(`device_${deviceId}_auth`);
      }
      throw new Error(errorData.message || errorData.error || 'Failed to fetch Proxmox stats');
    }
    
    const data = await response.json();
    
    // If no node is selected and we have nodes data, return the nodes list
    if (!node && data.nodes) {
      return {
        type: 'proxmox',
        nodes: data.nodes,
        resources: data.resources
      };
    }
    
    return data;
  } catch (error) {
    throw new Error(`Error fetching Proxmox stats: ${error.message}`);
  }
};

export const fetchDockerStats = async (deviceId) => {
  try {
    const authToken = getStoredAuthToken(deviceId);
    if (!authToken) {
      throw new Error('Device authentication not found. Please reconfigure the device.');
    }

    const device = JSON.parse(localStorage.getItem(`device_${deviceId}`));
    if (!device?.address) {
      throw new Error('Device configuration not found. Please reconfigure the device.');
    }

    const queryParams = new URLSearchParams({
      type: 'docker',
      address: device.address
    });

    const response = await fetch(`${API_URL}/devices/${deviceId}/metrics?${queryParams}`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch Docker stats');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching Docker stats: ${error.message}`);
  }
};

export const fetchLXCStats = async (deviceId) => {
  try {
    const authToken = getStoredAuthToken(deviceId);
    if (!authToken) {
      throw new Error('Device authentication not found. Please reconfigure the device.');
    }

    const device = JSON.parse(localStorage.getItem(`device_${deviceId}`));
    if (!device?.address) {
      throw new Error('Device configuration not found. Please reconfigure the device.');
    }

    const queryParams = new URLSearchParams({
      type: 'lxc',
      address: device.address
    });

    const response = await fetch(`${API_URL}/devices/${deviceId}/metrics?${queryParams}`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch LXC stats');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching LXC stats: ${error.message}`);
  }
};

export const fetchVMStats = async (deviceId) => {
  try {
    const authToken = getStoredAuthToken(deviceId);
    if (!authToken) {
      throw new Error('Device authentication not found. Please reconfigure the device.');
    }

    const device = JSON.parse(localStorage.getItem(`device_${deviceId}`));
    if (!device?.address) {
      throw new Error('Device configuration not found. Please reconfigure the device.');
    }

    const queryParams = new URLSearchParams({
      type: 'vm',
      address: device.address
    });

    const response = await fetch(`${API_URL}/devices/${deviceId}/metrics?${queryParams}`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch VM stats');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching VM stats: ${error.message}`);
  }
};
