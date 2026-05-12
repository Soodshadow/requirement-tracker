import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../App';
import type { Requirement, Department } from '../types';

export default function RequirementDetail() {
  const { id } = useParams<{ id: string }>();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [newSub, setNewSub] = useState({ title: '', description: '', targetDept: '', priority: 'medium' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const [req, depts] = await Promise.all([
      fetch(`${API_BASE}/api/requirements/${id}`).then(r => r.json()),
      fetch(`${API_BASE}/api/departments`).then(r => r.json()),
    ]);
    setRequirement(req as Requirement);
    setDepartments(depts as Department[]);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await fetch(`${API_BASE}/api/requirements/${id}/analyze`, { method: 'POST' });
    fetchData();
    setAnalyzing(false);
  };

  const handleStatusChange = async (status: string) => {
    await fetch(`${API_BASE}/api/requirements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleAddSub = async () => {
    if (!newSub.title || !newSub.targetDept) return;
    await fetch(`${API_BASE}/api/sub-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSub, parentId: id }),
    });
    setNewSub({ title: '', description: '', targetDept: '', priority: 'medium' });
    fetchData();
  };

  const handleSubStatusChange = async (subId: string, status: string) => {
    await fetch(`${API_BASE}/api/sub-requirements/${subId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleSubProgress = async (subId: string, progress: number) => {
    await fetch(`${API_BASE}/api/sub-requirements/${subId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64">加载中...</div>;
  if (!requirement) return <div>需求不存在</div>;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    analyzing: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const subStatusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{requirement.title}</h2>
            <p className="text-gray-500 mt-2">{requirement.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {analyzing ? '分析中...' : '🤖 AI拆解'}
            </button>
            <select
              value={requirement.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="draft">草稿</option>
              <option value="analyzing">分析中</option>
              <option value="approved">已批准</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-gray-500 text-sm">来源部门</div>
            <div className="font-medium">{requirement.sourceDept || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">优先级</div>
            <div className={`font-medium ${priorityColors[requirement.priority]}`}>
              {requirement.priority === 'urgent' ? '紧急' : requirement.priority === 'high' ? '高' : requirement.priority === 'medium' ? '中' : '低'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">截止日期</div>
            <div className="font-medium">{requirement.deadline || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">状态</div>
            <span className={`px-2 py-1 rounded text-sm ${statusColors[requirement.status]}`}>
              {requirement.status}
            </span>
          </div>
        </div>
      </div>

      {requirement.aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 border border-purple-100">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span> AI分析结果
          </h3>
          <p className="text-gray-700 mb-4">{requirement.aiAnalysis.summary}</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">关键要点</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {requirement.aiAnalysis.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">风险因素</h4>
              <ul className="list-disc list-inside space-y-1 text-red-600">
                {requirement.aiAnalysis.riskFactors.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500">预估工期: <span className="font-medium text-gray-700">{requirement.aiAnalysis.estimatedDuration}</span></div>
          </div>

          {requirement.aiAnalysis.breakdown && requirement.aiAnalysis.breakdown.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-3">建议拆解</h4>
              <div className="space-y-2">
                {requirement.aiAnalysis.breakdown.map((b, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                    <span className={`px-2 py-1 rounded text-xs ${priorityColors[b.priority]}`}>
                      {b.priority}
                    </span>
                    <span className="flex-1">{b.title}</span>
                    <span className="text-sm text-gray-500">{b.dept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">子需求管理</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="子需求标题"
            value={newSub.title}
            onChange={(e) => setNewSub({ ...newSub, title: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="描述"
            value={newSub.description}
            onChange={(e) => setNewSub({ ...newSub, description: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={newSub.targetDept}
            onChange={(e) => setNewSub({ ...newSub, targetDept: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">选择部门</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select
            value={newSub.priority}
            onChange={(e) => setNewSub({ ...newSub, priority: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>
        <button
          onClick={handleAddSub}
          disabled={!newSub.title || !newSub.targetDept}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          添加子需求
        </button>

        <div className="space-y-4">
          {requirement.subRequirements?.map((sub) => (
            <div key={sub.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{sub.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${subStatusColors[sub.status]}`}>
                      {sub.status}
                    </span>
                    <span className={`text-sm ${priorityColors[sub.priority]}`}>
                      {sub.priority === 'urgent' ? '紧急' : sub.priority === 'high' ? '高' : sub.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{sub.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>负责部门: {sub.targetDept}</span>
                    <span>截止: {sub.deadline || '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={sub.status}
                    onChange={(e) => handleSubStatusChange(sub.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="pending">待处理</option>
                    <option value="accepted">已接受</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">完成</option>
                    <option value="rejected">拒绝</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>进度</span>
                  <span>{sub.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sub.progress}
                  onChange={(e) => handleSubProgress(sub.id, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          ))}
          {(!requirement.subRequirements || requirement.subRequirements.length === 0) && (
            <div className="text-center text-gray-500 py-8">
              暂无子需求，点击上方按钮添加或使用AI自动拆解
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">操作历史</h3>
        <div className="space-y-3">
          {requirement.workflowHistory?.map((h) => (
            <div key={h.id} className="flex gap-4 text-sm border-b pb-3">
              <span className="text-gray-400">{new Date(h.timestamp).toLocaleString()}</span>
              <span className="font-medium">{h.operator}</span>
              <span>{h.action}</span>
              {h.fromStatus && h.toStatus && (
                <span className="text-gray-500">
                  {h.fromStatus} → {h.toStatus}
                </span>
              )}
              {h.comment && <span className="text-gray-600">({h.comment})</span>}
            </div>
          ))}
          {(!requirement.workflowHistory || requirement.workflowHistory.length === 0) && (
            <div className="text-center text-gray-500 py-4">暂无操作记录</div>
          )}
        </div>
      </div>
    </div>
  );
}