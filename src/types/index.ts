// Основные типы для Raising CRM

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  budget?: number;
  currency: string;
  deadline?: Date;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  clientId?: string;
  client?: Client;
  tasks?: Task[];
  payments?: Payment[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  estimatedHours?: number;
  actualHours?: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId?: string;
  project?: Project;
  parentTaskId?: string;
  parentTask?: Task;
  subtasks?: Task[];
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projects?: Project[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  dueDate?: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId?: string;
  project?: Project;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: Date;
  sent: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId?: string;
  taskId?: string;
}

// Telegram WebApp типы
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  close(): void;
  expand(): void;
  ready(): void;
}

// API Response типы
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form типы
export interface ProjectFormData {
  title: string;
  description?: string;
  budget?: number;
  currency: string;
  deadline?: string;
  priority: Priority;
  clientId?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: Priority;
  estimatedHours?: number;
  deadline?: string;
  projectId?: string;
  parentTaskId?: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface PaymentFormData {
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
}

// Dashboard типы
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
}

// AI Integration типы
export interface AIAnalysisRequest {
  message: string;
  context?: string;
  userId: string;
}

export interface AIAnalysisResponse {
  type: 'project' | 'task' | 'client' | 'payment' | 'unknown';
  confidence: number;
  extractedData: {
    title?: string;
    description?: string;
    priority?: Priority;
    deadline?: string;
    budget?: number;
    clientName?: string;
    [key: string]: any;
  };
  suggestions: string[];
}
