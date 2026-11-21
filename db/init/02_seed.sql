-- Demo data. Also re-run by "Reset demo data" on the login page
-- (app/api/demo/reset), after it truncates the tables.

INSERT INTO departments (name, is_hr_flow) VALUES
  ('Retail Banking', false),
  ('Corporate Banking', false),
  ('Customer Service', false),
  ('Finance & Accounting', false),
  ('IT Support', false),
  ('Human Resources', true),
  ('Engineering Manager', true),
  ('Chief Technology Officer', true),
  ('Chief Executive Officer', true)
ON CONFLICT (name) DO NOTHING;

-- Names are invented. Employee passwords: password123 · HR/exec passwords: hrpass123
INSERT INTO users (id, name, username, password_hash, email, department) VALUES
  ('u-1001', 'Aran Suksawat',      'aran.suksawat',      crypt('password123', gen_salt('bf')), 'aran.suksawat@siambankcorp.com',      'Retail Banking'),
  ('u-1002', 'Nutcha Boonmee',     'nutcha.boonmee',     crypt('password123', gen_salt('bf')), 'nutcha.boonmee@siambankcorp.com',     'Corporate Banking'),
  ('u-1003', 'Pim Charoensuk',     'pim.charoensuk',     crypt('password123', gen_salt('bf')), 'pim.charoensuk@siambankcorp.com',     'Customer Service'),
  ('u-1004', 'Somchai Rattanakul', 'somchai.rattanakul', crypt('password123', gen_salt('bf')), 'somchai.rattanakul@siambankcorp.com', 'Finance & Accounting'),
  ('u-1005', 'Kanya Wattana',      'kanya.wattana',      crypt('password123', gen_salt('bf')), 'kanya.wattana@siambankcorp.com',      'IT Support'),
  ('u-1006', 'Nathan Wells',       'nathan.wells',       crypt('password123', gen_salt('bf')), 'nathan.wells@siambankcorp.com',       'Corporate Banking'),
  ('u-1007', 'Ploy Sirichai',      'ploy.sirichai',      crypt('password123', gen_salt('bf')), 'ploy.sirichai@siambankcorp.com',      'Retail Banking'),
  ('u-1008', 'David Chan',         'david.chan',         crypt('password123', gen_salt('bf')), 'david.chan@siambankcorp.com',         'Finance & Accounting'),
  ('u-1009', 'Warut Phetchara',    'warut.phetchara',    crypt('password123', gen_salt('bf')), 'warut.phetchara@siambankcorp.com',    'Retail Banking'),
  ('u-2001', 'Suda Anantasin (HR Executive)',        'hr.suda',   crypt('hrpass123', gen_salt('bf')), 'suda.anantasin@siambankcorp.com',   'Human Resources'),
  ('u-2002', 'Peter Lindqvist (CTO)',                'cto.peter', crypt('hrpass123', gen_salt('bf')), 'peter.lindqvist@siambankcorp.com',  'Chief Technology Officer'),
  ('u-2003', 'Malee Jitpakdee (CEO)',                'ceo.malee', crypt('hrpass123', gen_salt('bf')), 'malee.jitpakdee@siambankcorp.com',  'Chief Executive Officer'),
  ('u-2004', 'Nan Suriyawong (Engineering Manager)', 'em.nan',    crypt('hrpass123', gen_salt('bf')), 'nan.suriyawong@siambankcorp.com',   'Engineering Manager')
ON CONFLICT (id) DO NOTHING;

-- Each row copied from data/employees_ocean_hr.csv (employee_id in the comment).
-- u-1009 has no result -> demonstrates the "test not completed" state.
INSERT INTO test_results (user_id, o, c, e, a, n) VALUES
  ('u-1001', 37, 27, 21, 40, 28), -- 6
  ('u-1002', 49, 41, 45, 40, 37), -- 939
  ('u-1003', 44, 36, 33, 48, 26), -- 68
  ('u-1004', 38, 50, 42, 50, 22), -- 970
  ('u-1005', 48, 39, 21, 30, 43), -- 87
  ('u-1006', 42, 37, 24, 32, 40), -- 3
  ('u-1007', 46, 38, 42, 40, 40), -- 63
  ('u-1008', 49, 38, 35, 30, 24)  -- 1746
ON CONFLICT (user_id) DO NOTHING;
