import mongoose from 'mongoose';

const hostSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  probeType: {
    type: String,
    enum: ['ICMP', 'TCP', 'HTTP', 'DNS'],
    default: 'ICMP'
  },
  port: { type: Number, default: 80 },
  interval: { type: Number, default: 30, min: 5, max: 3600 },
  thresholdMs: { type: Number, default: 150, min: 1, max: 5000 },
  enabled: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  lastLatency: { type: Number, default: null },
  lastPacketLoss: { type: Number, default: null },
  lastChecked: { type: Date, default: null },
  availability: { type: Number, default: 100 },
  totalChecks: { type: Number, default: 0 },
  failedChecks: { type: Number, default: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

const monitoringResultSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Host', required: true },
  hostName: { type: String, required: true },
  address: { type: String, required: true },
  probeType: { type: String, default: 'ICMP' },
  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'DEGRADED', 'TIMEOUT'],
    required: true
  },
  responseTime: { type: Number, default: null },
  packetLoss: { type: Number, default: 0 },
  packetsSent: { type: Number, default: 1 },
  packetsReceived: { type: Number, default: 1 },
  errorMessage: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
});

const alertSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Host' },
  hostName: { type: String, required: true },
  type: {
    type: String,
    enum: ['UNREACHABLE', 'HIGH_LATENCY', 'PACKET_LOSS', 'PROBE_FAILED'],
    required: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'INFO'],
    default: 'WARNING'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'ACTIVE'
  },
  message: { type: String, required: true },
  value: { type: Number, default: null },
  threshold: { type: Number, default: null },
  acknowledgedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['HOST_ADDED', 'HOST_UPDATED', 'HOST_DELETED', 'HOST_OFFLINE', 'HOST_RECOVERED', 'ALERT_TRIGGERED', 'SYSTEM_START'],
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO'
  },
  message: { type: String, required: true },
  hostId: { type: String, default: null },
  hostName: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

export const HostModel = mongoose.model('Host', hostSchema);
export const MonitoringResultModel = mongoose.model('MonitoringResult', monitoringResultSchema);
export const AlertModel = mongoose.model('Alert', alertSchema);
export const EventModel = mongoose.model('Event', eventSchema);
