import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export async function GET(req:NextRequest){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!secret)return new NextResponse(null,{status:503});
  const token=req.headers.get('authorization');
  if(!token?.startsWith('Bearer '))return new NextResponse(null,{status:401});
  const client=createClient(url,key,{auth:{persistSession:false}});
  const {data:{user},error}=await client.auth.getUser(token.slice(7));
  if(error||!user)return new NextResponse(null,{status:401});
  const tipo=req.nextUrl.searchParams.get('tipo'),id=req.nextUrl.searchParams.get('id');
  if((tipo!=='consultoria'&&tipo!=='cliente')||!id||!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))return new NextResponse(null,{status:400});
  const table=tipo==='consultoria'?'consultorias':'clientes';
  const {data:record,error:readError}=await client.from(table).select('logo_path').eq('id',id).maybeSingle();
  if(readError||!record?.logo_path)return new NextResponse(null,{status:404});
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:signed,error:signError}=await admin.storage.from('logos-empresas').createSignedUrl(record.logo_path,60);
  if(signError||!signed?.signedUrl)return new NextResponse(null,{status:404});
  return NextResponse.json({url:signed.signedUrl},{headers:{'Cache-Control':'no-store'}});
 }catch{return new NextResponse(null,{status:500})}
}
