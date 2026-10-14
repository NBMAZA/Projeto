import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

async function access(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||!service)throw new Error('Configuração do servidor incompleta');
 const bearer=req.headers.get('authorization');
 if(!bearer?.startsWith('Bearer '))return null;
 const auth=createClient(url,key,{auth:{persistSession:false}});
 const {data:{user},error}=await auth.auth.getUser(bearer.slice(7));
 if(error||!user||user.app_metadata?.role!=='admin_central')return null;
 return createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
}
type Context={params:Promise<{id:string}>};
const validId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export async function GET(req:NextRequest,ctx:Context){
 try{
  const admin=await access(req);if(!admin)return NextResponse.json({error:'Acesso não autorizado'},{status:403});
  const {id}=await ctx.params;if(!validId(id))return NextResponse.json({error:'Identificador inválido'},{status:400});
  const [c,clients,users]=await Promise.all([
   admin.from('consultorias').select('id,razao_social,nome_fantasia,cnpj,email,telefone,cidade,uf,responsavel,status,logo_path').eq('id',id).maybeSingle(),
   admin.from('clientes').select('id,razao_social,cnpj,status').eq('consultoria_id',id).order('razao_social'),
   admin.from('usuarios_consultoria').select('usuario_id,perfil').eq('consultoria_id',id)
  ]);
  if(c.error||clients.error||users.error)return NextResponse.json({error:c.error?.message||clients.error?.message||users.error?.message},{status:400});
  if(!c.data)return NextResponse.json({error:'Consultoria não encontrada'},{status:404});
  return NextResponse.json({consultoria:c.data,clientes:clients.data||[],administradores:users.data||[]});
 }catch{return NextResponse.json({error:'Erro ao consultar consultoria'},{status:500})}
}
export async function POST(req:NextRequest,ctx:Context){
 try{
  const admin=await access(req);if(!admin)return NextResponse.json({error:'Acesso não autorizado'},{status:403});
  const {id}=await ctx.params;if(!validId(id))return NextResponse.json({error:'Identificador inválido'},{status:400});
  const body=await req.json();
  const nome=typeof body?.nome==='string'?body.nome.trim():'';
  const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
  if(!nome||nome.length>150||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return NextResponse.json({error:'Informe nome e e-mail válidos'},{status:400});
  const {data:consultoria,error:ce}=await admin.from('consultorias').select('id').eq('id',id).maybeSingle();
  if(ce||!consultoria)return NextResponse.json({error:'Consultoria não encontrada'},{status:404});
  const {data:invited,error:ie}=await admin.auth.admin.inviteUserByEmail(email,{data:{nome},redirectTo:new URL('/',req.nextUrl.origin).toString()});
  if(ie||!invited.user)return NextResponse.json({error:ie?.message||'Não foi possível enviar o convite. Se o e-mail já possui conta, contate o suporte para vinculação segura.'},{status:400});
  const {error:le}=await admin.from('usuarios_consultoria').insert({consultoria_id:id,usuario_id:invited.user.id,perfil:'admin_consultoria'});
  if(le)return NextResponse.json({error:'Convite enviado, mas vínculo não concluído. Contate o suporte antes de reenviar.'},{status:500});
  return NextResponse.json({message:'Convite enviado ao administrador.'},{status:201});
 }catch{return NextResponse.json({error:'Erro ao convidar administrador'},{status:500})}
}
