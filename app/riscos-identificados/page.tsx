'use client';
import {useEffect,useMemo,useState} from 'react';

import Link from 'next/link';
import {supabase} from '../../lib/supabase';

type Cliente={id:string;razao_social:string};
type Local={id:string;nome:string};
type Risco={grupo_risco?:string|null;perfil_exposicao?:string|null;medidas_existentes?:string|null;probabilidade?:number|null;severidade?:number|null;risco_puro?:number|null;nivel_mitigacao?:string|null;conclusao_tecnica?:string|null;classificacao_final?:string|null;lesoes_agravos?:string|null;id:string;cliente_id:string;nivel:'posto'|'estacao';estrutura_id:string;origem:string;criterio_codigo:string|null;titulo:string;descricao:string;classificacao:string;status:string;medidas_recomendadas:string|null;plano_acao:string|null;responsavel_acao:string|null;prazo:string|null;observacoes:string|null;created_at:string};
const vazio={grupo_risco:'Ergonômicos',perfil_exposicao:'',medidas_existentes:'',probabilidade:'',severidade:'',risco_puro:'',nivel_mitigacao:'',conclusao_tecnica:'',classificacao_final:'',lesoes_agravos:'',titulo:'',descricao:'',origem:'coleta_biomecanica',criterio_codigo:'',classificacao:'nao_classificado',status:'aberto',medidas_recomendadas:'',plano_acao:'',responsavel_acao:'',prazo:'',observacoes:''};
const classificacoes=[['nao_classificado','Não classificado'],['baixo','Baixo'],['moderado','Moderado'],['alto','Alto'],['critico','Crítico']];
const situacoes=[['aberto','Aberto'],['em_tratamento','Em tratamento'],['controlado','Controlado'],['encerrado','Encerrado']];
const origens=[['coleta_biomecanica','Coleta biomecânica'],['avaliacao_mobiliario','Avaliação do mobiliário'],['outra','Outra avaliação']];
const campo:React.CSSProperties={width:'100%',minWidth:0,height:38,padding:'5px 8px',border:'1px solid #cbd5e1',borderRadius:7,background:'white'};
const label:React.CSSProperties={display:'grid',gap:5,fontSize:13,fontWeight:600,minWidth:0};
export default function RiscosIdentificados(){

 const [clientes,setClientes]=useState<Cliente[]>([]),[cliente,setCliente]=useState('');
 const [nivel,setNivel]=useState<'posto'|'estacao'>('posto'),[locais,setLocais]=useState<Local[]>([]),[local,setLocal]=useState('');
 const [riscos,setRiscos]=useState<Risco[]>([]),[form,setForm]=useState(vazio),[editando,setEditando]=useState('');
 const [filtroStatus,setFiltroStatus]=useState(''),[filtroClasse,setFiltroClasse]=useState(''),[busca,setBusca]=useState('');
 const [erro,setErro]=useState(''),[aviso,setAviso]=useState(''),[salvando,setSalvando]=useState(false),[carregando,setCarregando]=useState(false);
 const [modo,setModo]=useState<'painel'|'cadastro'>('painel');
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const c=params.get('cliente')||'';const n=params.get('nivel');const id=params.get('estrutura')||'';if(params.get('novo')==='1'&&c&&id&&(n==='posto'||n==='estacao')){setCliente(c);setNivel(n);setLocal(id);setEditando('');setForm(vazio);setModo('cadastro')}},[]);
 const alterar=(k:keyof typeof vazio,v:string)=>setForm(p=>({...p,[k]:v}));
 const carregar=async()=>{setCarregando(true);const {data,error}=await supabase().from('riscos_identificados').select('*').order('created_at',{ascending:false});if(error)setErro('Não foi possível consultar os riscos. Verifique se a migração do módulo foi aplicada: '+error.message);else {setRiscos((data||[]) as Risco[]);setErro('')}setCarregando(false)};
 useEffect(()=>{supabase().from('clientes').select('id,razao_social').order('razao_social').then(({data,error})=>{if(error)setErro(error.message);else setClientes(data||[]) });void carregar()},[]);
 useEffect(()=>{setLocais([]);if(!cliente)return;let ativo=true;(async()=>{if(nivel==='posto'){const {data,error}=await supabase().from('postos_trabalho').select('id,nome,instalacoes!inner(plantas!inner(cliente_id))').eq('instalacoes.plantas.cliente_id',cliente).order('nome');if(ativo){if(error)setErro(error.message);else setLocais((data||[]).map((x:any)=>({id:x.id,nome:x.nome})))}}else{const {data,error}=await supabase().from('estacoes_trabalho').select('id,nome,postos_trabalho!inner(instalacoes!inner(plantas!inner(cliente_id)))').eq('postos_trabalho.instalacoes.plantas.cliente_id',cliente).order('nome');if(ativo){if(error)setErro(error.message);else setLocais((data||[]).map((x:any)=>({id:x.id,nome:x.nome})))}}})();return()=>{ativo=false}},[cliente,nivel]);
 const lista=useMemo(()=>riscos.filter(r=>(!cliente||r.cliente_id===cliente)&&(!filtroStatus||r.status===filtroStatus)&&(!filtroClasse||r.classificacao===filtroClasse)&&(!busca||[r.titulo,r.descricao,r.criterio_codigo||''].join(' ').toLowerCase().includes(busca.toLowerCase()))),[riscos,cliente,filtroStatus,filtroClasse,busca]);
 function novo(){setEditando('');setForm(vazio);setAviso('');setModo('cadastro')}
 function editar(r:Risco){setCliente(r.cliente_id);setNivel(r.nivel);setLocal(r.estrutura_id);setEditando(r.id);setForm({grupo_risco:r.grupo_risco||'Ergonômicos',perfil_exposicao:r.perfil_exposicao||'',medidas_existentes:r.medidas_existentes||'',probabilidade:r.probabilidade?.toString()||'',severidade:r.severidade?.toString()||'',risco_puro:r.risco_puro?.toString()||'',nivel_mitigacao:r.nivel_mitigacao||'',conclusao_tecnica:r.conclusao_tecnica||'',classificacao_final:r.classificacao_final||'',lesoes_agravos:r.lesoes_agravos||'',titulo:r.titulo,descricao:r.descricao,origem:r.origem,criterio_codigo:r.criterio_codigo||'',classificacao:r.classificacao,status:r.status,medidas_recomendadas:r.medidas_recomendadas||'',plano_acao:r.plano_acao||'',responsavel_acao:r.responsavel_acao||'',prazo:r.prazo||'',observacoes:r.observacoes||''});setAviso('');setModo('cadastro')}
 async function salvar(e:React.FormEvent){e.preventDefault();setErro('');setAviso('');if(!cliente||!local||!form.titulo.trim()||!form.descricao.trim()){setErro('Informe cliente, local, título e descrição do risco.');return}setSalvando(true);
 const payload={cliente_id:cliente,nivel,estrutura_id:local,...form,probabilidade:form.probabilidade===''?null:Number(form.probabilidade),severidade:form.severidade===''?null:Number(form.severidade),risco_puro:form.risco_puro===''?null:Number(form.risco_puro),titulo:form.titulo.trim(),descricao:form.descricao.trim(),criterio_codigo:form.criterio_codigo.trim()||null,prazo:form.prazo||null};
 const q=editando?supabase().from('riscos_identificados').update(payload).eq('id',editando):supabase().from('riscos_identificados').insert(payload);
 const {error}=await q;setSalvando(false);if(error){setErro(error.message);return}setAviso(editando?'Risco atualizado com sucesso.':'Risco cadastrado com sucesso.');setModo('painel');setEditando('');setForm(vazio);await carregar()}
 const nomes=Object.fromEntries(clientes.map(c=>[c.id,c.razao_social]));
 return <><header><nav><strong>Portal NR-17 — Riscos Identificados</strong></nav></header><main><section style={{maxWidth:1160}}><p><Link href="/">← Voltar ao painel</Link></p><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><h1 style={{marginBottom:4}}>Riscos Identificados</h1><p style={{fontSize:13,marginTop:0}}>Cadastro e acompanhamento dos riscos ergonômicos por cliente e local de trabalho.</p></div><button type="button" onClick={modo==='painel'?novo:()=>setModo('painel')}>{modo==='painel'?'+ Cadastrar risco':'Voltar à lista'}</button></div>
 {erro&&<p role="alert" style={{color:'#b42318'}}>{erro}</p>}{aviso&&<p role="status" style={{color:'#166534'}}>{aviso}</p>}
 {modo==='painel'?<><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,margin:'18px 0'}}>
 <label style={label}>Cliente<select style={campo} value={cliente} onChange={e=>{setCliente(e.target.value);setLocal('')}}><option value="">Todos os clientes</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></label>
 <label style={label}>Situação<select style={campo} value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}><option value="">Todas</option>{situacoes.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label style={label}>Classificação<select style={campo} value={filtroClasse} onChange={e=>setFiltroClasse(e.target.value)}><option value="">Todas</option>{classificacoes.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label style={label}>Pesquisar<input style={campo} value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Título, descrição ou fator"/></label></div>
 <p style={{fontSize:13}}>{carregando?'Carregando riscos...':lista.length+' risco(s) encontrado(s)'}</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Risco','Cliente','Local','Classificação','Situação','Prazo',''].map(h=><th key={h} style={{textAlign:'left',padding:10,borderBottom:'2px solid #cbd5e1'}}>{h}</th>)}</tr></thead><tbody>{lista.map(r=><tr key={r.id}><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}><strong>{r.titulo}</strong><div style={{fontSize:11,color:'#64748b'}}>{r.criterio_codigo||r.origem}</div></td><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}>{nomes[r.cliente_id]||r.cliente_id}</td><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}>{r.nivel==='posto'?'Posto':'Estação'}</td><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}>{classificacoes.find(x=>x[0]===r.classificacao)?.[1]}</td><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}>{situacoes.find(x=>x[0]===r.status)?.[1]}</td><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}>{r.prazo||'—'}</td><td style={{padding:10,borderBottom:'1px solid #e2e8f0'}}><button type="button" onClick={()=>editar(r)}>Editar</button></td></tr>)}</tbody></table></div>
 {!carregando&&lista.length===0&&<p style={{fontSize:13}}>Nenhum risco encontrado para os filtros selecionados.</p>}</>:<form onSubmit={salvar} style={{display:'grid',gap:14,marginTop:16}}>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>
 <label style={label}>Cliente<select required style={campo} value={cliente} onChange={e=>{setCliente(e.target.value);setLocal('')}}><option value="">Selecione</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></label>
 <label style={label}>Vincular a<select style={campo} value={nivel} onChange={e=>{setNivel(e.target.value as 'posto'|'estacao');setLocal('')}}><option value="posto">Posto de trabalho</option><option value="estacao">Estação de trabalho</option></select></label>
 <label style={label}>{nivel==='posto'?'Posto de trabalho':'Estação de trabalho'}<select required style={campo} value={local} onChange={e=>setLocal(e.target.value)} disabled={!cliente}><option value="">Selecione</option>{locais.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>
 <label style={label}>Origem<select style={campo} value={form.origem} onChange={e=>alterar('origem',e.target.value)}>{origens.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label style={label}>Fator biomecânico (opcional)<select style={campo} value={form.criterio_codigo} onChange={e=>alterar('criterio_codigo',e.target.value)}><option value="">Não vinculado</option>{Array.from({length:17},(_,i)=>'B'+String(i+1).padStart(2,'0')).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
 <label style={label}>Classificação técnica<select style={campo} value={form.classificacao} onChange={e=>alterar('classificacao',e.target.value)}>{classificacoes.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label style={label}>Situação<select style={campo} value={form.status} onChange={e=>alterar('status',e.target.value)}>{situacoes.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label style={label}>Prazo<input type="date" style={campo} value={form.prazo} onChange={e=>alterar('prazo',e.target.value)}/></label>
 </div>
 <details open style={{border:'1px solid #cbd5e1',borderRadius:8,padding:12}}><summary style={{fontWeight:700,cursor:'pointer'}}>1. Identificação do risco</summary><div style={{display:'grid',gap:12,marginTop:12}}>
 <label style={label}>Grupo do risco<input style={campo} value={form.grupo_risco} onChange={e=>alterar('grupo_risco',e.target.value)}/></label>
 </div></details>
 <details style={{border:'1px solid #cbd5e1',borderRadius:8,padding:12}}><summary style={{fontWeight:700,cursor:'pointer'}}>2. Exposição e prevenção</summary><div style={{display:'grid',gap:12,marginTop:12}}>
 {([['perfil_exposicao','Perfil de exposição'],['medidas_existentes','Medidas existentes']] as const).map(([k,t])=><label key={k} style={label}>{t}<textarea rows={3} style={{...campo,height:'auto'}} value={form[k]} onChange={e=>alterar(k,e.target.value)}/></label>)}
 </div></details>
 <details style={{border:'1px solid #cbd5e1',borderRadius:8,padding:12}}><summary style={{fontWeight:700,cursor:'pointer'}}>3. Avaliação de risco — preenchimento manual</summary><div style={{display:'grid',gap:12,marginTop:12}}>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
 {([['nivel_mitigacao','Nível de mitigação existente']] as const).map(([k,t])=><label key={k} style={label}>{t}<input style={campo} value={form[k]} onChange={e=>alterar(k,e.target.value)}/></label>)}
 {([['probabilidade','Probabilidade'],['severidade','Severidade'],['risco_puro','Risco puro']] as const).map(([k,t])=><label key={k} style={label}>{t}<input type="number" min="0" step="any" style={campo} value={form[k]} onChange={e=>alterar(k,e.target.value)}/></label>)}
 </div><p style={{fontSize:12,color:'#64748b'}}>Os valores são informados manualmente. Nenhum cálculo ou classificação automática é aplicado.</p>
 </div></details>
 <details style={{border:'1px solid #cbd5e1',borderRadius:8,padding:12}}><summary style={{fontWeight:700,cursor:'pointer'}}>4. Conclusão técnica</summary><div style={{display:'grid',gap:12,marginTop:12}}>
 <label style={label}>Classificação de risco final<input style={campo} value={form.classificacao_final} onChange={e=>alterar('classificacao_final',e.target.value)} placeholder="Ex.: Presença de risco ergonômico médio"/></label>
 <label style={label}>Conclusão<textarea rows={3} style={{...campo,height:'auto'}} value={form.conclusao_tecnica} onChange={e=>alterar('conclusao_tecnica',e.target.value)}/></label>
 </div></details>
 <details style={{border:'1px solid #cbd5e1',borderRadius:8,padding:12}}><summary style={{fontWeight:700,cursor:'pointer'}}>5. Ações e consequências</summary><div style={{display:'grid',gap:12,marginTop:12}}>
 <label style={label}>Lesões e agravos<textarea rows={3} style={{...campo,height:'auto'}} value={form.lesoes_agravos} onChange={e=>alterar('lesoes_agravos',e.target.value)}/></label>
 </div></details>
 <label style={label}>Título do risco<input required maxLength={180} style={campo} value={form.titulo} onChange={e=>alterar('titulo',e.target.value)} placeholder="Ex.: Flexão frequente do tronco"/></label>
 {([['descricao','Descrição técnica do risco'],['medidas_recomendadas','Medidas recomendadas'],['plano_acao','Plano de ação'],['observacoes','Observações adicionais']] as const).map(([k,t])=><label key={k} style={label}>{t}<textarea rows={3} style={{...campo,height:'auto',resize:'vertical'}} required={k==='descricao'} value={form[k]} onChange={e=>alterar(k,e.target.value)}/></label>)}
 <label style={label}>Responsável pelo plano de ação<input style={campo} value={form.responsavel_acao} onChange={e=>alterar('responsavel_acao',e.target.value)}/></label>
 <p style={{fontSize:12,color:'#64748b'}}>A classificação é informada pela profissional responsável, não calculada automaticamente.</p>
 <div style={{display:'flex',gap:10}}><button type="submit" disabled={salvando}>{salvando?'Salvando...':editando?'Salvar alterações':'Cadastrar risco'}</button><button type="button" onClick={()=>setModo('painel')}>Cancelar</button></div>
 </form>}
 </section></main></>
}
