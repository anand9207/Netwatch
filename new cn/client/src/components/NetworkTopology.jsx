import React, { useState, useMemo } from 'react';
import { Server, Globe, Shield, Activity, Wifi, Radio, ExternalLink, HardDrive } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const NetworkTopology = ({
  hosts = [],
  onSelectHost,
  onAddHost,
  onProbeHost,
  isLive = true
}) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState('radial'); // 'radial' | 'tree'

  // Filter hosts
  const filteredHosts = useMemo(() => {
    if (filterStatus === 'ALL') return hosts;
    return hosts.filter(h => h.status === filterStatus);
  }, [hosts, filterStatus]);

  // Topology node positioning calculations
  const { nodes, links, dimensions } = useMemo(() => {
    const width = 850;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;

    const centerNode = {
      id: 'noc-master',
      name: 'NetWatch NOC Core',
      address: '127.0.0.1 (Localhost)',
      type: 'master',
      status: 'ONLINE',
      probeType: 'CORE',
      x: centerX,
      y: centerY,
    };

    const hostNodes = [];
    const hostLinks = [];

    const total = filteredHosts.length;

    if (layoutMode === 'radial') {
      const radiusX = Math.min(320, width * 0.38);
      const radiusY = Math.min(180, height * 0.38);

      filteredHosts.forEach((host, index) => {
        // Distribute radially around center with elliptical compensation
        const angle = (index / (total || 1)) * (2 * Math.PI) - (Math.PI / 2);
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);

        const node = {
          ...host,
          id: String(host._id || host.id),
          x,
          y,
          type: 'host',
        };

        hostNodes.push(node);
        hostLinks.push({
          id: `link-${node.id}`,
          source: centerNode,
          target: node,
          status: node.status,
          latency: node.lastLatency,
        });
      });
    } else {
      // Tree / Hierarchical NOC Tier mode
      // Top: NOC Core; Bottom: Layer rows
      centerNode.x = centerX;
      centerNode.y = 75;

      const itemsPerRow = Math.min(5, Math.max(3, total));
      filteredHosts.forEach((host, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const countInRow = Math.min(itemsPerRow, total - row * itemsPerRow);
        
        const spacingX = width / (countInRow + 1);
        const x = spacingX * (col + 1);
        const y = 230 + row * 140;

        const node = {
          ...host,
          id: String(host._id || host.id),
          x,
          y,
          type: 'host',
        };

        hostNodes.push(node);
        hostLinks.push({
          id: `link-${node.id}`,
          source: centerNode,
          target: node,
          status: node.status,
          latency: node.lastLatency,
        });
      });
    }

    return {
      nodes: [centerNode, ...hostNodes],
      links: hostLinks,
      dimensions: { width, height, centerX, centerY }
    };
  }, [filteredHosts, layoutMode]);

  // Node icon selector
  const getNodeIcon = (node) => {
    if (node.type === 'master') return HardDrive;
    const p = (node.probeType || '').toUpperCase();
    if (p === 'HTTP') return Globe;
    if (p === 'DNS') return Shield;
    if (node.tags && node.tags.includes('Gateway')) return Wifi;
    return Server;
  };

  if (hosts.length === 0) {
    return (
      <div className="rounded-xl bg-[#101827] border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 animate-pulse">
          <Activity className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 font-mono mb-2">
          No Monitored Hosts Configured
        </h3>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          The Network Topology visualization displays real-time connectivity between your local NetWatch NOC server and configured target hosts. Add an IPv4 address or hostname to initiate monitoring.
        </p>
        <button
          onClick={onAddHost}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Activity className="w-4 h-4" />
          Add First Monitored Host
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl bg-[#101827] border border-slate-800 p-4 sm:p-5 shadow-2xl overflow-hidden flex flex-col">
      {/* Topology Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide flex items-center gap-2">
              LIVE NETWORK TOPOLOGY
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-500/20">
                {filteredHosts.length} NODES
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time interactive NOC graph. Click any node to inspect telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-[#080D18] rounded-lg p-0.5 border border-slate-800 text-xs">
            {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Layout Mode Toggle */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'radial' ? 'tree' : 'radial')}
            className="px-2.5 py-1 rounded-lg bg-[#080D18] hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono transition-colors cursor-pointer"
            title="Toggle Radial / Hierarchical Layout"
          >
            {layoutMode === 'radial' ? 'RADIAL NOC' : 'TIER TREE'}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] max-h-[520px] rounded-lg bg-[#080D18]/90 border border-slate-900 noc-grid-bg flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full select-none"
        >
          <defs>
            {/* Glow filters */}
            <filter id="glow-cyan-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Link Gradients */}
            <linearGradient id="grad-online" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#35D9FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#36D399" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-degraded" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#35D9FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFBD59" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-offline" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF647C" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Orbital Guidelines (radial mode only) */}
          {layoutMode === 'radial' && (
            <g className="opacity-20 pointer-events-none">
              <ellipse
                cx={dimensions.centerX}
                cy={dimensions.centerY}
                rx={Math.min(320, dimensions.width * 0.38)}
                ry={Math.min(180, dimensions.height * 0.38)}
                fill="none"
                stroke="#35D9FF"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <ellipse
                cx={dimensions.centerX}
                cy={dimensions.centerY}
                rx={Math.min(180, dimensions.width * 0.22)}
                ry={Math.min(100, dimensions.height * 0.22)}
                fill="none"
                stroke="#9875FF"
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
            </g>
          )}

          {/* Links between NOC Core and Hosts */}
          <g className="links">
            {links.map((link) => {
              const isHovered = hoveredNode?.id === link.target.id;
              const isOnline = link.status === 'ONLINE';
              const isDegraded = link.status === 'DEGRADED';
              const isOffline = link.status === 'OFFLINE' || link.status === 'TIMEOUT';

              let strokeColor = '#36D399';
              let strokeDash = isOnline ? '6 6' : (isDegraded ? '4 4' : 'none');
              if (isDegraded) strokeColor = '#FFBD59';
              if (isOffline) strokeColor = '#FF647C';

              // Smooth quadratic bezier curve for aesthetic technical feel
              const midX = (link.source.x + link.target.x) / 2;
              const midY = (link.source.y + link.target.y) / 2;
              const pathData = `M ${link.source.x} ${link.source.y} Q ${midX} ${midY - 10} ${link.target.x} ${link.target.y}`;

              return (
                <g key={link.id}>
                  {/* Background link track */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeOpacity={isHovered ? 0.9 : 0.25}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-300"
                  />

                  {/* Animated moving pulse packet on active links */}
                  {isLive && isOnline && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? 3 : 2}
                      strokeDasharray="8 20"
                      className="animate-pulse"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="28"
                        to="0"
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </path>
                  )}

                  {/* Latency badge on link center when hovered or active */}
                  {link.latency !== null && link.latency !== undefined && isOnline && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-20"
                        y="-10"
                        width="40"
                        height="18"
                        rx="9"
                        fill="#080D18"
                        stroke={strokeColor}
                        strokeWidth="0.8"
                        className="opacity-90"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fill={strokeColor}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {Math.round(link.latency)}ms
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Render Nodes */}
          <g className="nodes">
            {nodes.map((node) => {
              const isMaster = node.type === 'master';
              const isHovered = hoveredNode?.id === node.id;
              const Icon = getNodeIcon(node);

              const statusColor = node.status === 'ONLINE'
                ? '#36D399'
                : node.status === 'DEGRADED'
                ? '#FFBD59'
                : node.status === 'OFFLINE'
                ? '#FF647C'
                : '#94A3B8';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => !isMaster && onSelectHost && onSelectHost(node)}
                >
                  {/* Master Node Pulse Aura */}
                  {isMaster && (
                    <>
                      <circle
                        r="34"
                        fill="none"
                        stroke="#35D9FF"
                        strokeWidth="1"
                        className="animate-ping opacity-25"
                      />
                      <circle
                        r="28"
                        fill="#101827"
                        stroke="#35D9FF"
                        strokeWidth="2"
                        className="shadow-cyan-500"
                      />
                    </>
                  )}

                  {/* Host Node Base */}
                  {!isMaster && (
                    <>
                      {/* Hover ring */}
                      {isHovered && (
                        <circle
                          r="26"
                          fill="none"
                          stroke={statusColor}
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="animate-spin"
                        />
                      )}
                      <circle
                        r="20"
                        fill="#101827"
                        stroke={statusColor}
                        strokeWidth={isHovered ? 2.5 : 1.8}
                        className="transition-all duration-200"
                      />
                    </>
                  )}

                  {/* Icon */}
                  <foreignObject
                    x={isMaster ? -14 : -10}
                    y={isMaster ? -14 : -10}
                    width={isMaster ? 28 : 20}
                    height={isMaster ? 28 : 20}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex items-center justify-center text-slate-100">
                      <Icon className={isMaster ? 'w-6 h-6 text-cyan-400' : 'w-4 h-4'} style={{ color: !isMaster ? statusColor : undefined }} />
                    </div>
                  </foreignObject>

                  {/* Labels underneath node */}
                  <g transform="translate(0, 30)">
                    <text
                      textAnchor="middle"
                      fill="#F1F5F9"
                      fontSize={isMaster ? 11 : 10}
                      fontFamily="monospace"
                      fontWeight="600"
                      className="pointer-events-none"
                    >
                      {node.name.length > 18 ? node.name.slice(0, 16) + '..' : node.name}
                    </text>
                    <text
                      y="12"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="monospace"
                      className="pointer-events-none"
                    >
                      {node.address}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div
            className="absolute z-20 pointer-events-none bg-[#101827]/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl backdrop-blur-md min-w-[210px] text-xs font-mono"
            style={{
              left: Math.min(window.innerWidth - 250, Math.max(16, (hoveredNode.x / dimensions.width) * 100 + '%')),
              top: Math.max(16, (hoveredNode.y / dimensions.height) * 80 + '%'),
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-semibold text-slate-100 truncate">{hoveredNode.name}</span>
              <StatusBadge status={hoveredNode.status} size="xs" />
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Address:</span>
                <span className="text-cyan-400 font-bold">{hoveredNode.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Protocol:</span>
                <span className="text-purple-400">{hoveredNode.probeType || 'ICMP'} {hoveredNode.port ? `:${hoveredNode.port}` : ''}</span>
              </div>
              {hoveredNode.type !== 'master' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response Time:</span>
                    <span className={hoveredNode.lastLatency !== null ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {hoveredNode.lastLatency !== null ? `${hoveredNode.lastLatency} ms` : 'Unreachable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Availability:</span>
                    <span className="text-slate-200">{hoveredNode.availability ?? 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packet Loss:</span>
                    <span className={hoveredNode.lastPacketLoss > 0 ? 'text-amber-400' : 'text-slate-300'}>
                      {hoveredNode.lastPacketLoss ?? 0}%
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-cyan-400/80 text-center">
              Click node to open Host Intelligence
            </div>
          </div>
        )}
      </div>

      {/* Topology Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>DEGRADED / HIGH LATENCY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>OFFLINE / DROPPED</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Packet Probes: Round-Robin Heartbeat</span>
        </div>
      </div>
    </div>
  );
};
