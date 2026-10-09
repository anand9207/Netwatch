import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Radio,
  Zap,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { NetworkTopology } from '../components/NetworkTopology';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';

export const Overview = () => {
  const { dashboardData, hosts, onSelectHost, onAddHost } = useOutletContext();
  const [timeframe, setTimeframe] = useState('24h');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const metrics = dashboardData?.metrics || {
    overallStatus: 'OPTIMAL',
    totalHosts: hosts.length,
    onlineCount: hosts.filter((h) => h.status === 'ONLINE').length,
    offlineCount: hosts.filter((h) => h.status === 'OFFLINE').length,
    avgResponseTime: 0,
    avgAvailability: 100,
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoadingCharts(true);
    try {
      const res = await api.getAnalytics({ timeframe });
      if (res.success) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoadingCharts(false);
    }
  };

  const chartTrends = analyticsData?.trends || [];
  const events = dashboardData?.recentEvents || [];
  const recentProbes = dashboardData?.recentProbes || [];

  return (
    <div className="space-y-6">
      {/* Top NOC Status Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#101827] via-[#101827] to-[#0A101D] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/10">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                NOC SYSTEM TELEMETRY
              </span>
              <StatusBadge status={metrics.overallStatus} size="sm" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">
              Real-Time Network Performance & Probe Infrastructure
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddHost}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            Configure Host
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Overall Status"
          value={metrics.overallStatus}
          subtitle="Real-time health"
          icon={ShieldCheck}
          accent={metrics.overallStatus === 'CRITICAL' ? 'red' : metrics.overallStatus === 'DEGRADED' ? 'amber' : 'green'}
          badge="NOC Core"
        />
        <MetricCard
          title="Monitored Hosts"
          value={metrics.totalHosts}
          unit="targets"
          subtitle="Active configurations"
          icon={Server}
          accent="cyan"
          badge="IPv4 / FQDN"
        />
        <MetricCard
          title="Online Hosts"
          value={metrics.onlineCount}
          unit={`/ ${metrics.totalHosts}`}
          subtitle="Responding probes"
          icon={CheckCircle2}
          accent="green"
          badge="Reachable"
        />
        <MetricCard
          title="Offline Hosts"
          value={metrics.offlineCount}
          unit="targets"
          subtitle="Unresponsive / Timeout"
          icon={XCircle}
          accent={metrics.offlineCount > 0 ? 'red' : 'cyan'}
          badge={metrics.offlineCount > 0 ? 'Warning' : 'Nominal'}
        />
        <MetricCard
          title="Avg Latency"
          value={metrics.avgResponseTime}
          unit="ms"
          subtitle="Round-trip time (RTT)"
          icon={Clock}
          accent="violet"
          badge="Real Ping"
        />
        <MetricCard
          title="Availability"
          value={metrics.avgAvailability}
          unit="%"
          subtitle="SLA Index Formula"
          icon={TrendingUp}
          accent="green"
          badge="Recorded SLA"
        />
      </div>

      {/* Centerpiece: Interactive Network Topology Panel */}
      <NetworkTopology
        hosts={hosts}
        onSelectHost={onSelectHost}
        onAddHost={onAddHost}
        isLive={true}
      />

      {/* Grid: Charts & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-Time Performance Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latency Trend Area Chart */}
          <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80 font-mono">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  RESPONSE-TIME TELEMETRY TREND
                </h3>
                <p className="text-[11px] text-slate-400">
                  Aggregated Round-Trip Time (RTT) in milliseconds over recorded probes.
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800 text-xs">
                {['1h', '6h', '24h', '7d'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              {chartTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#35D9FF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#35D9FF" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF647C" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FF647C" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} fontFamily="monospace" />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="ms" fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101827',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#F1F5F9',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgLatency"
                      name="Avg Latency (ms)"
                      stroke="#35D9FF"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#cyanGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  Gathering sufficient time-series data for timeframe ({timeframe})...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Mean Round-Trip Latency (ms)</span>
              </span>
              <span>Total Probes Evaluated: {analyticsData?.totalChecks || 0}</span>
            </div>
          </div>

          {/* Host Latency Distribution Bar Chart */}
          <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80 font-mono">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  LATENCY DISTRIBUTION HISTOGRAM
                </h3>
                <p className="text-[11px] text-slate-400">
                  Categorized round-trip times demonstrating Computer Networks packet delay intervals.
                </p>
              </div>
              <Link to="/analytics" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                Deep Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-48 w-full">
              {analyticsData?.distribution ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.distribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="range" stroke="#475569" fontSize={10} tickLine={false} fontFamily="monospace" />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101827',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Bar dataKey="count" name="Probes Count" fill="#9875FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  Loading distribution telemetry...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Activity Feed & Recent Events */}
        <div className="space-y-6">
          <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                RECENT ACTIVITY FEED
              </h3>
              <Link to="/alerts" className="text-[11px] text-cyan-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No activity logged yet. System is monitoring network.
                </div>
              ) : (
                events.map((evt) => {
                  const isCrit = evt.severity === 'CRITICAL';
                  const isWarn = evt.severity === 'WARNING';
                  const borderClass = isCrit
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : isWarn
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-slate-800 bg-[#080D18]';

                  return (
                    <div
                      key={evt._id || evt.id}
                      className={`p-3 rounded-lg border ${borderClass} transition-colors hover:border-slate-700`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold text-[11px] ${
                            isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-cyan-400'
                          }`}
                        >
                          {evt.type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {evt.message}
                      </p>
                      {evt.hostName && (
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Target: {evt.hostName}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
