import { dbState, memoryStore } from '../config/db.js';
import { HostModel, MonitoringResultModel, AlertModel, EventModel } from './schemas.js';
import crypto from 'crypto';

// Helper to generate consistent ID for in-memory documents
const generateId = () => crypto.randomUUID();

export const dataRepository = {
  // ---- HOSTS ----
  async getAllHosts(filter = {}) {
    if (!dbState.usingFallback && dbState.connected) {
      try {
        const query = {};
        if (filter.status && filter.status !== 'ALL') {
          query.status = filter.status.toUpperCase();
        }
        if (filter.search) {
          query.$or = [
            { name: { $regex: filter.search, $options: 'i' } },
            { address: { $regex: filter.search, $options: 'i' } },
            { description: { $regex: filter.search, $options: 'i' } }
          ];
        }
        return await HostModel.find(query).sort({ updatedAt: -1 }).lean();
      } catch (err) {
        console.error('Error fetching hosts from Mongo, using memory store:', err.message);
      }
    }

    // In-memory fallback
    let list = Array.from(memoryStore.hosts.values());
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(h => h.status === filter.status.toUpperCase());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(h => 
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  },

  async getHostById(id) {
    if (!dbState.usingFallback && dbState.connected) {
      try {
        return await HostModel.findById(id).lean();
      } catch (err) {
        // Fallback
      }
    }
    return memoryStore.hosts.get(id) || null;
  },

  async createHost(data) {
    const now = new Date();
    const hostData = {
      ...data,
      port: data.port || 80,
      interval: Number(data.interval) || 30,
      thresholdMs: Number(data.thresholdMs) || 150,
      enabled: data.enabled !== undefined ? data.enabled : true,
      status: 'UNKNOWN',
      lastLatency: null,
      lastPacketLoss: null,
      lastChecked: null,
      availability: 100,
      totalChecks: 0,
      failedChecks: 0,
      tags: data.tags || ['General'],
      createdAt: now,
      updatedAt: now,
    };

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const host = new HostModel(hostData);
        await host.save();
        const obj = host.toObject();
        memoryStore.hosts.set(obj._id.toString(), obj);
        return obj;
      } catch (err) {
        console.error('Mongo host creation failed, using memory:', err.message);
      }
    }

    const id = generateId();
    const record = { _id: id, id, ...hostData };
    memoryStore.hosts.set(id, record);
    return record;
  },

  async updateHost(id, updateData) {
    const now = new Date();
    const cleanUpdate = { ...updateData, updatedAt: now };

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const updated = await HostModel.findByIdAndUpdate(id, cleanUpdate, { new: true }).lean();
        if (updated) {
          memoryStore.hosts.set(id.toString(), updated);
          return updated;
        }
      } catch (err) {
        // Fallback
      }
    }

    const existing = memoryStore.hosts.get(id);
    if (!existing) return null;
    const merged = { ...existing, ...cleanUpdate };
    memoryStore.hosts.set(id, merged);
    return merged;
  },

  async deleteHost(id) {
    if (!dbState.usingFallback && dbState.connected) {
      try {
        await HostModel.findByIdAndDelete(id);
        await MonitoringResultModel.deleteMany({ hostId: id });
        await AlertModel.deleteMany({ hostId: id });
      } catch (err) {
        // Fallback
      }
    }
    memoryStore.hosts.delete(id);
    // Cleanup results
    memoryStore.results = memoryStore.results.filter(r => r.hostId !== id);
    // Cleanup alerts
    for (const [alertId, alert] of memoryStore.alerts.entries()) {
      if (alert.hostId === id) memoryStore.alerts.delete(alertId);
    }
    return true;
  },

  // ---- MONITORING RESULTS ----
  async recordResult(resultData) {
    const now = new Date();
    const record = {
      ...resultData,
      timestamp: now,
    };

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const doc = new MonitoringResultModel(record);
        await doc.save();
      } catch (err) {
        // Fallback
      }
    }

    // Keep memory store capped at 2000 results
    const inMemRecord = { _id: generateId(), ...record };
    memoryStore.results.unshift(inMemRecord);
    if (memoryStore.results.length > 2000) {
      memoryStore.results.length = 2000;
    }

    return inMemRecord;
  },

  async getResults(filter = {}) {
    const { hostId, limit = 100, hours } = filter;
    let cutoff = null;
    if (hours) {
      cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const query = {};
        if (hostId) query.hostId = hostId;
        if (cutoff) query.timestamp = { $gte: cutoff };
        return await MonitoringResultModel.find(query)
          .sort({ timestamp: -1 })
          .limit(Number(limit))
          .lean();
      } catch (err) {
        // Fallback
      }
    }

    let list = memoryStore.results;
    if (hostId) list = list.filter(r => String(r.hostId) === String(hostId));
    if (cutoff) list = list.filter(r => new Date(r.timestamp) >= cutoff);
    return list.slice(0, Number(limit));
  },

  // ---- ALERTS ----
  async createAlert(alertData) {
    const now = new Date();
    const alert = {
      ...alertData,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const doc = new AlertModel(alert);
        await doc.save();
        const obj = doc.toObject();
        memoryStore.alerts.set(obj._id.toString(), obj);
        return obj;
      } catch (err) {
        // Fallback
      }
    }

    const id = generateId();
    const record = { _id: id, id, ...alert };
    memoryStore.alerts.set(id, record);
    return record;
  },

  async getActiveAlertsForHost(hostId, type) {
    if (!dbState.usingFallback && dbState.connected) {
      try {
        return await AlertModel.find({
          hostId,
          type,
          status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
        }).lean();
      } catch (err) {
        // Fallback
      }
    }

    return Array.from(memoryStore.alerts.values()).filter(a => 
      String(a.hostId) === String(hostId) && 
      a.type === type && 
      (a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED')
    );
  },

  async updateAlertStatus(alertId, newStatus) {
    const now = new Date();
    const update = {
      status: newStatus,
      updatedAt: now,
      ...(newStatus === 'ACKNOWLEDGED' ? { acknowledgedAt: now } : {}),
      ...(newStatus === 'RESOLVED' ? { resolvedAt: now } : {})
    };

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const doc = await AlertModel.findByIdAndUpdate(alertId, update, { new: true }).lean();
        if (doc) {
          memoryStore.alerts.set(alertId.toString(), doc);
          return doc;
        }
      } catch (err) {
        // Fallback
      }
    }

    const alert = memoryStore.alerts.get(alertId);
    if (!alert) return null;
    const merged = { ...alert, ...update };
    memoryStore.alerts.set(alertId, merged);
    return merged;
  },

  async getAlerts(filter = {}) {
    const { status, severity, limit = 50 } = filter;

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (severity && severity !== 'ALL') query.severity = severity;
        return await AlertModel.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
      } catch (err) {
        // Fallback
      }
    }

    let list = Array.from(memoryStore.alerts.values());
    if (status && status !== 'ALL') list = list.filter(a => a.status === status);
    if (severity && severity !== 'ALL') list = list.filter(a => a.severity === severity);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, Number(limit));
  },

  // ---- EVENTS ----
  async recordEvent(eventData) {
    const now = new Date();
    const event = {
      ...eventData,
      timestamp: now,
    };

    if (!dbState.usingFallback && dbState.connected) {
      try {
        const doc = new EventModel(event);
        await doc.save();
      } catch (err) {
        // Fallback
      }
    }

    const inMem = { _id: generateId(), ...event };
    memoryStore.events.unshift(inMem);
    if (memoryStore.events.length > 500) {
      memoryStore.events.length = 500;
    }
    return inMem;
  },

  async getEvents(limit = 50) {
    if (!dbState.usingFallback && dbState.connected) {
      try {
        return await EventModel.find().sort({ timestamp: -1 }).limit(Number(limit)).lean();
      } catch (err) {
        // Fallback
      }
    }

    return memoryStore.events.slice(0, Number(limit));
  },

  // ---- SEED SAMPLE COLLEGE DEMO HOSTS IF EMPTY ----
  async seedIfEmpty() {
    const existing = await this.getAllHosts();
    if (existing.length === 0) {
      console.log('[NetWatch] Initializing default Academic Network Topology hosts...');
      const seedHosts = [
        {
          name: 'Local Loopback Gateway',
          address: '127.0.0.1',
          description: 'Host local interface (RFC 5735 Loopback) - ideal for zero-latency baseline',
          probeType: 'ICMP',
          port: 80,
          interval: 15,
          thresholdMs: 15,
          tags: ['Localhost', 'Gateway', 'IPv4']
        },
        {
          name: 'Cloudflare Anycast DNS',
          address: '1.1.1.1',
          description: 'Cloudflare Ultra-Fast DNS Resolver Anycast Node',
          probeType: 'ICMP',
          port: 53,
          interval: 20,
          thresholdMs: 80,
          tags: ['Public DNS', 'Anycast', 'Tier 1']
        },
        {
          name: 'Google Primary DNS',
          address: '8.8.8.8',
          description: 'Google Global Anycast DNS Infrastructure',
          probeType: 'ICMP',
          port: 53,
          interval: 25,
          thresholdMs: 100,
          tags: ['Public DNS', 'Anycast', 'Google']
        },
        {
          name: 'Quad9 Secure Resolver',
          address: '9.9.9.9',
          description: 'Privacy-focused global security DNS',
          probeType: 'ICMP',
          port: 53,
          interval: 30,
          thresholdMs: 120,
          tags: ['Secure DNS', 'Security', 'Global']
        },
        {
          name: 'Public Web Gateway (HTTP)',
          address: 'cloudflare.com',
          description: 'Edge HTTP reverse proxy probe for Layer 7 web connectivity',
          probeType: 'HTTP',
          port: 80,
          interval: 30,
          thresholdMs: 250,
          tags: ['Web', 'HTTP', 'Layer-7']
        }
      ];

      for (const h of seedHosts) {
        await this.createHost(h);
      }

      await this.recordEvent({
        type: 'SYSTEM_START',
        severity: 'INFO',
        message: 'NetWatch NOC Engine initialized with 5 baseline network hosts.'
      });
      console.log('[NetWatch] ✓ 5 Academic Network Hosts loaded successfully.');
    }
  }
};
