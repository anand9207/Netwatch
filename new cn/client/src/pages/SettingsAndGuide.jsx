import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings,
  GraduationCap,
  BookOpen,
  Database,
  Layers,
  Shield,
  Radio,
  CheckCircle2,
  Cpu,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsAndGuide = () => {
  const { addToast, refreshData } = useOutletContext();
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.getHealth();
      setHealthData(res);
    } catch (err) {
      console.error('Failed to load health:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="rounded-2xl bg-[#101827] border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="uppercase tracking-widest text-slate-400 text-[11px]">
              SYSTEM CONFIGURATION & CURRICULUM MAPPING
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
              BTECH CSE COMPUTER NETWORKS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Settings & Computer Networks Syllabus Guide
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Detailed breakdown of Computer Networks academic concepts demonstrated in NetWatch, along with server runtime and storage configuration.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Backend & Database Diagnostic Card */}
      <div className="rounded-xl bg-[#101827] border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Database className="w-4 h-4" />
            <span>NOC CORE SERVER & PERSISTENCE DIAGNOSTICS</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {healthData?.status || 'HEALTHY'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Storage Mode</span>
            <div className="text-base font-bold text-slate-100">
              {healthData?.database?.mode === 'mongodb' ? 'MongoDB / Mongoose' : 'High-Performance In-Memory Engine'}
            </div>
            <span className="text-[10px] text-slate-400 block">
              URI: {healthData?.database?.uri || 'mongodb://127.0.0.1:27017/netwatch'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Server Uptime</span>
            <div className="text-base font-bold text-cyan-400">
              {healthData?.uptime ? `${Math.floor(healthData.uptime / 60)} minutes` : 'Active'}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Process ID: Node.js {process.version}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Background Polling Frequency</span>
            <div className="text-base font-bold text-purple-400">
              5000 ms Tick
            </div>
            <span className="text-[10px] text-slate-400 block">
              Concurrency: 5 parallel probes max
            </span>
          </div>
        </div>
      </div>

      {/* Academic Syllabus Guide Section */}
      <div className="rounded-xl bg-[#101827] border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Computer Networks Syllabus Concepts in NetWatch
            </h3>
            <p className="text-[11px] text-slate-400">
              Key theoretical networking topics implemented and demonstrated in this project.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
          {/* Card 1: Data Communication & Latency */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              1. Data Communication & Transmission Performance
            </h4>
            <p className="text-slate-300 leading-relaxed">
              NetWatch distinguishes between <strong>Latency (Round-Trip Time)</strong> and <strong>Bandwidth (Data Rate)</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Propagation Delay:</strong> Time taken for bits to travel across transmission media (governed by speed of light in optical fiber/copper).</li>
              <li><strong>Queuing Delay:</strong> Waiting time in router buffers, causing latency spikes and jitter.</li>
              <li><strong>Packet Loss:</strong> Evaluated by sending probe batches and computing <code className="text-slate-200">Loss% = ((Sent - Recv) / Sent) * 100</code>.</li>
            </ul>
          </div>

          {/* Card 2: Network Topologies */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 space-y-2">
            <h4 className="font-bold text-purple-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              2. Network Topologies & Architecture
            </h4>
            <p className="text-slate-300 leading-relaxed">
              The project visualizes a <strong>Hub-and-Spoke (Centralized NOC)</strong> topology:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Client-Server Architecture:</strong> The NetWatch backend serves as the centralized prober dispatching synchronous and asynchronous requests to distributed targets.</li>
              <li><strong>Star Topology:</strong> Central NOC monitoring core links point-to-point to managed endpoint nodes.</li>
              <li>Failure of a spoke node does not disrupt the central monitoring server.</li>
            </ul>
          </div>

          {/* Card 3: Protocols in TCP/IP Stack */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3. Protocols Across the TCP/IP Stack
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Demonstrates 4 protocols across different layers of the TCP/IP stack:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>ICMP (Network Layer - RFC 792):</strong> Echo Request & Echo Reply packets used for ping and packet loss detection.</li>
              <li><strong>TCP (Transport Layer - RFC 793):</strong> 3-way handshake (SYN, SYN-ACK, ACK) used to measure reliable port connection time.</li>
              <li><strong>DNS (Application Layer - RFC 1035):</strong> Maps human-readable domain names to 32-bit IPv4 addresses.</li>
              <li><strong>HTTP (Application Layer):</strong> Measures Time-to-First-Byte (TTFB) and HTTP response status codes.</li>
            </ul>
          </div>

          {/* Card 4: IPv4 Addressing & Subnets */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              4. IPv4 Addressing & Subnetting (CIDR)
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Implements strict address validation and subnet inspection:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>RFC 5735 Loopback (127.0.0.1/8):</strong> Host internal loopback bus for zero-latency testing.</li>
              <li><strong>Subnet Masks:</strong> Inspected from active local network adapters (e.g. 255.255.255.0 /24).</li>
              <li><strong>MAC Addressing (Data Link Layer):</strong> Hexadecimal 48-bit hardware addresses retrieved from network interface cards.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
