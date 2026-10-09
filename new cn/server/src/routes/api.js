import express from 'express';
import { hostController } from '../controllers/hostController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { alertController } from '../controllers/alertController.js';
import { eventController } from '../controllers/eventController.js';
import { networkToolsController } from '../controllers/networkToolsController.js';
import { dataRepository } from '../models/dataRepository.js';
import { dbState } from '../config/db.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'NetWatch NOC Core Engine',
    database: {
      mode: dbState.mode,
      connected: dbState.connected,
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date(),
  });
});

// Dashboard Summary
router.get('/dashboard/summary', dashboardController.getSummary);

// Host Monitoring Management
router.get('/hosts', hostController.getHosts);
router.post('/hosts', hostController.createHost);
router.get('/hosts/:id', hostController.getHostById);
router.put('/hosts/:id', hostController.updateHost);
router.delete('/hosts/:id', hostController.deleteHost);
router.post('/hosts/:id/probe', hostController.probeNow);

router.get('/hosts/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;
    const results = await dataRepository.getResults({ hostId: id, limit: Number(limit) });
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// All Results (Monitoring History)
router.get('/results', async (req, res) => {
  try {
    const { hostId, limit = 100, hours } = req.query;
    const results = await dataRepository.getResults({ hostId, limit: Number(limit), hours: hours ? Number(hours) : undefined });
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Analytics
router.get('/analytics', analyticsController.getAnalytics);
router.get('/analytics/export', analyticsController.exportCsv);

// Alerts
router.get('/alerts', alertController.getAlerts);
router.patch('/alerts/:id', alertController.updateAlertStatus);

// Events
router.get('/events', eventController.getEvents);

// Network Diagnostic Tools
router.post('/tools/ping', networkToolsController.runPing);
router.post('/tools/tcp', networkToolsController.runTcpCheck);
router.post('/tools/dns', networkToolsController.runDnsLookup);
router.post('/tools/throughput', networkToolsController.runThroughput);
router.get('/tools/system-info', networkToolsController.getSystemInfo);

export default router;
