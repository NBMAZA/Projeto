'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
type Item={id:string;nome:string};
type Nivel='cliente'|'planta'|'instalacao'|'posto'|'estacao';
type Medicao={id:string;tipo:'ruido'|'iluminacao_pontual'|'iluminacao_media'|'temperatura';resultado:string;observacoes:string};
type Ponto={id:string;nome:string;localizacao:string;observacoes:string;medicoes:Medicao[]};
const tipos={ruido:'Ruído — dB(A)',iluminacao_pontual:'Iluminação pontual — lux',iluminacao_media:'Iluminação média — lux',temperatura:'Temperatura — °C'};
const novaMedicao=():Medicao=>({id:crypto.randomUUID(),tipo:'ruido',resultado:'',observacoes:''});
const novoPonto=():Ponto=>({id:crypto.randomUUID(),nome:'',localizacao:'',observacoes:'',medicoes:[novaMedicao()]});
export default function CondicoesAmbientais(){
 const [clientes,setClientes]=useState<{id:string;razao_social:string}[]>([]);
 const [cliente,setCliente]=useState(''),[planta,setPlanta]=useState(''),[instalacao,setInstalacao]=useState(''),[posto,setPosto]=useState(''),[estacao,setEstacao]=useState('');
 const [plantas,setPlantas]=useState<Item[]>([]),[instalacoes,setInstalacoes]=useState<Item[]>([]),[postos,setPostos]=useState<Item[]>([]),[estacoes,setEstacoes]=useState<Item[]>([]);
 const [nivel,setNivel]=useState<Nivel>('cliente'),[data,setData]=useState(''),[titulo,setTitulo]=useState(''),[metodologia,setMetodologia]=useState(''),[conclusao,setConclusao]=useState('');
 const [pontos,setPontos]=useState<Ponto[]>([novoPonto()]),[erro,setErro]=useState('');
 const [empresaAtiva,setEmpresaAtiva]=useState(false);
 const [consultoriaId,setConsultoriaId]=useState(''),[salvando,setSalvando]=useState(false),[mensagem,setMensagem]=useState('');
 const [avaliacoes,setAvaliacoes]=useState<{id:string;titulo:string;data_coleta:string|null;nivel:string;created_at:string;situacao:string}[]>([]);
 const [tela,setTela]=useState<'lista'|'formulario'>('lista'),[busca,setBusca]=useState(''),[pagina,setPagina]=useState(0),[total,setTotal]=useState(0),[carregandoLista,setCarregandoLista]=useState(false);
 const [filtroNivel,setFiltroNivel]=useState(''),[filtroData,setFiltroData]=useState('');
 const [seletorRiscoAberto,setSeletorRiscoAberto]=useState(false),[riscoTitulo,setRiscoTitulo]=useState(''),[riscoGrupo,setRiscoGrupo]=useState(''),[riscoObservacoes,setRiscoObservacoes]=useState(''),[riscoNivel,setRiscoNivel]=useState<Nivel>('cliente'),[riscoEstrutura,setRiscoEstrutura]=useState(''),[criandoRisco,setCriandoRisco]=useState(false);
 const [erroRisco,setErroRisco]=useState('');
 const [estruturasRisco,setEstruturasRisco]=useState<Record<'planta'|'instalacao'|'posto'|'estacao',Item[]>>({planta:[],instalacao:[],posto:[],estacao:[]});
 const [situacao,setSituacao]=useState<'rascunho'|'concluida'|'reaberta'>('rascunho'),[riscos,setRiscos]=useState<{id:string;titulo:string}[]>([]),[riscosSelecionados,setRiscosSelecionados]=useState<string[]>([]);
 const [editandoId,setEditandoId]=useState<string|null>(null),[estruturaOriginal,setEstruturaOriginal]=useState<string|null>(null);
 const [criterios,setCriterios]=useState<Record<Medicao['tipo'],string>>({ruido:'',iluminacao_pontual:'',iluminacao_media:'',temperatura:''});
 useEffect(()=>{
  let ativo=true;
  (async()=>{
   try{
    const db=supabase();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError)throw authError;
    if(!user)return;
    const {data:links,error:linkError}=await db.from('usuarios_consultoria').select('consultoria_id').eq('usuario_id',user.id).eq('ativo',true).eq('perfil','admin_consultoria');
    if(linkError)throw linkError;
    if(!ativo)return;
    const consultoriaId=links?.[0]?.consultoria_id;
    if(!consultoriaId)return;
    setConsultoriaId(consultoriaId);
    const {data,error}=await db.from('clientes').select('id,razao_social').eq('consultoria_id',consultoriaId).order('razao_social');
    if(error)throw error;
    if(!ativo)return;
    const disponiveis=data||[];
    setClientes(disponiveis);
    const chave='portal-nr17:empresa-ativa:'+user.id+':'+consultoriaId;
    const informado=new URLSearchParams(window.location.search).get('cliente')||'';
    const salva=window.localStorage.getItem(chave)||'';
    const escolhido=informado||salva;
    if(escolhido&&disponiveis.some(c=>c.id===escolhido)){
      setCliente(escolhido);setEmpresaAtiva(true);
      window.localStorage.setItem(chave,escolhido);
    }else if(informado){setErro('A empresa informada não está disponível para este usuário. Selecione uma empresa autorizada no painel.')}
    else if(salva){window.localStorage.removeItem(chave)}
   }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Não foi possível carregar as empresas.')}
  })();
  return()=>{ativo=false};
 },[]);
 useEffect(()=>{setPlanta('');setPlantas([]);if(cliente)supabase().from('plantas').select('id,nome').eq('cliente_id',cliente).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPlantas(data||[])})},[cliente]);
 useEffect(()=>{setInstalacao('');setInstalacoes([]);if(planta)supabase().from('instalacoes').select('id,nome').eq('planta_id',planta).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setInstalacoes(data||[])})},[planta]);
 useEffect(()=>{setPosto('');setPostos([]);if(instalacao)supabase().from('postos_trabalho').select('id,nome').eq('instalacao_id',instalacao).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPostos(data||[])})},[instalacao]);
 useEffect(()=>{setEstacao('');setEstacoes([]);if(posto)supabase().from('estacoes_trabalho').select('id,nome').eq('posto_id',posto).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setEstacoes(data||[])})},[posto]);
 useEffect(()=>{
  if(!consultoriaId||!cliente)return;
  let ativo=true;
  (async()=>{
   setCarregandoLista(true);
   let q=supabase().from('avaliacoes_ambientais').select('id,titulo,data_coleta,nivel,created_at,situacao',{count:'exact'}).eq('consultoria_id',consultoriaId).eq('cliente_id',cliente);
   if(busca.trim())q=q.ilike('titulo','%'+busca.trim().replace(/[%_,]/g,'')+'%');
   if(filtroNivel)q=q.eq('nivel',filtroNivel);
   if(filtroData)q=q.eq('data_coleta',filtroData);
   const {data,error,count}=await q.order('created_at',{ascending:false}).range(pagina*20,pagina*20+19);
   if(ativo){if(error)setErro(error.message);else{setAvaliacoes(data||[]);setTotal(count||0)}setCarregandoLista(false)}
  })();
  return()=>{ativo=false};
 },[consultoriaId,cliente,busca,pagina,filtroNivel,filtroData,tela]);
 useEffect(()=>{
  if(!cliente){setEstruturasRisco({planta:[],instalacao:[],posto:[],estacao:[]});return}
  let ativo=true;
  (async()=>{
   const db=supabase();
   const {data:pls,error:pe}=await db.from('plantas').select('id,nome').eq('cliente_id',cliente).order('nome');
   if(pe){if(ativo)setErro(pe.message);return}
   const pids=(pls||[]).map(x=>x.id);
   const {data:ins,error:ie}=pids.length?await db.from('instalacoes').select('id,nome').in('planta_id',pids).order('nome'):{data:[] as Item[],error:null};
   if(ie){if(ativo)setErro(ie.message);return}
   const iids=(ins||[]).map(x=>x.id);
   const {data:pos,error:oe}=iids.length?await db.from('postos_trabalho').select('id,nome').in('instalacao_id',iids).order('nome'):{data:[] as Item[],error:null};
   if(oe){if(ativo)setErro(oe.message);return}
   const oids=(pos||[]).map(x=>x.id);
   const {data:est,error:ee}=oids.length?await db.from('estacoes_trabalho').select('id,nome').in('posto_id',oids).order('nome'):{data:[] as Item[],error:null};
   if(ee){if(ativo)setErro(ee.message);return}
   if(ativo)setEstruturasRisco({planta:pls||[],instalacao:ins||[],posto:pos||[],estacao:est||[]});
  })();
  return()=>{ativo=false}
 },[cliente]);
 useEffect(()=>{if(!cliente)return;let ativo=true;supabase().from('riscos_identificados').select('id,titulo').eq('cliente_id',cliente).order('titulo').then(({data,error})=>{if(ativo){if(error)setErro(error.message);else setRiscos(data||[])}});return()=>{ativo=false}},[cliente]);
 function novaAvaliacao(){
  setEditandoId(null);setEstruturaOriginal(null);setSituacao('rascunho');setRiscosSelecionados([]);setSeletorRiscoAberto(false);setRiscoTitulo('');
  setTitulo('');setData('');setNivel('cliente');setPlanta('');setInstalacao('');setPosto('');setEstacao('');
  setMetodologia('');setConclusao('');setCriterios({ruido:'',iluminacao_pontual:'',iluminacao_media:'',temperatura:''});
  setPontos([novoPonto()]);setErro('');setMensagem('');setTela('formulario');
 }
 async function incluirRisco(){
  setErroRisco('');
  if(!editandoId){setErroRisco('Salve a avaliação ambiental antes de incluir um risco.');return}
  if(!riscoTitulo.trim()){setErroRisco('Informe o título do risco.');return}
  if(riscoNivel!=='cliente'&&!riscoEstrutura){setErroRisco('Selecione a estrutura correspondente ao nível selecionado.');return}
  if(riscoNivel!=='cliente'&&!estruturasRisco[riscoNivel].some(x=>x.id===riscoEstrutura)){setErroRisco('A estrutura escolhida não pertence à Empresa Ativa. Selecione uma opção da lista.');return}
  setCriandoRisco(true);
  const db=supabase();
  let novoId='';
  try{
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError)throw authError;
   if(!user)throw new Error('Sessão expirada.');
   const {data:novo,error:ie}=await db.from('riscos_identificados').insert({cliente_id:cliente,nivel:riscoNivel,estrutura_id:riscoNivel==='cliente'?null:riscoEstrutura,origem:'outra',titulo:riscoTitulo.trim(),grupo_risco:riscoGrupo.trim()||null,observacoes:riscoObservacoes.trim()||null,criado_por:user.id}).select('id,titulo').single();
   if(ie)throw ie;novoId=novo.id;
   const {error:ve}=await db.from('avaliacoes_ambientais_riscos').insert({avaliacao_id:editandoId,risco_id:novo.id});
   if(ve)throw ve;
   setRiscos(a=>[...a,novo]);setRiscosSelecionados(a=>[...a,novo.id]);setSeletorRiscoAberto(false);setRiscoTitulo('');setRiscoGrupo('');setRiscoObservacoes('');
   setMensagem('Risco cadastrado e vinculado à avaliação.');
  }catch(e){
   if(novoId)await db.from('riscos_identificados').delete().eq('id',novoId).eq('cliente_id',cliente);
   setErroRisco(e instanceof Error?e.message:'Não foi possível incluir o risco.');
  }finally{setCriandoRisco(false)}
 }
 async function salvarVinculos(id:string){
  const db=supabase();
  const {data:atuais,error:le}=await db.from('avaliacoes_ambientais_riscos').select('risco_id').eq('avaliacao_id',id);
  if(le)throw le;
  const existentes=(atuais||[]).map(v=>v.risco_id);
  const incluir=riscosSelecionados.filter(x=>!existentes.includes(x));
  const excluir=existentes.filter(x=>!riscosSelecionados.includes(x));
  if(incluir.length){const {error}=await db.from('avaliacoes_ambientais_riscos').insert(incluir.map(risco_id=>({avaliacao_id:id,risco_id})));if(error)throw error}
  if(excluir.length){const {error}=await db.from('avaliacoes_ambientais_riscos').delete().eq('avaliacao_id',id).in('risco_id',excluir);if(error)throw error}
 }
 async function mudarSituacao(proxima:'concluida'|'reaberta'){
  if(!editandoId)return;
  setErro('');setMensagem('');
  if(!window.confirm(proxima==='concluida'?'Concluir esta avaliação?':'Reabrir esta avaliação para edição?'))return;
  const {error}=await supabase().from('avaliacoes_ambientais').update({situacao:proxima,updated_at:new Date().toISOString()}).eq('id',editandoId).eq('cliente_id',cliente).eq('consultoria_id',consultoriaId);
  if(error){setErro(error.message);return}
  setSituacao(proxima);setMensagem(proxima==='concluida'?'Avaliação concluída.':'Avaliação reaberta para edição.');
 }
 async function salvar(){
  setErro('');setMensagem('');
  if(!cliente||!consultoriaId||!titulo.trim()){setErro('Informe a empresa e o título da avaliação.');return}
  const estruturaId=editandoId?estruturaOriginal:nivel==='cliente'?null:nivel==='planta'?planta:nivel==='instalacao'?instalacao:nivel==='posto'?posto:estacao;
  if(nivel!=='cliente'&&!estruturaId){setErro('Selecione a estrutura organizacional correspondente ao nível escolhido.');return}
  setSalvando(true);
  const db=supabase();
  let avaliacaoId='';
  try{
   const {data:{user},error:authErro}=await db.auth.getUser();
   if(authErro)throw authErro;
   if(!user)throw new Error('Sessão expirada. Entre novamente.');
   if(editandoId){
    const {error:atualizarErro}=await db.rpc('atualizar_avaliacao_ambiental',{p_id:editandoId,p_cliente_id:cliente,p_titulo:titulo.trim(),p_data_coleta:data||null,p_criterios:criterios,p_metodologia:metodologia,p_conclusao:conclusao,p_pontos:pontos.map(p=>({nome:p.nome,localizacao:p.localizacao,observacoes:p.observacoes,medicoes:p.medicoes.map(m=>({tipo:m.tipo,resultado:m.resultado,observacoes:m.observacoes}))}))});
    if(atualizarErro)throw atualizarErro;
    await salvarVinculos(editandoId);
    setPagina(0);setTela('lista');setMensagem('Alterações salvas na avaliação original.');
    return;
   }
   const {data:av,error:avErro}=await db.from('avaliacoes_ambientais').insert({situacao:'rascunho',consultoria_id:consultoriaId,cliente_id:cliente,nivel,estrutura_id:estruturaId,titulo:titulo.trim(),data_coleta:data||null,criterios,metodologia,conclusao,criado_por:user.id}).select('id').single();
   if(avErro)throw avErro;
   avaliacaoId=av.id;
   for(let i=0;i<pontos.length;i++){
    const p=pontos[i];
    const {data:pt,error:ptErro}=await db.from('pontos_coleta_ambientais').insert({avaliacao_id:avaliacaoId,nome:p.nome,localizacao:p.localizacao,observacoes:p.observacoes,ordem:i}).select('id').single();
    if(ptErro)throw ptErro;
    if(p.medicoes.length){
     const {error:mErro}=await db.from('medicoes_ambientais').insert(p.medicoes.map((m,j)=>({ponto_id:pt.id,tipo:m.tipo,resultado:m.resultado,observacoes:m.observacoes,ordem:j})));
     if(mErro)throw mErro;
    }
   }
   await salvarVinculos(avaliacaoId);
   setPagina(0);setTela('lista');
   setMensagem('Avaliação salva com sucesso no Supabase.');
  }catch(e){
   if(avaliacaoId)await db.from('avaliacoes_ambientais').delete().eq('id',avaliacaoId);
   setErro(e instanceof Error?e.message:'Não foi possível salvar a avaliação.');
  }finally{setSalvando(false)}
 }
 async function carregarAvaliacao(id:string){
  setErro('');setMensagem('');
  const db=supabase();
  const {data:av,error:ae}=await db.from('avaliacoes_ambientais').select('*').eq('id',id).eq('consultoria_id',consultoriaId).single();
  if(ae||!av){setErro(ae?.message||'Avaliação não encontrada.');return}
  if(av.cliente_id!==cliente){setErro('Selecione a empresa da avaliação no painel para abrir este registro.');return}
  const {data:pts,error:pe}=await db.from('pontos_coleta_ambientais').select('*').eq('avaliacao_id',id).order('ordem');
  if(pe){setErro(pe.message);return}
  const {data:ms,error:me}=await db.from('medicoes_ambientais').select('*').in('ponto_id',(pts||[]).map(p=>p.id).length?(pts||[]).map(p=>p.id):['00000000-0000-0000-0000-000000000000']).order('ordem');
  if(me){setErro(me.message);return}
  setEditandoId(av.id);setEstruturaOriginal(av.estrutura_id||null);setSituacao(av.situacao||'rascunho');
  const {data:vinculos,error:ve}=await db.from('avaliacoes_ambientais_riscos').select('risco_id').eq('avaliacao_id',id);
  if(ve){setErro(ve.message);return}setRiscosSelecionados((vinculos||[]).map(v=>v.risco_id));
  setTitulo(av.titulo);setData(av.data_coleta||'');setNivel(av.nivel as Nivel);
  setCriterios({ruido:'',iluminacao_pontual:'',iluminacao_media:'',temperatura:'',...(av.criterios||{})});
  setMetodologia(av.metodologia||'');setConclusao(av.conclusao||'');
  setPontos((pts||[]).map(p=>({id:crypto.randomUUID(),nome:p.nome,localizacao:p.localizacao,observacoes:p.observacoes,medicoes:(ms||[]).filter(m=>m.ponto_id===p.id).map(m=>({id:crypto.randomUUID(),tipo:m.tipo,resultado:m.resultado,observacoes:m.observacoes}))})));
  setTela('formulario');
  setMensagem('Avaliação carregada para edição. Salvar alterações atualizará o registro original.');
 }
 const selecao=(nome:string,valor:string,alterar:(s:string)=>void,itens:Item[],disabled=false)=><label>{nome}<select value={valor} onChange={e=>alterar(e.target.value)} disabled={disabled}><option value="">Selecione</option>{itens.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label>;
 const mudarPonto=(id:string,campo:'nome'|'localizacao'|'observacoes',valor:string)=>setPontos(ps=>ps.map(p=>p.id===id?{...p,[campo]:valor}:p));
 const mudarMedicao=(pid:string,mid:string,campo:keyof Omit<Medicao,'id'>,valor:string)=>setPontos(ps=>ps.map(p=>p.id===pid?{...p,medicoes:p.medicoes.map(m=>m.id===mid?{...m,[campo]:valor}:m)}:p));
 return <><header><nav><strong>Portal NR-17 — Condições Ambientais</strong></nav></header><main><section style={{maxWidth:1100}}>
 <p><Link href="/">← Voltar ao painel</Link></p><h1>Condições Ambientais</h1>
 <p style={{color:'#53657a'}}>Avaliações ambientais da Empresa Ativa. Consulte os registros ou inicie uma nova coleta.</p>
 {erro&&<p role="alert" style={{color:'#b42318'}}>{erro}</p>}
 {mensagem&&<p role="status" style={{color:'#166534'}}>{mensagem}</p>}
 {tela==='lista'?<div>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><h2>Avaliações cadastradas</h2><button type="button" onClick={novaAvaliacao}>+ Nova avaliação</button></div>
 <div className="ambiental-grid">
 <label>Pesquisar por título<input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(0)}} placeholder="Digite o título da avaliação"/></label>
 <label>Nível<select value={filtroNivel} onChange={e=>{setFiltroNivel(e.target.value);setPagina(0)}}><option value="">Todos</option><option value="cliente">Cliente</option><option value="planta">Planta</option><option value="instalacao">Instalação</option><option value="posto">Posto</option><option value="estacao">Estação</option></select></label>
 <label>Data da coleta<input type="date" value={filtroData} onChange={e=>{setFiltroData(e.target.value);setPagina(0)}}/></label>
 </div>
 {!cliente?<p>Selecione uma Empresa Ativa no painel para consultar as avaliações.</p>:carregandoLista?<p>Carregando avaliações...</p>:avaliacoes.length===0?<p>Nenhuma avaliação encontrada para os filtros selecionados.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left'}}>Avaliação</th><th style={{textAlign:'left'}}>Data</th><th style={{textAlign:'left'}}>Nível</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{avaliacoes.map(a=><tr key={a.id} style={{borderTop:'1px solid #e2e8f0'}}><td style={{padding:'12px 6px'}}>{a.titulo}</td><td>{a.data_coleta||'—'}</td><td>{a.nivel}</td><td>{a.situacao==='concluida'?'Concluída':a.situacao==='reaberta'?'Reaberta':'Rascunho'}</td><td><button type="button" onClick={()=>carregarAvaliacao(a.id)}>Editar</button></td></tr>)}</tbody></table></div>}
 <div style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}><button type="button" disabled={pagina===0||carregandoLista} onClick={()=>setPagina(p=>p-1)}>Anterior</button><span>Página {pagina+1} de {Math.max(1,Math.ceil(total/20))} — {total} avaliações</span><button type="button" disabled={(pagina+1)*20>=total||carregandoLista} onClick={()=>setPagina(p=>p+1)}>Próxima</button></div>
 </div>:<>
 <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><button type="button" onClick={()=>{setTela('lista');setErro('');setMensagem('')}}>← Voltar à lista</button><button type="button" onClick={salvar} disabled={salvando||!consultoriaId||situacao==='concluida'}>{salvando?'Salvando...':editandoId?'Salvar alterações':'Salvar avaliação'}</button><span style={{fontSize:12,color:'#53657a'}}>{editandoId?'Edição do registro existente. A estrutura vinculada permanece inalterada.':'Nova avaliação ambiental.'}</span></div>
 {editandoId&&<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><strong>Situação: {situacao==='concluida'?'Concluída':situacao==='reaberta'?'Reaberta':'Rascunho'}</strong>{situacao==='concluida'?<button type="button" onClick={()=>mudarSituacao('reaberta')}>Reabrir avaliação</button>:<button type="button" onClick={()=>mudarSituacao('concluida')}>Concluir avaliação</button>}</div>}
 <h2>Identificação da avaliação</h2>
 <div className="ambiental-grid">
 <label>Título da avaliação<input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex.: Avaliação ambiental do escritório"/></label>
 <label>Data da coleta<input type="date" value={data} onChange={e=>setData(e.target.value)}/></label>
 <label>Cliente<select value={cliente} disabled={empresaAtiva} onChange={e=>setCliente(e.target.value)}><option value="">Selecione</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></label>
 <label>Vincular a<select value={nivel} disabled={!!editandoId} onChange={e=>setNivel(e.target.value as Nivel)}>{([['cliente','Cliente'],['planta','Planta'],['instalacao','Instalação'],['posto','Posto de trabalho'],['estacao','Estação de trabalho']] as const).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 {editandoId&&nivel!=='cliente'&&<p style={{fontSize:12,color:'#53657a'}}>Vínculo organizacional preservado nesta edição (ID: {estruturaOriginal}).</p>}
 {!editandoId&&nivel!=='cliente'&&selecao('Planta',planta,setPlanta,plantas,!cliente)}
 {!editandoId&&['instalacao','posto','estacao'].includes(nivel)&&selecao('Instalação',instalacao,setInstalacao,instalacoes,!planta)}
 {!editandoId&&['posto','estacao'].includes(nivel)&&selecao('Posto',posto,setPosto,postos,!instalacao)}
 {!editandoId&&nivel==='estacao'&&selecao('Estação',estacao,setEstacao,estacoes,!posto)}
 </div>
 {empresaAtiva&&<p style={{fontSize:12,color:'#53657a',margin:'8px 0'}}>Empresa herdada do Painel da Consultoria. Para alterar, volte ao painel e selecione outra empresa.</p>}
 <h2>Critérios de referência</h2>
 <p style={{color:'#53657a',fontSize:13}}>Informe uma vez o critério aplicável a cada tipo de medição. Os critérios serão utilizados como referência nos pontos de coleta desta avaliação.</p>
 <div className="ambiental-grid">{(Object.entries(tipos) as [Medicao['tipo'],string][]).map(([tipo,nome])=><label key={tipo}>{nome}<input value={criterios[tipo]} onChange={e=>setCriterios(atual=>({...atual,[tipo]:e.target.value}))} placeholder="Ex.: norma, limite ou critério aplicável"/></label>)}</div>
 <h2>Pontos de coleta</h2>
 {pontos.map((p,i)=><article key={p.id} style={{border:'1px solid #cbd5e1',borderRadius:10,padding:16,marginBottom:16}}>
 <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><h3>Ponto {i+1}</h3><button type="button" onClick={()=>setPontos(ps=>ps.filter(x=>x.id!==p.id))}>Excluir ponto</button></div>
 <div className="ambiental-grid"><label>Identificação<input value={p.nome} onChange={e=>mudarPonto(p.id,'nome',e.target.value)} placeholder="Ex.: Recepção"/></label><label>Localização<input value={p.localizacao} onChange={e=>mudarPonto(p.id,'localizacao',e.target.value)} placeholder="Ex.: Próximo à janela"/></label></div>
 <label>Observações do ponto<textarea rows={2} value={p.observacoes} onChange={e=>mudarPonto(p.id,'observacoes',e.target.value)}/></label>
 <h4>Medições</h4>
 {p.medicoes.map((m,j)=><div key={m.id} style={{borderTop:'1px solid #e2e8f0',padding:'12px 0'}}>
 <div className="ambiental-grid">
 <label>Tipo de medição<select value={m.tipo} onChange={e=>mudarMedicao(p.id,m.id,'tipo',e.target.value)}>{Object.entries(tipos).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label>Resultado<input value={m.resultado} onChange={e=>mudarMedicao(p.id,m.id,'resultado',e.target.value)} placeholder="Valor medido"/></label>
 </div>
 <label>Observações da medição<textarea rows={2} value={m.observacoes} onChange={e=>mudarMedicao(p.id,m.id,'observacoes',e.target.value)}/></label>
 <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:10}}>
 <button type="button" onClick={()=>setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:x.medicoes.filter(y=>y.id!==m.id)}:x))}>Excluir medição {j+1}</button>
 <button type="button" onClick={()=>setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:[...x.medicoes.slice(0,j+1),novaMedicao(),...x.medicoes.slice(j+1)]}:x))}>+ Adicionar medição</button>
 </div>
 </div>)}
 {p.medicoes.length===0&&<button type="button" onClick={()=>setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:[novaMedicao()]}:x))}>+ Adicionar medição</button>}
 </article>)}
 <button type="button" onClick={()=>setPontos(ps=>[...ps,novoPonto()])}>+ Adicionar ponto de coleta</button>
 <h2>Riscos vinculados</h2>
 <p style={{fontSize:13,color:'#53657a'}}>Cadastre riscos específicos desta avaliação. O sistema não classifica riscos automaticamente.</p>
 <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
 <button type="button" disabled={situacao==='concluida'||!editandoId} onClick={()=>{setErroRisco('');setRiscoTitulo('');setRiscoGrupo('');setRiscoObservacoes('');setRiscoNivel(nivel);setRiscoEstrutura(editandoId?estruturaOriginal||'':nivel==='cliente'?'':nivel==='planta'?planta:nivel==='instalacao'?instalacao:nivel==='posto'?posto:estacao);setSeletorRiscoAberto(true)}}>+ Incluir risco</button>
 <span style={{fontSize:12,color:'#53657a'}}>{riscosSelecionados.length} risco(s) vinculado(s)</span>
 </div>
 {!editandoId&&<p style={{fontSize:12,color:'#53657a'}}>Salve primeiro a avaliação ambiental para incluir riscos.</p>}
 {riscosSelecionados.length===0?<p>Nenhum risco vinculado a esta avaliação.</p>:<div style={{display:'grid',gap:8,marginBottom:16}}>{riscosSelecionados.map(id=>{const risco=riscos.find(r=>r.id===id);return <div key={id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,border:'1px solid #cbd5e1',padding:10,borderRadius:8}}><span>{risco?.titulo||'Risco cadastrado'}</span><button type="button" disabled={situacao==='concluida'} onClick={()=>setRiscosSelecionados(a=>a.filter(x=>x!==id))}>Remover vínculo</button></div>})}</div>}
 {seletorRiscoAberto&&<div role="presentation" style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',display:'flex',justifyContent:'center',alignItems:'center',padding:16,zIndex:1000}} onClick={()=>!criandoRisco&&setSeletorRiscoAberto(false)}>
 <div role="dialog" aria-modal="true" aria-label="Incluir novo risco" onClick={e=>e.stopPropagation()} style={{background:'#fff',color:'#0f172a',borderRadius:12,padding:20,width:'100%',maxWidth:640,maxHeight:'80vh',overflowY:'auto'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h3>Incluir novo risco</h3><button type="button" disabled={criandoRisco} onClick={()=>setSeletorRiscoAberto(false)}>Fechar</button></div>
 {erroRisco&&<p role="alert" style={{background:'#fef2f2',color:'#991b1b',border:'1px solid #fecaca',borderRadius:8,padding:12}}>{erroRisco}</p>}
 <label>Título do risco<input autoFocus value={riscoTitulo} onChange={e=>setRiscoTitulo(e.target.value)} placeholder="Identificação do risco"/></label>
 <label>Grupo de risco<input value={riscoGrupo} onChange={e=>setRiscoGrupo(e.target.value)} placeholder="Grupo ou categoria"/></label>
 <label>Nível organizacional<select value={riscoNivel} onChange={e=>{setRiscoNivel(e.target.value as Nivel);setRiscoEstrutura('')}}>{([['cliente','Empresa'],['planta','Planta'],['instalacao','Instalação'],['posto','Posto'],['estacao','Estação']] as const).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 {riscoNivel!=='cliente'&&<label>Estrutura correspondente<select value={riscoEstrutura} onChange={e=>setRiscoEstrutura(e.target.value)}><option value="">Selecione</option>{estruturasRisco[riscoNivel].map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select>{estruturasRisco[riscoNivel].length===0&&<small>Nenhuma estrutura deste nível cadastrada para a Empresa Ativa.</small>}</label>}
 <label>Observações<textarea rows={3} value={riscoObservacoes} onChange={e=>setRiscoObservacoes(e.target.value)}/></label>
 <div style={{display:'flex',gap:10,marginTop:14}}><button type="button" disabled={criandoRisco} onClick={incluirRisco}>{criandoRisco?'Salvando...':'Salvar e vincular risco'}</button><button type="button" disabled={criandoRisco} onClick={()=>setSeletorRiscoAberto(false)}>Cancelar</button></div>
 </div></div>}
 <h2>Informações técnicas</h2><label>Metodologia<textarea rows={3} value={metodologia} onChange={e=>setMetodologia(e.target.value)}/></label>
 <label>Conclusão técnica<textarea rows={3} value={conclusao} onChange={e=>setConclusao(e.target.value)}/></label>
 <p style={{fontSize:13,color:'#53657a'}}>Os critérios de referência são informativos, definidos por tipo de medição nesta avaliação, e não classificam riscos automaticamente. O vínculo organizacional de uma avaliação existente não pode ser alterado nesta versão. Microfone e associação aos riscos serão integrados nas próximas etapas.</p>
 </>}
 <style>{`.ambiental-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.ambiental-grid label,section>label,article>label{display:grid;gap:5px;margin-bottom:12px}input,select,textarea{max-width:100%;width:100%;box-sizing:border-box}`}</style>
 </section></main></>;
}
