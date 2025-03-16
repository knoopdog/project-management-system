-- Add client role flag to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE;

-- Create RLS policies for client access

-- Companies: Clients can only view their own company
CREATE POLICY "Clients can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND is_client = true
  ));

-- Projects: Clients can only view projects for their company
CREATE POLICY "Clients can view their company's projects"
  ON projects FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND is_client = true
  ));

-- Tasks: Clients can only view tasks for their company's projects
CREATE POLICY "Clients can view their company's tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT id FROM projects WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND is_client = true
    )
  ));

-- Time entries: Clients can view time entries for their company's tasks
CREATE POLICY "Clients can view their company's time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (task_id IN (
    SELECT id FROM tasks WHERE project_id IN (
      SELECT id FROM projects WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid() AND is_client = true
      )
    )
  ));

-- Articles: Clients can view public articles or articles for their company
CREATE POLICY "Clients can view public articles or articles for their company"
  ON articles FOR SELECT
  TO authenticated
  USING (
    is_public = true OR 
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND is_client = true
    )
  );
