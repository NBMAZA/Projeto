'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {supabase} from '../../lib/supabase';

export default function AtivarConta(){
 const [pronto,setPronto]=useState(false);
 const [autorizado,setAutorizado]=useState(false);
 const [senha,setSenha]=useState('');
 const [confirmacao,setConfirmacao]=useState('');
 const [erro,setErro]=useState('');
 const [sucesso,setSucesso]=useState(false);
 const [salvando,setSalvando]=useState(false);
 useEffect(()=>{
  let ativo=true;
  const auth=supabase().auth;
  const {data:{subscription}}=auth.onAuthStateChange((_evento,session)=>{
   if(!ativo)return;
   setAutorizado(!!session);
   if(session)setErro('');
   setPronto(true);
  });
  auth.getSession().then(({data:{session},error})=>{
   if(!ativo)return;
   setAutorizado(!!session);
   if(error)setErro('Não foi possível validar o convite. Solicite um novo convite.');
   setPronto(true);
  }).catch(()=>{if(ativo){setErro('Não foi possível validar o convite.');setPronto(true)}});
  return()=>{ativo=false;subscription.unsubscribe()};
 },[]);
 async function concluir(e:FormEvent){
  e.preventDefault();setErro('');
  if(senha.length<12){setErro('A senha deve ter pelo menos 12 caracteres.');return}
  if(senha!==confirmacao){setErro('As senhas não coincidem.');return}
  setSalvando(true);
  try{
   const {data:{session}}=await supabase().auth.getSession();
   if(!session)throw new Error('Convite expirado ou inválido. Solicite um novo convite.');
   const {error}=await supabase().auth.updateUser({password:senha});
   if(error)throw error;
   setSenha('');setConfirmacao('');setSucesso(true);
  }catch(e){setErro(e instanceof Error?e.message:'Não foi possível definir a senha.')}
  finally{setSalvando(false)}
 }
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f3f6fa',padding:20,fontFamily:'Arial,sans-serif'}}>
  <section style={{width:'100%',maxWidth:440,background:'white',padding:32,borderRadius:14,boxShadow:'0 8px 32px #102d491a'}}>
   <h1 style={{color:'#153d64',marginBottom:4}}>Portal NR-17</h1>
   <p style={{color:'#56677a'}}>Newbax-IA · Ativação de acesso</p>
   {!pronto?<p>Validando seu convite...</p>:sucesso?<div><h2>Senha cadastrada!</h2><p>Sua conta está pronta para acesso.</p><a href="/" style={{color:'#145f99'}}>Entrar no Portal NR-17</a></div>:autorizado?<><h2>Cadastre sua senha</h2><p>Defina uma senha para acessar sua consultoria ou empresa.</p><form onSubmit={concluir} style={{display:'grid',gap:12}}>
    <label>Nova senha<input type="password" autoComplete="new-password" minLength={12} required value={senha} onChange={e=>setSenha(e.target.value)} style={{display:'block',width:'100%',padding:12,marginTop:5,boxSizing:'border-box'}}/></label>
    <label>Confirme a senha<input type="password" autoComplete="new-password" minLength={12} required value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} style={{display:'block',width:'100%',padding:12,marginTop:5,boxSizing:'border-box'}}/></label>
    <button disabled={salvando} style={{background:'#153d64',color:'white',padding:13,border:0,borderRadius:6,cursor:'pointer'}}>{salvando?'Salvando...':'Ativar minha conta'}</button>
   </form></>:<><h2>Convite não validado</h2><p>Abra esta página pelo link recebido no e-mail. Se o convite expirou, solicite um novo ao administrador.</p><a href="/">Voltar ao portal</a></>}
   {erro&&<p role="alert" style={{color:'#b42318'}}>{erro}</p>}
  </section>
 </main>
}
