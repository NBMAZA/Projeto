import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export async function PATCH(req:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const {id}=await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'Identificador inválido'},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!secret)return NextResponse.json({error:'Configuração incompleta'},{status:503});
  const token=req.headers.get('authorization');
  if(!token?.startsWith('Bearer '))return NextResponse.json({error:'Não autenticado'},{status:401});
  const auth=createClient(url,key,{auth:{persistSession:false}});
  const {data:{user},error}=await auth.auth.getUser(token.slice(7));
  if(error||!user)return NextResponse.json({error:'Sessão inválida'},{status:401});
  if(user.app_metadata?.role!=='admin_central')return NextResponse.json({error:'Acesso restrito'},{status:403});
  const body=await req.json();
  const fields=['razao_social','nome_fantasia','cnpj','email','telefone','cidade','uf','responsavel','status'] as const;
  const input=body?.consultoria;
  if(!input||typeof input!=='object'||Array.isArray(input))return NextResponse.json({error:'Dados inválidos'},{status:400});
  const patch:Record<string,string>={};
  for(const field of fields)if(Object.prototype.hasOwnProperty.call(input,field)){
   if(typeof input[field]!=='string')return NextResponse.json({error:'Campo inválido: '+field},{status:400});
   patch[field]=input[field].trim();
  }
  if(!Object.keys(patch).length)return NextResponse.json({error:'Nenhuma alteração informada'},{status:400});
  if('cnpj'in patch){patch.cnpj=patch.cnpj.replace(/\D/g,'');if(!/^\d{14}$/.test(patch.cnpj))return NextResponse.json({error:'CNPJ inválido'},{status:400})}
  if('razao_social'in patch&&!patch.razao_social)return NextResponse.json({error:'Razão social obrigatória'},{status:400});
  if('email'in patch&&patch.email&&!/^\S+@\S+\.\S+$/.test(patch.email))return NextResponse.json({error:'E-mail inválido'},{status:400});
  if('uf'in patch)patch.uf=patch.uf.toUpperCase();
  if('status'in patch&&!['pendente','ativa','suspensa','inativa'].includes(patch.status))return NextResponse.json({error:'Status inválido'},{status:400});
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error:updateError}=await admin.from('consultorias').update(patch).eq('id',id).select('id').maybeSingle();
  if(updateError)return NextResponse.json({error:updateError.message},{status:400});
  if(!data)return NextResponse.json({error:'Consultoria não encontrada'},{status:404});
  return NextResponse.json({message:'Consultoria atualizada'});
 }catch{return NextResponse.json({error:'Erro ao atualizar consultoria'},{status:500})}
}
