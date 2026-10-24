'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {useClienteAtivo} from '../use-cliente-ativo';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
type Cliente={id:string;razao_social:string};
type Planta={id:string;cliente_id:string;nome:string;codigo:string|null;descricao:string|null;endereco:string|null;cidade:string|null;uf:string|null;status:string};
const vazio={nome:'',codigo:'',descricao:'',endereco:'',cidade:'',uf:'SP',status:'ativa'};
export default function Plantas(){
 const {clienteAtivo}=useClienteAtivo();
 const [clientes,setClientes]=useState<Cliente[]>([]);const [clienteId,setClienteId]=useState('');
 const [plantas,setPlantas]=useState<Planta[]>([]);const [form,setForm]=useState(vazio);
 const [aba,setAba]=useState<'lista'|'cadastro'>('lista');const [editando,setEditando]=useState<string|null>(null);const [erro,setErro]=useState('');const [mensagem,setMensagem]=useState('');
 const [carregando,setCarregando]=useState(true);const [salvando,setSalvando]=useState(false);const [somenteLeitura,setSomenteLeitura]=useState(true);
 useEffect(()=>{let ativo=true;(async()=>{try{
  const s=supabase();const {data:{user},error:authErro}=await s.auth.getUser();if(authErro||!user)throw new Error('Entre no portal para consultar as plantas.');
  
  const {data:vinculos,error:vErro}=await s.from('usuarios_consultoria').select('consultoria_id,perfil,ativo').eq('usuario_id',user.id).eq('ativo',true);
  if(vErro)throw vErro;
  const ids=(vinculos||[]).filter(v=>v.perfil==='admin_consultoria').map(v=>v.consultoria_id);if(!ids.length)throw new Error('Sem vínculo ativo de administrador de consultoria.');const podeEditar=true;
  const {data,error}=await s.from('clientes').select('id,razao_social').in('consultoria_id',ids).order('razao_social');
  if(error)throw error;if(!ativo)return;
  setSomenteLeitura(!podeEditar);setClientes(data||[]);
 }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Erro ao carregar clientes');}finally{if(ativo)setCarregando(false)}})();return()=>{ativo=false}},[]);
 useEffect(()=>{if(clientes.length&&clienteId!==clienteAtivo){setClienteId(clientes.some(c=>c.id===clienteAtivo)?clienteAtivo:'');setEditando(null);setForm(vazio);setErro('');setMensagem('');setPlantas([]);setAba('lista')}},[clienteAtivo,clientes,clienteId]);
 useEffect(()=>{if(!clienteId){setPlantas([]);return}let ativo=true;(async()=>{const {data,error}=await supabase().from('plantas').select('id,cliente_id,nome,codigo,descricao,endereco,cidade,uf,status').eq('cliente_id',clienteId).order('nome');if(!ativo)return;if(error)setErro(error.message);else setPlantas(data||[])})();return()=>{ativo=false}},[clienteId]);
 async function recarregar(){const {data,error}=await supabase().from('plantas').select('id,cliente_id,nome,codigo,descricao,endereco,cidade,uf,status').eq('cliente_id',clienteId).order('nome');if(error)throw error;setPlantas(data||[])}
 async function salvar(e:FormEvent){e.preventDefault();setErro('');setMensagem('');setSalvando(true);try{
  if(!clienteId||somenteLeitura||!clientes.some(c=>c.id===clienteId))throw new Error('Selecione uma empresa cliente autorizada antes de cadastrar a planta.');
  const dados={...form,nome:form.nome.trim(),cliente_id:clienteId};
  if(!dados.nome)throw new Error('Informe o nome da planta');
  const s=supabase();const {error}=editando?await s.from('plantas').update(dados).eq('id',editando).eq('cliente_id',clienteId):await s.from('plantas').insert(dados);
  if(error)throw error;await recarregar();setForm(vazio);setEditando(null);setMensagem(editando?'Planta atualizada.':'Planta cadastrada.');setAba('lista');
 }catch(e){setErro(e instanceof Error?e.message:'Não foi possível salvar a planta')}finally{setSalvando(false)}}
 function editar(p:Planta){setEditando(p.id);setForm({nome:p.nome,codigo:p.codigo||'',descricao:p.descricao||'',endereco:p.endereco||'',cidade:p.cidade||'',uf:p.uf||'SP',status:p.status});setAba('cadastro');window.scrollTo({top:0,behavior:'smooth'})}
 return <div className="ergobax-gestao-page"><header><nav><span className="ergobax-modulo-marca"><img src="/ergobax_logo_transparente.png" alt="ERGOBAX — Plataforma de Inteligência Ergonômica" /><strong>Gestão de Plantas</strong></span> <Link href="/">Voltar ao portal</Link></nav></header><main><section><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:20}}><Link href="/" style={{display:'inline-block',padding:'10px 16px',background:'#2169aa',color:'#fff',borderRadius:7,textDecoration:'none'}}>← Voltar ao painel da consultoria</Link>{clienteId&&<><button type="button" aria-pressed={aba==='lista'} onClick={()=>{setAba('lista');setEditando(null);setForm(vazio)}}>Plantas cadastradas ({plantas.length})</button>{!somenteLeitura&&<button type="button" aria-pressed={aba==='cadastro'} onClick={()=>{setAba('cadastro');setEditando(null);setForm(vazio)}}>+ Nova planta</button>}</>}</div><h1>Módulo 03 — Gestão de Plantas</h1><p>Cadastre e consulte as unidades físicas vinculadas a cada empresa cliente.</p>
 {erro&&<p role="alert" className="error">{erro}</p>}{mensagem&&<p role="status" className="success">{mensagem}</p>}
 {carregando?<p>Carregando...</p>:<><h2>Empresa em análise</h2><p>A empresa é definida na faixa Cliente Ativo, acima desta tela.</p><p><strong>{clientes.find(c=>c.id===clienteId)?.razao_social||'Nenhuma empresa selecionada'}</strong></p>{!clienteId&&<p>Selecione uma empresa na faixa Cliente Ativo para visualizar ou cadastrar plantas.</p>}
 
 {clienteId&&aba==='cadastro'&&!somenteLeitura&&<form onSubmit={salvar}><h2>{editando?'2. Editar planta':'2. Cadastrar nova planta'}</h2><div className="grid">{(['nome','codigo','endereco','cidade','uf'] as const).map(k=><div key={k}><label htmlFor={'planta-'+k}>{({nome:'Nome da planta',codigo:'Código',endereco:'Endereço',cidade:'Cidade',uf:'UF'})[k]}</label><input id={'planta-'+k} required={k==='nome'} maxLength={k==='uf'?2:undefined} value={form[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/></div>)}</div><label htmlFor="planta-descricao">Descrição detalhada</label><textarea id="planta-descricao" rows={5} value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))}/><label htmlFor="planta-status">Situação</label><select id="planta-status" value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))}><option value="ativa">Ativa</option><option value="inativa">Inativa</option></select><p><button disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar planta'}</button> {editando&&<button type="button" onClick={()=>{setEditando(null);setForm(vazio)}}>Cancelar edição</button>}</p></form>}
 {clienteId&&aba==='lista'&&<><h2>Plantas cadastradas ({plantas.length})</h2>{plantas.length===0?<p>Não há plantas cadastradas para esta empresa.</p>:<table><thead><tr><th>Planta</th><th>Código</th><th>Localização</th><th>Situação</th>{!somenteLeitura&&<th>Ações</th>}</tr></thead><tbody>{plantas.map(p=><tr key={p.id}><td><strong>{p.nome}</strong>{p.descricao&&<p>{p.descricao}</p>}</td><td>{p.codigo||'—'}</td><td>{[p.cidade,p.uf].filter(Boolean).join(' / ')||'—'}</td><td>{p.status}</td>{!somenteLeitura&&<td><button type="button" onClick={()=>editar(p)}>Editar</button></td>}</tr>)}</tbody></table>}</>}</>}
 </section></main></div>
}
