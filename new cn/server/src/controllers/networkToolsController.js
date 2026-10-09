import os from 'os';
import { probeICMP, probeTCP, probeDNS, measureThroughput, isValidHost } from '../services/networkProber.js';

export const networkToolsController = {
  async runPing(req, res) {
    try {
      const { target, count = 4, timeoutMs = 2000 } = req.body;
      if (!isValidHost(target)) {
        return res.status(400).json({ success: false, error: 'Invalid destination address or hostname' });
      }

      const result = await probeICMP(target, { count: Math.min(10, count), timeoutMs });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async runTcpCheck(req, res) {
    try {
      const { target, port = 80, timeoutMs = 3000 } = req.body;
      if (!isValidHost(target)) {
        return res.status(400).json({ success: false, error: 'Invalid host address' });
      }

      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return res.status(400).json({ success: false, error: 'Invalid TCP port (1-65535)' });
      }

      const result = await probeTCP(target, portNum, timeoutMs);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async runDnsLookup(req, res) {
    try {
      const { target } = req.body;
      if (!isValidHost(target)) {
        return res.status(400).json({ success: false, error: 'Invalid hostname' });
      }

      const result = await probeDNS(target);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async runThroughput(req, res) {
    try {
      const result = await measureThroughput();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getSystemInfo(req, res) {
    try {
      const interfaces = os.networkInterfaces();
      const cleanInterfaces = {};

      Object.entries(interfaces).forEach(([name, addrs]) => {
        cleanInterfaces[name] = addrs.map(a => ({
          address: a.address,
          netmask: a.netmask,
          family: a.family,
          mac: a.mac,
          internal: a.internal,
          cidr: a.cidr
        }));
      });

      const mem = process.memoryUsage();

      res.json({
        success: true,
        data: {
          hostname: os.hostname(),
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          uptimeSeconds: Math.floor(os.uptime()),
          nodeVersion: process.version,
          networkInterfaces: cleanInterfaces,
          memoryUsage: {
            heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
            heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
            rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
          }
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
