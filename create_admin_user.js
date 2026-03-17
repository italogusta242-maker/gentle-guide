const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hyjpxscsixeoibzhhtaf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'italogusta242@gmail.com';
  const password = 'Wall9969';

  console.log(`Buscando usuário: ${email}`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  
  let user = users.find(u => u.email === email);
  let userId;

  if (user) {
    userId = user.id;
    console.log(`Usuário encontrado! ID: ${userId}. Atualizando senha...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
    if (updateError) throw updateError;
  } else {
    console.log('Criando novo usuário...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: 'Admin Italo' }
    });
    if (authError) throw authError;
    userId = authData.user.id;
  }

  // 2. Criar Perfil
  console.log('Criando/Atualizando perfil...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      nome: 'Admin Italo',
      email: email,
      onboarded: true
    });

  if (profileError) {
      console.error('Erro no Perfil:', profileError.message);
      throw profileError;
  }

  // 3. Atribuir Role
  console.log('Atribuindo role admin...');
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

  if (roleError) {
      console.error('Erro no Role:', roleError.message);
      throw roleError;
  }

  // 4. Inicializar Gamificação
  console.log('Inicializando gamificação...');
  const { error: gamificationError } = await supabase
    .from('gamification')
    .upsert({ user_id: userId, level: 99, xp: 999999 });

  if (gamificationError) {
      console.error('Erro na Gamificação:', gamificationError.message);
      throw gamificationError;
  }

  console.log('TUDO PRONTO! O login deve funcionar agora.');
}

createAdmin().catch(err => {
  console.error('ERRO:', err.message);
  process.exit(1);
});
