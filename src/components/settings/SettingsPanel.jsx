import React, { useState } from 'react';
import { X, Plus, Server, Box, Database, Monitor, Trash2, Eye, EyeOff } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { testDeviceConnection } from '../../api/systemApi';

const DeviceForm = ({ onSubmit, onCancel }) => {
  const [device, setDevice] = useState({
    name: '',
    type: 'host',
    address: '',
    credentials: {
      username: '',
      password: '',
      realm: 'pam',
      tokenId: '',
      tokenSecret: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTokenSecret, setShowTokenSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'token'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setTesting(true);

    try {
      // Clean up credentials based on auth method and device type
      const cleanDevice = {
        ...device,
        credentials: device.type === 'proxmox' 
          ? (authMethod === 'password' 
              ? {
                  username: device.credentials.username,
                  password: device.credentials.password,
                  realm: device.credentials.realm
                }
              : {
                  tokenId: device.credentials.tokenId,
                  tokenSecret: device.credentials.tokenSecret
                })
          : undefined
      };

      await testDeviceConnection(cleanDevice);
      onSubmit(cleanDevice);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const renderProxmoxFields = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Authentication Method
          </label>
          <select
            value={authMethod}
            onChange={(e) => setAuthMethod(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="password">Username & Password</option>
            <option value="token">API Token</option>
          </select>
        </div>

        {authMethod === 'password' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={device.credentials.username}
                onChange={(e) => setDevice({
                  ...device,
                  credentials: { ...device.credentials, username: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="root@pam"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={device.credentials.password}
                  onChange={(e) => setDevice({
                    ...device,
                    credentials: { ...device.credentials, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Realm
              </label>
              <select
                value={device.credentials.realm}
                onChange={(e) => setDevice({
                  ...device,
                  credentials: { ...device.credentials, realm: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pam">PAM</option>
                <option value="pve">PVE</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Token ID
              </label>
              <input
                type="text"
                value={device.credentials.tokenId}
                onChange={(e) => setDevice({
                  ...device,
                  credentials: { ...device.credentials, tokenId: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@pam!tokenname"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Token Secret
              </label>
              <div className="relative">
                <input
                  type={showTokenSecret ? "text" : "password"}
                  value={device.credentials.tokenSecret}
                  onChange={(e) => setDevice({
                    ...device,
                    credentials: { ...device.credentials, tokenSecret: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowTokenSecret(!showTokenSecret)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showTokenSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Device Name
        </label>
        <input
          type="text"
          value={device.name}
          onChange={(e) => setDevice({ ...device, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Type
        </label>
        <select
          value={device.type}
          onChange={(e) => setDevice({ ...device, type: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="host">Host System</option>
          <option value="proxmox">Proxmox Server</option>
          <option value="vm">Virtual Machine</option>
          <option value="lxc">LXC Container</option>
          <option value="docker">Docker Host</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Address
        </label>
        <input
          type="text"
          value={device.address}
          onChange={(e) => setDevice({ ...device, address: e.target.value })}
          placeholder={device.type === 'proxmox' ? 'https://10.10.20.35:8006' : 'hostname or IP address'}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {device.type === 'proxmox' && renderProxmoxFields()}

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={testing}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
        >
          {testing ? 'Testing Connection...' : 'Add Device'}
        </button>
      </div>
    </form>
  );
};

const DeviceList = () => {
  const { state, removeDevice } = useDashboard();
  const devices = Object.values(state.devices.list);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'proxmox':
        return <Server className="h-4 w-4 text-purple-400" />;
      case 'vm':
        return <Box className="h-4 w-4 text-green-400" />;
      case 'lxc':
        return <Box className="h-4 w-4 text-blue-400" />;
      case 'docker':
        return <Database className="h-4 w-4 text-cyan-400" />;
      default:
        return <Monitor className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <div
          key={`device-${device.id}`}
          className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <div key={`info-${device.id}`} className="flex items-center space-x-3">
            {getDeviceIcon(device.type)}
            <div>
              <div className="text-sm font-medium text-gray-200">
                {device.name}
              </div>
              <div className="text-xs text-gray-400">
                {device.address}
              </div>
            </div>
          </div>
          {device.id !== 'local' && (
            <button
              key={`remove-${device.id}`}
              onClick={() => removeDevice(device.id)}
              className="p-1 text-gray-400 hover:text-red-400"
              title="Remove device"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export const SettingsPanel = ({ onClose }) => {
  const { state, setTheme, updateRefreshRate, addDevice } = useDashboard();
  const [showDeviceForm, setShowDeviceForm] = useState(false);

  const handleAddDevice = (device) => {
    addDevice(device);
    setShowDeviceForm(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/95 backdrop-blur-sm border-l border-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-medium text-gray-200">Settings</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Theme Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Theme</h3>
          <select
            value={state.theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </section>

        {/* Refresh Rate Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Refresh Rate
          </h3>
          <select
            value={state.refreshRate}
            onChange={(e) => updateRefreshRate(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1000}>1 second</option>
            <option value={2000}>2 seconds</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
          </select>
        </section>

        {/* Devices Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Devices</h3>
            {!showDeviceForm && (
              <button
                onClick={() => setShowDeviceForm(true)}
                className="flex items-center text-sm text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Device
              </button>
            )}
          </div>

          {showDeviceForm ? (
            <DeviceForm
              onSubmit={handleAddDevice}
              onCancel={() => setShowDeviceForm(false)}
            />
          ) : (
            <DeviceList />
          )}
        </section>
      </div>
    </div>
  );
};
