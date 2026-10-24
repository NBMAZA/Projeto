'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';

type Cliente={id:string;razao_social:string;status:string|null};
const chave=(usuario:string,consultoria:string)=>'portal-nr17:empresa-ativa:'+usuario+':'+consultoria;
export default function ClienteAtivoCabecalho(){
 const pathname=usePathname();
 const ocultarSeletor=pathname==='/plantas'||pathname==='/instalacoes'||pathname==='/postos'||pathname==='/estacoes'||pathname==='/cargos'||pathname==='/atividades';
 const [contexto,setContexto]=useState<{usuario:string;consultoria:string}|null>(null);
 const [clientes,setClientes]=useState<Cliente[]>([]);
 const [selecionado,setSelecionado]=useState('');
 const [erro,setErro]=useState('');
 const [destino,setDestino]=useState<HTMLElement|null>(null);
 useEffect(()=>{
  const faixa=document.createElement('div');
  faixa.id='ergobax-cliente-ativo-faixa';
  const posicionar=()=>{const cabecalho=document.querySelector('body > header, body > main > header, body > div > header, body > div > main > header');if(cabecalho&&cabecalho.nextElementSibling!==faixa)cabecalho.insertAdjacentElement('afterend',faixa);else if(!cabecalho&&!faixa.isConnected)document.body.prepend(faixa)};
  posicionar();setDestino(faixa);
  const observer=new MutationObserver(posicionar);observer.observe(document.body,{childList:true,subtree:true});
  return()=>{observer.disconnect();faixa.remove()};
 },[]);
 useEffect(()=>{
  let vivo=true;
  const db=supabase();
  async function carregar(){
   const {data:{user}}=await db.auth.getUser();
   if(!vivo)return;
   if(!user){setContexto(null);setClientes([]);setSelecionado('');return}
   const {data:links,error:linkErro}=await db.from('usuarios_consultoria').select('consultoria_id').eq('usuario_id',user.id).eq('ativo',true).limit(1);
   if(!vivo)return;
   if(linkErro){setErro('Não foi possível identificar a consultoria.');return}
   const consultoria=links?.[0]?.consultoria_id;
   if(!consultoria){setContexto(null);return}
   const {data,error}=await db.from('clientes').select('id,razao_social,status').eq('consultoria_id',consultoria).order('razao_social');
   if(!vivo)return;
   if(error){setErro('Não foi possível carregar os clientes.');return}
   const ativos=(data||[]).filter(c=>c.status!=='inativo');
   const salvo=window.localStorage.getItem(chave(user.id,consultoria))||'';
   const valido=ativos.some(c=>c.id===salvo)?salvo:'';
   if(salvo&&!valido)window.localStorage.removeItem(chave(user.id,consultoria));
   setContexto({usuario:user.id,consultoria});setClientes(ativos);setSelecionado(valido);setErro('');
   window.dispatchEvent(new CustomEvent('portal-nr17:empresa-ativa',{detail:{clienteId:valido}}));
  }
  void carregar();
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void carregar()});
  const atualizar=()=>{if(document.visibilityState==='visible')void carregar()};
  const sincronizar=(e:Event)=>setSelecionado((e as CustomEvent<{clienteId:string}>).detail?.clienteId||'');
  window.addEventListener('portal-nr17:empresa-ativa',sincronizar);
  window.addEventListener('portal-nr17:clientes-atualizados',atualizar);
  window.addEventListener('focus',atualizar);
  return()=>{vivo=false;subscription.unsubscribe();window.removeEventListener('portal-nr17:empresa-ativa',sincronizar);window.removeEventListener('portal-nr17:clientes-atualizados',atualizar);window.removeEventListener('focus',atualizar)};
 },[]);
 function alterar(id:string){
  if(!contexto||id&&!clientes.some(c=>c.id===id))return;
  setSelecionado(id);
  if(id)window.localStorage.setItem(chave(contexto.usuario,contexto.consultoria),id);
  else window.localStorage.removeItem(chave(contexto.usuario,contexto.consultoria));
  window.dispatchEvent(new CustomEvent('portal-nr17:empresa-ativa',{detail:{clienteId:id}}));
 }
 if(!contexto||!destino||ocultarSeletor)return null;
 return createPortal(<div role="region" aria-label="Cliente ativo" style={{position:'sticky',top:0,zIndex:50,background:'#e9f5f2',borderBottom:'1px solid #b6d8cd',padding:'8px clamp(14px,3vw,36px)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
  <strong style={{fontSize:14,color:'#123d38'}}>Cliente ativo</strong>
  <select aria-label="Trocar cliente ativo" value={selecionado} onChange={e=>alterar(e.target.value)} style={{flex:'1 1 240px',maxWidth:560,padding:'8px 12px',borderRadius:8,border:'1px solid #8ab5a9',background:'#fff'}}>
   <option value="">Selecione um cliente</option>
   {clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
  </select>
  {erro&&<span role="alert" style={{color:'#b42318',fontSize:12}}>{erro}</span>}
 </div>,destino);
}
