// User types
export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Customer types
export interface Customer {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

// Project status
export type ProjectStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed';

// Project types
export interface Project {
  id: string;
  customer_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  total_hours: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
  // Relationships
  customer?: Customer;
  tasks?: Task[];
}

// Task types
export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  total_hours: number;
  total_cost: number;
  invoiced: boolean;
  created_at: string;
  updated_at: string;
  // Relationships
  project?: Project;
  subtasks?: Subtask[];
  time_entries?: TimeEntry[];
  comments?: Comment[];
}

// Subtask types
export interface Subtask {
  id: string;
  task_id: string;
  name: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Time entry types
export interface TimeEntry {
  id: string;
  task_id: string;
  admin_id: string;
  start_time: string;
  end_time: string;
  hours: number;
  cost: number;
  notes: string;
  manual_entry: boolean;
  created_at: string;
}

// Comment types
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  is_customer: boolean;
  admin_notified: boolean;
  created_at: string;
  // For joined data from Supabase
  user?: {
    email: string;
  };
}

// Filter types
export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface ProjectFilter extends DateRangeFilter {
  status?: ProjectStatus;
  customer_id?: string;
}

export interface TaskFilter extends DateRangeFilter {
  project_id?: string;
}

// Report types
export interface ReportData {
  projects: Project[];
  total_hours: number;
  total_cost: number;
  date_range: DateRangeFilter;
}
