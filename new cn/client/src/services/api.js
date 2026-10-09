const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  },

  // Dashboard
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    return await res.json();
  },

  // Hosts
  async getHosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/hosts?${query}`);
    return await res.json();
  },

  async getHost(id) {
    const res = await fetch(`${API_BASE}/hosts/${id}`);
    return await res.json();
  },

  async createHost(data) {
    const res = await fetch(`${API_BASE}/hosts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async updateHost(id, data) {
    const res = await fetch(`${API_BASE}/hosts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async deleteHost(id) {
    const res = await fetch(`${API_BASE}/hosts/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async probeHostNow(id) {
    const res = await fetch(`${API_BASE}/hosts/${id}/probe`, {
      method: 'POST',
    });
    return await res.json();
  },

  async getHostHistory(id, limit = 50) {
    const res = await fetch(`${API_BASE}/hosts/${id}/history?limit=${limit}`);
    return await res.json();
  },

  // Results / History
  async getAllResults(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/results?${query}`);
    return await res.json();
  },

  // Analytics
  async getAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analytics?${query}`);
    return await res.json();
  },

  getExportCsvUrl() {
    return `${API_BASE}/analytics/export`;
  },

  // Alerts
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/alerts?${query}`);
    return await res.json();
  },

  async updateAlertStatus(id, status) {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  // Events
  async getEvents(limit = 50) {
    const res = await fetch(`${API_BASE}/events?limit=${limit}`);
    return await res.json();
  },

  // Diagnostic Tools
  async runQuickPing(target, count = 4, timeoutMs = 2000) {
    const res = await fetch(`${API_BASE}/tools/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, count, timeoutMs }),
    });
    return await res.json();
  },

  async runTcpCheck(target, port = 80, timeoutMs = 3000) {
    const res = await fetch(`${API_BASE}/tools/tcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, port, timeoutMs }),
    });
    return await res.json();
  },

  async runDnsLookup(target) {
    const res = await fetch(`${API_BASE}/tools/dns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    });
    return await res.json();
  },

  async runThroughputTest() {
    const res = await fetch(`${API_BASE}/tools/throughput`, {
      method: 'POST',
    });
    return await res.json();
  },

  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/tools/system-info`);
    return await res.json();
  },
};

// SSE Stream listener helper
export const initSseStream = (onEvent, onError) => {
  let eventSource = null;
  let retryTimeout = null;

  const connect = () => {
    try {
      eventSource = new EventSource(`${API_BASE}/stream`);

      eventSource.onopen = () => {
        onEvent({ type: 'stream_status', status: 'connected' });
      };

      eventSource.addEventListener('host_checked', (e) => {
        const data = JSON.parse(e.data);
        onEvent({ type: 'host_checked', data });
      });

      eventSource.addEventListener('alert_created', (e) => {
        const data = JSON.parse(e.data);
        onEvent({ type: 'alert_created', data });
      });

      eventSource.addEventListener('host_recovered', (e) => {
        const data = JSON.parse(e.data);
        onEvent({ type: 'host_recovered', data });
      });

      eventSource.addEventListener('ping', () => {
        onEvent({ type: 'ping', time: Date.now() });
      });

      eventSource.onerror = (err) => {
        onEvent({ type: 'stream_status', status: 'disconnected' });
        if (eventSource) {
          eventSource.close();
        }
        // Auto-reconnect after 4s
        retryTimeout = setTimeout(connect, 4000);
        if (onError) onError(err);
      };
    } catch (err) {
      if (onError) onError(err);
      retryTimeout = setTimeout(connect, 4000);
    }
  };

  connect();

  return () => {
    if (retryTimeout) clearTimeout(retryTimeout);
    if (eventSource) eventSource.close();
  };
};
