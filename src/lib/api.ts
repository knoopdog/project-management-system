import { supabase } from "../../supabase/supabase";
import { Company, Project, Task, TimeEntry, Article } from "@/types/schema";

// Company API
export const companyApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name");

    if (error) throw error;
    return data as Company[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Company;
  },

  create: async (
    company: Omit<Company, "id" | "created_at" | "updated_at">,
  ) => {
    const { data, error } = await supabase
      .from("companies")
      .insert(company)
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  },

  update: async (id: string, company: Partial<Company>) => {
    const { data, error } = await supabase
      .from("companies")
      .update(company)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);

    if (error) throw error;
  },
};

// Project API
export const projectApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Project[];
  },

  getByCompany: async (companyId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Project[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Project;
  },

  create: async (
    project: Omit<Project, "id" | "created_at" | "updated_at" | "is_archived">,
  ) => {
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...project, is_archived: false })
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  update: async (id: string, project: Partial<Project>) => {
    const { data, error } = await supabase
      .from("projects")
      .update(project)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  archive: async (id: string) => {
    const { data, error } = await supabase
      .from("projects")
      .update({ is_archived: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;
  },
};

// Task API
export const taskApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  getByProject: async (projectId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Task;
  },

  create: async (task: Omit<Task, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  update: async (id: string, task: Partial<Task>) => {
    const { data, error } = await supabase
      .from("tasks")
      .update(task)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;
  },
};

// Time Entry API
export const timeEntryApi = {
  getByTask: async (taskId: string) => {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TimeEntry[];
  },

  getByTasks: async (taskIds: string[]) => {
    if (taskIds.length === 0) return [];

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .in("task_id", taskIds);

    if (error) throw error;
    return data as TimeEntry[];
  },

  create: async (entry: Omit<TimeEntry, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("time_entries")
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
  },

  update: async (id: string, entry: Partial<TimeEntry>) => {
    const { data, error } = await supabase
      .from("time_entries")
      .update(entry)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("time_entries").delete().eq("id", id);

    if (error) throw error;
  },
};

// Article API
export const articleApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Article[];
  },

  getPublic: async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Article[];
  },

  getByCompany: async (companyId: string) => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .or(`is_public.eq.true,company_id.eq.${companyId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Article[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Article;
  },

  create: async (
    article: Omit<Article, "id" | "created_at" | "updated_at">,
  ) => {
    const { data, error } = await supabase
      .from("articles")
      .insert(article)
      .select()
      .single();

    if (error) throw error;
    return data as Article;
  },

  update: async (id: string, article: Partial<Article>) => {
    const { data, error } = await supabase
      .from("articles")
      .update(article)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Article;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) throw error;
  },
};
