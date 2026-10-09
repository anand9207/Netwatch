import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Server,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  Shield,
  Globe,
  Radio,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

export const HostMonitoring = () => {
  const { hosts, onSelectHost, onAddHost, onEditHost, onDeleteHost, refreshData, addToast } =
    useOutletContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'latency' | 'lastChecked' | 'availability'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [probingHostId, setProbingHostId] = useState(null);

  // Filter and Sort hosts
  const filteredHosts = useMemo(() => {
    return hosts
      .filter((h) => {
        if (statusFilter !== 'ALL' && h.status !== statusFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          (h.description && h.description.toLowerCase().includes(q)) ||
          (h.tags && h.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'latency') {
          valA = a.lastLatency !== null && a.lastLatency !== undefined ? a.lastLatency : 999999;
          valB = b.lastLatency !== null && b.lastLatency !== undefined ? b.lastLatency : 999999;
        } else if (sortBy === 'lastChecked') {
          valA = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
          valB = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
        } else if (sortBy === 'availability') {
          valA = a.availability ?? 100;
          valB = b.availability ?? 100;
        } else {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [hosts, search, statusFilter, sortBy, sortOrder]);

  const handleTriggerProbe = async (host, e) => {
    e.stopPropagation();
    const id = host._id || host.id;
    setProbingHostId(id);
    try {
      const res = await api.probeHostNow(id);
      if (res.success) {
        addToast(`Host "${host.name}" probed: ${res.data.result.responseTime ?? 'Unreachable'} ms`, 'success');
        refreshData();
      }
    } catch (err) {
      addToast(`Probe failed for "${host.name}"`, 'error');
    } finally {
      setProbingHostId(null);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Page Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="uppercase tracking-widest text-slate-400 text-[11px]">
              TARGET MANAGEMENT CONSOLE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
              {hosts.length} CONFIGURED TARGETS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Host Monitoring & Probe Operations
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Manage target endpoints, view live latency, configure ICMP/TCP/DNS/HTTP probe parameters, and trigger manual probe telemetry.
          </p>
        </div>

        <button
          onClick={onAddHost}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Monitored Host
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-[#101827] border border-slate-800 p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, address (e.g. 1.1.1.1), or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 text-xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800 text-xs">
            {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE', 'UNKNOWN'].map((st) => (
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

          {/* Quick refresh */}
          <button
            onClick={refreshData}
            className="p-2 rounded-lg bg-[#080D18] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Host Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl bg-[#101827] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#080D18] border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Host Identity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Address / IP</th>
                <th className="py-3 px-4 font-semibold">Protocol</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th
                  onClick={() => toggleSort('latency')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>RTT Latency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('availability')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Availability</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Loss</th>
                <th
                  onClick={() => toggleSort('lastChecked')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Checked</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredHosts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No monitored hosts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHosts.map((host) => {
                  const isProbing = probingHostId === (host._id || host.id);
                  const isDegraded = host.status === 'DEGRADED';
                  const isOnline = host.status === 'ONLINE';

                  return (
                    <tr
                      key={host._id || host.id}
                      onClick={() => onSelectHost && onSelectHost(host)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {host.name}
                          </span>
                        </div>
                        {host.description && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                            {host.description}
                          </span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-cyan-400 font-bold">
                        {host.address}
                        {host.port && host.port !== 80 && (
                          <span className="text-slate-400 font-normal">:{host.port}</span>
                        )}
                      </td>

                      {/* Protocol */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-400 border border-purple-500/20 text-[10px]">
                          {host.probeType || 'ICMP'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={host.status} size="xs" />
                      </td>

                      {/* Latency */}
                      <td className="py-3.5 px-4">
                        {host.lastLatency !== null && host.lastLatency !== undefined ? (
                          <span
                            className={`font-bold ${
                              isDegraded ? 'text-amber-400' : isOnline ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {host.lastLatency} ms
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                        <span className="text-[10px] text-slate-400 block">
                          limit: {host.thresholdMs}ms
                        </span>
                      </td>

                      {/* Availability */}
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {host.availability !== undefined ? `${host.availability}%` : '100%'}
                      </td>

                      {/* Packet Loss */}
                      <td className="py-3.5 px-4">
                        <span
                          className={
                            (host.lastPacketLoss || 0) > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'
                          }
                        >
                          {host.lastPacketLoss !== null && host.lastPacketLoss !== undefined
                            ? `${host.lastPacketLoss}%`
                            : '0%'}
                        </span>
                      </td>

                      {/* Last Checked */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {host.lastChecked
                          ? new Date(host.lastChecked).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Pending'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleTriggerProbe(host, e)}
                            disabled={isProbing}
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer disabled:opacity-50"
                            title="Instant Probe"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => onEditHost && onEditHost(host)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Edit Host"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteHost && onDeleteHost(host)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-slate-950 transition-all cursor-pointer"
                            title="Remove Host"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
        {filteredHosts.map((host) => {
          const isProbing = probingHostId === (host._id || host.id);
          return (
            <div
              key={host._id || host.id}
              onClick={() => onSelectHost && onSelectHost(host)}
              className="p-4 rounded-xl bg-[#101827] border border-slate-800 space-y-3 cursor-pointer hover:border-slate-700 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{host.name}</h3>
                  <span className="text-cyan-400 text-xs font-mono">{host.address}</span>
                </div>
                <StatusBadge status={host.status} size="xs" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Latency</span>
                  <span className="font-bold text-emerald-400">
                    {host.lastLatency !== null ? `${host.lastLatency} ms` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">SLA</span>
                  <span className="text-slate-200">{host.availability ?? 100}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Loss</span>
                  <span className={(host.lastPacketLoss || 0) > 0 ? 'text-amber-400' : 'text-slate-200'}>
                    {host.lastPacketLoss ?? 0}%
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-slate-400">
                  {host.probeType || 'ICMP'} • {host.interval}s
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleTriggerProbe(host, e)}
                    className="p-1 rounded bg-cyan-500/10 text-cyan-400"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => onEditHost && onEditHost(host)}
                    className="p-1 rounded bg-slate-800 text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteHost && onDeleteHost(host)}
                    className="p-1 rounded bg-rose-500/10 text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
