'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
export function useClienteAtivo(){
 const [clienteAtivo,setClienteAtivo]=useState('');
 const [chave,setChave]=useState('');
 useEffect(()=>{
  let vivo=true;
  async function carregar(){
   const {data:{user}}=await supabase().auth.getUser();
   if(!user||!vivo)return;
   const {data}=await supabase().from('usuarios_consultoria').select('consultoria_id').eq('usuario_id',user.id).eq('ativo',true).limit(1);
   if(!vivo)return;
   const consultoria=data?.[0]?.consultoria_id;
   if(!consultoria)return;
   const k='portal-nr17:empresa-ativa:'+user.id+':'+consultoria;
   setChave(k);setClienteAtivo(window.localStorage.getItem(k)||'');
  }
  void carregar();
  const receber=(e:Event)=>setClienteAtivo((e as CustomEvent<{clienteId:string}>).detail?.clienteId||'');
  window.addEventListener('portal-nr17:empresa-ativa',receber);
  return()=>{vivo=false;window.removeEventListener('portal-nr17:empresa-ativa',receber)};
 },[]);
 function selecionarClienteAtivo(id:string){
  if(!chave)return;
  if(id)window.localStorage.setItem(chave,id);
  else window.localStorage.removeItem(chave);
  setClienteAtivo(id);
  window.dispatchEvent(new CustomEvent('portal-nr17:empresa-ativa',{detail:{clienteId:id}}));
 }
 return {clienteAtivo,selecionarClienteAtivo};
}
