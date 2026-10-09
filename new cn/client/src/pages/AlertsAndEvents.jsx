import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  RefreshCw,
  Shield,
  Activity,
  History,
} from 'lucide-react';
import { api } from '../services/api';

export const AlertsAndEvents = () => {
  const { addToast } = useOutletContext();
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'events'
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WARNING'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, eventsRes] = await Promise.all([
        api.getAlerts({ status: statusFilter, severity: severityFilter }),
        api.getEvents(80),
      ]);
      if (alertsRes.success) setAlerts(alertsRes.data || []);
      if (eventsRes.success) setEvents(eventsRes.data || []);
    } catch (err) {
      console.error('Failed to load alerts/events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      const res = await api.updateAlertStatus(alertId, newStatus);
      if (res.success) {
        addToast(`Alert marked as ${newStatus}`, 'success');
        setAlerts((prev) =>
          prev.map((a) => (String(a._id || a.id) === String(alertId) ? res.data : a))
        );
      }
    } catch (err) {
      addToast('Failed to update alert status', 'error');
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="uppercase tracking-widest text-slate-400 text-[11px]">
              INCIDENT RESPONSE & EVENT LOGS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
              {alerts.filter((a) => a.status === 'ACTIVE').length} ACTIVE ALERTS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Alert Operations & System Events Feed
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Automated threshold evaluation, host unreachability detection, intelligent cooldown deduplication, and full audit trail of network state changes.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#101827] rounded-xl p-1.5 gap-2 max-w-md">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'alerts'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alert Incidents ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'events'
              ? 'bg-slate-800 text-purple-400 shadow-sm border border-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Events ({events.length})</span>
        </button>
      </div>

      {/* Filter Bar (Alerts Tab) */}
      {activeTab === 'alerts' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#101827] border border-slate-800 shadow-sm">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800">
              {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-800 text-cyan-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Severity:</span>
            <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800">
              {['ALL', 'CRITICAL', 'WARNING'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#101827] border border-slate-800 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No alerts found matching filter criteria. Network operating within nominal thresholds.</span>
            </div>
          ) : (
            alerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isResolved = alert.status === 'RESOLVED';
              const isAck = alert.status === 'ACKNOWLEDGED';

              return (
                <div
                  key={alert._id || alert.id}
                  className={`p-4 rounded-xl border transition-all shadow-md ${
                    isCrit
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-amber-500/5 border-amber-500/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {isCrit ? (
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-100 text-sm">
                        {alert.type}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          isCrit ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          isResolved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isAck
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {alert.status}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-200 text-xs leading-relaxed my-2">
                    {alert.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div>
                      Target Host: <strong className="text-slate-200">{alert.hostName}</strong>
                      {alert.value !== null && alert.threshold !== null && (
                        <span className="ml-2 text-cyan-400">
                          (Value: {alert.value}ms / Threshold: {alert.threshold}ms)
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isResolved && (
                      <div className="flex items-center gap-2">
                        {alert.status !== 'ACKNOWLEDGED' && (
                          <button
                            onClick={() => handleUpdateStatus(alert._id || alert.id, 'ACKNOWLEDGED')}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(alert._id || alert.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content: Events */}
      {activeTab === 'events' && (
        <div className="rounded-xl bg-[#101827] border border-slate-800 shadow-xl overflow-hidden">
          <div className="divide-y divide-slate-800/80">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No system events recorded.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt._id || evt.id}
                  className="p-3.5 hover:bg-slate-850/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-rose-400'
                          : evt.severity === 'WARNING'
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{evt.type}</span>
                        {evt.hostName && (
                          <span className="text-[10px] text-cyan-400 font-mono">
                            [{evt.hostName}]
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        {evt.message}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
