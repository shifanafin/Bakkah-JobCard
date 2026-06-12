-- Quotation tables — UAE workshop pre-work estimate flow
-- Customer approves quotation before work begins; invoice follows after completion

CREATE TABLE IF NOT EXISTS quotations (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id      UUID          NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  quotation_number TEXT          NOT NULL UNIQUE,
  status           TEXT          NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'sent', 'approved', 'declined')),
  valid_days       INTEGER       NOT NULL DEFAULT 7,
  notes            TEXT,
  customer_notes   TEXT,
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID          NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_type     TEXT          NOT NULL DEFAULT 'service'
                              CHECK (item_type IN ('service', 'part', 'labor')),
  description   TEXT          NOT NULL,
  quantity      NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Auto-generate quotation number: QT-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
DECLARE
  yr  TEXT    := TO_CHAR(NOW(), 'YYYY');
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO cnt
  FROM quotations
  WHERE quotation_number LIKE 'QT-' || yr || '-%';
  NEW.quotation_number := 'QT-' || yr || '-' || LPAD(cnt::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_quotation_number ON quotations;
CREATE TRIGGER trg_set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quotation_number();

-- RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_quotations" ON quotations;
CREATE POLICY "auth_all_quotations" ON quotations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_quotation_items" ON quotation_items;
CREATE POLICY "auth_all_quotation_items" ON quotation_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_quotations" ON quotations;
CREATE POLICY "anon_read_quotations" ON quotations
  FOR SELECT TO anon
  USING (status IN ('sent', 'approved', 'declined'));

DROP POLICY IF EXISTS "anon_read_quotation_items" ON quotation_items;
CREATE POLICY "anon_read_quotation_items" ON quotation_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_id
        AND q.status IN ('sent', 'approved', 'declined')
    )
  );
