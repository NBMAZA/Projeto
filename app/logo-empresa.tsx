'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

type Props={tipo:'consultoria'|'cliente';id:string;nome:string;logoPath?:string|null};
export default function LogoEmpresa({tipo,id,nome,logoPath}:Props){
 const [url,setUrl]=useState('');
 const [arquivo,setArquivo]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [erro,setErro]=useState('');
 const [sucesso,setSucesso]=useState('');
 const [version,setVersion]=useState(0);
 useEffect(()=>{
  let ativo=true;
  async function carregar(){
   setUrl('');
   if(!logoPath&&version===0)return;
   const {data:{session}}=await supabase().auth.getSession();
   if(!session)return;
   const params=new URLSearchParams({tipo,id});
   const r=await fetch('/api/logos/visualizar?'+params,{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
   if(!r.ok)return;
   const body=await r.json();
   if(ativo)setUrl(body.url||'');
  }
  carregar().catch(()=>{});
  return()=>{ativo=false};
 },[tipo,id,logoPath,version]);
 async function salvar(){
  if(!arquivo)return;
  setErro('');setSucesso('');
  if(arquivo.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(arquivo.type)){
   setErro('Selecione PNG, JPG ou WebP de até 2 MB.');return;
  }
  setBusy(true);
  try{
   const {data:{session}}=await supabase().auth.getSession();
   if(!session)throw new Error('Sua sessão expirou.');
   const form=new FormData();
   form.append('tipo',tipo);form.append('id',id);form.append('arquivo',arquivo);
   const r=await fetch('/api/logos',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},body:form});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Erro no envio');
   setSucesso('Logo atualizado.');setArquivo(null);setVersion(v=>v+1);
  }catch(e){setErro(e instanceof Error?e.message:'Falha ao enviar imagem')}
  finally{setBusy(false)}
 }
 return <div style={{minWidth:190,display:'grid',gap:6}}>
  {url?<img src={url} alt={'Logotipo de '+nome} style={{maxWidth:120,maxHeight:65,objectFit:'contain'}}/>:<span className="muted">Sem logotipo</span>}
  <input aria-label={'Selecionar logo de '+nome} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setArquivo(e.target.files?.[0]||null)} style={{maxWidth:185}}/>
  <button type="button" disabled={!arquivo||busy} onClick={salvar}>{busy?'Enviando...':url?'Substituir logo':'Salvar logo'}</button>
  {erro&&<small role="alert" className="error">{erro}</small>}
  {sucesso&&<small role="status">{sucesso}</small>}
 </div>;
}
