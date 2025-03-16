-- Create task_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own comments and comments on tasks they have access to" ON task_comments;
CREATE POLICY "Users can view their own comments and comments on tasks they have access to"
  ON task_comments FOR SELECT
  USING (
    -- Admin can see all comments
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
    OR
    -- Users can see comments on tasks from their company's projects
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON p.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own comments" ON task_comments;
CREATE POLICY "Users can insert their own comments"
  ON task_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (user_id = auth.uid());

-- Check if table exists in publication before adding
DO
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'task_comments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE task_comments';
  END IF;
END;
