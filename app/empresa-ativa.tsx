'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

type Cliente={id:string;razao_social:string;status:string|null};
const chave=(usuario:string,consultoria:string)=>'portal-nr17:empresa-ativa:'+usuario+':'+consultoria;

export default function EmpresaAtiva({consultoriaId,onChange}:{consultoriaId:string;onChange?:(clienteId:string)=>void}){
 const [clientes,setClientes]=useState<Cliente[]>([]);
 const [selecionada,setSelecionada]=useState('');
 const [usuario,setUsuario]=useState('');
 const [erro,setErro]=useState('');
 const [carregando,setCarregando]=useState(true);
 useEffect(()=>{
  let ativo=true;
  async function carregar(){
   setCarregando(true);setErro('');setSelecionada('');setClientes([]);
   if(!consultoriaId){setCarregando(false);return}
   try{
    const db=supabase();
    const {data:{user},error:authErro}=await db.auth.getUser();
    if(authErro)throw authErro;
    if(!user)throw new Error('Sessão não encontrada.');
    const {data,error}=await db.from('clientes').select('id,razao_social,status').eq('consultoria_id',consultoriaId).order('razao_social');
    if(error)throw error;
    if(!ativo)return;
    const disponiveis=(data||[]).filter(c=>c.status!=='inativo');
    setClientes(disponiveis);setUsuario(user.id);
    const salva=window.localStorage.getItem(chave(user.id,consultoriaId))||'';
    if(salva&&disponiveis.some(c=>c.id===salva)){setSelecionada(salva);onChange?.(salva);}
    else if(salva)window.localStorage.removeItem(chave(user.id,consultoriaId));
    if(!salva||!disponiveis.some(c=>c.id===salva))onChange?.('');
   }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Não foi possível carregar as empresas.')}
   finally{if(ativo)setCarregando(false)}
  }
  carregar();
  const atualizar=()=>{if(document.visibilityState==='visible')void carregar()};
  const aoCadastrar=()=>{void carregar()};
  window.addEventListener('focus',atualizar);
  document.addEventListener('visibilitychange',atualizar);
  window.addEventListener('portal-nr17:clientes-atualizados',aoCadastrar);
  return()=>{ativo=false;window.removeEventListener('focus',atualizar);document.removeEventListener('visibilitychange',atualizar);window.removeEventListener('portal-nr17:clientes-atualizados',aoCadastrar)};
 },[consultoriaId]);
 function alterar(id:string){
  if(!usuario||!consultoriaId)return;
  if(id&&!clientes.some(c=>c.id===id))return;
  setSelecionada(id);onChange?.(id);
  if(id)window.localStorage.setItem(chave(usuario,consultoriaId),id);
  else window.localStorage.removeItem(chave(usuario,consultoriaId));
  window.dispatchEvent(new CustomEvent('portal-nr17:empresa-ativa',{detail:{clienteId:id}}));
 }
 return <div style={{border:'1px solid #d5dfeb',borderRadius:10,padding:14,marginBottom:18,background:'#f8fafc'}}>
  <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
   <div style={{flex:'1 1 190px'}}><strong style={{fontSize:14}}>Empresa ativa</strong><p style={{fontSize:12,margin:'4px 0 0',color:'#475569'}}>Selecione o cliente para as próximas coletas.</p></div>
   <label style={{display:'grid',gap:5,flex:'2 1 280px',fontSize:12,fontWeight:600}}>Empresa selecionada
    <select aria-label="Empresa ativa" value={selecionada} onChange={e=>alterar(e.target.value)} disabled={carregando||!consultoriaId} style={{width:'100%',minWidth:0,height:40}}>
     <option value="">{carregando?'Carregando empresas...':'Nenhuma empresa selecionada'}</option>
     {clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
    </select>
   </label>
  </div>
  {erro&&<p role="alert" style={{color:'#b42318',fontSize:12}}>{erro}</p>}
  {!erro&&!carregando&&<p style={{fontSize:12,color:'#53657a',margin:'8px 0 0'}}>{selecionada?'Empresa ativa definida neste navegador.':'Selecione uma empresa quando for iniciar uma coleta.'} A integração automática às demais telas será feita na fase 2.</p>}
 </div>;
}
