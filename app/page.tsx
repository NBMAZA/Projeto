'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {supabase} from '../lib/supabase';
import LogoEmpresa from './logo-empresa';
type Consultoria={id:string;razao_social:string;nome_fantasia:string|null;cnpj:string;email:string;status:string;logo_path:string|null};
export default function Home(){const [novaSenha,setNovaSenha]=useState('');const [recuperacao,setRecuperacao]=useState(false);const [email,setEmail]=useState('');const [senha,setSenha]=useState('');const [user,setUser]=useState(false);const [admin,setAdmin]=useState(false);const [consultoriaAtual,setConsultoriaAtual]=useState('');const [clienteItems,setClienteItems]=useState<{id:string;razao_social:string;cnpj:string;status:string;logo_path:string|null}[]>([]);const [clienteForm,setClienteForm]=useState({razao_social:'',nome_fantasia:'',cnpj:'',email:'',telefone:'',responsavel:'',cep:'',logradouro:'',numero:'',complemento:'',bairro:'',cidade:'',uf:'SP',cnae:'',grau_risco:'',quantidade_funcionarios:''});const [logoConsultoria,setLogoConsultoria]=useState<File|null>(null);const [logoCliente,setLogoCliente]=useState<File|null>(null);const [clienteAdmin,setClienteAdmin]=useState({nome:'',email:''});const [items,setItems]=useState<Consultoria[]>([]);const [adminPage,setAdminPage]=useState<'painel'|'consultorias'|'nova'|'detalhes'>('painel');const [filtro,setFiltro]=useState('');const [selecionada,setSelecionada]=useState<string|null>(null);const [abaDetalhe,setAbaDetalhe]=useState<'dados'|'administradores'|'clientes'|'configuracoes'>('dados');const [detalhe,setDetalhe]=useState<Record<string,string>>({});const [clientesDetalhe,setClientesDetalhe]=useState<{id:string;razao_social:string;cnpj:string;status:string}[]>([]);const [adminsDetalhe,setAdminsDetalhe]=useState<{usuario_id:string;perfil:string}[]>([]);const [logoDetalhe,setLogoDetalhe]=useState<File|null>(null);const [erro,setErro]=useState('');const [busy,setBusy]=useState(false);const [sucesso,setSucesso]=useState('');const [administrador,setAdministrador]=useState({nome:'',email:''});const [form,setForm]=useState({razao_social:'',nome_fantasia:'',cnpj:'',email:'',telefone:'',cidade:'',uf:'SP',responsavel:''});
async function refresh(){const s=supabase();const {data:{user}}=await s.auth.getUser();setUser(!!user);const isAdmin=user?.app_metadata?.role==='admin_central';setAdmin(isAdmin);if(!isAdmin&&user){const {data:links}=await s.from('usuarios_consultoria').select('consultoria_id').eq('usuario_id',user.id).eq('perfil','admin_consultoria');if(links?.length)setConsultoriaAtual(links[0].consultoria_id)}if(isAdmin){const {data,error}=await s.from('consultorias').select('id,razao_social,nome_fantasia,cnpj,email,status,logo_path').order('created_at',{ascending:false});if(error)setErro(error.message);else setItems(data||[])}}
useEffect(()=>{const client=supabase();client.auth.getSession().then(({data:{session}})=>{if(session?.user?.invited_at&&!session.user.last_sign_in_at)setRecuperacao(true)}).catch(()=>{});const {data:{subscription}}=client.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setRecuperacao(true)});refresh().catch(e=>setErro(e.message));return ()=>subscription.unsubscribe()},[]);
async function login(e:FormEvent){e.preventDefault();setBusy(true);setErro('');try{const {error}=await supabase().auth.signInWithPassword({email,password:senha});if(error)throw error;await refresh()}catch(e){setErro(e instanceof Error?e.message:'Erro no login')}finally{setBusy(false)}}
async function enviarLogo(tipo:'consultoria'|'cliente',id:string,arquivo:File){const {data:{session}}=await supabase().auth.getSession();if(!session)throw new Error('Sessão expirada');const body=new FormData();body.append('tipo',tipo);body.append('id',id);body.append('arquivo',arquivo);const r=await fetch('/api/logos',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},body});if(!r.ok){const result=await r.json();throw new Error(result.error||'Falha no upload')} }
async function save(e:FormEvent){e.preventDefault();setBusy(true);setErro('');setSucesso('');try{const {data:{session}}=await supabase().auth.getSession();if(!session)throw new Error('Sua sessão expirou. Entre novamente.');const response=await fetch('/api/consultorias',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({consultoria:form,administrador})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Erro ao cadastrar');if(logoConsultoria){try{await enviarLogo('consultoria',result.id,logoConsultoria)}catch(e){setErro('Consultoria cadastrada, mas o logo não foi salvo: '+(e instanceof Error?e.message:'erro desconhecido'))}}setLogoConsultoria(null);setSucesso(result.message);setForm({razao_social:'',nome_fantasia:'',cnpj:'',email:'',telefone:'',cidade:'',uf:'SP',responsavel:''});setAdministrador({nome:'',email:''});await refresh();setAdminPage('consultorias')}catch(e){setErro(e instanceof Error?e.message:'Erro ao salvar')}finally{setBusy(false)}}
async function salvarCliente(e:FormEvent){e.preventDefault();setBusy(true);setErro('');setSucesso('');try{const {data:{session}}=await supabase().auth.getSession();if(!session)throw new Error('Sessão expirada');const r=await fetch('/api/clientes',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({consultoria_id:consultoriaAtual,cliente:clienteForm,administrador:clienteAdmin})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro no cadastro');if(logoCliente){try{await enviarLogo('cliente',data.id,logoCliente)}catch(e){setErro('Cliente cadastrado, mas o logo não foi salvo: '+(e instanceof Error?e.message:'erro desconhecido'))}}setLogoCliente(null);setSucesso(data.message);setClienteForm({razao_social:'',nome_fantasia:'',cnpj:'',email:'',telefone:'',responsavel:'',cep:'',logradouro:'',numero:'',complemento:'',bairro:'',cidade:'',uf:'SP',cnae:'',grau_risco:'',quantidade_funcionarios:''});setClienteAdmin({nome:'',email:''});await carregarClientes()}catch(e){setErro(e instanceof Error?e.message:'Falha ao cadastrar cliente')}finally{setBusy(false)}}
async function carregarClientes(){const {data,error}=await supabase().from('clientes').select('id,razao_social,cnpj,status,logo_path').eq('consultoria_id',consultoriaAtual).order('created_at',{ascending:false});if(error)setErro(error.message);else setClienteItems(data||[])}
useEffect(()=>{if(consultoriaAtual)carregarClientes().catch(e=>setErro(e.message))},[consultoriaAtual]);
async function definirSenha(e:FormEvent){e.preventDefault();setErro('');setBusy(true);try{if(novaSenha.length<12)throw new Error('Use uma senha de pelo menos 12 caracteres.');const {error}=await supabase().auth.updateUser({password:novaSenha});if(error)throw error;setNovaSenha('');setRecuperacao(false);setSucesso('Senha definida com sucesso.');await refresh()}catch(e){setErro(e instanceof Error?e.message:'Não foi possível definir a senha')}finally{setBusy(false)}}
async function abrirDetalhes(c:Consultoria){setSelecionada(c.id);setAbaDetalhe('dados');setAdminPage('detalhes');setErro('');const db=supabase();const [a,b,d]=await Promise.all([db.from('consultorias').select('razao_social,nome_fantasia,cnpj,email,telefone,cidade,uf,responsavel,status').eq('id',c.id).single(),db.from('clientes').select('id,razao_social,cnpj,status').eq('consultoria_id',c.id),db.from('usuarios_consultoria').select('usuario_id,perfil').eq('consultoria_id',c.id)]);if(a.error)setErro(a.error.message);else setDetalhe(Object.fromEntries(Object.entries(a.data||{}).map(([k,v])=>[k,String(v??'')])));if(b.error)setErro(b.error.message);else setClientesDetalhe(b.data||[]);if(d.error)setErro(d.error.message);else setAdminsDetalhe(d.data||[])}
async function salvarDetalhes(e:FormEvent){e.preventDefault();if(!selecionada)return;setBusy(true);setErro('');setSucesso('');try{const {data:{session}}=await supabase().auth.getSession();if(!session)throw new Error('Sessão expirada');const r=await fetch('/api/consultorias/'+selecionada,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({consultoria:detalhe})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Falha ao atualizar');if(logoDetalhe){await enviarLogo('consultoria',selecionada,logoDetalhe);setLogoDetalhe(null)}await refresh();setSucesso('Dados da consultoria atualizados.')}catch(e){setErro(e instanceof Error?e.message:'Erro ao atualizar')}finally{setBusy(false)}}
async function mudarStatus(status:string){if(!selecionada||!confirm('Confirma alterar o status da consultoria para '+status+'?'))return;setDetalhe(v=>({...v,status}));setBusy(true);setErro('');try{const {data:{session}}=await supabase().auth.getSession();if(!session)throw new Error('Sessão expirada');const r=await fetch('/api/consultorias/'+selecionada,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({consultoria:{status}})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Falha ao atualizar status');await refresh();setSucesso('Status atualizado.')}catch(e){setErro(e instanceof Error?e.message:'Falha ao alterar status')}finally{setBusy(false)}}
async function logout(){await supabase().auth.signOut();setUser(false);setAdmin(false);setItems([])}

return (
  <>
    <header><nav><strong>Portal NR-17 | Administração</strong>{user&&<button onClick={logout}>Sair</button>}</nav></header>
    <main>
      {erro&&<p role="alert" className="error">{erro}</p>}
      {sucesso&&<p role="status" className="success">{sucesso}</p>}
      {recuperacao&&user ? (
        <section><h2>Definir senha</h2><form onSubmit={definirSenha}><input type="password" minLength={12} required value={novaSenha} onChange={e=>setNovaSenha(e.target.value)}/><button disabled={busy}>Salvar senha</button></form></section>
      ) : !user ? (
        <section><h2>Acesso administrativo</h2><form onSubmit={login}><label>E-mail</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/><label>Senha</label><input type="password" required value={senha} onChange={e=>setSenha(e.target.value)}/><button disabled={busy}>Entrar</button></form></section>
      ) : !admin ? (
        <section>
          <h2>Módulo 02 — Clientes da Consultoria</h2>
          {consultoriaAtual ? (
            <>
              <form onSubmit={salvarCliente}>
                <div className="grid">{(Object.keys(clienteForm) as Array<keyof typeof clienteForm>).map(key=><div key={key}><label>{key.replaceAll('_',' ')}</label><input value={clienteForm[key]} onChange={e=>setClienteForm(v=>({...v,[key]:e.target.value}))}/></div>)}</div>
                <label>Logotipo</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setLogoCliente(e.target.files?.[0]||null)}/>
                <label>Nome do administrador</label><input required value={clienteAdmin.nome} onChange={e=>setClienteAdmin(v=>({...v,nome:e.target.value}))}/>
                <label>E-mail do administrador</label><input type="email" required value={clienteAdmin.email} onChange={e=>setClienteAdmin(v=>({...v,email:e.target.value}))}/>
                <button disabled={busy}>Cadastrar cliente e enviar convite</button>
              </form>
              <h3>Clientes cadastrados</h3>
              <table><tbody>{clienteItems.map(c=><tr key={c.id}><td>{c.razao_social}</td><td>{c.cnpj}</td><td>{c.status}</td><td><LogoEmpresa tipo="cliente" id={c.id} nome={c.razao_social} logoPath={c.logo_path}/></td></tr>)}</tbody></table>
            </>
          ) : <p>Conta sem permissão de administrador de consultoria.</p>}
        </section>
      ) : (
        <div className="admin-shell">
          <aside className="admin-menu">
            <h2>Módulo 00</h2><p>Administração Geral</p>
            <button onClick={()=>setAdminPage('painel')}>Painel geral</button>
            <button onClick={()=>setAdminPage('consultorias')}>Consultorias</button>
            <button onClick={()=>setAdminPage('nova')}>+ Nova consultoria</button>
          </aside>
          <div className="admin-main">
            {adminPage==='painel'&&<section><h2>Visão geral</h2><p>Consultorias: {items.length}</p><p>Ativas: {items.filter(c=>c.status==='ativa').length}</p><button onClick={()=>setAdminPage('consultorias')}>Ver consultorias</button></section>}
            {adminPage==='nova'&&<section>
              <h2>Nova consultoria</h2>
              <form onSubmit={save}>
                <div className="grid">{(Object.keys(form) as Array<keyof typeof form>).map(key=><div key={key}><label>{key.replaceAll('_',' ')}</label><input value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}/></div>)}</div>
                <label>Logotipo</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setLogoConsultoria(e.target.files?.[0]||null)}/>
                <label>Nome do administrador</label><input required value={administrador.nome} onChange={e=>setAdministrador(v=>({...v,nome:e.target.value}))}/>
                <label>E-mail do administrador</label><input type="email" required value={administrador.email} onChange={e=>setAdministrador(v=>({...v,email:e.target.value}))}/>
                <button disabled={busy}>Cadastrar e enviar convite</button>
              </form>
            </section>}
            {adminPage==='consultorias'&&<section>
              <h2>Consultorias cadastradas</h2>
              <input aria-label="Buscar consultoria" placeholder="Buscar por nome, CNPJ ou e-mail" value={filtro} onChange={e=>setFiltro(e.target.value)}/>
              <table><thead><tr><th>Consultoria</th><th>CNPJ</th><th>Status</th><th>Logotipo</th><th>Ações</th></tr></thead><tbody>
                {items.filter(c=>[c.razao_social,c.nome_fantasia||'',c.cnpj,c.email].some(v=>v.toLowerCase().includes(filtro.toLowerCase()))).map(c=><tr key={c.id}><td>{c.razao_social}</td><td>{c.cnpj}</td><td>{c.status}</td><td><LogoEmpresa tipo="consultoria" id={c.id} nome={c.razao_social} logoPath={c.logo_path}/></td><td><button onClick={()=>abrirDetalhes(c)}>Visualizar</button></td></tr>)}
              </tbody></table>
            </section>}
            {adminPage==='detalhes'&&<section>
              <button onClick={()=>setAdminPage('consultorias')}>Voltar</button>
              <h2>{items.find(c=>c.id===selecionada)?.razao_social||'Consultoria'}</h2>
              <div className="detail-tabs" role="tablist">
                {([['dados','Dados cadastrais'],['administradores','Administradores'],['clientes','Clientes'],['configuracoes','Configurações']] as const).map(([id,label])=><button key={id} role="tab" aria-selected={abaDetalhe===id} onClick={()=>setAbaDetalhe(id)}>{label}</button>)}
              </div>
              {abaDetalhe==='dados'&&<form onSubmit={salvarDetalhes}>
                <div className="grid">{(['razao_social','nome_fantasia','cnpj','email','telefone','responsavel','cidade','uf'] as const).map(key=><div key={key}><label>{key.replaceAll('_',' ')}</label><input value={detalhe[key]||''} onChange={e=>setDetalhe(v=>({...v,[key]:e.target.value}))}/></div>)}</div>
                <label>Atualizar logotipo</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setLogoDetalhe(e.target.files?.[0]||null)}/>
                <button disabled={busy}>Salvar alterações</button>
              </form>}
              {abaDetalhe==='administradores'&&<div><h3>Administradores vinculados</h3><table><tbody>{adminsDetalhe.map(a=><tr key={a.usuario_id}><td>{a.usuario_id}</td><td>{a.perfil}</td></tr>)}</tbody></table></div>}
              {abaDetalhe==='clientes'&&<div><h3>Clientes vinculados ({clientesDetalhe.length})</h3><table><tbody>{clientesDetalhe.map(c=><tr key={c.id}><td>{c.razao_social}</td><td>{c.cnpj}</td><td>{c.status}</td></tr>)}</tbody></table></div>}
              {abaDetalhe==='configuracoes'&&<div><h3>Configurações</h3><p>Status: {detalhe.status}</p>{(['ativa','suspensa','inativa'] as const).map(status=><button key={status} disabled={busy||detalhe.status===status} onClick={()=>mudarStatus(status)}>{status}</button>)}</div>}
            </section>}
          </div>
        </div>
      )}
    </main>
  </>
);
}
