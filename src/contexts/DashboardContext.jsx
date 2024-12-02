import React, { createContext, useContext, useReducer, useEffect } from 'react';

const DashboardContext = createContext();

// Action types
const ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  UPDATE_LAYOUT: 'UPDATE_LAYOUT',
  UPDATE_REFRESH_RATE: 'UPDATE_REFRESH_RATE',
  ADD_WIDGET: 'ADD_WIDGET',
  REMOVE_WIDGET: 'REMOVE_WIDGET',
  UPDATE_WIDGET_CONFIG: 'UPDATE_WIDGET_CONFIG',
  TOGGLE_VIEW_MODE: 'TOGGLE_VIEW_MODE',
  ADD_DEVICE: 'ADD_DEVICE',
  REMOVE_DEVICE: 'REMOVE_DEVICE',
  SET_ACTIVE_DEVICE: 'SET_ACTIVE_DEVICE',
  UPDATE_DEVICE: 'UPDATE_DEVICE',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  SET_DEVICE_ERROR: 'SET_DEVICE_ERROR',
  INIT_DEVICES: 'INIT_DEVICES',
};

// Generate a stable device ID for Proxmox
const generateProxmoxId = (address) => {
  return `proxmox-${address.replace(/[^a-zA-Z0-9]/g, '-')}`;
};

// Store local system device config
const localDevice = {
  id: 'local',
  name: 'Local System',
  type: 'host',
  address: 'localhost',
  enabled: true,
};

const initialState = {
  theme: 'dark',
  showSidebar: false,
  refreshRate: 1000,
  layout: {
    mainGrid: 4,
    sections: [
      'power',
      'backup',
      'updates',
      'storage',
      'security',
      'cpu',
      'memory',
      'network'
    ],
    viewMode: 'card',
  },
  widgets: {
    power: { enabled: true, expanded: true },
    backup: { enabled: true, expanded: true },
    updates: { enabled: true, expanded: true },
    storage: { enabled: true, expanded: true },
    security: { enabled: true, expanded: true },
    cpu: { enabled: true, expanded: true },
    memory: { enabled: true, expanded: true },
    network: { enabled: true, expanded: true },
    docker: { enabled: false, expanded: false },
    processes: { enabled: true, expanded: true },
  },
  devices: {
    activeDevice: 'local',
    selectedNode: null,
    error: null,
    list: {
      local: localDevice
    }
  },
};

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };
    
    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, showSidebar: !state.showSidebar };
    
    case ACTIONS.UPDATE_LAYOUT:
      return { 
        ...state, 
        layout: { ...state.layout, ...action.payload } 
      };
    
    case ACTIONS.UPDATE_REFRESH_RATE:
      return { ...state, refreshRate: action.payload };
    
    case ACTIONS.ADD_WIDGET:
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            enabled: true,
            expanded: false,
            ...action.payload.config
          }
        }
      };
    
    case ACTIONS.REMOVE_WIDGET:
      const { [action.payload]: removed, ...remainingWidgets } = state.widgets;
      return {
        ...state,
        widgets: remainingWidgets
      };
    
    case ACTIONS.UPDATE_WIDGET_CONFIG:
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            ...action.payload.config
          }
        }
      };

    case ACTIONS.TOGGLE_VIEW_MODE:
      return {
        ...state,
        layout: {
          ...state.layout,
          viewMode: state.layout.viewMode === 'card' ? 'full' : 'card'
        }
      };

    case ACTIONS.ADD_DEVICE: {
      // Store device configuration in localStorage
      const deviceConfig = {
        id: action.payload.id,
        name: action.payload.name,
        type: action.payload.type,
        address: action.payload.address,
        enabled: true
      };
      localStorage.setItem(`device_${deviceConfig.id}`, JSON.stringify(deviceConfig));

      // Store auth token if provided
      if (action.payload.authToken) {
        localStorage.setItem(`device_${deviceConfig.id}_auth`, action.payload.authToken);
      }
      
      // Remove authToken from device object before storing in state
      const { authToken, ...deviceData } = action.payload;
      
      return {
        ...state,
        devices: {
          ...state.devices,
          list: {
            ...state.devices.list,
            [deviceData.id]: deviceData
          }
        }
      };
    }

    case ACTIONS.REMOVE_DEVICE: {
      // Don't allow removing local device
      if (action.payload === 'local') {
        return state;
      }

      // Clean up device configuration and auth token
      localStorage.removeItem(`device_${action.payload}`);
      localStorage.removeItem(`device_${action.payload}_auth`);
      
      const { [action.payload]: removedDevice, ...remainingDevices } = state.devices.list;
      return {
        ...state,
        devices: {
          ...state.devices,
          list: remainingDevices,
          activeDevice: action.payload === state.devices.activeDevice ? 'local' : state.devices.activeDevice,
          selectedNode: action.payload === state.devices.activeDevice ? null : state.devices.selectedNode,
          error: null
        }
      };
    }

    case ACTIONS.SET_ACTIVE_DEVICE: {
      // Ensure local device is always in the list
      const updatedList = {
        ...state.devices.list,
        local: localDevice
      };

      return {
        ...state,
        devices: {
          ...state.devices,
          list: updatedList,
          activeDevice: action.payload,
          selectedNode: null, // Reset selected node when changing device
          error: null // Clear any previous errors
        }
      };
    }

    case ACTIONS.UPDATE_DEVICE: {
      // Don't allow updating local device
      if (action.payload.id === 'local') {
        return state;
      }

      // Update device configuration in localStorage
      const updatedDevice = {
        ...state.devices.list[action.payload.id],
        ...action.payload.updates
      };
      localStorage.setItem(`device_${action.payload.id}`, JSON.stringify(updatedDevice));

      return {
        ...state,
        devices: {
          ...state.devices,
          list: {
            ...state.devices.list,
            [action.payload.id]: updatedDevice
          }
        }
      };
    }

    case ACTIONS.SET_SELECTED_NODE:
      return {
        ...state,
        devices: {
          ...state.devices,
          selectedNode: action.payload,
          error: null // Clear any previous errors when selecting a node
        }
      };

    case ACTIONS.SET_DEVICE_ERROR:
      return {
        ...state,
        devices: {
          ...state.devices,
          error: action.payload
        }
      };

    case ACTIONS.INIT_DEVICES: {
      // Store device configurations in localStorage
      Object.entries(action.payload).forEach(([id, device]) => {
        if (id !== 'local') {
          localStorage.setItem(`device_${id}`, JSON.stringify(device));
        }
      });

      // Ensure local device is always in the list
      const updatedDevices = {
        ...action.payload,
        local: localDevice
      };

      return {
        ...state,
        devices: {
          ...state.devices,
          list: {
            ...state.devices.list,
            ...updatedDevices
          }
        }
      };
    }
    
    default:
      return state;
  }
};

