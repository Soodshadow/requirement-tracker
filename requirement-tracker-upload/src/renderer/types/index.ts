export interface Requirement {
  id: string;
  title: string;
  description: string;
  sourceDept: string;
  targetDepts: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'analyzing' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  assignee?: string;
  tags: string[];
  subRequirements: SubRequirement[];
  workflowHistory: WorkflowHistory[];
  aiAnalysis?: AIAnalysis;
}

export interface SubRequirement {
  id: string;
  parentId: string;
  title: string;
  description: string;
  targetDept: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  assignee?: string;
  deadline?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  feedback?: string;
}

export interface WorkflowHistory {
  id: string;
  requirementId: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  operator: string;
  timestamp: string;
  comment?: string;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  estimatedDuration: string;
  riskFactors: string[];
  suggestedDepts: string[];
  breakdown: {
    title: string;
    dept: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  manager?: string;
  contact?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}