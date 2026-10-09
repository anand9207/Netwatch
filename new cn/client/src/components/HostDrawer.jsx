import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Activity, Shield, AlertTriangle, Clock, Server, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

export const HostDrawer = ({
  host,
  onClose,
  onEdit,
  onDelete,
  onHostUpdated,
}) => {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [probing, setProbing] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'history' | 'alerts'

  useEffect(() => {
    if (host?._id || host?.id) {
      loadHostDetails();
    }
  }, [host]);

  const loadHostDetails = async () => {
    const id = host._id || host.id;
    setLoading(true);
    try {
      const res = await api.getHost(id);
      if (res.success) {
        setHistory(res.data.history || []);
        setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load host history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProbeNow = async () => {
    const id = host._id || host.id;
    setProbing(true);
    try {
      const res = await api.probeHostNow(id);
      if (res.success) {
        await loadHostDetails();
        if (onHostUpdated) onHostUpdated(res.data.host);
      }
    } catch (err) {
      console.error('Probe failed:', err);
    } finally {
      setProbing(false);
    }
  };

  if (!host) return null;

  // Chart data formatted chronologically
  const chartData = [...history]
    .reverse()
    .map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      latency: item.responseTime !== null ? item.responseTime : null,
      loss: item.packetLoss || 0,
      status: item.status,
    }));

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-[#101827] border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D18]/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">
                {host.name}
              </h2>
              <StatusBadge status={host.status} size="xs" />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {host.address} {host.port ? `:${host.port}` : ''} • {host.probeType || 'ICMP'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Bar */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={handleProbeNow}
            disabled={probing}
            className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            {probing ? 'Probing...' : 'Probe Now'}
          </button>
          <button
            onClick={() => onEdit && onEdit(host)}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Edit Config
          </button>
        </div>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Interval: {host.interval || 30}s
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#080D18]/50 px-5 text-xs font-mono">
        {[
          { id: 'metrics', label: 'METRICS & TELEMETRY' },
          { id: 'history', label: `PROBE LOGS (${history.length})` },
          { id: 'alerts', label: `ALERTS (${alerts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3 border-b-2 font-medium tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === 'metrics' && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Latest Response Time
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {host.lastLatency !== null && host.lastLatency !== undefined ? host.lastLatency : '--'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ms</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Threshold: {host.thresholdMs || 150} ms
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Availability Index
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {host.availability !== undefined ? host.availability : 100}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Total Probes: {host.totalChecks || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Packet Loss
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold font-mono ${(host.lastPacketLoss || 0) > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                    {host.lastPacketLoss !== null && host.lastPacketLoss !== undefined ? `${host.lastPacketLoss}%` : '0%'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Failed: {host.failedChecks || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Probe Protocol
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold font-mono text-purple-400">
                    {host.probeType || 'ICMP'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block truncate">
                  Port: {host.port || 'Default'}
                </span>
              </div>
            </div>

            {/* Latency History Chart */}
            <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-medium text-slate-300">
                  RESPONSE TIME DYNAMICS (RTT)
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  Last {chartData.length} Checks
                </span>
              </div>

              {chartData.length > 0 ? (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#35D9FF" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#35D9FF" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} unit="ms" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#101827',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="latency"
                        stroke="#35D9FF"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#latencyGradient)"
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center text-xs text-slate-400 font-mono">
                  No historical measurements recorded yet.
                </div>
              )}
            </div>

            {/* Host Config Summary */}
            <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 text-xs font-mono space-y-2">
              <span className="text-xs font-bold text-slate-200 block mb-2">
                CONFIGURATION SPECIFICATIONS
              </span>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Host Identifier:</span>
                <span className="text-slate-200">{host._id || host.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Target Destination:</span>
                <span className="text-cyan-400">{host.address}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Description:</span>
                <span className="text-slate-300">{host.description || 'No description provided'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Last Monitored:</span>
                <span className="text-slate-300">
                  {host.lastChecked ? new Date(host.lastChecked).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Tags:</span>
                <span className="text-purple-400">
                  {(host.tags || []).join(', ') || 'General'}
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-mono">
                No probe logs available for this host.
              </div>
            ) : (
              history.map((record) => (
                <div
                  key={record._id || record.id}
                  className="p-3 rounded-lg bg-[#080D18] border border-slate-800 flex items-center justify-between text-xs font-mono hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {record.status === 'ONLINE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : record.status === 'DEGRADED' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {record.responseTime !== null ? `${record.responseTime} ms` : 'Unreachable'}
                        </span>
                        <StatusBadge status={record.status} size="xs" />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(record.timestamp).toLocaleTimeString()} • Packet Loss: {record.packetLoss}%
                      </span>
                    </div>
                  </div>

                  {record.errorMessage && (
                    <span className="text-[10px] text-rose-400 max-w-[140px] truncate" title={record.errorMessage}>
                      {record.errorMessage}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-mono">
                No active or historic alerts logged for this host.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert._id || alert.id}
                  className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800 space-y-1.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alert.type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Destructive Actions */}
      <div className="p-4 border-t border-slate-800 bg-[#080D18] flex items-center justify-between text-xs font-mono">
        <button
          onClick={() => onDelete && onDelete(host)}
          className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
        >
          Remove Host
        </button>
        <span className="text-slate-400 text-[11px]">
          ID: {(host._id || host.id).slice(0, 8)}...
        </span>
      </div>
    </div>
  );
};
