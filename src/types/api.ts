// API types for Raising CRM

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type TaskSource = 'MANUAL' | 'TELEGRAM' | 'AI_GENERATED';

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  currency: string;
  startDate?: Date | string | null;
  deadline?: Date | string | null;
  endDate?: Date | string | null;
  priority: Priority;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
  } | null;
  tasks?: Task[];
  payments?: Payment[];
  _count?: {
    tasks: number;
    payments: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  estimatedHours?: number | null;
  actualHours?: number | null;
  deadline?: Date | string | null;
  dueDate?: Date | string | null;
  source: TaskSource;
  telegramChatId?: string | null;
  telegramMessageId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  projectId?: string | null;
  parentTaskId?: string | null;
  project?: Project | null;
  parentTask?: Task | null;
  subtasks?: Task[];
  reminders?: Reminder[];
  timeSessions?: TimeSession[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string | null;
  dueDate?: Date | string | null;
  paidDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  projectId?: string | null;
  project?: Project | null;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: Date | string;
  sent: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  projectId?: string | null;
  project?: Project | null;
  taskId?: string | null;
  task?: Task | null;
}

export interface TimeSession {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  duration: number;
  comment?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  taskId: string;
  task?: Task;
}

export interface User {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isPremium: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProjectsResponse {
  success: boolean;
  projects: Project[];
}

export interface ProjectResponse {
  success: boolean;
  project: Project;
}

export interface TasksResponse {
  success: boolean;
  tasks: Task[];
}

export interface TaskResponse {
  success: boolean;
  task: Task;
}

export interface ClientsResponse {
  success: boolean;
  clients: Client[];
}

export interface ClientResponse {
  success: boolean;
  client: Client;
}

export interface PaymentsResponse {
  success: boolean;
  payments: Payment[];
}

export interface PaymentResponse {
  success: boolean;
  payment: Payment;
}

export interface RemindersResponse {
  success: boolean;
  reminders: Reminder[];
}

export interface ReminderResponse {
  success: boolean;
  reminder: Reminder;
}

export interface TimeSessionsResponse {
  success: boolean;
  timeSessions: TimeSession[];
}

export interface TimeSessionResponse {
  success: boolean;
  timeSession: TimeSession;
}

// Dashboard statistics
export interface DashboardStats {
  projects: {
    count: number;
    weeklyChange: number;
  };
  tasks: {
    count: number;
    completedToday: number;
  };
  clients: {
    count: number;
    newClients: number;
  };
  revenue: {
    amount: number;
    monthlyChange: number;
  };
}

// Analytics types
export interface PaymentAnalytics {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRevenue: {
    month: string;
    amount: number;
  }[];
  revenueByProject: {
    projectId: string;
    projectTitle: string;
    amount: number;
  }[];
  revenueByClient: {
    clientId: string;
    clientName: string;
    amount: number;
  }[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
