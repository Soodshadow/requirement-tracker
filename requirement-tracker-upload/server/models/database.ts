import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';

let db: Database.Database;

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'requirements.db');
  
  log.info(`Initializing database at: ${dbPath}`);
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      sourceDept TEXT,
      targetDepts TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'draft',
      createdAt TEXT,
      updatedAt TEXT,
      deadline TEXT,
      assignee TEXT,
      tags TEXT,
      aiAnalysis TEXT
    );

    CREATE TABLE IF NOT EXISTS sub_requirements (
      id TEXT PRIMARY KEY,
      parentId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      targetDept TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      assignee TEXT,
      deadline TEXT,
      progress INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      feedback TEXT,
      FOREIGN KEY (parentId) REFERENCES requirements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_history (
      id TEXT PRIMARY KEY,
      requirementId TEXT,
      action TEXT,
      fromStatus TEXT,
      toStatus TEXT,
      operator TEXT,
      timestamp TEXT,
      comment TEXT,
      FOREIGN KEY (requirementId) REFERENCES requirements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      manager TEXT,
      contact TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT,
      title TEXT,
      message TEXT,
      timestamp TEXT,
      read INTEGER DEFAULT 0,
      link TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
    CREATE INDEX IF NOT EXISTS idx_sub_requirements_parent ON sub_requirements(parentId);
    CREATE INDEX IF NOT EXISTS idx_sub_requirements_dept ON sub_requirements(targetDept);
    CREATE INDEX IF NOT EXISTS idx_workflow_requirement ON workflow_history(requirementId);
  `);

  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (deptCount.count === 0) {
    const insertDept = db.prepare('INSERT INTO departments (id, name, code, manager) VALUES (?, ?, ?, ?)');
    const depts = [
      ['dept-1', '产品部', 'PRODUCT', '张经理'],
      ['dept-2', '研发部', 'DEV', '李经理'],
      ['dept-3', '测试部', 'QA', '王经理'],
      ['dept-4', '运维部', 'OPS', '刘经理'],
      ['dept-5', '设计部', 'DESIGN', '陈经理'],
      ['dept-6', '市场部', 'MARKET', '赵经理'],
      ['dept-7', '销售部', 'SALES', '孙经理'],
      ['dept-8', '财务部', 'FINANCE', '周经理'],
    ];
    depts.forEach(d => insertDept.run(...d));
  }

  log.info('Database initialized successfully');
  return db;
}

export function getDatabase(): Database.Database {
  return db;
}