import { dataRepository } from '../models/dataRepository.js';

export const eventController = {
  async getEvents(req, res) {
    try {
      const { limit = 100 } = req.query;
      const events = await dataRepository.getEvents(Number(limit));
      res.json({ success: true, count: events.length, data: events });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
