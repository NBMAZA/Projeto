import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key||!service)return NextResponse.json({error:'Configuração incompleta'},{status:503});
    const bearer=req.headers.get('authorization');
    if(!bearer?.startsWith('Bearer '))return NextResponse.json({error:'Acesso não autenticado'},{status:401});
    const auth=createClient(url,key,{auth:{persistSession:false}});
    const {data:{user},error:authError}=await auth.auth.getUser(bearer.slice(7));
    if(authError||!user)return NextResponse.json({error:'Sessão inválida'},{status:401});
    const body=await req.json();
    const consultoriaId=String(body.consultoria_id||'');
    const cliente=body.cliente||{}, responsavel=body.administrador||{};
    const cnpj=String(cliente.cnpj||'').replace(/\D/g,'');
    const email=String(responsavel.email||'').trim().toLowerCase(),nome=String(responsavel.nome||'').trim();
    if(!/^[0-9a-f-]{36}$/i.test(consultoriaId)||!/^\d{14}$/.test(cnpj)||!String(cliente.razao_social||'').trim()||!nome||!/^\S+@\S+\.\S+$/.test(email))
      return NextResponse.json({error:'Informe consultoria, razão social, CNPJ, nome e e-mail do administrador.'},{status:400});
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    if(user.app_metadata?.role!=='admin_central'){
      const {data:membership,error:memberError}=await admin.from('usuarios_consultoria').select('id').eq('consultoria_id',consultoriaId).eq('usuario_id',user.id).eq('perfil','admin_consultoria').eq('ativo',true).maybeSingle();
      if(memberError)return NextResponse.json({error:'Não foi possível verificar a permissão da consultoria.'},{status:500});
      if(!membership)return NextResponse.json({error:'Sem permissão para esta consultoria.'},{status:403});
    }
    const {data:created,error:createError}=await admin.from('clientes').insert({
      consultoria_id:consultoriaId,razao_social:String(cliente.razao_social).trim(),nome_fantasia:String(cliente.nome_fantasia||'').trim(),
      cnpj,email:String(cliente.email||'').trim(),telefone:String(cliente.telefone||'').trim(),responsavel:String(cliente.responsavel||'').trim(),
      cep:String(cliente.cep||'').replace(/\D/g,''),logradouro:String(cliente.logradouro||'').trim(),numero:String(cliente.numero||'').trim(),
      complemento:String(cliente.complemento||'').trim(),bairro:String(cliente.bairro||'').trim(),cidade:String(cliente.cidade||'').trim(),
      uf:String(cliente.uf||'').trim().toUpperCase(),cnae:String(cliente.cnae||'').trim(),
      grau_risco:cliente.grau_risco?Number(cliente.grau_risco):null,
      quantidade_funcionarios:cliente.quantidade_funcionarios===''||cliente.quantidade_funcionarios==null?null:Number(cliente.quantidade_funcionarios)
    }).select('id').single();
    if(createError||!created)return NextResponse.json({error:createError?.message||'Falha ao criar cliente'},{status:400});
    const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{
      data:{nome},redirectTo:'https://portal-nr17.vercel.app/ativar-conta'
    });
    if(inviteError||!invited.user){
      await admin.from('clientes').delete().eq('id',created.id);
      return NextResponse.json({error:inviteError?.message||'Falha ao enviar convite'},{status:400});
    }
    const {error:linkError}=await admin.from('usuarios_cliente').insert({cliente_id:created.id,consultoria_id:consultoriaId,usuario_id:invited.user.id,perfil:'admin_cliente'});
    if(linkError)return NextResponse.json({error:'Cliente criado e convite processado, mas vínculo não foi concluído. Solicite suporte antes de tentar novamente.',cliente_id:created.id},{status:500});
    return NextResponse.json({id:created.id,message:'Cliente cadastrado e convite enviado ao administrador.'},{status:201});
  }catch{return NextResponse.json({error:'Não foi possível concluir a operação.'},{status:500})}
}
