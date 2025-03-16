export interface Company {
  id: string;
  name: string;
  contact_person?: string;
  address?: string;
  email?: string;
  phone?: string;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "Incoming" | "In Progress" | "Completed" | "Invoiced";
  priority: "Low" | "Medium" | "High";
  company_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: "Incoming" | "In Progress" | "Completed" | "Invoiced";
  hourly_rate?: number;
  platform?: string;
  contact_person?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  duration: number; // Duration in seconds
  notes?: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  is_public: boolean;
  company_id?: string;
  created_at: string;
  updated_at: string;
}
