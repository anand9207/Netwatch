import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Gauge,
  Zap,
  Radio,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
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
  Legend,
} from 'recharts';
import { api } from '../services/api';

export const PerformanceAnalytics = () => {
  const { hosts, addToast } = useOutletContext();
  const [timeframe, setTimeframe] = useState('24h');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Controlled throughput benchmark test state
  const [throughputResult, setThroughputResult] = useState(null);
  const [runningThroughput, setRunningThroughput] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics({ timeframe });
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunThroughput = async () => {
    setRunningThroughput(true);
    try {
      const res = await api.runThroughputTest();
      if (res.success) {
        setThroughputResult(res.data);
        addToast(`Benchmark complete: ${res.data.dataRateMbps} Mbps data rate`, 'success');
      }
    } catch (err) {
      addToast('Controlled throughput test failed', 'error');
    } finally {
      setRunningThroughput(false);
    }
  };

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
    addToast('Historical CSV export initiated', 'info');
  };

  const trends = analytics?.trends || [];
  const distribution = analytics?.distribution || [];
  const hostComparison = analytics?.hostComparison || [];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="uppercase tracking-widest text-slate-400 text-[11px]">
              DATA COMMUNICATION & PERFORMANCE ANALYSIS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
              CN SYLLABUS UNIT 2 & 3
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Network Performance & Latency Analytics
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Detailed statistical metrics including Round-Trip Time (min/avg/max RTT), Packet Loss %, SLA Availability Index, and controlled throughput data rate benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800 text-xs">
            {['1h', '6h', '24h', '7d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-[11px] transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Average Latency"
          value={analytics?.avgResponseTime ?? 0}
          unit="ms"
          subtitle="Mean Round-Trip Time"
          icon={Clock}
          accent="cyan"
        />
        <MetricCard
          title="Min Latency"
          value={analytics?.minLatency ?? 0}
          unit="ms"
          subtitle="Fastest observed probe"
          icon={TrendingUp}
          accent="green"
        />
        <MetricCard
          title="Max Latency"
          value={analytics?.maxLatency ?? 0}
          unit="ms"
          subtitle="Peak jitter spike"
          icon={Activity}
          accent="amber"
        />
        <MetricCard
          title="Total Probes"
          value={analytics?.totalChecks ?? 0}
          subtitle={`${analytics?.successfulChecks ?? 0} success / ${analytics?.failedChecks ?? 0} fail`}
          icon={Layers}
          accent="violet"
        />
        <MetricCard
          title="Availability"
          value={analytics?.availabilityPct ?? 100}
          unit="%"
          subtitle="(Success / Total) * 100"
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Packet Loss"
          value={analytics?.avgPacketLoss ?? 0}
          unit="%"
          subtitle="Multi-probe drop rate"
          icon={XCircle}
          accent={analytics?.avgPacketLoss > 0 ? 'red' : 'cyan'}
        />
      </div>

      {/* RTT Latency Dynamics Chart */}
      <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              TEMPORAL RESPONSE-TIME VARIATION (RTT DYNAMICS)
            </h3>
            <p className="text-[11px] text-slate-400">
              Evaluated over window ({timeframe}). Demonstrates network delay, queuing, and propagation time.
            </p>
          </div>
          <span className="text-[11px] text-cyan-400 font-bold">
            {trends.length} Time Bins
          </span>
        </div>

        <div className="h-64 w-full">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#35D9FF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#35D9FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101827',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgLatency"
                  name="Mean RTT (ms)"
                  stroke="#35D9FF"
                  strokeWidth={2}
                  fill="url(#latencyAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical trends recorded for this window yet.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Host-by-Host Comparative & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Host-by-Host Comparative Chart */}
        <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl">
          <div className="mb-4 pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              HOST-BY-HOST COMPARATIVE LATENCY (MS)
            </h3>
            <p className="text-[11px] text-slate-400">
              Comparative round-trip time benchmarks across all configured endpoints.
            </p>
          </div>

          <div className="h-64 w-full">
            {hostComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hostComparison} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    fontSize={9}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101827',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="avgLatency" name="Avg Latency (ms)" fill="#35D9FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Awaiting comparative host data...
              </div>
            )}
          </div>
        </div>

        {/* Latency Distribution Histogram */}
        <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl">
          <div className="mb-4 pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              RESPONSE TIME DISTRIBUTION SPECTRUM
            </h3>
            <p className="text-[11px] text-slate-400">
              Packet arrival delay histogram demonstrating queuing latency clusters.
            </p>
          </div>

          <div className="h-64 w-full">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="range" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101827',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="count" name="Probes in Range" fill="#36D399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Awaiting distribution data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controlled Network Throughput Benchmark Tool */}
      <div className="rounded-xl bg-gradient-to-r from-[#101827] via-[#101827] to-[#151F32] border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Gauge className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-wider">
                CONTROLLED TRANSMISSION THROUGHPUT TEST (DATA RATE)
              </h3>
              <p className="text-slate-400 text-xs">
                Accurately measures effective bandwidth using a controlled data transfer payload. Adheres strictly to Computer Networks rules: does not confuse Ping Latency (RTT) with Bandwidth (Data Rate)!
              </p>
            </div>
          </div>

          <button
            onClick={handleRunThroughput}
            disabled={runningThroughput}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${runningThroughput ? 'animate-spin' : ''}`} />
            {runningThroughput ? 'Transferring 500KB Chunk...' : 'Measure Throughput (Mbps)'}
          </button>
        </div>

        {/* Benchmark Results Display */}
        {throughputResult ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#080D18] border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Measured Data Rate
              </span>
              <span className="text-2xl font-bold text-cyan-400">
                {throughputResult.dataRateMbps} Mbps
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Bits Transferred / Duration
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Payload Size
              </span>
              <span className="text-2xl font-bold text-slate-100">
                {Math.round(throughputResult.bytesTransferred / 1024)} KB
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Controlled byte stream
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Transfer Duration
              </span>
              <span className="text-2xl font-bold text-purple-400">
                {throughputResult.durationMs} ms
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                End-to-end receipt time
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Test Target Point
              </span>
              <span className="text-sm font-bold text-emerald-400 block truncate mt-1">
                {throughputResult.testServer}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {throughputResult.method}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 text-center text-slate-400 text-xs">
            Click "Measure Throughput (Mbps)" to run a verified transmission speed test against a controlled endpoint.
          </div>
        )}

        {/* Academic Syllabus Note */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
          <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-cyan-300">Computer Networks Academic Context:</strong> Latency is the round-trip propagation time of a tiny probe packet (ms), while Throughput is the actual rate of data delivery over a channel (bits per second). Throughput depends on the Bandwidth-Delay Product (BDP) and TCP window size: <code className="text-purple-300">Throughput ≤ Window Size / RTT</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
