-- ============================================================
-- Valet & Shuttle Service System – Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('admin', 'operator', 'driver', 'customer');
CREATE TYPE booking_status     AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
CREATE TYPE payment_status     AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE payment_method     AS ENUM ('cash', 'card', 'online', 'invoice');
CREATE TYPE vehicle_condition  AS ENUM ('excellent', 'good', 'fair', 'damaged');
CREATE TYPE invoice_status     AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- ─────────────────────────────────────────
-- TENANTS  (Multi-Tenant root entity)
-- ─────────────────────────────────────────
CREATE TABLE tenants (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(100) UNIQUE NOT NULL,       -- URL-friendly identifier
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(50),
  address      TEXT,
  logo_url     TEXT,
  settings     JSONB        NOT NULL DEFAULT '{}', -- tax rate, currency, etc.
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID         REFERENCES tenants(id) ON DELETE SET NULL,
  role         user_role    NOT NULL DEFAULT 'customer',
  first_name   VARCHAR(100),
  last_name    VARCHAR(100),
  phone        VARCHAR(50),
  avatar_url   TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AIRPORTS
-- ─────────────────────────────────────────
CREATE TABLE airports (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  iata_code    VARCHAR(3)   UNIQUE NOT NULL,
  city         VARCHAR(100) NOT NULL,
  country      VARCHAR(100) NOT NULL DEFAULT 'Deutschland',
  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PARKING LOTS
-- ─────────────────────────────────────────
CREATE TABLE parking_lots (
  id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id            UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  airport_id           UUID          NOT NULL REFERENCES airports(id),
  name                 VARCHAR(255)  NOT NULL,
  description          TEXT,
  address              TEXT          NOT NULL,
  distance_to_airport  INTEGER,                    -- metres
  price_per_day        DECIMAL(10,2) NOT NULL,
  total_capacity       INTEGER       NOT NULL DEFAULT 0,
  available_spots      INTEGER       NOT NULL DEFAULT 0,
  shuttle_available    BOOLEAN       NOT NULL DEFAULT FALSE,
  valet_available      BOOLEAN       NOT NULL DEFAULT FALSE,
  features             JSONB         NOT NULL DEFAULT '[]', -- ['covered','cctv','24h','ev_charging']
  images               JSONB         NOT NULL DEFAULT '[]',
  is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DRIVERS
-- ─────────────────────────────────────────
CREATE TABLE drivers (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id      UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(50),
  license_number  VARCHAR(100),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS booking_seq START 1;

CREATE TABLE bookings (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number   VARCHAR(20)    UNIQUE NOT NULL,
  tenant_id        UUID           NOT NULL REFERENCES tenants(id),
  parking_lot_id   UUID           NOT NULL REFERENCES parking_lots(id),
  customer_id      UUID           NOT NULL REFERENCES profiles(id),
  driver_id        UUID           REFERENCES drivers(id),

  -- Flight information
  flight_number    VARCHAR(20),
  flight_departure TIMESTAMPTZ,
  flight_arrival   TIMESTAMPTZ,

  -- Dates
  dropoff_date     TIMESTAMPTZ    NOT NULL,
  pickup_date      TIMESTAMPTZ    NOT NULL,

  -- Pricing
  total_days       INTEGER        NOT NULL,
  price_per_day    DECIMAL(10,2)  NOT NULL,
  total_amount     DECIMAL(10,2)  NOT NULL,
  discount_amount  DECIMAL(10,2)  NOT NULL DEFAULT 0,

  -- Status
  status           booking_status NOT NULL DEFAULT 'pending',
  payment_status   payment_status NOT NULL DEFAULT 'pending',
  payment_method   payment_method,

  notes            TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- VEHICLES  (1 vehicle per booking)
-- ─────────────────────────────────────────
CREATE TABLE vehicles (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID         NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  make            VARCHAR(100) NOT NULL,
  model           VARCHAR(100) NOT NULL,
  year            SMALLINT,
  color           VARCHAR(50),
  license_plate   VARCHAR(20)  NOT NULL,
  vin             VARCHAR(17),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CHECK-IN / CHECK-OUT PROTOCOLS
-- ─────────────────────────────────────────
CREATE TABLE checkin_protocols (
  id                      UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id              UUID              NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tenant_id               UUID              NOT NULL REFERENCES tenants(id),
  driver_id               UUID              REFERENCES drivers(id),
  parking_spot            VARCHAR(50),

  -- Check-in
  checkin_at              TIMESTAMPTZ,
  checkin_mileage         INTEGER,
  checkin_fuel_level      SMALLINT,                        -- 0–100 %
  checkin_condition       vehicle_condition,
  checkin_notes           TEXT,
  checkin_photos          JSONB             NOT NULL DEFAULT '[]',
  checkin_signature       TEXT,                            -- Base64 canvas PNG
  checkin_signature_name  VARCHAR(255),                    -- Signatory full name
  checkin_signed_at       TIMESTAMPTZ,

  -- Check-out
  checkout_at             TIMESTAMPTZ,
  checkout_mileage        INTEGER,
  checkout_fuel_level     SMALLINT,
  checkout_condition      vehicle_condition,
  checkout_notes          TEXT,
  checkout_photos         JSONB             NOT NULL DEFAULT '[]',
  checkout_signature      TEXT,
  checkout_signature_name VARCHAR(255),
  checkout_signed_at      TIMESTAMPTZ,

  created_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DAMAGE REPORTS
-- ─────────────────────────────────────────
CREATE TABLE damage_reports (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id      UUID         NOT NULL REFERENCES checkin_protocols(id) ON DELETE CASCADE,
  description      TEXT         NOT NULL,
  photos           JSONB        NOT NULL DEFAULT '[]',
  reported_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  resolution_notes TEXT
);

-- ─────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE TABLE invoices (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  VARCHAR(20)    UNIQUE NOT NULL,
  tenant_id       UUID           NOT NULL REFERENCES tenants(id),
  booking_id      UUID           REFERENCES bookings(id),
  customer_id     UUID           REFERENCES profiles(id),

  -- Amounts
  subtotal        DECIMAL(10,2)  NOT NULL,
  tax_rate        DECIMAL(5,2)   NOT NULL DEFAULT 19.00, -- MwSt.
  tax_amount      DECIMAL(10,2)  NOT NULL,
  total           DECIMAL(10,2)  NOT NULL,

  -- Status & dates
  status          invoice_status NOT NULL DEFAULT 'draft',
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  payment_method  payment_method,

  -- Content (line items stored as JSON for flexibility)
  items           JSONB          NOT NULL DEFAULT '[]',
  notes           TEXT,

  -- Delivery
  pdf_url         TEXT,
  sent_at         TIMESTAMPTZ,
  recipient_email VARCHAR(255),

  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DAILY CASH REGISTER
-- ─────────────────────────────────────────
CREATE TABLE daily_cash (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID          NOT NULL REFERENCES tenants(id),
  date             DATE          NOT NULL,
  opening_balance  DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_balance  DECIMAL(10,2),
  total_cash       DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_card       DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_online     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_invoice    DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  closed_by        UUID          REFERENCES profiles(id),
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, date)
);

-- ─────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────
CREATE TABLE payments (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID           NOT NULL REFERENCES tenants(id),
  booking_id     UUID           REFERENCES bookings(id),
  invoice_id     UUID           REFERENCES invoices(id),
  daily_cash_id  UUID           REFERENCES daily_cash(id),
  amount         DECIMAL(10,2)  NOT NULL,
  method         payment_method NOT NULL,
  status         payment_status NOT NULL DEFAULT 'pending',
  reference      VARCHAR(255),
  processed_by   UUID           REFERENCES profiles(id),
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Auto-set booking number
CREATE OR REPLACE FUNCTION fn_set_booking_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.booking_number := 'BK-' || TO_CHAR(NOW(), 'YYYY') || '-'
                        || LPAD(nextval('booking_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL OR NEW.booking_number = '')
  EXECUTE FUNCTION fn_set_booking_number();

-- Auto-set invoice number
CREATE OR REPLACE FUNCTION fn_set_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-'
                        || LPAD(nextval('invoice_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION fn_set_invoice_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenants_updated_at          BEFORE UPDATE ON tenants           FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_profiles_updated_at         BEFORE UPDATE ON profiles          FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_parking_lots_updated_at     BEFORE UPDATE ON parking_lots      FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_drivers_updated_at          BEFORE UPDATE ON drivers           FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_bookings_updated_at         BEFORE UPDATE ON bookings          FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_checkin_protocols_updated_at BEFORE UPDATE ON checkin_protocols FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_invoices_updated_at         BEFORE UPDATE ON invoices          FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_lots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_protocols  ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cash         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;

-- Tenants
CREATE POLICY "tenant_select_own"   ON tenants FOR SELECT USING (id = get_user_tenant_id() OR get_user_role() = 'admin');
CREATE POLICY "tenant_admin_all"    ON tenants FOR ALL    USING (get_user_role() = 'admin');

-- Profiles
CREATE POLICY "profile_select_own"        ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profile_select_tenant"     ON profiles FOR SELECT USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));
CREATE POLICY "profile_update_own"        ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profile_operator_manage"   ON profiles FOR ALL    USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));

-- Airports (public read)
CREATE POLICY "airports_public_read"  ON airports FOR SELECT USING (TRUE);
CREATE POLICY "airports_admin_write"  ON airports FOR ALL    USING (get_user_role() = 'admin');

-- Parking Lots
CREATE POLICY "lots_public_read"      ON parking_lots FOR SELECT USING (is_active = TRUE);
CREATE POLICY "lots_operator_manage"  ON parking_lots FOR ALL    USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));

-- Drivers
CREATE POLICY "drivers_operator_manage" ON drivers FOR ALL    USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));
CREATE POLICY "drivers_self_read"       ON drivers FOR SELECT USING (profile_id = auth.uid());

-- Bookings
CREATE POLICY "bookings_customer_read"   ON bookings FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "bookings_customer_insert" ON bookings FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "bookings_operator_all"    ON bookings FOR ALL    USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','driver','admin'));

-- Vehicles
CREATE POLICY "vehicles_via_booking" ON vehicles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
      AND (b.customer_id = auth.uid() OR b.tenant_id = get_user_tenant_id())
  )
);

-- Checkin Protocols
CREATE POLICY "protocols_operator_driver" ON checkin_protocols FOR ALL USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','driver','admin'));

-- Damage Reports
CREATE POLICY "damage_via_protocol" ON damage_reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM checkin_protocols cp
    WHERE cp.id = protocol_id AND cp.tenant_id = get_user_tenant_id()
  )
);

-- Invoices
CREATE POLICY "invoices_operator_manage"  ON invoices FOR ALL    USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));
CREATE POLICY "invoices_customer_read"    ON invoices FOR SELECT USING (customer_id = auth.uid());

-- Daily Cash
CREATE POLICY "cash_operator_manage" ON daily_cash FOR ALL USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));

-- Payments
CREATE POLICY "payments_operator_manage" ON payments FOR ALL USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('operator','admin'));

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_profiles_tenant          ON profiles(tenant_id);
CREATE INDEX idx_parking_lots_airport     ON parking_lots(airport_id);
CREATE INDEX idx_parking_lots_tenant      ON parking_lots(tenant_id);
CREATE INDEX idx_bookings_tenant          ON bookings(tenant_id);
CREATE INDEX idx_bookings_customer        ON bookings(customer_id);
CREATE INDEX idx_bookings_parking_lot     ON bookings(parking_lot_id);
CREATE INDEX idx_bookings_status          ON bookings(status);
CREATE INDEX idx_bookings_dropoff         ON bookings(dropoff_date);
CREATE INDEX idx_drivers_tenant           ON drivers(tenant_id);
CREATE INDEX idx_checkin_booking          ON checkin_protocols(booking_id);
CREATE INDEX idx_invoices_tenant          ON invoices(tenant_id);
CREATE INDEX idx_daily_cash_tenant_date   ON daily_cash(tenant_id, date);
CREATE INDEX idx_payments_tenant          ON payments(tenant_id);
CREATE INDEX idx_payments_booking         ON payments(booking_id);
