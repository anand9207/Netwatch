import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { NetworkTopology } from '../components/NetworkTopology';
import { StatusBadge } from '../components/StatusBadge';
import {
  Network,
  Activity,
  Server,
  Layers,
  Radio,
  Wifi,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react';

export const TopologyPage = () => {
  const { hosts, onSelectHost, onAddHost } = useOutletContext();
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-slate-400">
              TOPOLOGY VISUALIZER
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              STAR / HUB-AND-SPOKE NOC ARCHITECTURE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Network Topology & Active Node Graph
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Interactive real-time graph model mapping the central NetWatch monitoring server to configured targets. Demonstrates Computer Networks syllabus concepts: Hub-and-Spoke Topology, Client-Server architecture, and IP layer routing.
          </p>
        </div>

        <button
          onClick={onAddHost}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
        >
          <Activity className="w-4 h-4" />
          Add Monitored Node
        </button>
      </div>

      {/* Main Interactive Map */}
      <NetworkTopology
        hosts={hosts}
        onSelectHost={(host) => {
          setSelectedNode(host);
          if (onSelectHost) onSelectHost(host);
        }}
        onAddHost={onAddHost}
        isLive={true}
      />

      {/* Subnet / Tier Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#101827] border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Layers className="w-4 h-4" />
            <span>TIER 1: LOOPBACK & GATEWAY</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Local loopback interfaces (RFC 5735 / 127.0.0.1) provide zero-packet-drop, sub-millisecond local network stack baselines.
          </p>
          <div className="pt-2 text-[11px] text-slate-300">
            Nodes: {hosts.filter((h) => h.address.startsWith('127.') || h.tags?.includes('Gateway')).length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101827] border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Radio className="w-4 h-4" />
            <span>TIER 2: GLOBAL ANYCAST DNS</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            High-availability Anycast IP resolvers (1.1.1.1, 8.8.8.8, 9.9.9.9) routed via BGP to the geographically closest edge PoP.
          </p>
          <div className="pt-2 text-[11px] text-slate-300">
            Nodes: {hosts.filter((h) => h.tags?.includes('DNS') || h.tags?.includes('Anycast')).length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101827] border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Wifi className="w-4 h-4" />
            <span>TIER 3: APPLICATION SERVICES</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Layer 7 Web and API endpoints tested via TCP/HTTP probes to verify Transport Layer handshakes and TTFB latency.
          </p>
          <div className="pt-2 text-[11px] text-slate-300">
            Nodes: {hosts.filter((h) => h.probeType === 'HTTP' || h.probeType === 'TCP').length}
          </div>
        </div>
      </div>
    </div>
  );
};
