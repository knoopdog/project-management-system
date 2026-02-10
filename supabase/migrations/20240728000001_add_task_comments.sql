-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to view comments on tasks they have access to
CREATE POLICY "Users can view comments on their tasks" 
  ON task_comments FOR SELECT 
  USING (
    (user_id = auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON u.company_id = p.company_id
      WHERE t.id = task_comments.task_id AND u.id = auth.uid()
    )
  );

-- Allow users to insert their own comments
CREATE POLICY "Users can insert their own comments" 
  ON task_comments FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
  ON task_comments FOR UPDATE 
  USING (user_id = auth.uid());

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON task_comments FOR DELETE 
  USING (user_id = auth.uid());

-- Create function to create task_comments table if it doesn't exist
CREATE OR REPLACE FUNCTION create_task_comments_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since we've already created the table above
  -- In a real scenario, this would contain the CREATE TABLE statement
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
