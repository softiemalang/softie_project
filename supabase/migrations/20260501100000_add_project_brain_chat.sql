-- Table 1: project_brain_threads
CREATE TABLE IF NOT EXISTS project_brain_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  owner_key text NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 2: project_brain_messages
CREATE TABLE IF NOT EXISTS project_brain_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES project_brain_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  citations_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_brain_threads_owner_key_updated_at ON project_brain_threads(owner_key, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_brain_messages_thread_id_created_at ON project_brain_messages(thread_id, created_at ASC);

-- Note: These tables currently rely on simple RLS or public access depending on the project's security posture. 
-- In a production environment, ensure stricter RLS policies are applied to ensure users can only access their own threads.
