import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_SIZE=2*1024*1024;
const types:Record<string,{ext:string;matches:(b:Uint8Array)=>boolean}>={
 'image/png':{ext:'png',matches:b=>b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)},
 'image/jpeg':{ext:'jpg',matches:b=>b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255},
 'image/webp':{ext:'webp',matches:b=>b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP'}
};
export async function POST(req:NextRequest){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!secret)return NextResponse.json({error:'Configuração do servidor incompleta'},{status:503});
  const bearer=req.headers.get('authorization');
  if(!bearer?.startsWith('Bearer '))return NextResponse.json({error:'Não autenticado'},{status:401});
  const client=createClient(url,key,{auth:{persistSession:false}});
  const {data:{user},error:authError}=await client.auth.getUser(bearer.slice(7));
  if(authError||!user)return NextResponse.json({error:'Sessão inválida'},{status:401});
  const form=await req.formData();
  const tipo=form.get('tipo'),id=form.get('id'),file=form.get('arquivo');
  if((tipo!=='consultoria'&&tipo!=='cliente')||typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)||!(file instanceof File))
   return NextResponse.json({error:'Dados inválidos'},{status:400});
  if(file.size===0||file.size>MAX_SIZE||!types[file.type])
   return NextResponse.json({error:'Use PNG, JPG ou WebP de até 2 MB.'},{status:400});
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!types[file.type].matches(bytes))return NextResponse.json({error:'O conteúdo do arquivo não corresponde ao formato informado.'},{status:400});
  const central=user.app_metadata?.role==='admin_central';
  let permitido=false;
  let consultoriaId=id;
  if(tipo==='consultoria'){
   permitido=central;
  }else{
   const {data:cliente,error}=await client.from('clientes').select('consultoria_id').eq('id',id).maybeSingle();
   if(error||!cliente)return NextResponse.json({error:'Cliente não encontrado ou sem acesso'},{status:404});
   consultoriaId=cliente.consultoria_id;
   const {data:membership}=await client.from('usuarios_consultoria').select('id').eq('consultoria_id',consultoriaId).eq('usuario_id',user.id).eq('perfil','admin_consultoria').maybeSingle();
   permitido=central||!!membership;
  }
  if(!permitido)return NextResponse.json({error:'Sem permissão para alterar este logo'},{status:403});
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const tabela=tipo==='consultoria'?'consultorias':'clientes';
  const {data:registro,error:recordError}=await admin.from(tabela).select('id,logo_path').eq('id',id).maybeSingle();
  if(recordError||!registro)return NextResponse.json({error:'Registro não encontrado'},{status:404});
  const path=tipo==='consultoria'?`consultorias/${id}/${crypto.randomUUID()}.${types[file.type].ext}`:`consultorias/${consultoriaId}/clientes/${id}/${crypto.randomUUID()}.${types[file.type].ext}`;
  const {error:uploadError}=await admin.storage.from('logos-empresas').upload(path,bytes,{contentType:file.type,upsert:false});
  if(uploadError)return NextResponse.json({error:'Falha ao enviar imagem'},{status:500});
  const {error:updateError}=await admin.from(tabela).update({logo_path:path}).eq('id',id);
  if(updateError){await admin.storage.from('logos-empresas').remove([path]);return NextResponse.json({error:'Falha ao vincular logo ao cadastro'},{status:500})}
  if(registro.logo_path&&registro.logo_path!==path)await admin.storage.from('logos-empresas').remove([registro.logo_path]);
  return NextResponse.json({message:'Logotipo salvo com sucesso.'});
 }catch{return NextResponse.json({error:'Erro ao processar imagem'},{status:500})}
}
