import { dataRepository } from '../models/dataRepository.js';

export const alertController = {
  async getAlerts(req, res) {
    try {
      const { status, severity, limit } = req.query;
      const alerts = await dataRepository.getAlerts({ status, severity, limit: limit || 100 });
      res.json({ success: true, count: alerts.length, data: alerts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateAlertStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid alert status. Must be ACTIVE, ACKNOWLEDGED, or RESOLVED.' });
      }

      const updated = await dataRepository.updateAlertStatus(id, status);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
      }

      await dataRepository.recordEvent({
        type: 'ALERT_TRIGGERED',
        severity: 'INFO',
        message: `Alert "${updated.message}" was updated to status: ${status}`,
        hostId: updated.hostId,
        hostName: updated.hostName,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
