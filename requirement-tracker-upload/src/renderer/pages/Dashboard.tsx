import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../App';
import type { Requirement } from '../types';

interface Stats {
  totalRequirements: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  pendingSubRequirements: number;
  deptStats: { targetDept: string; total: number; completed: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReqs, setRecentReqs] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/stats`).then(r => r.json()),
      fetch(`${API_BASE}/api/requirements`).then(r => r.json()),
    ]).then(([s, reqs]) => {
      setStats(s);
      setRecentReqs((reqs as Requirement[]).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">加载中...</div>;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    analyzing: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const priorityColors: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">仪表盘</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">总需求数</div>
          <div className="text-3xl font-bold mt-2">{stats?.totalRequirements || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">进行中</div>
          <div className="text-3xl font-bold mt-2 text-purple-600">{stats?.byStatus?.in_progress || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">待处理子需求</div>
          <div className="text-3xl font-bold mt-2 text-orange-600">{stats?.pendingSubRequirements || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">已完成</div>
          <div className="text-3xl font-bold mt-2 text-green-600">{stats?.byStatus?.completed || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">状态分布</h3>
          <div className="space-y-2">
            {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-sm ${statusColors[status] || ''}`}>
                  {status}
                </span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="h-2 bg-gray-200 rounded flex-1 max-w-xs">
                    <div
                      className="h-2 bg-blue-500 rounded"
                      style={{ width: `${(count as number / (stats?.totalRequirements || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">优先级分布</h3>
          <div className="space-y-2">
            {Object.entries(stats?.byPriority || {}).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className={`font-medium ${priorityColors[priority] || ''}`}>
                  {priority === 'urgent' ? '紧急' : priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
                </span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="h-2 bg-gray-200 rounded flex-1 max-w-xs">
                    <div
                      className={`h-2 rounded ${priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-orange-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'}`}
                      style={{ width: `${(count as number / (stats?.totalRequirements || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">最近需求</h3>
          <Link to="/requirements" className="text-blue-600 hover:underline">查看全部</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">标题</th>
              <th className="pb-2">优先级</th>
              <th className="pb-2">状态</th>
              <th className="pb-2">更新时间</th>
            </tr>
          </thead>
          <tbody>
            {recentReqs.map((req) => (
              <tr key={req.id} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  <Link to={`/requirements/${req.id}`} className="text-blue-600 hover:underline">
                    {req.title}
                  </Link>
                </td>
                <td className={`py-3 font-medium ${priorityColors[req.priority]}`}>
                  {req.priority === 'urgent' ? '紧急' : req.priority === 'high' ? '高' : req.priority === 'medium' ? '中' : '低'}
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-sm ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </td>
                <td className="py-3 text-gray-500">{new Date(req.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}