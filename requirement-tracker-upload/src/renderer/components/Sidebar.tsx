import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/requirements', label: '需求管理', icon: '📋' },
  { path: '/departments', label: '部门视图', icon: '🏢' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={`bg-slate-800 text-white transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {!collapsed && <h1 className="text-lg font-bold">需求追踪系统</h1>}
        <button onClick={onToggle} className="p-2 hover:bg-slate-700 rounded">
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 hover:bg-slate-700 transition-colors ${
              location.pathname.startsWith(item.path) ? 'bg-slate-700 border-l-4 border-blue-500' : ''
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
        {!collapsed && <span>v1.0.0</span>}
      </div>
    </aside>
  );
}