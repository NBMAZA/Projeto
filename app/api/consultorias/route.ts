import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !publicKey || !serviceKey) return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 503 });

    const bearer = request.headers.get('authorization');
    if (!bearer?.startsWith('Bearer ')) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    const client = createClient(url, publicKey, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await client.auth.getUser(bearer.slice(7));
    if (authError || !user) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    if (user.app_metadata?.role !== 'admin_central') return NextResponse.json({ error: 'Acesso restrito ao administrador central.' }, { status: 403 });

    const body = await request.json();
    const { consultoria, administrador } = body ?? {};
    const cnpj = String(consultoria?.cnpj ?? '').replace(/\D/g, '');
    const email = String(administrador?.email ?? '').trim().toLowerCase();
    const nome = String(administrador?.nome ?? '').trim();
    if (!/^\d{14}$/.test(cnpj) || !String(consultoria?.razao_social ?? '').trim() || !/^\S+@\S+\.\S+$/.test(email) || !nome)
      return NextResponse.json({ error: 'Preencha razão social, CNPJ, nome e e-mail do administrador.' }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: created, error: insertError } = await admin.from('consultorias').insert({
      razao_social: String(consultoria.razao_social).trim(),
      nome_fantasia: String(consultoria.nome_fantasia ?? '').trim(),
      cnpj,
      email: String(consultoria.email ?? '').trim(),
      telefone: String(consultoria.telefone ?? '').trim(),
      cidade: String(consultoria.cidade ?? '').trim(),
      uf: String(consultoria.uf ?? '').trim().toUpperCase(),
      responsavel: String(consultoria.responsavel ?? '').trim(),
      status: 'pendente'
    }).select('id').single();
    if (insertError || !created) return NextResponse.json({ error: insertError?.message ?? 'Falha ao cadastrar consultoria.' }, { status: 400 });

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { nome },
      redirectTo: 'https://portal-nr17.vercel.app/ativar-conta'
    });
    if (inviteError || !invited.user) {
      await admin.from('consultorias').delete().eq('id', created.id);
      return NextResponse.json({ error: inviteError?.message ?? 'Falha ao convidar administrador.' }, { status: 400 });
    }

    const { error: linkError } = await admin.from('usuarios_consultoria').insert({
      consultoria_id: created.id, usuario_id: invited.user.id, perfil: 'admin_consultoria'
    });
    if (linkError) {
      // Não apagar automaticamente uma conta Auth, pois ela pode existir em outros contextos.
      await admin.from('consultorias').delete().eq('id', created.id);
      return NextResponse.json({ error: 'Convite enviado, mas o vínculo falhou. Contate o suporte antes de tentar novamente.' }, { status: 500 });
    }
    return NextResponse.json({ id: created.id, message: 'Consultoria cadastrada. Convite enviado ao administrador.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Não foi possível concluir o cadastro.' }, { status: 500 });
  }
}
