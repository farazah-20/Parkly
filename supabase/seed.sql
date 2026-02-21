-- ============================================================
-- Seed data for development
-- ============================================================

-- Airports (German + major European)
INSERT INTO airports (name, iata_code, city, country) VALUES
  ('Frankfurt Airport',               'FRA', 'Frankfurt am Main', 'Deutschland'),
  ('Munich Airport',                  'MUC', 'München',           'Deutschland'),
  ('Düsseldorf Airport',              'DUS', 'Düsseldorf',        'Deutschland'),
  ('Berlin Brandenburg Airport',      'BER', 'Berlin',            'Deutschland'),
  ('Hamburg Airport',                 'HAM', 'Hamburg',           'Deutschland'),
  ('Stuttgart Airport',               'STR', 'Stuttgart',         'Deutschland'),
  ('Cologne Bonn Airport',            'CGN', 'Köln',              'Deutschland'),
  ('Hannover Airport',                'HAJ', 'Hannover',          'Deutschland'),
  ('Nuremberg Airport',               'NUE', 'Nürnberg',          'Deutschland'),
  ('Vienna International Airport',    'VIE', 'Wien',              'Österreich'),
  ('Zurich Airport',                  'ZRH', 'Zürich',            'Schweiz');

-- Demo tenant
INSERT INTO tenants (name, slug, email, phone, address, settings) VALUES
  (
    'Parkservice Frankfurt GmbH',
    'parkservice-frankfurt',
    'info@parkservice-frankfurt.de',
    '+49 69 123456',
    'Flughafenstraße 1, 60549 Frankfurt am Main',
    '{"tax_rate": 19, "currency": "EUR", "invoice_prefix": "PSF"}'
  );

-- Demo parking lots (tenant_id must be replaced with actual UUID after insertion)
-- Run this after creating the tenant:
/*
INSERT INTO parking_lots (tenant_id, airport_id, name, description, address, distance_to_airport, price_per_day, total_capacity, available_spots, shuttle_available, valet_available, features) VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'parkservice-frankfurt'),
    (SELECT id FROM airports WHERE iata_code = 'FRA'),
    'P1 – Valet Premium',
    'Direkter Valet-Service mit Shuttle zum Terminal. Überdachte Stellplätze, 24/7 Video-Überwachung.',
    'Cargo City Nord, 60549 Frankfurt am Main',
    800,
    24.90,
    150,
    120,
    TRUE,
    TRUE,
    '["covered", "cctv", "24h", "valet", "shuttle"]'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'parkservice-frankfurt'),
    (SELECT id FROM airports WHERE iata_code = 'FRA'),
    'P2 – Economy Shuttle',
    'Günstiges Parken mit regelmäßigem Shuttle-Bus. Außengelände, beleuchtet.',
    'Mönchhofstraße 20, 65451 Kelsterbach',
    3200,
    9.90,
    500,
    380,
    TRUE,
    FALSE,
    '["cctv", "24h", "shuttle", "open_air"]'
  );
*/
