import { dataRepository } from '../models/dataRepository.js';
import { monitorEngine } from '../services/monitorEngine.js';
import { isValidHost } from '../services/networkProber.js';

export const hostController = {
  async getHosts(req, res) {
    try {
      const { status, search } = req.query;
      const hosts = await dataRepository.getAllHosts({ status, search });
      res.json({ success: true, count: hosts.length, data: hosts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getHostById(req, res) {
    try {
      const { id } = req.params;
      const host = await dataRepository.getHostById(id);
      if (!host) {
        return res.status(404).json({ success: false, error: 'Host not found' });
      }

      // Fetch last 100 probe results for this host
      const history = await dataRepository.getResults({ hostId: id, limit: 100 });
      // Fetch active alerts for this host
      const alerts = await dataRepository.getAlerts({ limit: 20 });
      const hostAlerts = alerts.filter(a => String(a.hostId) === String(id));

      res.json({
        success: true,
        data: {
          host,
          history,
          alerts: hostAlerts,
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createHost(req, res) {
    try {
      const { name, address, description, probeType, port, interval, thresholdMs, enabled, tags } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Host name is required' });
      }
      if (!address || !address.trim()) {
        return res.status(400).json({ success: false, error: 'Host address (IP or hostname) is required' });
      }

      const cleanAddress = address.trim();
      if (!isValidHost(cleanAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid IP address or hostname format. Only standard IPv4, IPv6, or domain names allowed.'
        });
      }

      // Check duplicates
      const existing = await dataRepository.getAllHosts();
      const duplicate = existing.find(h => h.address.toLowerCase() === cleanAddress.toLowerCase() && h.name.toLowerCase() === name.trim().toLowerCase());
      if (duplicate) {
        return res.status(409).json({ success: false, error: 'A monitored host with this name and address already exists.' });
      }

      const newHost = await dataRepository.createHost({
        name: name.trim(),
        address: cleanAddress,
        description: description?.trim() || '',
        probeType: probeType || 'ICMP',
        port: Number(port) || 80,
        interval: Math.max(5, Number(interval) || 30),
        thresholdMs: Math.max(5, Number(thresholdMs) || 150),
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : ['Monitored']),
      });

      await dataRepository.recordEvent({
        type: 'HOST_ADDED',
        severity: 'INFO',
        message: `Monitored host "${newHost.name}" (${newHost.address}) registered.`,
        hostId: String(newHost._id),
        hostName: newHost.name,
      });

      // Trigger immediate initial probe in background
      monitorEngine.probeSingleHost(String(newHost._id)).catch(() => {});

      res.status(201).json({ success: true, data: newHost });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateHost(req, res) {
    try {
      const { id } = req.params;
      const { name, address, description, probeType, port, interval, thresholdMs, enabled, tags } = req.body;

      const existing = await dataRepository.getHostById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Host not found' });
      }

      if (address && !isValidHost(address.trim())) {
        return res.status(400).json({ success: false, error: 'Invalid address format' });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (address) updateData.address = address.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (probeType) updateData.probeType = probeType;
      if (port !== undefined) updateData.port = Number(port);
      if (interval !== undefined) updateData.interval = Math.max(5, Number(interval));
      if (thresholdMs !== undefined) updateData.thresholdMs = Math.max(5, Number(thresholdMs));
      if (enabled !== undefined) updateData.enabled = Boolean(enabled);
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags];

      const updated = await dataRepository.updateHost(id, updateData);

      await dataRepository.recordEvent({
        type: 'HOST_UPDATED',
        severity: 'INFO',
        message: `Host "${updated.name}" configuration updated.`,
        hostId: id,
        hostName: updated.name,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteHost(req, res) {
    try {
      const { id } = req.params;
      const existing = await dataRepository.getHostById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Host not found' });
      }

      await dataRepository.deleteHost(id);

      await dataRepository.recordEvent({
        type: 'HOST_DELETED',
        severity: 'WARNING',
        message: `Monitored host "${existing.name}" (${existing.address}) was removed from monitoring.`,
        hostId: id,
        hostName: existing.name,
      });

      res.json({ success: true, message: 'Host successfully removed' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async probeNow(req, res) {
    try {
      const { id } = req.params;
      const probeRes = await monitorEngine.probeSingleHost(id);
      if (!probeRes) {
        return res.status(404).json({ success: false, error: 'Host probe failed or host not found' });
      }
      res.json({ success: true, data: probeRes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
