import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../App';
import type { Requirement, Department } from '../types';
import RequirementModal from '../components/RequirementModal';

export default function Requirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ status: '', priority: '', dept: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [reqs, depts] = await Promise.all([
      fetch(`${API_BASE}/api/requirements`).then(r => r.json()),
      fetch(`${API_BASE}/api/departments`).then(r => r.json()),
    ]);
    setRequirements(reqs as Requirement[]);
    setDepartments(depts as Department[]);
    setLoading(false);
  };

  const filteredReqs = requirements.filter(r => {
    if (filter.status && r.status !== filter.status) return false;
    if (filter.priority && r.priority !== filter.priority) return false;
    if (filter.dept && !r.targetDepts.includes(filter.dept)) return false;
    return true;
  });

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

  if (loading) return <div className="flex items-center justify-center h-64">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">需求管理</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + 新建需求
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex gap-4 flex-wrap">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="analyzing">分析中</option>
          <option value="approved">已批准</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="rejected">已拒绝</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">全部优先级</option>
          <option value="urgent">紧急</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select
          value={filter.dept}
          onChange={(e) => setFilter({ ...filter, dept: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">全部部门</option>
          {departments.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="p-4">标题</th>
              <th className="p-4">来源部门</th>
              <th className="p-4">目标部门</th>
              <th className="p-4">优先级</th>
              <th className="p-4">状态</th>
              <th className="p-4">子需求</th>
              <th className="p-4">截止日期</th>
            </tr>
          </thead>
          <tbody>
            {filteredReqs.map((req) => (
              <tr key={req.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <Link to={`/requirements/${req.id}`} className="text-blue-600 hover:underline font-medium">
                    {req.title}
                  </Link>
                </td>
                <td className="p-4 text-gray-600">{req.sourceDept || '-'}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {req.targetDepts.slice(0, 2).map(d => (
                      <span key={d} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-sm">
                        {d}
                      </span>
                    ))}
                    {req.targetDepts.length > 2 && (
                      <span className="text-gray-400 text-sm">+{req.targetDepts.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className={`p-4 font-medium ${priorityColors[req.priority]}`}>
                  {req.priority === 'urgent' ? '紧急' : req.priority === 'high' ? '高' : req.priority === 'medium' ? '中' : '低'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-sm">
                    {req.subRequirements?.length || 0}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{req.deadline || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReqs.length === 0 && (
          <div className="p-8 text-center text-gray-500">暂无需求</div>
        )}
      </div>

      {showModal && (
        <RequirementModal
          departments={departments}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}