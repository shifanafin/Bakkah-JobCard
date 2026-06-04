-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT DEFAULT 'general' CHECK (category IN ('detailing','paint','chemical','tool','consumable','parts','general')),
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  cost_price NUMERIC(10,2) DEFAULT 0,
  selling_price NUMERIC(10,2) DEFAULT 0,
  stock_quantity NUMERIC(10,2) DEFAULT 0,
  min_stock_level NUMERIC(10,2) DEFAULT 5,
  supplier TEXT,
  location TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','promo')),
  active BOOLEAN DEFAULT true,
  show_on_track BOOLEAN DEFAULT true,
  created_by TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sample inventory
INSERT INTO inventory (name, sku, category, unit, cost_price, selling_price, stock_quantity, min_stock_level, supplier) VALUES
  ('Ceramic Pro 9H Coating', 'CP-9H-50ML', 'detailing', 'bottle', 120, 350, 10, 3, 'Ceramic Pro UAE'),
  ('Meguiars Ultimate Compound', 'MEG-UC-450G', 'detailing', 'bottle', 45, 120, 25, 5, 'Meguiars GCC'),
  ('Isopropyl Alcohol 99%', 'IPA-99-1L', 'chemical', 'litre', 15, 35, 50, 10, 'Local Supplier'),
  ('Microfibre Cloth Pack (10)', 'MF-10PK', 'consumable', 'pack', 20, 55, 40, 10, 'CarPro UAE'),
  ('DA Polisher Pad 5-inch', 'PAD-DA-5', 'tool', 'pcs', 30, 75, 15, 4, 'Rupes UAE'),
  ('Car Shampoo pH Neutral 5L', 'SHP-PH-5L', 'chemical', 'can', 35, 90, 20, 5, 'Koch Chemie UAE'),
  ('PPF Film Roll (1.52m x 15m)', 'PPF-152-15', 'detailing', 'roll', 850, 2200, 4, 2, 'XPEL UAE'),
  ('Tyre Shine Spray 500ml', 'TYR-SH-500', 'detailing', 'bottle', 18, 45, 30, 8, 'Autoglym UAE')
ON CONFLICT DO NOTHING;

-- Sample announcement
INSERT INTO announcements (title, content, type, created_by) VALUES
  ('Eid Special — 20% OFF All Detailing Packages', 'Book before the end of the month and get 20% off on all full detailing packages. Valid for new bookings only.', 'promo', 'admin')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON inventory;
DROP POLICY IF EXISTS allow_all ON announcements;
CREATE POLICY allow_all ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON announcements FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory, announcements TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
