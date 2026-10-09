import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Wrench,
  Radio,
  Shield,
  Server,
  Zap,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';

export const DiagnosticsTools = () => {
  const { addToast } = useOutletContext();

  // Tool 1: Ping
  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [pingCount, setPingCount] = useState(4);
  const [pingResult, setPingResult] = useState(null);
  const [runningPing, setRunningPing] = useState(false);

  // Tool 2: TCP
  const [tcpTarget, setTcpTarget] = useState('cloudflare.com');
  const [tcpPort, setTcpPort] = useState(443);
  const [tcpResult, setTcpResult] = useState(null);
  const [runningTcp, setRunningTcp] = useState(false);

  // Tool 3: DNS
  const [dnsTarget, setDnsTarget] = useState('google.com');
  const [dnsResult, setDnsResult] = useState(null);
  const [runningDns, setRunningDns] = useState(false);

  // System info
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const res = await api.getSystemInfo();
      if (res.success) setSystemInfo(res.data);
    } catch (err) {
      console.error('Failed to load system info:', err);
    }
  };

  const handleRunPing = async (e) => {
    e.preventDefault();
    setRunningPing(true);
    setPingResult(null);
    try {
      const res = await api.runQuickPing(pingTarget, pingCount);
      if (res.success) {
        setPingResult(res.data);
        addToast(`Ping probe finished for ${pingTarget}`, 'success');
      } else {
        addToast(res.error || 'Ping failed', 'error');
      }
    } catch (err) {
      addToast('Ping execution error', 'error');
    } finally {
      setRunningPing(false);
    }
  };

  const handleRunTcp = async (e) => {
    e.preventDefault();
    setRunningTcp(true);
    setTcpResult(null);
    try {
      const res = await api.runTcpCheck(tcpTarget, tcpPort);
      if (res.success) {
        setTcpResult(res.data);
        addToast(`TCP check completed on port ${tcpPort}`, 'success');
      } else {
        addToast(res.error || 'TCP check failed', 'error');
      }
    } catch (err) {
      addToast('TCP execution error', 'error');
    } finally {
      setRunningTcp(false);
    }
  };

  const handleRunDns = async (e) => {
    e.preventDefault();
    setRunningDns(true);
    setDnsResult(null);
    try {
      const res = await api.runDnsLookup(dnsTarget);
      if (res.success) {
        setDnsResult(res.data);
        addToast(`DNS resolved for ${dnsTarget}`, 'success');
      } else {
        addToast(res.error || 'DNS lookup failed', 'error');
      }
    } catch (err) {
      addToast('DNS execution error', 'error');
    } finally {
      setRunningDns(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="uppercase tracking-widest text-slate-400 text-[11px]">
              ON-DEMAND NETWORK PROBERS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
              LAYER 3, 4 & 7 DIAGNOSTICS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Network Diagnostic Probers & Local Stack Inspector
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Execute manual diagnostic probes to test ICMP echo requests, Layer-4 TCP three-way handshakes, and Application-Layer DNS lookups.
          </p>
        </div>
      </div>

      {/* Grid: 3 Interactive Network Probers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tool 1: Safe ICMP Ping Tool */}
        <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <Radio className="w-4 h-4" />
              <span>ICMP PING PROBER (RFC 792)</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-4">
              Sends ICMP Type 8 Echo Requests to measure round-trip time and packet loss.
            </p>

            <form onSubmit={handleRunPing} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">TARGET IP / HOSTNAME</label>
                <input
                  type="text"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">PROBE COUNT: {pingCount}</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={pingCount}
                  onChange={(e) => setPingCount(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={runningPing}
                className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {runningPing ? 'Probing ICMP Packets...' : 'Execute Ping'}
              </button>
            </form>
          </div>

          {/* Result Box */}
          {pingResult && (
            <div className="mt-4 p-3 rounded-lg bg-[#080D18] border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Status:</span>
                <span className={pingResult.status === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {pingResult.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mean Latency:</span>
                <span className="text-slate-100 font-bold">{pingResult.responseTime ?? 'N/A'} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Packet Loss:</span>
                <span className={pingResult.packetLoss > 0 ? 'text-amber-400' : 'text-slate-200'}>
                  {pingResult.packetLoss}% ({pingResult.packetsSent} sent / {pingResult.packetsReceived} recv)
                </span>
              </div>
              {pingResult.errorMessage && (
                <div className="text-rose-400 pt-1 border-t border-slate-800">
                  {pingResult.errorMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tool 2: TCP Handshake Prober */}
        <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
              <Zap className="w-4 h-4" />
              <span>LAYER-4 TCP PORT CHECK</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-4">
              Tests TCP SYN-ACK 3-way handshake roundtrip. Ideal when ICMP is filtered by firewalls.
            </p>

            <form onSubmit={handleRunTcp} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">TARGET HOST</label>
                <input
                  type="text"
                  value={tcpTarget}
                  onChange={(e) => setTcpTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">PORT (1 - 65535)</label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={tcpPort}
                  onChange={(e) => setTcpPort(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={runningTcp}
                className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {runningTcp ? 'Initiating SYN-ACK...' : 'Connect Port'}
              </button>
            </form>
          </div>

          {/* Result Box */}
          {tcpResult && (
            <div className="mt-4 p-3 rounded-lg bg-[#080D18] border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Port {tcpPort} Status:</span>
                <span className={tcpResult.status === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {tcpResult.status === 'ONLINE' ? 'OPEN / RESPONSIVE' : 'CLOSED / FILTERED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Handshake Latency:</span>
                <span className="text-slate-100 font-bold">{tcpResult.responseTime ?? 'N/A'} ms</span>
              </div>
              {tcpResult.errorMessage && (
                <div className="text-rose-400 pt-1 border-t border-slate-800">
                  {tcpResult.errorMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tool 3: DNS Resolver Prober */}
        <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <Globe className="w-4 h-4" />
              <span>DNS RESOLUTION LOOKUP</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-4">
              Queries DNS resolver to map domain names into IPv4 addresses and benchmark lookup latency.
            </p>

            <form onSubmit={handleRunDns} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">DOMAIN NAME</label>
                <input
                  type="text"
                  value={dnsTarget}
                  onChange={(e) => setDnsTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="pt-7">
                <button
                  type="submit"
                  disabled={runningDns}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {runningDns ? 'Resolving DNS...' : 'Resolve Domain'}
                </button>
              </div>
            </form>
          </div>

          {/* Result Box */}
          {dnsResult && (
            <div className="mt-4 p-3 rounded-lg bg-[#080D18] border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Resolution:</span>
                <span className={dnsResult.status === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {dnsResult.status === 'ONLINE' ? 'RESOLVED' : 'FAILED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resolved IPv4:</span>
                <span className="text-cyan-400 font-bold">{dnsResult.resolvedAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Query Latency:</span>
                <span className="text-slate-100 font-bold">{dnsResult.responseTime ?? 'N/A'} ms</span>
              </div>
              {dnsResult.errorMessage && (
                <div className="text-rose-400 pt-1 border-t border-slate-800">
                  {dnsResult.errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Local Network Interfaces Inspector */}
      {systemInfo && (
        <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  HOST SYSTEM NETWORK INTERFACES & HARDWARE STACK
                </h3>
                <p className="text-[11px] text-slate-400">
                  Inspected network adapters, MAC addresses, IPv4/IPv6 addresses, subnet netmasks, and CIDR.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Host: <span className="text-slate-200 font-bold">{systemInfo.hostname}</span> • OS:{' '}
              <span className="text-cyan-300 font-bold">{systemInfo.platform}</span> ({systemInfo.arch})
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(systemInfo.networkInterfaces || {}).map(([ifName, addrs]) => (
              <div
                key={ifName}
                className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800 space-y-2 text-[11px]"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-bold text-cyan-400">{ifName}</span>
                  <span className="text-slate-400 text-[10px]">{addrs.length} bindings</span>
                </div>
                {addrs.map((a, i) => (
                  <div key={i} className="space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{a.family}:</span>
                      <span className="text-slate-200 font-bold truncate max-w-[170px]" title={a.address}>
                        {a.address}
                      </span>
                    </div>
                    {a.netmask && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Netmask:</span>
                        <span className="text-slate-300">{a.netmask}</span>
                      </div>
                    )}
                    {a.mac && a.mac !== '00:00:00:00:00:00' && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">MAC (Layer 2):</span>
                        <span className="text-purple-300">{a.mac}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
