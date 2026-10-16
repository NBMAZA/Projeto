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
   if(session){setAutorizado(true);setErro('');setPronto(true)}
  });
  async function validar(){
   try{
    // Convites Supabase podem entregar a sessão no fragmento da URL.
    // Processar explicitamente evita uma condição de corrida com getSession().
    const fragmento=new URLSearchParams(window.location.hash.slice(1));
    const erroLink=fragmento.get('error_description')||fragmento.get('error');
    if(erroLink)throw new Error('O link de ativação expirou ou já foi utilizado. Solicite um novo convite.');
    const access_token=fragmento.get('access_token');
    const refresh_token=fragmento.get('refresh_token');
    if(access_token&&refresh_token){
     const {error}=await auth.setSession({access_token,refresh_token});
     if(error)throw error;
     // Retira os tokens do histórico e da barra de endereço após o uso.
     window.history.replaceState(null,'',window.location.pathname+window.location.search);
    }
    const {data:{session},error}=await auth.getSession();
    if(error)throw error;
    if(!ativo)return;
    setAutorizado(!!session);
    if(!session)setErro('Não foi possível validar o convite. Verifique se o link está completo ou solicite um novo.');
   }catch(e){
    if(ativo){setAutorizado(false);setErro(e instanceof Error?e.message:'Não foi possível validar o convite.')}
   }finally{if(ativo)setPronto(true)}
  }
  void validar();
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
