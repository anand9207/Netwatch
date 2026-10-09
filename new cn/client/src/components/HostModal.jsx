import React, { useState, useEffect } from 'react';
import { X, Server, Shield, Check, AlertCircle } from 'lucide-react';

export const HostModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    probeType: 'ICMP',
    port: 80,
    interval: 30,
    thresholdMs: 150,
    enabled: true,
    tags: 'Core, Infrastructure',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        description: initialData.description || '',
        probeType: initialData.probeType || 'ICMP',
        port: initialData.port || 80,
        interval: initialData.interval || 30,
        thresholdMs: initialData.thresholdMs || 150,
        enabled: initialData.enabled !== undefined ? initialData.enabled : true,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
      });
    } else {
      setFormData({
        name: '',
        address: '',
        description: '',
        probeType: 'ICMP',
        port: 80,
        interval: 30,
        thresholdMs: 150,
        enabled: true,
        tags: 'Core, Infrastructure',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide a host name.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please provide an IP address or hostname.');
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      address: formData.address.trim(),
      port: Number(formData.port) || 80,
      interval: Math.max(5, Number(formData.interval) || 30),
      thresholdMs: Math.max(5, Number(formData.thresholdMs) || 150),
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Monitored'],
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#101827] border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D18]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
                {isEditing ? 'Modify Monitored Host' : 'Register Monitored Host'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure IP target, probe protocol, and latency thresholds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                HOST NAME *
              </label>
              <input
                type="text"
                placeholder="e.g. Cloudflare Edge DNS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                IP OR HOSTNAME *
              </label>
              <input
                type="text"
                placeholder="e.g. 1.1.1.1 or cloudflare.com"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              DESCRIPTION / ROLE
            </label>
            <input
              type="text"
              placeholder="e.g. Edge DNS Resolver & Anycast Gateway"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                PROBE PROTOCOL
              </label>
              <select
                value={formData.probeType}
                onChange={(e) => setFormData({ ...formData, probeType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs cursor-pointer"
              >
                <option value="ICMP">ICMP Echo (Ping)</option>
                <option value="TCP">TCP Port Probe</option>
                <option value="HTTP">HTTP/HTTPS Web</option>
                <option value="DNS">DNS Lookup Resolution</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                PORT (FOR TCP/HTTP)
              </label>
              <input
                type="number"
                min="1"
                max="65535"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                POLL INTERVAL (SEC)
              </label>
              <input
                type="number"
                min="5"
                max="3600"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ALERT THRESHOLD (MS)
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                value={formData.thresholdMs}
                onChange={(e) => setFormData({ ...formData, thresholdMs: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              NETWORK TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              placeholder="e.g. Gateway, Anycast, DNS"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#080D18] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="enabledCheck"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="enabledCheck" className="text-slate-300 cursor-pointer">
              Active Monitoring Enabled
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-wider uppercase transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Host' : 'Register Host'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
