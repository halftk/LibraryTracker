-- -----------------------------------------------------------------------------
-- Seed SQL para entorno de desarrollo local (Supabase Docker)
-- Crea un usuario de pruebas por defecto compatible con GoTrue Auth (Go struct non-null strings)
-- -----------------------------------------------------------------------------

-- 1. Crear usuario de pruebas en auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@local.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"username":"TestGamer"}',
  false,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear registro correspondiente en auth.identities (Obligatorio para GoTrue v2)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"test@local.com"}',
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
