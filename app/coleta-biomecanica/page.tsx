'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
import {useClienteAtivo} from '../use-cliente-ativo';
import ColetaDetalhadaB03,{type OcorrenciaB03} from './coleta-detalhada-b03';

type Item={id:string;nome:string};
type Fator={codigo:string;grupo:string;titulo:string;sugestao:string};
type Avaliacao={id:string;titulo:string;nivel:'posto'|'estacao';estrutura_id:string;planta_id:string|null;instalacao_id:string|null;posto_id:string|null;estacao_id:string|null;respostas:Record<string,Resposta>;avaliacao_geral:{observacoes:string;comentario:string;plano:string};situacao:string;created_at:string};
type Resposta={situacao:string;descricao:string;observacoes:string;comentario:string;plano:string;detalhes_b03?:OcorrenciaB03[]};
const fatores:Fator[]=[
{codigo:'B01',grupo:'Posturas',titulo:'Postura predominante',sugestao:'Atividade realizada predominantemente 50% em pé e 50% sentada, com liberdade para pausas quando necessário.'},
{codigo:'B02',grupo:'Esforços e cargas',titulo:'Levantamento e transporte manual de cargas',sugestao:'Não se observa exigência de movimentação manual de cargas durante a atividade.'},
{codigo:'B03',grupo:'Posturas',titulo:'Posturas incômodas por longos períodos',sugestao:'As tarefas são realizadas em posturas naturais e confortáveis, sem manutenção prolongada de posições inadequadas.'},
{codigo:'B04',grupo:'Esforços e cargas',titulo:'Trabalho com esforço físico intenso',sugestao:'As atividades exigem esforço físico leve a moderado, conforme condições observadas.'},
{codigo:'B05',grupo:'Esforços e cargas',titulo:'Puxar e empurrar cargas',sugestao:'Não há execução frequente de atividades que envolvam puxar ou empurrar cargas.'},
{codigo:'B06',grupo:'Movimentos e acionamentos',titulo:'Uso frequente de escadas',sugestao:'O acesso aos locais de trabalho ocorre predominantemente em superfícies planas.'},
{codigo:'B07',grupo:'Movimentos e acionamentos',titulo:'Movimentos repetitivos',sugestao:'As atividades apresentam variabilidade de tarefas e movimentos.'},
{codigo:'B08',grupo:'Esforços e cargas',titulo:'Ferramentas ou objetos pesados / pega pobre',sugestao:'Não ocorre manuseio prolongado de ferramentas ou objetos pesados ou adoção de pega inadequada.'},
{codigo:'B09',grupo:'Contato e vibração',titulo:'Compressão por superfícies rígidas ou quinas',sugestao:'As atividades não exigem apoio constante de partes do corpo sobre superfícies rígidas ou bordas vivas.'},
{codigo:'B10',grupo:'Posturas',titulo:'Flexões frequentes da coluna vertebral',sugestao:'As tarefas são executadas sem necessidade de flexões frequentes ou acentuadas da coluna.'},
{codigo:'B11',grupo:'Posturas',titulo:'Elevações frequentes dos membros superiores',sugestao:'Não há necessidade de manter membros superiores acima dos ombros de forma frequente ou prolongada.'},
{codigo:'B12',grupo:'Contato e vibração',titulo:'Vibração de corpo inteiro',sugestao:'Não há exposição significativa a vibrações de corpo inteiro durante a jornada.'},
{codigo:'B13',grupo:'Contato e vibração',titulo:'Vibração localizada',sugestao:'Não são utilizadas ferramentas ou equipamentos que gerem vibração localizada relevante.'},
{codigo:'B14',grupo:'Movimentos e acionamentos',titulo:'Uso frequente de pedais',sugestao:'As atividades não requerem operação frequente de pedais.'},
{codigo:'B15',grupo:'Movimentos e acionamentos',titulo:'Uso frequente de alavancas',sugestao:'Não há utilização frequente de alavancas ou dispositivos que demandem esforço manual repetitivo.'},
{codigo:'B16',grupo:'Esforços e cargas',titulo:'Força, pressão, preensão, flexão, extensão ou torção',sugestao:'Não foi identificada exposição habitual ou frequente à exigência de força, pressão, preensão, flexão, extensão ou torção dos segmentos corporais.'},
{codigo:'B17',grupo:'Entrada de dados',titulo:'Trabalho intensivo com teclado e dispositivos de entrada',sugestao:'A entrada de dados é alternada com outras tarefas e pausas, conforme observação e relato.'}
];
const grupos=['Posturas','Esforços e cargas','Movimentos e acionamentos','Contato e vibração','Entrada de dados','Avaliação geral'];
const inicial=():Resposta=>({situacao:'',descricao:'',observacoes:'',comentario:'',plano:''});
export default function ColetaBiomecanica(){
 const {clienteAtivo}=useClienteAtivo();
 const [clientes,setClientes]=useState<{id:string;razao_social:string}[]>([]);
 const [cliente,setCliente]=useState(''),[plantas,setPlantas]=useState<Item[]>([]),[planta,setPlanta]=useState(''),[instalacoes,setInstalacoes]=useState<Item[]>([]),[instalacao,setInstalacao]=useState(''),[postos,setPostos]=useState<Item[]>([]),[posto,setPosto]=useState(''),[estacoes,setEstacoes]=useState<Item[]>([]),[estacao,setEstacao]=useState('');
 const [nivel,setNivel]=useState<'posto'|'estacao'>('posto'),[grupo,setGrupo]=useState('Posturas'),[respostas,setRespostas]=useState<Record<string,Resposta>>({}),[geral,setGeral]=useState({observacoes:'',comentario:'',plano:''});
 const [erro,setErro]=useState('');
 const [detalheAberto,setDetalheAberto]=useState(false);
 const rascunhoCarregado=useRef('');
 const [formularioAlterado,setFormularioAlterado]=useState(false);

 const [consultoriaId,setConsultoriaId]=useState(''),[titulo,setTitulo]=useState(''),[editandoId,setEditandoId]=useState<string|null>(null),[situacao,setSituacao]=useState('rascunho'),[tela,setTela]=useState<'lista'|'formulario'>('lista'),[avaliacoes,setAvaliacoes]=useState<Avaliacao[]>([]),[salvando,setSalvando]=useState(false),[mensagem,setMensagem]=useState('');
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

   }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Não foi possível carregar as empresas.')}
  })();
  return()=>{ativo=false};
 },[]);
 useEffect(()=>{const valido=clientes.some(c=>c.id===clienteAtivo)?clienteAtivo:'';if(cliente!==valido){setCliente(valido);setRespostas({});setGeral({observacoes:'',comentario:'',plano:''});setTela('lista');setEditandoId(null);setErro('')}},[clienteAtivo,clientes,cliente]);
 useEffect(()=>{setPlantas([]);if(cliente)supabase().from('plantas').select('id,nome').eq('cliente_id',cliente).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPlantas(data||[])})},[cliente]);
 useEffect(()=>{setInstalacoes([]);if(planta)supabase().from('instalacoes').select('id,nome').eq('planta_id',planta).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setInstalacoes(data||[])})},[planta]);
 useEffect(()=>{setPostos([]);if(instalacao)supabase().from('postos_trabalho').select('id,nome').eq('instalacao_id',instalacao).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPostos(data||[])})},[instalacao]);
 useEffect(()=>{setEstacoes([]);if(posto)supabase().from('estacoes_trabalho').select('id,nome').eq('posto_id',posto).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setEstacoes(data||[])})},[posto]);
 const chaveRascunho=cliente&&consultoriaId?`ergobax:biomecanica:rascunho:${consultoriaId}:${cliente}`:'';
 useEffect(()=>{
  if(!chaveRascunho||rascunhoCarregado.current===chaveRascunho)return;
  rascunhoCarregado.current=chaveRascunho;
  try{const raw=localStorage.getItem(chaveRascunho);if(!raw)return;const d=JSON.parse(raw);
   if(d&&d.versao===1&&d.tela==='formulario'){
    setTitulo(d.titulo||'');setNivel(d.nivel==='estacao'?'estacao':'posto');setPlanta(d.planta||'');setInstalacao(d.instalacao||'');setPosto(d.posto||'');setEstacao(d.estacao||'');setRespostas(d.respostas||{});setGeral(d.geral||{observacoes:'',comentario:'',plano:''});setGrupo(d.grupo||'Posturas');localStorage.removeItem(chaveRascunho);
   }
  }catch{localStorage.removeItem(chaveRascunho)}
 },[chaveRascunho]);
 useEffect(()=>{
  if(!chaveRascunho||rascunhoCarregado.current!==chaveRascunho||tela!=='formulario'||editandoId)return;
  try{if(formularioAlterado)localStorage.setItem(chaveRascunho,JSON.stringify({versao:1,tela,titulo,nivel,planta,instalacao,posto,estacao,respostas,geral,grupo}))}catch{setErro('Não foi possível guardar o rascunho neste navegador. Salve antes de sair.')}
 },[chaveRascunho,tela,editandoId,titulo,nivel,planta,instalacao,posto,estacao,respostas,geral,grupo,formularioAlterado]);
 useEffect(()=>{const avisar=(e:BeforeUnloadEvent)=>{if(tela==='formulario'&&formularioAlterado){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',avisar);return()=>window.removeEventListener('beforeunload',avisar)},[tela,formularioAlterado]);
 function alterar(codigo:string,campo:keyof Resposta,valor:string){setRespostas(prev=>({...prev,[codigo]:{...(prev[codigo]||inicial()),[campo]:valor}}))}
 function sugerir(f:Fator){alterar(f.codigo,'descricao',f.sugestao)}
 function abrirRisco(codigo:string){
  const estrutura=nivel==='posto'?posto:estacao;
  if(!cliente||!estrutura){setErro('Selecione a empresa e o posto ou estação antes de registrar um risco.');return}
  const params=new URLSearchParams({novo:'1',cliente,nivel,estrutura,criterio:codigo});
  window.open('/riscos-identificados?'+params.toString(),'_blank','noopener,noreferrer');
 }
 function atualizarB03(items:OcorrenciaB03[]){setRespostas(p=>({...p,B03:{...(p.B03||inicial()),detalhes_b03:items}}));setFormularioAlterado(true)}
 const campo=(rotulo:string,valor:string,onChange:(v:string)=>void,lista:Item[],bloqueado=false)=><label style={{display:'grid',gap:5,fontSize:13,minWidth:0,fontWeight:600}}>{rotulo}<select title={lista.find(x=>x.id===valor)?.nome||rotulo} style={{width:'100%',minWidth:0,maxWidth:'100%',height:40,fontWeight:400,textOverflow:'ellipsis'}} value={valor} disabled={bloqueado} onChange={e=>onChange(e.target.value)}><option value="">Selecione</option>{lista.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>;

 async function carregarAvaliacoes(){
  if(!cliente)return;
  const {data,error}=await supabase().from('avaliacoes_biomecanicas').select('id,titulo,nivel,estrutura_id,planta_id,instalacao_id,posto_id,estacao_id,respostas,avaliacao_geral,situacao,created_at').eq('cliente_id',cliente).order('created_at',{ascending:false});
  if(error)setErro(error.message);else setAvaliacoes((data||[]) as Avaliacao[]);
 }
 useEffect(()=>{if(cliente)void carregarAvaliacoes();else setAvaliacoes([])},[cliente]);
 const chaveNavegacao=cliente&&consultoriaId?`ergobax:biomecanica:navegacao:${consultoriaId}:${cliente}`:'';

 function nova(){
  setEditandoId(null);setTitulo('');setNivel('posto');setPlanta('');setInstalacao('');setPosto('');setEstacao('');setRespostas({});setGeral({observacoes:'',comentario:'',plano:''});setSituacao('rascunho');setGrupo('Posturas');setMensagem('');setErro('');setFormularioAlterado(false);setTela('formulario');
 }
 function editar(a:Avaliacao){
  setEditandoId(a.id);setTitulo(a.titulo);setNivel(a.nivel);setPlanta(a.planta_id||'');setInstalacao(a.instalacao_id||'');setPosto(a.posto_id||'');setEstacao(a.estacao_id||'');setRespostas(a.respostas||{});setGeral(a.avaliacao_geral||{observacoes:'',comentario:'',plano:''});setSituacao(a.situacao);setGrupo('Posturas');setMensagem('');setErro('');setTela('formulario');
 }
 async function salvar(novaSituacao?:string){
  const estrutura=nivel==='posto'?posto:estacao;
  if(!cliente||!consultoriaId||!estrutura||!titulo.trim()){setErro('Informe o título e selecione o posto ou estação.');return}
  setSalvando(true);setErro('');
  try{
   const db=supabase();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('Sessão expirada.');
   const payload={consultoria_id:consultoriaId,cliente_id:cliente,titulo:titulo.trim(),nivel,estrutura_id:estrutura,planta_id:planta||null,instalacao_id:instalacao||null,posto_id:posto||null,estacao_id:nivel==='estacao'?estacao||null:null,respostas,avaliacao_geral:geral,situacao:novaSituacao||situacao,updated_at:new Date().toISOString()};
   const result=editandoId?await db.from('avaliacoes_biomecanicas').update(payload).eq('id',editandoId).eq('cliente_id',cliente).select('id').single():await db.from('avaliacoes_biomecanicas').insert({...payload,criado_por:user.id}).select('id').single();
   if(result.error)throw result.error;
   if(chaveRascunho&&!editandoId)localStorage.removeItem(chaveRascunho);
   setEditandoId(result.data.id);setSituacao(payload.situacao);setFormularioAlterado(false);setMensagem('Avaliação salva com sucesso.');await carregarAvaliacoes();
  }catch(e){setErro(e instanceof Error?e.message:'Erro ao salvar avaliação.')}finally{setSalvando(false)}
 }
 const selecionado=nivel==='posto'?posto:estacao;
 return <div className="ergobax-gestao-page" onChangeCapture={e=>{const tag=(e.target as HTMLElement).tagName;if(tela==='formulario'&&(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'))setFormularioAlterado(true)}}><header><nav><span className="ergobax-modulo-marca"><img src="/ergobax_logo_transparente.png" alt="ERGOBAX — Plataforma de Inteligência Ergonômica"/><strong>Coleta Biomecânica</strong></span></nav></header><main><section style={{maxWidth:1120}}><p><Link href="/" onClick={e=>{if(tela==='formulario'&&!editandoId&&!window.confirm('Voltar ao painel? O rascunho será preservado apenas neste navegador.'))e.preventDefault()}}>← Voltar ao painel</Link></p><h1>Coleta de Dados Biomecânicos</h1><p style={{fontSize:13}}>Formulário de desenvolvimento. As avaliações são armazenadas no Supabase.</p>
 <div style={{background:"#eef7f4",border:"1px solid #b9d8cb",borderLeft:"4px solid #239b65",padding:"14px 18px",borderRadius:8,margin:"16px 0 22px",overflowWrap:"anywhere"}}><div style={{fontSize:13,color:"#315e54",fontWeight:700,marginBottom:5}}>EMPRESA EM ANÁLISE</div><div style={{fontSize:"clamp(16px,2vw,20px)",fontWeight:700,color:"#102c4a"}}>{clientes.find(c=>c.id===cliente)?.razao_social||"Nenhuma empresa selecionada"}</div></div>{erro&&<p role="alert" style={{color:'#b42318'}}>{erro}</p>}
<div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',margin:'16px 0'}}><strong>{tela==='lista'?'Avaliações biomecânicas':'Cadastro de avaliação'}</strong>{tela==='lista'?<button type="button" onClick={nova}>Nova avaliação</button>:<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" onClick={()=>{if(formularioAlterado&&!window.confirm('Descartar as alterações não salvas e voltar à lista?'))return;setFormularioAlterado(false);if(chaveRascunho)localStorage.removeItem(chaveRascunho);setTela('lista');if(chaveNavegacao)sessionStorage.removeItem(chaveNavegacao);void carregarAvaliacoes()}}>Voltar à lista</button><button type="button" disabled={salvando||situacao==='concluida'} onClick={()=>void salvar()}>{salvando?'Salvando...':'Salvar avaliação'}</button><button type="button" disabled={salvando||situacao==='concluida'} onClick={()=>void salvar('concluida')}>Concluir avaliação</button>{situacao==='concluida'&&<button type="button" disabled={salvando} onClick={()=>void salvar('reaberta')}>Reabrir avaliação</button>}</div>}</div>
 {mensagem&&<p role="status" style={{color:'#176b46'}}>{mensagem}</p>}
 {tela==='lista'?<div style={{display:'grid',gap:10}}>{avaliacoes.length===0?<p>Nenhuma avaliação cadastrada para esta empresa.</p>:avaliacoes.map(a=><article key={a.id} style={{border:'1px solid #d5dfeb',borderRadius:8,padding:14,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><strong>{a.titulo}</strong><div style={{fontSize:12,color:'#53657a'}}>{a.nivel==='posto'?'Posto':'Estação'} · {a.situacao} · {new Date(a.created_at).toLocaleDateString('pt-BR')}</div></div><button type="button" onClick={()=>editar(a)}>{a.situacao==='concluida'?'Consultar / Reabrir':'Editar'}</button></article>)}</div>:<>
 <label style={{display:'grid',gap:5,margin:'12px 0',maxWidth:650,fontWeight:600}}>Título da avaliação<input value={titulo} onChange={e=>setTitulo(e.target.value)} disabled={situacao==='concluida'} placeholder="Ex.: Avaliação biomecânica do posto administrativo"/></label>
 <div style={{display:'grid',gridTemplateColumns:'repeat(12,minmax(0,1fr))',gap:'12px 14px',alignItems:'end'}}>

 <div style={{gridColumn:'span 4',minWidth:0}}><label style={{display:'grid',gap:5,fontSize:13,fontWeight:600}}>Vincular a<select style={{width:'100%',minWidth:0,height:40,fontWeight:400}} value={nivel} onChange={e=>setNivel(e.target.value as 'posto'|'estacao')}><option value="posto">Posto de trabalho</option><option value="estacao">Estação de trabalho</option></select></label></div>
 </div>
 
 <div className="biomecanica-seletores" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'12px 14px',marginTop:12}}>
 {campo('Planta',planta,setPlanta,plantas,!cliente)}{campo('Instalação',instalacao,setInstalacao,instalacoes,!planta)}{campo('Posto',posto,setPosto,postos,!instalacao)}{nivel==='estacao'&&campo('Estação',estacao,setEstacao,estacoes,!posto)}
 </div>
 <style>{`@media(max-width:720px){.biomecanica-seletores{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:460px){.biomecanica-seletores{grid-template-columns:minmax(0,1fr)!important}}`}</style>
 <p style={{fontSize:12,color:'#53657a'}}>{selecionado?'Vínculo selecionado.':'Selecione um posto ou estação para identificar o local da coleta.'} Os dados preenchidos são gravados ao clicar em Salvar avaliação.</p>
 <div style={{display:'flex',gap:7,flexWrap:'wrap',margin:'16px 0'}}>{grupos.map(g=><button type="button" key={g} aria-pressed={grupo===g} onClick={()=>setGrupo(g)} style={{padding:'7px 10px',fontWeight:grupo===g?700:400}}>{g}</button>)}</div>
 {grupo==='Avaliação geral'?<div style={{display:'grid',gap:12}}>{([['observacoes','Observações gerais'],['comentario','Comentário técnico geral'],['plano','Plano de ação geral']] as const).map(([k,t])=><label key={k} style={{display:'grid',gap:5}}>{t}<textarea rows={3} value={geral[k]} onChange={e=>setGeral(p=>({...p,[k]:e.target.value}))}/></label>)}</div>:<div style={{border:'1px solid #d5dfeb',borderRadius:10,overflow:'hidden'}}>{fatores.filter(f=>f.grupo===grupo).map(f=>{const r=respostas[f.codigo]||inicial();return <div key={f.codigo} style={{padding:12,borderBottom:'1px solid #e3e9f0',display:'grid',gap:8}}><div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><strong style={{fontSize:13}}>{f.codigo} — {f.titulo}</strong><button type="button" onClick={()=>abrirRisco(f.codigo)} style={{fontSize:12,background:'#e7f3ec',color:'#14532d',border:'1px solid #a7d4b5',padding:'7px 12px',borderRadius:7}}>+ Registrar risco</button>{f.codigo==='B03'&&<button type="button" aria-expanded={detalheAberto} onClick={()=>setDetalheAberto(v=>!v)}>{detalheAberto?'Ocultar detalhes':`Detalhar B03 (${r.detalhes_b03?.length||0})`}</button>}<select aria-label={'Situação: '+f.titulo} value={r.situacao} onChange={e=>alterar(f.codigo,'situacao',e.target.value)}><option value="">Não avaliado</option><option value="sim">Situação identificada</option><option value="nao">Não identificada</option><option value="na">Não se aplica</option></select></div>{f.codigo==='B03'&&detalheAberto&&<ColetaDetalhadaB03 ocorrencias={r.detalhes_b03||[]} onChange={atualizarB03} somenteLeitura={situacao==='concluida'}/>}<label style={{display:'grid',gap:4,fontSize:12}}>Descrição técnica editável<textarea rows={2} value={r.descricao} onChange={e=>alterar(f.codigo,'descricao',e.target.value)} placeholder="Descreva a condição observada..."/></label><div><button type="button" onClick={()=>sugerir(f)} style={{fontSize:12}}>Usar texto sugerido</button><span style={{fontSize:11,marginLeft:8,color:'#53657a'}}>Confira se o texto corresponde à situação real.</span></div><details><summary style={{cursor:'pointer',fontSize:12}}>Observações, comentário técnico e plano de ação</summary><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginTop:8}}>{([['observacoes','Observações'],['comentario','Comentário técnico'],['plano','Plano de ação']] as const).map(([k,t])=><label key={k} style={{display:'grid',gap:4,fontSize:12}}>{t}<textarea rows={2} value={r[k]} onChange={e=>alterar(f.codigo,k,e.target.value)}/></label>)}</div></details></div>})}</div>}
 <p style={{fontSize:12,color:'#53657a'}}>A avaliação técnica e a caracterização da exposição dependem da análise da profissional responsável.</p>
 </>}
 </section></main></div>
}
