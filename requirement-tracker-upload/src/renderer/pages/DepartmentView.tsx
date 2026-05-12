import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../App';
import type { Department } from '../types';

interface DeptSub {
  id: string;
  parentId: string;
  title: string;
  status: string;
  progress: number;
  assignee: string;
}

export default function DepartmentView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptSubs, setDeptSubs] = useState<Record<string, DeptSub[]>>({});
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchDeptSubs(selectedDept);
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    const depts = await fetch(`${API_BASE}/api/departments`).then(r => r.json());
    setDepartments(depts as Department[]);
    setSelectedDept((depts as Department[])[0]?.name || null);
    setLoading(false);
  };

  const fetchDeptSubs = async (deptName: string) => {
    const depts = await fetch(`${API_BASE}/api/departments`).then(r => r.json()) as Department[];
    const dept = depts.find(d => d.name === deptName);
    if (dept) {
      const subs = await fetch(`${API_BASE}/api/departments/${dept.id}/sub-requirements`).then(r => r.json());
      setDeptSubs(prev => ({ ...prev, [deptName]: subs }));
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="flex items-center justify-center h-64">加载中...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">部门视图</h2>

      <div className="flex gap-6">
        <div className="w-64 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">部门列表</h3>
          <div className="space-y-2">
            {departments.map((dept) => {
              const subs = deptSubs[dept.name] || [];
              const completed = subs.filter((s: DeptSub) => s.status === 'completed').length;
              const total = subs.length;
              
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.name)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDept === dept.name ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{dept.name}</div>
                  <div className="text-sm text-gray-500">
                    {total > 0 ? `${completed}/${total} 完成` : '暂无任务'}
                  </div>
                  {total > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded">
                      <div
                        className="h-1.5 bg-green-500 rounded"
                        style={{ width: `${(completed / total) * 100}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {selectedDept ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{selectedDept} 的任务</h3>
                <div className="text-gray-500">
                  {deptSubs[selectedDept]?.length || 0} 个任务
                </div>
              </div>

              <div className="space-y-4">
                {(deptSubs[selectedDept] || []).map((sub: any) => (
                  <Link
                    key={sub.id}
                    to={`/requirements/${sub.parentId}`}
                    className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{sub.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{sub.description}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${statusColors[sub.status]}`}>
                        {sub.status === 'in_progress' ? '进行中' : sub.status === 'completed' ? '完成' : sub.status === 'pending' ? '待处理' : sub.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                          <span>进度</span>
                          <span>{sub.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded">
                          <div
                            className={`h-2 rounded ${sub.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${sub.progress}%` }}
                          />
                        </div>
                      </div>
                      {sub.assignee && (
                        <div className="text-sm text-gray-500">
                          负责人: {sub.assignee}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {(!deptSubs[selectedDept] || deptSubs[selectedDept].length === 0) && (
                  <div className="text-center text-gray-500 py-12">
                    该部门暂无任务
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              请选择一个部门查看任务
            </div>
          )}
        </div>
      </div>
    </div>
  );
}