import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export async function POST(req:NextRequest){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!service)return NextResponse.json({error:'Configuração incompleta'},{status:503});
  const token=req.headers.get('authorization');
  if(!token?.startsWith('Bearer '))return NextResponse.json({error:'Acesso não autenticado'},{status:401});
  const auth=createClient(url,key,{auth:{persistSession:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token.slice(7));
  if(authError||!user)return NextResponse.json({error:'Sessão inválida'},{status:401});
  const body=await req.json();
  const consultoriaId=String(body.consultoria_id||''),clienteId=String(body.cliente_id||'');
  const nome=String(body.nome||'').trim(),email=String(body.email||'').trim().toLowerCase();
  if(!/^[0-9a-f-]{36}$/i.test(consultoriaId)||!/^[0-9a-f-]{36}$/i.test(clienteId)||!nome||!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:'Informe cliente, nome e e-mail válido.'},{status:400});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  if(user.app_metadata?.role!=='admin_central'){
   const {data:member,error}=await admin.from('usuarios_consultoria').select('id').eq('consultoria_id',consultoriaId).eq('usuario_id',user.id).eq('perfil','admin_consultoria').eq('ativo',true).maybeSingle();
   if(error||!member)return NextResponse.json({error:'Sem permissão para esta consultoria.'},{status:403});
  }
  const {data:cliente,error:clienteError}=await admin.from('clientes').select('id').eq('id',clienteId).eq('consultoria_id',consultoriaId).maybeSingle();
  if(clienteError||!cliente)return NextResponse.json({error:'Cliente não encontrado nesta consultoria.'},{status:404});
  const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{data:{nome},redirectTo:'https://portal-nr17.vercel.app/ativar-conta'});
  if(inviteError||!invited.user)return NextResponse.json({error:inviteError?.message||'Não foi possível enviar convite. Se o usuário já existir, será necessário vinculá-lo separadamente.'},{status:400});
  const {error:linkError}=await admin.from('usuarios_cliente').insert({cliente_id:clienteId,consultoria_id:consultoriaId,usuario_id:invited.user.id,perfil:'admin_cliente'});
  if(linkError)return NextResponse.json({error:'Convite enviado, mas o vínculo não foi concluído. Solicite suporte antes de reenviar.'},{status:500});
  return NextResponse.json({message:'Convite enviado e administrador vinculado ao cliente.'});
 }catch{return NextResponse.json({error:'Não foi possível concluir o convite.'},{status:500})}
}
