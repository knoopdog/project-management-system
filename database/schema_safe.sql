-- Enable Row Level Security
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on user_roles
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT,
  email TEXT UNIQUE NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on customers
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;

-- Create project_status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'waiting', 'completed');
  END IF;
END$$;

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'not_started',
  total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on projects
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on tasks
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;

-- Create subtasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on subtasks
ALTER TABLE IF EXISTS subtasks ENABLE ROW LEVEL SECURITY;

-- Create time_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  manual_entry BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on time_entries
ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_customer BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on comments
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers if they don't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_customers_modtime ON customers;
CREATE TRIGGER update_customers_modtime
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_projects_modtime ON projects;
CREATE TRIGGER update_projects_modtime
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_tasks_modtime ON tasks;
CREATE TRIGGER update_tasks_modtime
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_subtasks_modtime ON subtasks;
CREATE TRIGGER update_subtasks_modtime
BEFORE UPDATE ON subtasks
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create trigger to update task hours and cost when time entries change
CREATE OR REPLACE FUNCTION update_task_totals()
RETURNS TRIGGER AS $$
DECLARE
  task_id_val UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    task_id_val := OLD.task_id;
  ELSE
    task_id_val := NEW.task_id;
  END IF;

  -- Update task totals
  UPDATE tasks
  SET 
    total_hours = (SELECT COALESCE(SUM(hours), 0) FROM time_entries WHERE task_id = task_id_val),
    total_cost = (SELECT COALESCE(SUM(cost), 0) FROM time_entries WHERE task_id = task_id_val)
  WHERE id = task_id_val;

  -- Update project totals
  UPDATE projects
  SET 
    total_hours = (
      SELECT COALESCE(SUM(total_hours), 0) 
      FROM tasks 
      WHERE project_id = (SELECT project_id FROM tasks WHERE id = task_id_val)
    ),
    total_cost = (
      SELECT COALESCE(SUM(total_cost), 0) 
      FROM tasks 
      WHERE project_id = (SELECT project_id FROM tasks WHERE id = task_id_val)
    )
  WHERE id = (SELECT project_id FROM tasks WHERE id = task_id_val);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_task_totals_after_insert_or_update ON time_entries;
CREATE TRIGGER update_task_totals_after_insert_or_update
AFTER INSERT OR UPDATE OF hours, cost ON time_entries
FOR EACH ROW EXECUTE PROCEDURE update_task_totals();

DROP TRIGGER IF EXISTS update_task_totals_after_delete ON time_entries;
CREATE TRIGGER update_task_totals_after_delete
AFTER DELETE ON time_entries
FOR EACH ROW EXECUTE PROCEDURE update_task_totals();

-- Create trigger to calculate cost when hours are entered
CREATE OR REPLACE FUNCTION calculate_time_entry_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the hourly rate from the customer associated with this task
  NEW.cost := NEW.hours * (
    SELECT c.hourly_rate
    FROM customers c
    JOIN projects p ON p.customer_id = c.id
    JOIN tasks t ON t.project_id = p.id
    WHERE t.id = NEW.task_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS calculate_cost_before_insert_or_update ON time_entries;
CREATE TRIGGER calculate_cost_before_insert_or_update
BEFORE INSERT OR UPDATE OF hours ON time_entries
FOR EACH ROW EXECUTE PROCEDURE calculate_time_entry_cost();

-- Row Level Security Policies

-- Check if policies exist before creating them
DO $$
BEGIN
  -- Admins can see and do everything
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'admin_all_access') THEN
    CREATE POLICY admin_all_access ON customers
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'admin_all_access') THEN
    CREATE POLICY admin_all_access ON projects
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'admin_all_access') THEN
    CREATE POLICY admin_all_access ON tasks
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subtasks' AND policyname = 'admin_all_access') THEN
    CREATE POLICY admin_all_access ON subtasks
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'admin_all_access') THEN
    CREATE POLICY admin_all_access ON time_entries
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'admin_all_access') THEN
    CREATE POLICY admin_all_access ON comments
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;

  -- Customers can only see their own data
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'customer_read_own_data') THEN
    CREATE POLICY customer_read_own_data ON customers
      FOR SELECT
      TO authenticated
      USING (
        email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'customer_read_own_projects') THEN
    CREATE POLICY customer_read_own_projects ON projects
      FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT id FROM customers
          WHERE email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'customer_read_own_tasks') THEN
    CREATE POLICY customer_read_own_tasks ON tasks
      FOR SELECT
      TO authenticated
      USING (
        project_id IN (
          SELECT id FROM projects
          WHERE customer_id IN (
            SELECT id FROM customers
            WHERE email = (
              SELECT email FROM auth.users WHERE id = auth.uid()
            )
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subtasks' AND policyname = 'customer_read_own_subtasks') THEN
    CREATE POLICY customer_read_own_subtasks ON subtasks
      FOR SELECT
      TO authenticated
      USING (
        task_id IN (
          SELECT id FROM tasks
          WHERE project_id IN (
            SELECT id FROM projects
            WHERE customer_id IN (
              SELECT id FROM customers
              WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
              )
            )
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'customer_read_own_time_entries') THEN
    CREATE POLICY customer_read_own_time_entries ON time_entries
      FOR SELECT
      TO authenticated
      USING (
        task_id IN (
          SELECT id FROM tasks
          WHERE project_id IN (
            SELECT id FROM projects
            WHERE customer_id IN (
              SELECT id FROM customers
              WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
              )
            )
          )
        )
      );
  END IF;

  -- Customers can read all comments on their tasks and create new comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'customer_read_own_comments') THEN
    CREATE POLICY customer_read_own_comments ON comments
      FOR SELECT
      TO authenticated
      USING (
        task_id IN (
          SELECT id FROM tasks
          WHERE project_id IN (
            SELECT id FROM projects
            WHERE customer_id IN (
              SELECT id FROM customers
              WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
              )
            )
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'customer_insert_comments') THEN
    CREATE POLICY customer_insert_comments ON comments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        task_id IN (
          SELECT id FROM tasks
          WHERE project_id IN (
            SELECT id FROM projects
            WHERE customer_id IN (
              SELECT id FROM customers
              WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
              )
            )
          )
        )
        AND user_id = auth.uid()
        AND is_customer = TRUE
      );
  END IF;
END$$;

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_user_id') THEN
    CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_customer_id') THEN
    CREATE INDEX idx_projects_customer_id ON projects(customer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_project_id') THEN
    CREATE INDEX idx_tasks_project_id ON tasks(project_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subtasks_task_id') THEN
    CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_time_entries_task_id') THEN
    CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_time_entries_admin_id') THEN
    CREATE INDEX idx_time_entries_admin_id ON time_entries(admin_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_task_id') THEN
    CREATE INDEX idx_comments_task_id ON comments(task_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_user_id') THEN
    CREATE INDEX idx_comments_user_id ON comments(user_id);
  END IF;
END$$;