export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Initialize devices from localStorage on mount
  useEffect(() => {
    const initializeDevices = () => {
      const devices = { local: localDevice };
      const proxmoxId = generateProxmoxId('10.10.20.35:8006');
      
      // Check if we have auth for the Proxmox device
      const authToken = localStorage.getItem(`device_${proxmoxId}_auth`);
      if (authToken) {
        const deviceConfig = {
          id: proxmoxId,
          name: 'Proxmox Server',
          type: 'proxmox',
          address: 'https://10.10.20.35:8006',
          enabled: true
        };
        
        // Store device configuration
        localStorage.setItem(`device_${proxmoxId}`, JSON.stringify(deviceConfig));
        devices[proxmoxId] = deviceConfig;
        
        // Initialize devices
        dispatch({ type: ACTIONS.INIT_DEVICES, payload: devices });
      }
    };

    initializeDevices();
  }, []);

  const value = {
    state,
    setTheme: (theme) => dispatch({ type: ACTIONS.SET_THEME, payload: theme }),
    toggleSidebar: () => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR }),
    updateLayout: (layout) => dispatch({ type: ACTIONS.UPDATE_LAYOUT, payload: layout }),
    updateRefreshRate: (rate) => dispatch({ type: ACTIONS.UPDATE_REFRESH_RATE, payload: rate }),
    addWidget: (id, config) => dispatch({ type: ACTIONS.ADD_WIDGET, payload: { id, config } }),
    removeWidget: (id) => dispatch({ type: ACTIONS.REMOVE_WIDGET, payload: id }),
    updateWidgetConfig: (id, config) => dispatch({
      type: ACTIONS.UPDATE_WIDGET_CONFIG,
      payload: { id, config }
    }),
    toggleViewMode: () => dispatch({ type: ACTIONS.TOGGLE_VIEW_MODE }),
    addDevice: (device) => {
      // Generate auth token if credentials are provided
      let authToken = '';
      if (device.credentials) {
        if (device.credentials.tokenId && device.credentials.tokenSecret) {
          authToken = `PVEAPIToken=${device.credentials.tokenId}=${device.credentials.tokenSecret}`;
        } else if (device.credentials.username && device.credentials.password) {
          authToken = `Basic ${btoa(`${device.credentials.username}:${device.credentials.password}`)}`;
        }
      }
      
      dispatch({ 
        type: ACTIONS.ADD_DEVICE, 
        payload: { ...device, authToken }
      });
    },
    removeDevice: (deviceId) => dispatch({ type: ACTIONS.REMOVE_DEVICE, payload: deviceId }),
    setActiveDevice: (deviceId) => dispatch({ type: ACTIONS.SET_ACTIVE_DEVICE, payload: deviceId }),
    updateDevice: (id, updates) => dispatch({ 
      type: ACTIONS.UPDATE_DEVICE, 
      payload: { id, updates }
    }),
    setSelectedNode: (node) => dispatch({ type: ACTIONS.SET_SELECTED_NODE, payload: node }),
    setDeviceError: (error) => dispatch({ type: ACTIONS.SET_DEVICE_ERROR, payload: error }),
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// Export actions for external use
export { ACTIONS, generateProxmoxId };
