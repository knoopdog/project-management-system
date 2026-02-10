-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  hourly_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('Incoming', 'In Progress', 'Completed', 'Invoiced')),
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')),
  company_id UUID REFERENCES companies(id),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('Incoming', 'In Progress', 'Completed', 'Invoiced')),
  set_value DECIMAL(10, 2),
  platform TEXT,
  contact_person TEXT,
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  duration INTEGER NOT NULL, -- Duration in seconds
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table for knowledge base
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add company_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Enable realtime for all tables
alter publication supabase_realtime add table companies;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table time_entries;
alter publication supabase_realtime add table articles;
