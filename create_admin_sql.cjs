const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function createAdminSQL() {
  try {
    await client.connect();
    console.log('Conectado ao Postgres!');

    const sql = `
-- 1. Cria o usuário na tabela de Autenticação (Auth)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'italogusta242@gmail.com') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'italogusta242@gmail.com',
      crypt('Wall9969', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Admin Italo"}',
      false,
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'italogusta242@gmail.com';
    UPDATE auth.users SET encrypted_password = crypt('Wall9969', gen_salt('bf')) WHERE id = v_user_id;
  END IF;

  -- Perfil
  INSERT INTO public.profiles (id, nome, email, onboarded)
  VALUES (v_user_id, 'Admin Italo', 'italogusta242@gmail.com', true)
  ON CONFLICT (id) DO UPDATE SET onboarded = true;

  -- Role de Admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Gamificação
  INSERT INTO public.gamification (user_id, level, xp)
  VALUES (v_user_id, 99, 999999)
  ON CONFLICT (user_id) DO NOTHING;
END $$;
    `;

    console.log('Executando SQL de criação de admin...');
    await client.query(sql);
    console.log('ADMIN CRIADO/ATUALIZADO COM SUCESSO VIA SQL!');

  } catch (err) {
    console.error('ERRO:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminSQL();
