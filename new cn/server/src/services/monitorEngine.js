import { dataRepository } from '../models/dataRepository.js';
import { probeHost } from './networkProber.js';

class MonitorEngine {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.sseClients = new Set();
    this.lastCheckTimes = new Map();
    this.alertCooldowns = new Map(); // key: hostId:type -> timestamp
  }

  start(tickIntervalMs = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[MonitorEngine] 🚀 Network Monitoring Engine started.');

    // Run first check immediately for any overdue host
    this.runMonitoringCycle();

    this.intervalId = setInterval(() => {
      this.runMonitoringCycle();
    }, tickIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[MonitorEngine] 🛑 Monitoring Engine stopped.');
  }

  addSseClient(res) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  broadcast(eventName, payload) {
    const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(data);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  async runMonitoringCycle() {
    try {
      const hosts = await dataRepository.getAllHosts();
      const now = Date.now();

      // Find hosts whose interval has elapsed
      const eligibleHosts = hosts.filter((host) => {
        if (!host.enabled) return false;
        const hostIntervalMs = (host.interval || 30) * 1000;
        const lastChecked = this.lastCheckTimes.get(String(host._id)) || 0;
        return (now - lastChecked) >= hostIntervalMs;
      });

      if (eligibleHosts.length === 0) return;

      // Limit concurrency to 5 parallel probes
      const concurrency = 5;
      for (let i = 0; i < eligibleHosts.length; i += concurrency) {
        const batch = eligibleHosts.slice(i, i + concurrency);
        await Promise.all(batch.map((h) => this.probeAndProcessHost(h)));
      }
    } catch (err) {
      console.error('[MonitorEngine] Error in monitoring cycle:', err);
    }
  }

  async probeAndProcessHost(host) {
    const hostId = String(host._id);
    this.lastCheckTimes.set(hostId, Date.now());

    try {
      const result = await probeHost(host);

      // Save monitoring probe record
      const probeRecord = await dataRepository.recordResult({
        hostId: host._id,
        hostName: host.name,
        address: host.address,
        probeType: result.probeType || host.probeType || 'ICMP',
        status: result.status,
        responseTime: result.responseTime,
        packetLoss: result.packetLoss,
        packetsSent: result.packetsSent || 1,
        packetsReceived: result.packetsReceived || (result.status === 'ONLINE' ? 1 : 0),
        errorMessage: result.errorMessage,
        details: {
          minRtt: result.minRtt,
          maxRtt: result.maxRtt,
          note: result.note,
          resolvedAddress: result.resolvedAddress,
          httpStatus: result.httpStatus
        }
      });

      // Calculate availability
      const totalChecks = (host.totalChecks || 0) + 1;
      const isFailed = result.status === 'OFFLINE' || result.status === 'TIMEOUT';
      const failedChecks = (host.failedChecks || 0) + (isFailed ? 1 : 0);
      const availability = Math.round(((totalChecks - failedChecks) / totalChecks) * 1000) / 10;

      const previousStatus = host.status;
      const updatedHost = await dataRepository.updateHost(hostId, {
        status: result.status,
        lastLatency: result.responseTime,
        lastPacketLoss: result.packetLoss,
        lastChecked: new Date(),
        availability,
        totalChecks,
        failedChecks,
      });

      // Process Alerts & Events
      await this.handleAlertsAndEvents(host, previousStatus, result);

      // Broadcast update to real-time clients
      this.broadcast('host_checked', {
        host: updatedHost,
        result: probeRecord
      });

      return { host: updatedHost, result: probeRecord };
    } catch (err) {
      console.error(`[MonitorEngine] Failed probing host ${host.name}:`, err.message);
      return null;
    }
  }

  async handleAlertsAndEvents(host, previousStatus, result) {
    const hostId = String(host._id);
    const now = Date.now();
    const cooldownMs = 3 * 60 * 1000; // 3 minutes cooldown

    // 1. Host became OFFLINE
    if (result.status === 'OFFLINE' || result.status === 'TIMEOUT') {
      const activeAlerts = await dataRepository.getActiveAlertsForHost(host._id, 'UNREACHABLE');
      const lastFired = this.alertCooldowns.get(`${hostId}:UNREACHABLE`) || 0;

      if (activeAlerts.length === 0 && (now - lastFired) > cooldownMs) {
        this.alertCooldowns.set(`${hostId}:UNREACHABLE`, now);
        const alert = await dataRepository.createAlert({
          hostId: host._id,
          hostName: host.name,
          type: 'UNREACHABLE',
          severity: 'CRITICAL',
          message: `Host "${host.name}" (${host.address}) is unreachable. Probe returned ${result.status} with 100% packet loss.`,
          value: result.packetLoss || 100,
          threshold: 0,
        });

        await dataRepository.recordEvent({
          type: 'HOST_OFFLINE',
          severity: 'CRITICAL',
          message: `Host "${host.name}" went OFFLINE (${result.errorMessage || 'Packet Loss: 100%'})`,
          hostId,
          hostName: host.name,
        });

        this.broadcast('alert_created', alert);
      }
    }

    // 2. Host RECOVERED to ONLINE
    if (result.status === 'ONLINE' && (previousStatus === 'OFFLINE' || previousStatus === 'TIMEOUT')) {
      // Auto-resolve unreachable alerts
      const activeAlerts = await dataRepository.getActiveAlertsForHost(host._id, 'UNREACHABLE');
      for (const alert of activeAlerts) {
        await dataRepository.updateAlertStatus(String(alert._id), 'RESOLVED');
      }

      const evt = await dataRepository.recordEvent({
        type: 'HOST_RECOVERED',
        severity: 'INFO',
        message: `Host "${host.name}" recovered and is now ONLINE with ${result.responseTime}ms latency.`,
        hostId,
        hostName: host.name,
      });

      this.broadcast('host_recovered', { hostId, hostName: host.name, event: evt });
    }

    // 3. Response-Time threshold exceeded (Latency Spike)
    if (result.status === 'DEGRADED' || (result.status === 'ONLINE' && result.thresholdExceeded)) {
      const activeAlerts = await dataRepository.getActiveAlertsForHost(host._id, 'HIGH_LATENCY');
      const lastFired = this.alertCooldowns.get(`${hostId}:HIGH_LATENCY`) || 0;

      if (activeAlerts.length === 0 && (now - lastFired) > cooldownMs) {
        this.alertCooldowns.set(`${hostId}:HIGH_LATENCY`, now);
        const alert = await dataRepository.createAlert({
          hostId: host._id,
          hostName: host.name,
          type: 'HIGH_LATENCY',
          severity: 'WARNING',
          message: `Host "${host.name}" response time (${result.responseTime}ms) exceeded configured threshold (${host.thresholdMs}ms).`,
          value: result.responseTime,
          threshold: host.thresholdMs,
        });

        await dataRepository.recordEvent({
          type: 'ALERT_TRIGGERED',
          severity: 'WARNING',
          message: `High latency threshold breach for "${host.name}": ${result.responseTime}ms > ${host.thresholdMs}ms`,
          hostId,
          hostName: host.name,
        });

        this.broadcast('alert_created', alert);
      }
    }

    // 4. If latency restored below threshold, auto-resolve HIGH_LATENCY alerts
    if (result.status === 'ONLINE' && !result.thresholdExceeded) {
      const activeAlerts = await dataRepository.getActiveAlertsForHost(host._id, 'HIGH_LATENCY');
      for (const alert of activeAlerts) {
        await dataRepository.updateAlertStatus(String(alert._id), 'RESOLVED');
      }
    }
  }

  // Trigger immediate check on single host
  async probeSingleHost(hostId) {
    const host = await dataRepository.getHostById(hostId);
    if (!host) throw new Error('Host not found');
    return await this.probeAndProcessHost(host);
  }
}

export const monitorEngine = new MonitorEngine();
