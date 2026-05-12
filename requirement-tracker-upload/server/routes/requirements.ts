import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDatabase } from '../models/database';
import type { Requirement, SubRequirement, WorkflowHistory } from '../models/types';

const requirementSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  sourceDept: z.string(),
  targetDepts: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['draft', 'analyzing', 'approved', 'in_progress', 'completed', 'rejected']).default('draft'),
  deadline: z.string().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const subRequirementSchema = z.object({
  parentId: z.string(),
  title: z.string().min(1),
  description: z.string(),
  targetDept: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'rejected']).default('pending'),
  assignee: z.string().optional(),
  deadline: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  feedback: z.string().optional(),
});

export function setupRoutes(app: any): void {
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/requirements', (_req: Request, res: Response) => {
    const db = getDatabase();
    const requirements = db.prepare('SELECT * FROM requirements ORDER BY createdAt DESC').all();
    const result = requirements.map((r: any) => ({
      ...r,
      targetDepts: JSON.parse(r.targetDepts || '[]'),
      tags: JSON.parse(r.tags || '[]'),
      aiAnalysis: r.aiAnalysis ? JSON.parse(r.aiAnalysis) : undefined,
      subRequirements: getSubRequirementsByParent(r.id),
      workflowHistory: getWorkflowHistory(r.id),
    }));
    res.json(result);
  });

  app.get('/api/requirements/:id', (req: Request, res: Response) => {
    const db = getDatabase();
    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    const r = requirement as any;
    res.json({
      ...r,
      targetDepts: JSON.parse(r.targetDepts || '[]'),
      tags: JSON.parse(r.tags || '[]'),
      aiAnalysis: r.aiAnalysis ? JSON.parse(r.aiAnalysis) : undefined,
      subRequirements: getSubRequirementsByParent(r.id),
      workflowHistory: getWorkflowHistory(r.id),
    });
  });

  app.post('/api/requirements', async (req: Request, res: Response) => {
    try {
      const data = requirementSchema.parse(req.body);
      const db = getDatabase();
      const id = uuidv4();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO requirements (id, title, description, sourceDept, targetDepts, priority, status, createdAt, updatedAt, deadline, assignee, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.title, data.description, data.sourceDept,
        JSON.stringify(data.targetDepts), data.priority, data.status,
        now, now, data.deadline, data.assignee, JSON.stringify(data.tags)
      );

      addWorkflowHistory(id, '创建需求', '', data.status, '系统', `创建需求: ${data.title}`);

      const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
      const r = requirement as any;
      res.status(201).json({
        ...r,
        targetDepts: JSON.parse(r.targetDepts || '[]'),
        tags: JSON.parse(r.tags || '[]'),
        subRequirements: [],
        workflowHistory: [],
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  app.put('/api/requirements/:id', (req: Request, res: Response) => {
    try {
      const data = requirementSchema.partial().parse(req.body);
      const db = getDatabase();
      const existing = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Requirement not found' });
      }

      const e = existing as any;
      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
      if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
      if (data.sourceDept !== undefined) { updates.push('sourceDept = ?'); values.push(data.sourceDept); }
      if (data.targetDepts !== undefined) { updates.push('targetDepts = ?'); values.push(JSON.stringify(data.targetDepts)); }
      if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
      if (data.status !== undefined) {
        updates.push('status = ?');
        values.push(data.status);
        if (e.status !== data.status) {
          addWorkflowHistory(req.params.id, '状态变更', e.status, data.status, '系统');
        }
      }
      if (data.deadline !== undefined) { updates.push('deadline = ?'); values.push(data.deadline); }
      if (data.assignee !== undefined) { updates.push('assignee = ?'); values.push(data.assignee); }
      if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)); }

      updates.push('updatedAt = ?');
      values.push(now);
      values.push(req.params.id);

      db.prepare(`UPDATE requirements SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
      const r = requirement as any;
      res.json({
        ...r,
        targetDepts: JSON.parse(r.targetDepts || '[]'),
        tags: JSON.parse(r.tags || '[]'),
        aiAnalysis: r.aiAnalysis ? JSON.parse(r.aiAnalysis) : undefined,
        subRequirements: getSubRequirementsByParent(r.id),
        workflowHistory: getWorkflowHistory(r.id),
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  app.delete('/api/requirements/:id', (req: Request, res: Response) => {
    const db = getDatabase();
    db.prepare('DELETE FROM requirements WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  app.post('/api/requirements/:id/analyze', async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id) as any;
      if (!requirement) {
        return res.status(404).json({ error: 'Requirement not found' });
      }

      const analysis = await generateAIAnalysis({
        title: requirement.title,
        description: requirement.description,
        sourceDept: requirement.sourceDept,
      });

      db.prepare('UPDATE requirements SET aiAnalysis = ?, updatedAt = ? WHERE id = ?')
        .run(JSON.stringify(analysis), new Date().toISOString(), req.params.id);

      res.json({ analysis, message: 'AI分析完成' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Analysis failed' });
    }
  });

  app.post('/api/sub-requirements', (req: Request, res: Response) => {
    try {
      const data = subRequirementSchema.parse(req.body);
      const db = getDatabase();
      const id = uuidv4();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO sub_requirements (id, parentId, title, description, targetDept, priority, status, assignee, deadline, progress, createdAt, updatedAt, feedback)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.parentId, data.title, data.description, data.targetDept, data.priority, data.status, data.assignee, data.deadline, data.progress, now, now, data.feedback);

      addWorkflowHistory(data.parentId, '创建子需求', '', 'pending', '系统', `新增子需求: ${data.title}`);

      res.status(201).json({
        id, ...data, createdAt: now, updatedAt: now,
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  app.put('/api/sub-requirements/:id', (req: Request, res: Response) => {
    try {
      const data = subRequirementSchema.partial().parse(req.body);
      const db = getDatabase();
      const existing = db.prepare('SELECT * FROM sub_requirements WHERE id = ?').get(req.params.id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Sub-requirement not found' });
      }

      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: any[] = [];

      Object.keys(data).forEach(key => {
        if (data[key as keyof typeof data] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(data[key as keyof typeof data]);
        }
      });

      if (updates.length > 0) {
        updates.push('updatedAt = ?');
        values.push(now);
        values.push(req.params.id);
        db.prepare(`UPDATE sub_requirements SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        if (data.status && data.status !== existing.status) {
          addWorkflowHistory(existing.parentId, '子需求状态变更', existing.status, data.status, '系统', `子需求: ${existing.title}`);
        }
      }

      const updated = db.prepare('SELECT * FROM sub_requirements WHERE id = ?').get(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  app.delete('/api/sub-requirements/:id', (req: Request, res: Response) => {
    const db = getDatabase();
    db.prepare('DELETE FROM sub_requirements WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  app.get('/api/departments', (_req: Request, res: Response) => {
    const db = getDatabase();
    const departments = db.prepare('SELECT * FROM departments').all();
    res.json(departments);
  });

  app.get('/api/departments/:id/sub-requirements', (req: Request, res: Response) => {
    const db = getDatabase();
    const subs = db.prepare('SELECT * FROM sub_requirements WHERE targetDept = ? ORDER BY createdAt DESC').all(req.params.id);
    res.json(subs);
  });

  app.get('/api/stats', (_req: Request, res: Response) => {
    const db = getDatabase();
    const totalReqs = (db.prepare('SELECT COUNT(*) as count FROM requirements').get() as any).count;
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM requirements GROUP BY status').all();
    const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM requirements GROUP BY priority').all();
    const pendingSubs = (db.prepare('SELECT COUNT(*) as count FROM sub_requirements WHERE status != ?').get('completed') as any).count;
    const deptStats = db.prepare(`
      SELECT targetDept, COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM sub_requirements
      GROUP BY targetDept
    `).all();

    res.json({
      totalRequirements: totalReqs,
      byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s.count])),
      byPriority: Object.fromEntries(byPriority.map((p: any) => [p.priority, p.count])),
      pendingSubRequirements: pendingSubs,
      deptStats,
    });
  });

  app.get('/api/notifications', (_req: Request, res: Response) => {
    const db = getDatabase();
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50').all();
    res.json(notifications.map((n: any) => ({ ...n, read: !!n.read })));
  });

  app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
    const db = getDatabase();
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
}

function getSubRequirementsByParent(parentId: string): SubRequirement[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM sub_requirements WHERE parentId = ? ORDER BY createdAt DESC').all(parentId) as SubRequirement[];
}

function getWorkflowHistory(requirementId: string): WorkflowHistory[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM workflow_history WHERE requirementId = ? ORDER BY timestamp DESC').all(requirementId) as WorkflowHistory[];
}

function addWorkflowHistory(requirementId: string, action: string, fromStatus: string, toStatus: string, operator: string, comment?: string): void {
  const db = getDatabase();
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  db.prepare(`
    INSERT INTO workflow_history (id, requirementId, action, fromStatus, toStatus, operator, timestamp, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, requirementId, action, fromStatus, toStatus, operator, timestamp, comment);
}

async function generateAIAnalysis(req: { title: string; description: string; sourceDept: string }) {
  const deptPool = ['产品部', '研发部', '测试部', '运维部', '设计部'];
  const points = [
    '建议拆分为多个可独立执行的子任务',
    '需要明确各部门的职责边界',
    '建议设置关键里程碑检查点',
    '涉及跨系统接口需要预留联调时间',
    '建议提前进行技术方案评审',
  ];
  const risks = [
    '需求范围可能蔓延',
    '部门间协调成本较高',
    '技术实现存在不确定性',
  ];

  const breakdownCount = Math.floor(Math.random() * 3) + 2;
  const breakdown = Array.from({ length: breakdownCount }, (_, i) => ({
    title: `子任务${i + 1}: ${['功能模块开发', '接口对接', '数据迁移', '测试验证', '上线部署'][i % 5]}`,
    dept: deptPool[Math.floor(Math.random() * deptPool.length)],
    description: `${req.title}的子任务${i + 1}描述`,
    priority: ['high', 'medium', 'high', 'urgent', 'medium'][i % 5] as any,
  }));

  return {
    summary: `基于AI分析，需求"${req.title}"建议拆分为${breakdownCount}个子需求，分布在${new Set(breakdown.map(b => b.dept)).size}个部门执行。`,
    keyPoints: points.slice(0, 3),
    estimatedDuration: `${Math.floor(Math.random() * 4) + 2}周`,
    riskFactors: risks.slice(0, 2),
    suggestedDepts: [...new Set(breakdown.map(b => b.dept))],
    breakdown,
  };
}