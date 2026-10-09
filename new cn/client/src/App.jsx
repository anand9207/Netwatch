import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Overview } from './pages/Overview';
import { TopologyPage } from './pages/TopologyPage';
import { HostMonitoring } from './pages/HostMonitoring';
import { PerformanceAnalytics } from './pages/PerformanceAnalytics';
import { AlertsAndEvents } from './pages/AlertsAndEvents';
import { MonitoringHistory } from './pages/MonitoringHistory';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Overview />} />
          <Route path="topology" element={<TopologyPage />} />
          <Route path="hosts" element={<HostMonitoring />} />
          <Route path="analytics" element={<PerformanceAnalytics />} />
          <Route path="alerts" element={<AlertsAndEvents />} />
          <Route path="history" element={<MonitoringHistory />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
