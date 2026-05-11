// Run: node scripts/migrate.mjs <SUPABASE_ACCESS_TOKEN>
// Get your token from: https://supabase.com/dashboard/account/tokens

const PROJECT_REF = 'euoomvrjyximybvnquck';
const token = process.argv[2];

if (!token) {
  console.error('Usage: node scripts/migrate.mjs <SUPABASE_ACCESS_TOKEN>');
  process.exit(1);
}

async function runSQL(sql, description) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ ${description}:`, data.message || JSON.stringify(data));
    return false;
  }
  console.log(`✅ ${description}`);
  return true;
}

const migrations = [
  {
    description: 'Create wm_user_settings',
    sql: `
CREATE TABLE IF NOT EXISTS wm_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  business_name TEXT,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
  extra_credit_points DECIMAL(4,2) DEFAULT 0,
  settlement_name TEXT,
  settlement_credit_rate DECIMAL(5,4) DEFAULT 0.10,
  settlement_ceiling DECIMAL(12,2) DEFAULT 180000,
  salary_annual_income DECIMAL(12,2) DEFAULT 0,
  receipt_counter_current_year INT DEFAULT 0,
  receipt_counter_year INT DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_wm_user_settings_user ON wm_user_settings(user_id);
ALTER TABLE wm_user_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'own_wm_settings' AND tablename = 'wm_user_settings'
  ) THEN
    CREATE POLICY "own_wm_settings" ON wm_user_settings FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`,
  },
  {
    description: 'Create wm_clients',
    sql: `
CREATE TABLE IF NOT EXISTS wm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(8,2),
  event_rate DECIMAL(10,2),
  contact_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wm_clients_user ON wm_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_wm_clients_active ON wm_clients(user_id) WHERE is_active = true;
ALTER TABLE wm_clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'own_wm_clients' AND tablename = 'wm_clients'
  ) THEN
    CREATE POLICY "own_wm_clients" ON wm_clients FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`,
  },
  {
    description: 'Create wm_work_entries',
    sql: `
CREATE TABLE IF NOT EXISTS wm_work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES wm_clients(id) ON DELETE RESTRICT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('hours', 'event')),
  entry_date DATE NOT NULL,
  hours DECIMAL(6,2),
  event_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  receipt_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (entry_type = 'hours' AND hours IS NOT NULL AND hours > 0) OR
    (entry_type = 'event' AND event_name IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_wm_entries_user ON wm_work_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_wm_entries_date ON wm_work_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_wm_entries_client ON wm_work_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_wm_entries_receipt ON wm_work_entries(receipt_id) WHERE receipt_id IS NOT NULL;
ALTER TABLE wm_work_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'own_wm_entries' AND tablename = 'wm_work_entries'
  ) THEN
    CREATE POLICY "own_wm_entries" ON wm_work_entries FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`,
  },
  {
    description: 'Create wm_receipts',
    sql: `
CREATE TABLE IF NOT EXISTS wm_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES wm_clients(id) ON DELETE RESTRICT NOT NULL,
  receipt_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  total_amount DECIMAL(12,2) NOT NULL,
  client_snapshot JSONB NOT NULL,
  user_snapshot JSONB NOT NULL,
  line_items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, receipt_number)
);
CREATE INDEX IF NOT EXISTS idx_wm_receipts_user ON wm_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_wm_receipts_client ON wm_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_wm_receipts_period ON wm_receipts(user_id, period_year, period_month);
ALTER TABLE wm_receipts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'own_wm_receipts' AND tablename = 'wm_receipts'
  ) THEN
    CREATE POLICY "own_wm_receipts" ON wm_receipts FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`,
  },
  {
    description: 'Create wm_monthly_insights',
    sql: `
CREATE TABLE IF NOT EXISTS wm_monthly_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  content TEXT NOT NULL,
  metrics_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_year, period_month)
);
CREATE INDEX IF NOT EXISTS idx_wm_insights_user ON wm_monthly_insights(user_id, period_year, period_month);
ALTER TABLE wm_monthly_insights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'own_wm_insights' AND tablename = 'wm_monthly_insights'
  ) THEN
    CREATE POLICY "own_wm_insights" ON wm_monthly_insights FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;`,
  },
];

const startFrom = process.argv[3] ? parseInt(process.argv[3]) - 1 : 0;
console.log('Running WorkMind migrations...\n');
for (let i = startFrom; i < migrations.length; i++) {
  const ok = await runSQL(migrations[i].sql, migrations[i].description);
  if (!ok) process.exit(1);
}
console.log('\n✅ All migrations complete!');
