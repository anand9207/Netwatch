import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { HostDrawer } from '../components/HostDrawer';
import { HostModal } from '../components/HostModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';
import { api, initSseStream } from '../services/api';

export const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sseStatus, setSseStatus] = useState('connected');

  // Modals & Drawers state
  const [selectedHost, setSelectedHost] = useState(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState(null);
  const [deletingHost, setDeletingHost] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch summary and hosts data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [summaryRes, hostsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getHosts(),
      ]);

      if (summaryRes.success) {
        setDashboardData(summaryRes.data);
      }
      if (hostsRes.success) {
        setHosts(hostsRes.data || []);
      }
      setLastUpdated(new Date());

      if (isManual) {
        addToast('Telemetry refreshed from network engine', 'success');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (isManual) {
        addToast('Failed to refresh network metrics', 'error');
      }
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, [addToast]);

  // Initial load and periodic fallback poll every 15s
  useEffect(() => {
    fetchData();
    const timer = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Real-Time Server-Sent Events (SSE) Stream listener
  useEffect(() => {
    const cleanup = initSseStream(
      (event) => {
        if (event.type === 'stream_status') {
          setSseStatus(event.status);
        } else if (event.type === 'host_checked') {
          const { host } = event.data;
          // Update host in state
          setHosts((prev) =>
            prev.map((h) => (String(h._id || h.id) === String(host._id || host.id) ? host : h))
          );
          setLastUpdated(new Date());

          // If currently open in drawer, update drawer host
          setSelectedHost((curr) => {
            if (curr && String(curr._id || curr.id) === String(host._id || host.id)) {
              return host;
            }
            return curr;
          });
        } else if (event.type === 'alert_created') {
          const alert = event.data;
          addToast(`ALERT: ${alert.message}`, alert.severity === 'CRITICAL' ? 'error' : 'warning');
          fetchData(false);
        } else if (event.type === 'host_recovered') {
          const { hostName } = event.data;
          addToast(`RECOVERED: Host "${hostName}" is back online`, 'success');
          fetchData(false);
        }
      },
      (err) => {
        console.warn('SSE connection issue, falling back to background polling');
      }
    );

    return cleanup;
  }, [addToast, fetchData]);

  // Host CRUD handlers
  const handleCreateOrUpdateHost = async (formData) => {
    if (editingHost) {
      const res = await api.updateHost(editingHost._id || editingHost.id, formData);
      if (res.success) {
        addToast(`Host "${formData.name}" updated successfully`, 'success');
        fetchData(false);
      } else {
        throw new Error(res.error || 'Failed to update host');
      }
    } else {
      const res = await api.createHost(formData);
      if (res.success) {
        addToast(`Host "${formData.name}" registered and initial probe scheduled`, 'success');
        fetchData(false);
      } else {
        throw new Error(res.error || 'Failed to add host');
      }
    }
  };

  const handleDeleteHostConfirm = async () => {
    if (!deletingHost) return;
    try {
      const res = await api.deleteHost(deletingHost._id || deletingHost.id);
      if (res.success) {
        addToast(`Host "${deletingHost.name}" removed from monitoring`, 'info');
        if (selectedHost && String(selectedHost._id || selectedHost.id) === String(deletingHost._id || deletingHost.id)) {
          setSelectedHost(null);
        }
        setDeletingHost(null);
        fetchData(false);
      }
    } catch (err) {
      addToast('Failed to delete host', 'error');
    }
  };

  const activeAlertsCount = dashboardData?.metrics?.activeAlertsCount || 0;

  return (
    <div className="min-h-screen bg-[#080D18] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeAlertsCount={activeAlertsCount}
        sseStatus={sseStatus}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Command Bar */}
        <Navbar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onRefresh={() => fetchData(true)}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          hosts={hosts}
          onSelectHost={(h) => setSelectedHost(h)}
          systemState={dashboardData?.systemState}
        />

        {/* Dynamic Route Pages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet
            context={{
              dashboardData,
              hosts,
              refreshData: () => fetchData(true),
              onSelectHost: (h) => setSelectedHost(h),
              onAddHost: () => {
                setEditingHost(null);
                setIsHostModalOpen(true);
              },
              onEditHost: (h) => {
                setEditingHost(h);
                setIsHostModalOpen(true);
              },
              onDeleteHost: (h) => setDeletingHost(h),
              addToast,
            }}
          />
        </main>
      </div>

      {/* Host Details Drawer */}
      {selectedHost && (
        <HostDrawer
          host={selectedHost}
          onClose={() => setSelectedHost(null)}
          onEdit={(h) => {
            setEditingHost(h);
            setIsHostModalOpen(true);
          }}
          onDelete={(h) => setDeletingHost(h)}
          onHostUpdated={(updated) => {
            setSelectedHost(updated);
            fetchData(false);
          }}
        />
      )}

      {/* Add / Edit Host Modal */}
      <HostModal
        isOpen={isHostModalOpen}
        onClose={() => {
          setIsHostModalOpen(false);
          setEditingHost(null);
        }}
        onSubmit={handleCreateOrUpdateHost}
        initialData={editingHost}
        isEditing={Boolean(editingHost)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingHost)}
        title="Remove Monitored Host?"
        message={`Are you sure you want to remove "${deletingHost?.name}" (${deletingHost?.address})? All recorded telemetry and monitoring results for this host will be purged.`}
        confirmLabel="Remove Host"
        onConfirm={handleDeleteHostConfirm}
        onCancel={() => setDeletingHost(null)}
      />

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
