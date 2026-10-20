'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {supabase} from '../../lib/supabase';

type Cliente={id:string;razao_social:string};
type Cargo={id:string;codigo:string|null;nome:string;cbo:string|null;descricao:string|null;ativo:boolean};
const vazio={codigo:'',nome:'',cbo:'',descricao:'',ativo:true};
const estiloCampo={padding:'10px',border:'1px solid #cbd5e1',borderRadius:8,width:'100%',boxSizing:'border-box' as const};
const ambienteTeste=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').includes('zyptfcosjxtrnghacrgg.supabase.co');
export default function CargosPage(){
 const [clientes,setClientes]=useState<Cliente[]>([]);
 const [cliente,setCliente]=useState('');
 const [cargos,setCargos]=useState<Cargo[]>([]);
 const [editando,setEditando]=useState<string|null>(null);
 const [form,setForm]=useState(vazio);
 const [erro,setErro]=useState('');
 const [sucesso,setSucesso]=useState('');
 const [carregando,setCarregando]=useState(false);
 const [autorizado,setAutorizado]=useState(false);
 useEffect(()=>{if(!ambienteTeste)return;let ativo=true;(async()=>{try{
 const s=supabase();const {data:{user}}=await s.auth.getUser();
 if(!user)throw new Error('Entre no portal antes de acessar o cadastro de cargos.');
 const {data:vinculos,error:ev}=await s.from('usuarios_consultoria').select('consultoria_id').eq('usuario_id',user.id).eq('ativo',true).eq('perfil','admin_consultoria');
 if(ev)throw ev;if(!vinculos?.length)throw new Error('Acesso restrito ao administrador da consultoria.');
 const ids=vinculos.map(v=>v.consultoria_id);
 const {data,error}=await s.from('clientes').select('id,razao_social').in('consultoria_id',ids).order('razao_social');
 if(error)throw error;if(ativo){setClientes(data||[]);setAutorizado(true);if(data?.length)setCliente(data[0].id);}
 }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Falha ao carregar clientes');}})();return()=>{ativo=false}},[]);
 useEffect(()=>{if(!cliente||!autorizado)return;let ativo=true;(async()=>{try{const {data,error}=await supabase().from('cargos_cliente').select('id,codigo,nome,cbo,descricao,ativo').eq('cliente_id',cliente).order('nome');if(error)throw error;if(ativo)setCargos(data||[])}catch(e){if(ativo)setErro(e instanceof Error?e.message:'Erro ao consultar cargos')}})();return()=>{ativo=false}},[cliente,autorizado]);
 function editar(c:Cargo){setEditando(c.id);setForm({codigo:c.codigo||'',nome:c.nome,cbo:c.cbo||'',descricao:c.descricao||'',ativo:c.ativo});setErro('');setSucesso('')}
 function novo(){setEditando(null);setForm(vazio);setErro('');setSucesso('')}
 async function salvar(e:FormEvent){e.preventDefault();setErro('');setSucesso('');
 if(!ambienteTeste){setErro('Gravação bloqueada: Preview não conectado ao Supabase de testes.');return}
 if(!cliente||!clientes.some(c=>c.id===cliente)){setErro('Selecione um cliente válido.');return}
 if(!form.nome.trim()){setErro('Informe o nome do cargo.');return}
 if(form.cbo.trim()&&!/^\d{6}$/.test(form.cbo.trim())){setErro('CBO deve conter exatamente 6 números.');return}
 setCarregando(true);try{const s=supabase();const payload={cliente_id:cliente,codigo:form.codigo.trim()||null,nome:form.nome.trim(),cbo:form.cbo.trim()||null,descricao:form.descricao.trim()||null,ativo:form.ativo};
 const {error}=editando?await s.from('cargos_cliente').update(payload).eq('id',editando).eq('cliente_id',cliente):await s.from('cargos_cliente').insert(payload);
 if(error)throw error;const {data,error:listaErro}=await s.from('cargos_cliente').select('id,codigo,nome,cbo,descricao,ativo').eq('cliente_id',cliente).order('nome');if(listaErro)throw listaErro;setCargos(data||[]);novo();setSucesso('Cargo salvo com sucesso.');
 }catch(e){setErro(e instanceof Error?e.message:'Erro ao salvar cargo')}finally{setCarregando(false)}}
 return <main style={{maxWidth:1050,margin:'32px auto',padding:'0 20px',fontFamily:'Arial,sans-serif',color:'#1e293b'}}>
 <a href="/" style={{color:'#1d4ed8'}}>← Voltar ao Painel da Consultoria</a>
 <h1>Cadastro de Cargos</h1><p>Cadastre cargos por cliente. O vínculo com atividades será disponibilizado na próxima etapa.</p>
 {!ambienteTeste&&<p role="alert" style={{background:'#fef3c7',padding:14,borderRadius:8}}>Ambiente protegido: esta tela só permite operações quando o Preview estiver conectado ao banco Supabase de testes.</p>}
 {erro&&<p role="alert" style={{background:'#fee2e2',padding:12,borderRadius:8}}>{erro}</p>}
 {sucesso&&<p role="status" style={{background:'#dcfce7',padding:12,borderRadius:8}}>{sucesso}</p>}
 {ambienteTeste&&autorizado&&<>
 <label style={{display:'block',marginBottom:18}}>Cliente
 <select value={cliente} onChange={e=>{setCliente(e.target.value);setCargos([]);novo()}} style={estiloCampo}>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></label>
 {!clientes.length&&<p>Nenhum cliente disponível para esta consultoria no ambiente de testes.</p>}
 {!!cliente&&<><form onSubmit={salvar} style={{border:'1px solid #cbd5e1',borderRadius:12,padding:20,marginBottom:24}}>
 <h2>{editando?'Editar cargo':'Novo cargo'}</h2>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:14}}>
 <label>Código<input style={estiloCampo} maxLength={40} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})}/></label>
 <label>Nome do cargo *<input required style={estiloCampo} maxLength={200} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></label>
 <label>CBO (6 números)<input style={estiloCampo} maxLength={6} inputMode="numeric" value={form.cbo} onChange={e=>setForm({...form,cbo:e.target.value})}/></label>
 </div>
 <label style={{display:'block',marginTop:14}}>Descrição<textarea style={estiloCampo} rows={3} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></label>
 <label style={{display:'block',marginTop:12}}><input type="checkbox" checked={form.ativo} onChange={e=>setForm({...form,ativo:e.target.checked})}/> Cargo ativo</label>
 <div style={{display:'flex',gap:10,marginTop:16}}><button type="submit" disabled={carregando} style={{padding:'10px 18px',background:'#1d4ed8',color:'white',border:0,borderRadius:8}}>{carregando?'Salvando...':'Salvar cargo'}</button><button type="button" onClick={novo} style={{padding:'10px 18px'}}>Limpar</button></div>
 </form>
 <h2>Cargos cadastrados ({cargos.length})</h2>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Código','Cargo','CBO','Situação','Ações'].map(x=><th key={x} style={{textAlign:'left',padding:10,borderBottom:'1px solid #cbd5e1'}}>{x}</th>)}</tr></thead><tbody>{cargos.map(c=><tr key={c.id}><td style={{padding:10}}>{c.codigo||'—'}</td><td style={{padding:10}}>{c.nome}</td><td style={{padding:10}}>{c.cbo||'—'}</td><td style={{padding:10}}>{c.ativo?'Ativo':'Inativo'}</td><td style={{padding:10}}><button onClick={()=>editar(c)}>Editar</button></td></tr>)}</tbody></table>{!cargos.length&&<p>Nenhum cargo cadastrado para este cliente.</p>}</div>
 </>}
 </>}
 </main>
}
