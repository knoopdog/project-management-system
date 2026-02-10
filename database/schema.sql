-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create customers table
CREATE TABLE customers (
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
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'waiting', 'completed');

CREATE TABLE projects (
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
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE tasks (
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
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create subtasks table
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on subtasks
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create time_entries table
CREATE TABLE time_entries (
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
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_customer BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_modtime
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_projects_modtime
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_tasks_modtime
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

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

CREATE TRIGGER update_task_totals_after_insert_or_update
AFTER INSERT OR UPDATE OF hours, cost ON time_entries
FOR EACH ROW EXECUTE PROCEDURE update_task_totals();

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

CREATE TRIGGER calculate_cost_before_insert_or_update
BEFORE INSERT OR UPDATE OF hours ON time_entries
FOR EACH ROW EXECUTE PROCEDURE calculate_time_entry_cost();

-- Row Level Security Policies

-- Admins can see and do everything
CREATE POLICY admin_all_access ON customers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_all_access ON projects
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_all_access ON tasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_all_access ON subtasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_all_access ON time_entries
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_all_access ON comments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Customers can only see their own data
CREATE POLICY customer_read_own_data ON customers
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

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

-- Customers can read all comments on their tasks and create new comments
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

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_admin_id ON time_entries(admin_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
