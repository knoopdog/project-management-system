-- Create a view to help with client dashboard queries
CREATE OR REPLACE VIEW client_dashboard_data AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.description as project_description,
  p.status as project_status,
  p.priority as project_priority,
  p.company_id,
  c.name as company_name,
  t.id as task_id,
  t.name as task_name,
  t.description as task_description,
  t.status as task_status,
  t.hourly_rate as task_hourly_rate,
  COALESCE(t.hourly_rate, c.hourly_rate) as effective_hourly_rate,
  te.id as time_entry_id,
  te.duration as time_entry_duration,
  te.created_at as time_entry_created_at
FROM 
  projects p
LEFT JOIN 
  companies c ON p.company_id = c.id
LEFT JOIN 
  tasks t ON t.project_id = p.id
LEFT JOIN 
  time_entries te ON te.task_id = t.id;

-- Create policy for the view
CREATE POLICY "Clients can view their dashboard data"
  ON client_dashboard_data FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND is_client = true
  ));
