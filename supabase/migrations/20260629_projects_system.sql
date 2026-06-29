-- جداول نظام الشغلانات / المشاريع

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'مفتوحة',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_revenues (
  id TEXT PRIMARY KEY,
  project_code TEXT NOT NULL REFERENCES projects(code) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'مستحق',
  collection_method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_expenses (
  id TEXT PRIMARY KEY,
  project_code TEXT NOT NULL REFERENCES projects(code) ON DELETE CASCADE,
  expense_code TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'مباشر',
  custody_id TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_custodies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  project_code TEXT NOT NULL REFERENCES projects(code) ON DELETE CASCADE,
  holder_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  open_date TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'مفتوحة',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimated_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'أخرى',
  value INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'نشط',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_deductions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_revenues_code ON project_revenues(project_code);
CREATE INDEX IF NOT EXISTS idx_project_expenses_code ON project_expenses(project_code);
CREATE INDEX IF NOT EXISTS idx_project_custodies_code ON project_custodies(project_code);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_user ON employee_deductions(user_id, month_key);

-- RLS: allow all authenticated users (same pattern as existing tables)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON project_revenues FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON project_expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON project_custodies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON estimated_assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON employee_deductions FOR ALL USING (auth.role() = 'authenticated');
