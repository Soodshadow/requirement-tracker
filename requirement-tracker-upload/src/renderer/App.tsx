import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Requirements from './pages/Requirements';
import DepartmentView from './pages/DepartmentView';
import RequirementDetail from './pages/RequirementDetail';
import Sidebar from './components/Sidebar';

declare global {
  interface Window {
    electronAPI?: {
      getServerUrl: () => Promise<string>;
    };
  }
}

export const API_BASE = 'http://localhost:3001';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/requirements/:id" element={<RequirementDetail />} />
            <Route path="/departments" element={<DepartmentView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}