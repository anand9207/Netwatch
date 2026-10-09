import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

export const MonitoringHistory = () => {
  const { hosts, addToast } = useOutletContext();
  const [results, setResults] = useState([]);
  const [selectedHostId, setSelectedHostId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    loadResults();
  }, [selectedHostId, limit]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const res = await api.getAllResults({
        hostId: selectedHostId || undefined,
        limit,
      });
      if (res.success) {
        setResults(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.hostName && r.hostName.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q)) ||
      (r.probeType && r.probeType.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="uppercase tracking-widest text-slate-400 text-[11px]">
              AUDITABLE MEASUREMENTS LEDGER
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
              {results.length} RECORDED ENTRIES
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Monitoring Telemetry & Probe History
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Immutable chronological log of all ICMP, TCP, DNS, and HTTP probe executions with exact round-trip latencies, loss percentages, and packet counts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(api.getExportCsvUrl(), '_blank')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={loadResults}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Query Controls */}
      <div className="rounded-xl bg-[#101827] border border-slate-800 p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Host Filter Dropdown */}
          <select
            value={selectedHostId}
            onChange={(e) => setSelectedHostId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs cursor-pointer min-w-[180px]"
          >
            <option value="">All Monitored Hosts</option>
            {hosts.map((h) => (
              <option key={h._id || h.id} value={h._id || h.id}>
                {h.name} ({h.address})
              </option>
            ))}
          </select>

          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search history records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800 text-xs">
          {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE', 'TIMEOUT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl bg-[#101827] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#080D18] border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Host Name</th>
                <th className="py-3 px-4 font-semibold">Address</th>
                <th className="py-3 px-4 font-semibold">Protocol</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Latency</th>
                <th className="py-3 px-4 font-semibold">Loss</th>
                <th className="py-3 px-4 font-semibold">Sent/Recv</th>
                <th className="py-3 px-4 font-semibold">Error / Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No probe records found matching the specified parameters.
                  </td>
                </tr>
              ) : (
                filteredResults.map((record) => {
                  const isOnline = record.status === 'ONLINE';
                  const isDegraded = record.status === 'DEGRADED';

                  return (
                    <tr
                      key={record._id || record.id}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {record.hostName}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-bold">
                        {record.address}
                      </td>
                      <td className="py-3 px-4 text-purple-400">
                        {record.probeType || 'ICMP'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={record.status} size="xs" />
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {record.responseTime !== null ? (
                          <span className={isDegraded ? 'text-amber-400' : isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                            {record.responseTime} ms
                          </span>
                        ) : (
                          <span className="text-rose-400">Unreachable</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={(record.packetLoss || 0) > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {record.packetLoss ?? 0}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {record.packetsSent || 1} / {record.packetsReceived ?? (isOnline ? 1 : 0)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={record.errorMessage || 'OK'}>
                        {record.errorMessage ? (
                          <span className="text-rose-400">{record.errorMessage}</span>
                        ) : (
                          <span className="text-slate-400">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
