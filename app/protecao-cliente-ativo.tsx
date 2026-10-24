'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {supabase} from '../lib/supabase';

const modulos=new Set(['/plantas','/instalacoes','/postos','/estacoes','/cargos','/atividades','/vinculos-cargos']);
export default function ProtecaoClienteAtivo({children}:{children:ReactNode}){
 const pathname=usePathname();
 const protegido=modulos.has(pathname);
 const [situacao,setSituacao]=useState<'verificando'|'liberado'|'sem-cliente'|'sem-acesso'>('verificando');
 useEffect(()=>{
  if(!protegido){setSituacao('liberado');return}
  let ativo=true;
  const validar=async()=>{
   setSituacao('verificando');
   try{
    const db=supabase();
    const {data:{user}}=await db.auth.getUser();
    if(!ativo)return;
    if(!user){setSituacao('sem-acesso');return}
    const {data:links,error:erroLinks}=await db.from('usuarios_consultoria').select('consultoria_id').eq('usuario_id',user.id).eq('ativo',true).limit(1);
    if(erroLinks)throw erroLinks;
    const consultoria=links?.[0]?.consultoria_id;
    if(!consultoria){setSituacao('sem-acesso');return}
    const chave='portal-nr17:empresa-ativa:'+user.id+':'+consultoria;
    const id=window.localStorage.getItem(chave)||'';
    if(!id){setSituacao('sem-cliente');return}
    const {data:cliente,error}=await db.from('clientes').select('id,status').eq('id',id).eq('consultoria_id',consultoria).maybeSingle();
    if(error)throw error;
    if(!ativo)return;
    setSituacao(cliente&&cliente.status!=='inativo'?'liberado':'sem-cliente');
   }catch{if(ativo)setSituacao('sem-acesso')}
  };
  void validar();
  const atualizar=()=>{void validar()};
  window.addEventListener('portal-nr17:empresa-ativa',atualizar);
  return()=>{ativo=false;window.removeEventListener('portal-nr17:empresa-ativa',atualizar)};
 },[pathname,protegido]);
 if(!protegido||situacao==='liberado')return <>{children}</>;
 if(situacao==='verificando')return <main style={{padding:32}} role="status">Verificando a empresa ativa...</main>;
 return <main style={{maxWidth:700,margin:'64px auto',padding:28,border:'1px solid #cad6dc',borderRadius:12}}>
  <h1>{situacao==='sem-cliente'?'Empresa não selecionada':'Acesso não autorizado'}</h1>
  <p role="alert">{situacao==='sem-cliente'?'Selecione uma empresa no Painel da Consultoria antes de acessar este módulo.':'Entre com uma conta autorizada da consultoria para acessar este módulo.'}</p>
  <Link href="/">Voltar ao Painel da Consultoria</Link>
 </main>;
}
