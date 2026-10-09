import { dataRepository } from '../models/dataRepository.js';

export const analyticsController = {
  async getAnalytics(req, res) {
    try {
      const { timeframe = '24h', hostId } = req.query;

      let hours = 24;
      if (timeframe === '1h') hours = 1;
      else if (timeframe === '6h') hours = 6;
      else if (timeframe === '24h') hours = 24;
      else if (timeframe === '7d') hours = 168;

      const hosts = await dataRepository.getAllHosts();
      const results = await dataRepository.getResults({ hostId, hours, limit: 1000 });

      const totalChecks = results.length;
      let successfulChecks = 0;
      let failedChecks = 0;
      let totalLatency = 0;
      let minLatency = null;
      let maxLatency = null;
      let totalPacketLoss = 0;

      // Latency distribution buckets
      const distribution = {
        '0-15ms': 0,
        '15-50ms': 0,
        '50-100ms': 0,
        '100-200ms': 0,
        '200ms+': 0,
      };

      // Trend data points grouped by interval
      const trendMap = new Map();

      // Host by host aggregation
      const hostStatsMap = new Map();
      hosts.forEach(h => {
        hostStatsMap.set(String(h._id), {
          id: String(h._id),
          name: h.name,
          address: h.address,
          checks: 0,
          success: 0,
          failed: 0,
          latencySum: 0,
          lossSum: 0,
          minLatency: null,
          maxLatency: null,
        });
      });

      results.forEach((r) => {
        const isOnline = r.status === 'ONLINE' || r.status === 'DEGRADED';
        if (isOnline) {
          successfulChecks++;
          if (r.responseTime !== null && r.responseTime !== undefined) {
            totalLatency += r.responseTime;
            if (minLatency === null || r.responseTime < minLatency) minLatency = r.responseTime;
            if (maxLatency === null || r.responseTime > maxLatency) maxLatency = r.responseTime;

            // Distribution
            if (r.responseTime < 15) distribution['0-15ms']++;
            else if (r.responseTime < 50) distribution['15-50ms']++;
            else if (r.responseTime < 100) distribution['50-100ms']++;
            else if (r.responseTime < 200) distribution['100-200ms']++;
            else distribution['200ms+']++;
          }
        } else {
          failedChecks++;
        }

        totalPacketLoss += (r.packetLoss || 0);

        // Group trend into time buckets
        const ts = new Date(r.timestamp);
        // Round to 5min / 15min / 1hour based on timeframe
        const stepMs = hours <= 1 ? 2 * 60 * 1000 : (hours <= 6 ? 10 * 60 * 1000 : 30 * 60 * 1000);
        const bucketKey = Math.floor(ts.getTime() / stepMs) * stepMs;
        if (!trendMap.has(bucketKey)) {
          trendMap.set(bucketKey, { count: 0, sumLatency: 0, sumLoss: 0 });
        }
        const b = trendMap.get(bucketKey);
        b.count++;
        b.sumLatency += (r.responseTime || 0);
        b.sumLoss += (r.packetLoss || 0);

        // Host breakdown
        const hid = String(r.hostId);
        if (hostStatsMap.has(hid)) {
          const hs = hostStatsMap.get(hid);
          hs.checks++;
          if (isOnline) {
            hs.success++;
            if (r.responseTime !== null) {
              hs.latencySum += r.responseTime;
              if (hs.minLatency === null || r.responseTime < hs.minLatency) hs.minLatency = r.responseTime;
              if (hs.maxLatency === null || r.responseTime > hs.maxLatency) hs.maxLatency = r.responseTime;
            }
          } else {
            hs.failed++;
          }
          hs.lossSum += (r.packetLoss || 0);
        }
      });

      const avgResponseTime = successfulChecks > 0 ? Math.round((totalLatency / successfulChecks) * 10) / 10 : 0;
      const availabilityPct = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 1000) / 10 : 100;
      const avgPacketLoss = totalChecks > 0 ? Math.round((totalPacketLoss / totalChecks) * 10) / 10 : 0;

      // Format trends sorted chronologically
      const trendData = Array.from(trendMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([timeMs, data]) => {
          const date = new Date(timeMs);
          return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTimestamp: date.toISOString(),
            avgLatency: data.count > 0 ? Math.round((data.sumLatency / data.count) * 10) / 10 : 0,
            avgLoss: data.count > 0 ? Math.round((data.sumLoss / data.count) * 10) / 10 : 0,
            probesCount: data.count
          };
        });

      // Format host comparison
      const hostComparison = Array.from(hostStatsMap.values()).map(hs => ({
        id: hs.id,
        name: hs.name,
        address: hs.address,
        totalChecks: hs.checks,
        avgLatency: hs.success > 0 ? Math.round((hs.latencySum / hs.success) * 10) / 10 : null,
        minLatency: hs.minLatency,
        maxLatency: hs.maxLatency,
        availability: hs.checks > 0 ? Math.round((hs.success / hs.checks) * 1000) / 10 : 100,
        packetLossPct: hs.checks > 0 ? Math.round((hs.lossSum / hs.checks) * 10) / 10 : 0,
      }));

      res.json({
        success: true,
        data: {
          period: timeframe,
          hours,
          totalChecks,
          successfulChecks,
          failedChecks,
          availabilityPct,
          avgResponseTime,
          minLatency: minLatency ?? 0,
          maxLatency: maxLatency ?? 0,
          avgPacketLoss,
          distribution: Object.entries(distribution).map(([range, count]) => ({ range, count })),
          trends: trendData,
          hostComparison,
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async exportCsv(req, res) {
    try {
      const results = await dataRepository.getResults({ limit: 2000 });
      let csv = 'Timestamp,Host Name,Address,Probe Type,Status,Response Time (ms),Packet Loss (%),Packets Sent,Packets Received,Error Message\n';

      results.forEach(r => {
        const time = new Date(r.timestamp).toISOString();
        const hostName = `"${(r.hostName || '').replace(/"/g, '""')}"`;
        const address = `"${(r.address || '').replace(/"/g, '""')}"`;
        const probeType = r.probeType || 'ICMP';
        const status = r.status;
        const latency = r.responseTime !== null ? r.responseTime : 'N/A';
        const loss = r.packetLoss !== undefined ? r.packetLoss : '0';
        const sent = r.packetsSent || 1;
        const recv = r.packetsReceived || 0;
        const error = `"${(r.errorMessage || '').replace(/"/g, '""')}"`;

        csv += `${time},${hostName},${address},${probeType},${status},${latency},${loss},${sent},${recv},${error}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=netwatch_measurements_${Date.now()}.csv`);
      res.send(csv);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
