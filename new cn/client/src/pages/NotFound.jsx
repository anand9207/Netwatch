import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, Activity } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 font-mono text-xs">
      <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 animate-pulse">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black text-slate-100 tracking-tight mb-2">
        404 — ROUTE UNREACHABLE
      </h1>
      <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
        ICMP Destination Unreachable: The requested route or resource does not exist within the NetWatch NOC console routing table.
      </p>
      <Link
        to="/"
        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Return to Overview Dashboard
      </Link>
    </div>
  );
};
