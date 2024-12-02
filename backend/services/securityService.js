const { exec } = require('child_process');

// Helper function to execute shell commands
const execCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) resolve('');
      resolve(stdout.trim());
    });
  });
};

// Get security events and metrics
const getSecurityMetrics = async () => {
  try {
    // Get auth log events
    const authEvents = await execCommand('grep -iE "auth|failure|failed|invalid|session|sudo|security|error|warning" /var/log/auth.log | tail -n 50');
    
    // Get system journal events
    const criticalEvents = await execCommand('journalctl -p 0..2 --since "24 hours ago" --no-pager');
    const errorEvents = await execCommand('journalctl -p 3 --since "24 hours ago" --no-pager');
    const warningEvents = await execCommand('journalctl -p 4 --since "24 hours ago" --no-pager');
    
    // Get source-specific events
    const systemEvents = await execCommand('journalctl -p 0..3 --since "24 hours ago" | grep -i "systemd" | grep -v "systemd-logind" | sort | uniq -c | wc -l');
    const networkEvents = await execCommand('journalctl -p 0..3 --since "24 hours ago" | grep -iE "network|networkmanager|wpa_supplicant|dhcp" | sort | uniq -c | wc -l');
    const hardwareEvents = await execCommand('journalctl -p 0..3 --since "24 hours ago" | grep -iE "hardware|acpi|usb|pci|thermal|driver|firmware|power|cpu|memory" | sort | uniq -c | wc -l');
    
    // Get recent events
    const recentEvents = await execCommand('journalctl -p 0..4 -n 8 --no-pager');
    
    // Parse recent events
    const parsedRecentEvents = recentEvents.split('\n')
      .filter(line => line.trim())
      .map(line => {
        let severity = 'INFO';
        if (line.includes('CRIT') || line.includes('critical')) severity = 'CRIT';
        else if (line.includes('ERR') || line.includes('error')) severity = 'ERR';
        else if (line.includes('WARN') || line.includes('warning')) severity = 'WARN';
        
        const parts = line.split(' ');
        const service = parts[4] || 'system';
        const message = parts.slice(5).join(' ');
        
        return { severity, service, message };
      });

    return {
      events: authEvents.split('\n').filter(line => line.trim()),
      stats: {
        critical: parseInt(await execCommand('journalctl -p 0..2 --since "24 hours ago" | sort | uniq -c | wc -l')) || 0,
        errors: parseInt(await execCommand('journalctl -p 3 --since "24 hours ago" | sort | uniq -c | wc -l')) || 0,
        warnings: parseInt(await execCommand('journalctl -p 4 --since "24 hours ago" | sort | uniq -c | wc -l')) || 0
      },
      sources: {
        system: parseInt(systemEvents) || 0,
        network: parseInt(networkEvents) || 0,
        hardware: parseInt(hardwareEvents) || 0
      },
      recentEvents: parsedRecentEvents
    };
  } catch (error) {
    console.error('Error getting security events:', error);
    return {
      events: [],
      stats: { critical: 0, errors: 0, warnings: 0 },
      sources: { system: 0, network: 0, hardware: 0 },
      recentEvents: []
    };
  }
};

module.exports = {
  getSecurityMetrics
};
