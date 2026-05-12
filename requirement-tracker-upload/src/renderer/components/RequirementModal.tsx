import React, { useState } from 'react';
import type { Department } from '../types';
import { API_BASE } from '../App';

interface RequirementModalProps {
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequirementModal({ departments, onClose, onSuccess }: RequirementModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    sourceDept: '',
    targetDepts: [] as string[],
    priority: 'medium',
    deadline: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDept = (dept: string) => {
    setForm(prev => ({
      ...prev,
      targetDepts: prev.targetDepts.includes(dept)
        ? prev.targetDepts.filter(d => d !== dept)
        : [...prev.targetDepts, dept],
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">新建需求</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">需求标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="请输入需求标题"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">需求描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24"
              placeholder="请详细描述需求内容"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">来源部门</label>
              <select
                value={form.sourceDept}
                onChange={(e) => setForm({ ...form, sourceDept: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">选择部门</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">优先级</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">目标部门</label>
            <div className="flex flex-wrap gap-2">
              {departments.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDept(d.name)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    form.targetDepts.includes(d.name)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">截止日期</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border rounded-lg px-4 py-2"
                placeholder="输入标签后按回车添加"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-800">&times;</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '创建中...' : '创建需求'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}