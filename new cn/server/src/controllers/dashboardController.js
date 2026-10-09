import { dataRepository } from '../models/dataRepository.js';
import { dbState } from '../config/db.js';

export const dashboardController = {
  async getSummary(req, res) {
    try {
      const hosts = await dataRepository.getAllHosts();
      const events = await dataRepository.getEvents(12);
      const alerts = await dataRepository.getAlerts({ limit: 10 });
      const recentProbes = await dataRepository.getResults({ limit: 20 });

      const totalHosts = hosts.length;
      let onlineCount = 0;
      let offlineCount = 0;
      let degradedCount = 0;
      let unknownCount = 0;

      let totalLatencySum = 0;
      let onlineLatencyCount = 0;
      let totalAvailabilitySum = 0;

      hosts.forEach((h) => {
        if (h.status === 'ONLINE') onlineCount++;
        else if (h.status === 'OFFLINE') offlineCount++;
        else if (h.status === 'DEGRADED') degradedCount++;
        else unknownCount++;

        if (h.lastLatency !== null && h.lastLatency !== undefined && (h.status === 'ONLINE' || h.status === 'DEGRADED')) {
          totalLatencySum += h.lastLatency;
          onlineLatencyCount++;
        }

        totalAvailabilitySum += (h.availability !== undefined ? h.availability : 100);
      });

      const avgResponseTime = onlineLatencyCount > 0 
        ? Math.round((totalLatencySum / onlineLatencyCount) * 10) / 10 
        : 0;

      const avgAvailability = totalHosts > 0 
        ? Math.round((totalAvailabilitySum / totalHosts) * 10) / 10 
        : 100;

      let overallStatus = 'OPTIMAL';
      if (offlineCount > 0) {
        overallStatus = 'CRITICAL';
      } else if (degradedCount > 0 || (totalHosts > 0 && avgAvailability < 95)) {
        overallStatus = 'DEGRADED';
      } else if (totalHosts === 0) {
        overallStatus = 'IDLE';
      }

      // Build Topology Model
      const topologyNodes = [
        {
          id: 'noc-master',
          label: 'NetWatch NOC Core Server',
          type: 'core-server',
          status: 'ONLINE',
          ip: '127.0.0.1 (Localhost)',
          metrics: { role: 'Monitoring Probe Master', os: process.platform }
        },
        ...hosts.map(h => ({
          id: String(h._id),
          label: h.name,
          address: h.address,
          status: h.status,
          probeType: h.probeType || 'ICMP',
          port: h.port,
          latency: h.lastLatency,
          packetLoss: h.lastPacketLoss,
          availability: h.availability,
          type: 'host'
        }))
      ];

      const topologyLinks = hosts.map(h => ({
        id: `link-noc-${h._id}`,
        source: 'noc-master',
        target: String(h._id),
        status: h.status,
        latency: h.lastLatency,
        probeType: h.probeType || 'ICMP',
      }));

      res.json({
        success: true,
        data: {
          metrics: {
            overallStatus,
            totalHosts,
            onlineCount,
            offlineCount,
            degradedCount,
            unknownCount,
            avgResponseTime,
            avgAvailability,
            activeAlertsCount: alerts.filter(a => a.status === 'ACTIVE').length,
          },
          topology: {
            nodes: topologyNodes,
            links: topologyLinks,
          },
          recentEvents: events,
          recentAlerts: alerts.slice(0, 5),
          recentProbes,
          systemState: {
            database: dbState.mode,
            dbConnected: dbState.connected,
            timestamp: new Date(),
          }
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
