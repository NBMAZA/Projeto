'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
import {useClienteAtivo} from '../use-cliente-ativo';
type Item={id:string;nome:string};
type Nivel='cliente'|'planta'|'instalacao'|'posto'|'estacao';
type Medicao={id:string;tipo:'ruido'|'iluminacao_pontual'|'iluminacao_media'|'temperatura';resultado:string;observacoes:string};
type Ponto={id:string;nome:string;localizacao:string;observacoes:string;medicoes:Medicao[]};
const tipos={ruido:'Ruído — dB(A)',iluminacao_pontual:'Iluminação pontual — lux',iluminacao_media:'Iluminação média — lux',temperatura:'Temperatura — °C'};
const novaMedicao=():Medicao=>({id:crypto.randomUUID(),tipo:'ruido',resultado:'',observacoes:''});
const novoPonto=():Ponto=>({id:crypto.randomUUID(),nome:'',localizacao:'',observacoes:'',medicoes:[novaMedicao(),novaMedicao()]});
const quatroPontos=()=>Array.from({length:4},()=>novoPonto());
const pontoPreenchido=(p:Ponto)=>Boolean(p.nome.trim()||p.localizacao.trim()||p.observacoes.trim()||p.medicoes.some(m=>m.resultado.trim()||m.observacoes.trim()));
const pontosParaSalvar=(ps:Ponto[])=>ps.map(p=>({...p,medicoes:p.medicoes.filter(m=>m.resultado.trim()||m.observacoes.trim())}));
export default function CondicoesAmbientais(){
 const {clienteAtivo}=useClienteAtivo();
 const [clientes,setClientes]=useState<{id:string;razao_social:string}[]>([]);
 const [cliente,setCliente]=useState(''),[planta,setPlanta]=useState(''),[instalacao,setInstalacao]=useState(''),[posto,setPosto]=useState(''),[estacao,setEstacao]=useState('');
 const [plantas,setPlantas]=useState<Item[]>([]),[instalacoes,setInstalacoes]=useState<Item[]>([]),[postos,setPostos]=useState<Item[]>([]),[estacoes,setEstacoes]=useState<Item[]>([]);
 const [nivel,setNivel]=useState<Nivel>('cliente'),[data,setData]=useState(''),[titulo,setTitulo]=useState(''),[metodologia,setMetodologia]=useState(''),[conclusao,setConclusao]=useState('');
 const [pontos,setPontos]=useState<Ponto[]>(quatroPontos()),[pontoAtivo,setPontoAtivo]=useState(0),[erro,setErro]=useState('');
 const [mostrarExtras,setMostrarExtras]=useState(false);
 useEffect(()=>{setMostrarExtras(false)},[pontoAtivo]);
 const [empresaAtiva,setEmpresaAtiva]=useState(false);
 const [consultoriaId,setConsultoriaId]=useState(''),[salvando,setSalvando]=useState(false),[mensagem,setMensagem]=useState('');
 const [avaliacoes,setAvaliacoes]=useState<{id:string;titulo:string;data_coleta:string|null;nivel:string;created_at:string;situacao:string;estado_vigencia:string}[]>([]);
 const [tela,setTela]=useState<'lista'|'formulario'>('lista'),[busca,setBusca]=useState(''),[pagina,setPagina]=useState(0),[total,setTotal]=useState(0),[carregandoLista,setCarregandoLista]=useState(false);
 const [filtroNivel,setFiltroNivel]=useState(''),[filtroData,setFiltroData]=useState('');
 const [nivelSelecionado,setNivelSelecionado]=useState<Nivel>('cliente');
 const estruturaSelecionada=nivelSelecionado==='cliente'?cliente:nivelSelecionado==='planta'?planta:nivelSelecionado==='instalacao'?instalacao:nivelSelecionado==='posto'?posto:estacao;
 const [seletorRiscoAberto,setSeletorRiscoAberto]=useState(false),[riscoTitulo,setRiscoTitulo]=useState(''),[riscoGrupo,setRiscoGrupo]=useState(''),[riscoObservacoes,setRiscoObservacoes]=useState(''),[riscoNivel,setRiscoNivel]=useState<Nivel>('cliente'),[riscoEstrutura,setRiscoEstrutura]=useState(''),[criandoRisco,setCriandoRisco]=useState(false);
 const [erroRisco,setErroRisco]=useState('');
 const [estruturasRisco,setEstruturasRisco]=useState<Record<'planta'|'instalacao'|'posto'|'estacao',Item[]>>({planta:[],instalacao:[],posto:[],estacao:[]});
 const [situacao,setSituacao]=useState<'rascunho'|'concluida'|'reaberta'>('rascunho'),[riscos,setRiscos]=useState<{id:string;titulo:string}[]>([]),[riscosSelecionados,setRiscosSelecionados]=useState<string[]>([]);
 const [editandoId,setEditandoId]=useState<string|null>(null),[estruturaOriginal,setEstruturaOriginal]=useState<string|null>(null);

 type RiscoPonto={id:string;titulo:string;observacoes:string;classificacao:string;status:string;perfil_exposicao:string;medidas_existentes:string;medidas_recomendadas:string;plano_acao:string;responsavel_acao:string;conclusao_tecnica:string};
 const [riscoInline,setRiscoInline]=useState<RiscoPonto|null>(null),[riscosPonto,setRiscosPonto]=useState<{id:string;titulo:string;classificacao:string;status:string}[]>([]),[versaoRiscosPonto,setVersaoRiscosPonto]=useState(0),[salvandoRiscoPonto,setSalvandoRiscoPonto]=useState(false);
 useEffect(()=>{setRiscoInline(null)},[pontoAtivo,editandoId]);
 useEffect(()=>{if(!editandoId||!cliente||tela!=='formulario'){setRiscosPonto([]);return}let ativo=true;supabase().from('riscos_identificados').select('id,titulo,classificacao,status').eq('cliente_id',cliente).eq('avaliacao_ambiental_id',editandoId).eq('ponto_ambiental_ordem',pontoAtivo).order('created_at',{ascending:false}).then(({data,error})=>{if(ativo){if(error)setErro(error.message);else setRiscosPonto(data||[])}});return()=>{ativo=false}},[editandoId,cliente,pontoAtivo,versaoRiscosPonto,tela]);
 async function abrirRiscoPonto(id?:string){if(bloqueada||!editandoId){setErro('Salve a avaliação em elaboração antes de adicionar riscos.');return}setErro('');if(!id){setRiscoInline({id:'',titulo:pontos[pontoAtivo]?.nome||'Risco ambiental',observacoes:'',classificacao:'nao_classificado',status:'aberto',perfil_exposicao:'',medidas_existentes:'',medidas_recomendadas:'',plano_acao:'',responsavel_acao:'',conclusao_tecnica:''});return}const {data,error}=await supabase().from('riscos_identificados').select('id,titulo,observacoes,classificacao,status,perfil_exposicao,medidas_existentes,medidas_recomendadas,plano_acao,responsavel_acao,conclusao_tecnica').eq('id',id).eq('cliente_id',cliente).eq('avaliacao_ambiental_id',editandoId).eq('ponto_ambiental_ordem',pontoAtivo).maybeSingle();if(error||!data){setErro(error?.message||'Risco não encontrado.');return}setRiscoInline({id:data.id,titulo:data.titulo,observacoes:data.observacoes||'',classificacao:data.classificacao||'nao_classificado',status:data.status||'aberto',perfil_exposicao:data.perfil_exposicao||'',medidas_existentes:data.medidas_existentes||'',medidas_recomendadas:data.medidas_recomendadas||'',plano_acao:data.plano_acao||'',responsavel_acao:data.responsavel_acao||'',conclusao_tecnica:data.conclusao_tecnica||''})}
 async function salvarRiscoPonto(){if(bloqueada||!editandoId||!riscoInline||!cliente)return;if(!riscoInline.titulo.trim()){setErro('Informe o título do risco.');return}setSalvandoRiscoPonto(true);setErro('');const {id,...campos}=riscoInline;const payload={...campos,titulo:campos.titulo.trim()};const q=id?supabase().from('riscos_identificados').update(payload).eq('id',id).eq('cliente_id',cliente).eq('avaliacao_ambiental_id',editandoId).eq('ponto_ambiental_ordem',pontoAtivo):supabase().from('riscos_identificados').insert({...payload,cliente_id:cliente,nivel,estrutura_id:estruturaOriginal,origem:'outra',avaliacao_ambiental_id:editandoId,ponto_ambiental_ordem:pontoAtivo,criterio_codigo:'P'+String(pontoAtivo+1).padStart(2,'0'),grupo_risco:'Ergonômicos'}).select('id,titulo').single();const {data,error}=await q;setSalvandoRiscoPonto(false);if(error){setErro(error.message);return}if(!id&&data){setRiscos(a=>[...a,data]);setRiscosSelecionados(a=>a.includes(data.id)?a:[...a,data.id])}setRiscoInline(null);setVersaoRiscosPonto(v=>v+1);setMensagem('Risco salvo e vinculado ao ponto de coleta.')}
 const [estadoVigencia,setEstadoVigencia]=useState('em_elaboracao');
 const bloqueada=!!editandoId&&estadoVigencia!=='em_elaboracao';
 const nomeEstado=(v:string)=>({em_elaboracao:'Em elaboração',concluida:'Concluída',vigente:'Vigente',historica:'Histórica',cancelada:'Cancelada'} as Record<string,string>)[v]||v;
 const chaveNavegacao=cliente&&consultoriaId?`ergobax:ambiental:navegacao:${consultoriaId}:${cliente}`:'';
 const [formularioAlterado,setFormularioAlterado]=useState(false);
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

   }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Não foi possível carregar as empresas.')}
  })();
  return()=>{ativo=false};
 },[]);
 useEffect(()=>{const valido=clientes.some(c=>c.id===clienteAtivo)?clienteAtivo:'';if(cliente!==valido){setCliente(valido);setNivelSelecionado('cliente');setPagina(0);setEmpresaAtiva(!!valido);setTela('lista');setEditandoId(null);setMensagem('');setErro('')}},[clienteAtivo,clientes,cliente]);
 useEffect(()=>{setPlanta('');setPlantas([]);if(cliente)supabase().from('plantas').select('id,nome').eq('cliente_id',cliente).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPlantas(data||[])})},[cliente]);
 useEffect(()=>{setInstalacao('');setInstalacoes([]);if(planta)supabase().from('instalacoes').select('id,nome').eq('planta_id',planta).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setInstalacoes(data||[])})},[planta]);
 useEffect(()=>{setPosto('');setPostos([]);if(instalacao)supabase().from('postos_trabalho').select('id,nome').eq('instalacao_id',instalacao).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPostos(data||[])})},[instalacao]);
 useEffect(()=>{setEstacao('');setEstacoes([]);if(posto)supabase().from('estacoes_trabalho').select('id,nome').eq('posto_id',posto).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setEstacoes(data||[])})},[posto]);
 useEffect(()=>{
  if(!consultoriaId||!cliente||!estruturaSelecionada){setAvaliacoes([]);setTotal(0);return}
  let ativo=true;
  (async()=>{
   setCarregandoLista(true);
   let q=supabase().from('avaliacoes_ambientais').select('id,titulo,data_coleta,nivel,created_at,situacao,estado_vigencia',{count:'exact'}).eq('consultoria_id',consultoriaId).eq('cliente_id',cliente).eq('nivel',nivelSelecionado);
   q=nivelSelecionado==='cliente'?q.is('estrutura_id',null):q.eq('estrutura_id',estruturaSelecionada);
   if(busca.trim())q=q.ilike('titulo','%'+busca.trim().replace(/[%_,]/g,'')+'%');
   if(filtroNivel)q=q.eq('nivel',filtroNivel);
   if(filtroData)q=q.eq('data_coleta',filtroData);
   const {data,error,count}=await q.order('created_at',{ascending:false}).range(pagina*20,pagina*20+19);
   if(ativo){if(error)setErro(error.message);else{setAvaliacoes(data||[]);setTotal(count||0)}setCarregandoLista(false)}
  })();
  return()=>{ativo=false};
 },[consultoriaId,cliente,nivelSelecionado,estruturaSelecionada,busca,pagina,filtroNivel,filtroData,tela]);
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
  if(!estruturaSelecionada){setErro('Selecione a estrutura física antes de criar a avaliação.');return}
  setEditandoId(null);setEstruturaOriginal(null);setSituacao('rascunho');setEstadoVigencia('em_elaboracao');setRiscosSelecionados([]);setSeletorRiscoAberto(false);setRiscoTitulo('');
  setTitulo('');setData('');setNivel(nivelSelecionado);
  setMetodologia('');setConclusao('');setCriterios({ruido:'',iluminacao_pontual:'',iluminacao_media:'',temperatura:''});
  setPontos(quatroPontos());setPontoAtivo(0);setFormularioAlterado(false);setErro('');setMensagem('');setTela('formulario');
 }
 async function incluirRisco(){if(bloqueada){setErroRisco('Avaliação concluída: edição bloqueada.');return}
  setErroRisco('');
  if(!editandoId){setErroRisco('Salve a avaliação ambiental antes de incluir um risco.');return}
  if(!riscoTitulo.trim()){setErroRisco('Informe o título do risco.');return}
  const nivelVinculo=nivel;
  const estruturaVinculo=editandoId?estruturaOriginal:(nivel==='cliente'?null:nivel==='planta'?planta:nivel==='instalacao'?instalacao:nivel==='posto'?posto:estacao);
  if(nivelVinculo!=='cliente'&&!estruturaVinculo){setErroRisco('A avaliação não possui um ambiente definido. Salve uma avaliação com ambiente válido antes de incluir o risco.');return}
  setCriandoRisco(true);
  const db=supabase();
  let novoId='';
  try{
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError)throw authError;
   if(!user)throw new Error('Sessão expirada.');
   const {data:novo,error:ie}=await db.from('riscos_identificados').insert({cliente_id:cliente,nivel:nivelVinculo,estrutura_id:estruturaVinculo,origem:'outra',titulo:riscoTitulo.trim(),grupo_risco:riscoGrupo.trim()||null,observacoes:riscoObservacoes.trim()||null,criado_por:user.id}).select('id,titulo').single();
   if(ie)throw ie;novoId=novo.id;
   const {error:ve}=await db.from('avaliacoes_ambientais_riscos').insert({avaliacao_id:editandoId,risco_id:novo.id});
   if(ve)throw ve;
   setRiscos(a=>[...a,novo]);setRiscosSelecionados(a=>[...a,novo.id]);setSeletorRiscoAberto(false);setRiscoTitulo('');setRiscoGrupo('');setRiscoObservacoes('');
   setMensagem('Risco cadastrado e vinculado à avaliação.');
  }catch(e){
   if(novoId)await db.from('riscos_identificados').delete().eq('id',novoId).eq('cliente_id',cliente);
   const falha=e as {message?:string;details?:string;hint?:string;code?:string}|null;
   const detalhe=[falha?.message,falha?.details,falha?.hint].filter(Boolean).join(' — ');
   setErroRisco(detalhe?('Não foi possível incluir o risco: '+detalhe+(falha?.code?' (código '+falha.code+')':'')):'Não foi possível incluir o risco. Verifique os dados e tente novamente.');
  }finally{setCriandoRisco(false)}
 }
 async function salvarVinculos(id:string){if(bloqueada)throw new Error('Avaliação concluída: vínculos bloqueados.');
  const db=supabase();
  const {data:atuais,error:le}=await db.from('avaliacoes_ambientais_riscos').select('risco_id').eq('avaliacao_id',id);
  if(le)throw le;
  const existentes=(atuais||[]).map(v=>v.risco_id);
  const incluir=riscosSelecionados.filter(x=>!existentes.includes(x));
  const excluir=existentes.filter(x=>!riscosSelecionados.includes(x));
  if(incluir.length){const {error}=await db.from('avaliacoes_ambientais_riscos').insert(incluir.map(risco_id=>({avaliacao_id:id,risco_id})));if(error)throw error}
  if(excluir.length){const {error}=await db.from('avaliacoes_ambientais_riscos').delete().eq('avaliacao_id',id).in('risco_id',excluir);if(error)throw error}
 }
 async function mudarSituacao(acao:'concluir'|'vigente',id?:string){
  const alvo=id||editandoId;if(!alvo)return;
  if(formularioAlterado&&tela==='formulario'){setErro('Salve as alterações antes de continuar.');return}
  if(!window.confirm(acao==='concluir'?'Concluir esta avaliação? Os campos serão bloqueados para edição.':'Definir esta avaliação como vigente e arquivar a vigente anterior?'))return;
  setSalvando(true);setErro('');setMensagem('');
  const {error}=await supabase().rpc('alterar_vigencia_ambiental',{p_avaliacao_id:alvo,p_acao:acao});
  setSalvando(false);
  if(error){setErro(error.message);return}
  const novo=acao==='concluir'?'concluida':'vigente';
  if(editandoId===alvo){setEstadoVigencia(novo);if(acao==='concluir')setSituacao('concluida')}
  setAvaliacoes(prev=>prev.map(a=>({...a,estado_vigencia:a.id===alvo?novo:acao==='vigente'&&a.estado_vigencia==='vigente'?'historica':a.estado_vigencia})));
  setMensagem(acao==='concluir'?'Avaliação concluída com sucesso. Edição bloqueada.':'Avaliação definida como vigente com sucesso.');
 }
 async function salvar(){if(bloqueada){setErro('Avaliação concluída: edição bloqueada.');return}
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
    const {error:atualizarErro}=await db.rpc('atualizar_avaliacao_ambiental',{p_id:editandoId,p_cliente_id:cliente,p_titulo:titulo.trim(),p_data_coleta:data||null,p_criterios:criterios,p_metodologia:metodologia,p_conclusao:conclusao,p_pontos:pontosParaSalvar(pontos).map(p=>({nome:p.nome,localizacao:p.localizacao,observacoes:p.observacoes,medicoes:p.medicoes.map(m=>({tipo:m.tipo,resultado:m.resultado,observacoes:m.observacoes}))}))});
    if(atualizarErro)throw atualizarErro;
    await salvarVinculos(editandoId);
    setPagina(0);if(chaveNavegacao)sessionStorage.removeItem(chaveNavegacao);setTela('lista');setMensagem('Alterações salvas na avaliação original.');
    return;
   }
   const {data:av,error:avErro}=await db.from('avaliacoes_ambientais').insert({situacao:'rascunho',consultoria_id:consultoriaId,cliente_id:cliente,nivel,estrutura_id:estruturaId,titulo:titulo.trim(),data_coleta:data||null,criterios,metodologia,conclusao,criado_por:user.id}).select('id').single();
   if(avErro)throw avErro;
   avaliacaoId=av.id;
   const pontosValidos=pontosParaSalvar(pontos);
   for(let i=0;i<pontosValidos.length;i++){
    const p=pontosValidos[i];
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
   const falha=e as {message?:string;details?:string;hint?:string;code?:string}|null;const detalhe=[falha?.message,falha?.details,falha?.hint].filter(Boolean).join(' — ');setErro(detalhe?('Não foi possível salvar a avaliação: '+detalhe+(falha?.code?' (código '+falha.code+')':'')):'Não foi possível salvar a avaliação. Consulte o erro técnico no navegador.');
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
  setEditandoId(av.id);setEstadoVigencia(av.estado_vigencia||'em_elaboracao');setEstruturaOriginal(av.estrutura_id||null);setSituacao(av.situacao||'rascunho');
  const {data:vinculos,error:ve}=await db.from('avaliacoes_ambientais_riscos').select('risco_id').eq('avaliacao_id',id);
  if(ve){setErro(ve.message);return}setRiscosSelecionados((vinculos||[]).map(v=>v.risco_id));
  setTitulo(av.titulo);setData(av.data_coleta||'');setNivel(av.nivel as Nivel);
  setCriterios({ruido:'',iluminacao_pontual:'',iluminacao_media:'',temperatura:'',...(av.criterios||{})});
  setMetodologia(av.metodologia||'');setConclusao(av.conclusao||'');
  const pontosExistentes=(pts||[]).map(p=>{const medicoes=(ms||[]).filter(m=>m.ponto_id===p.id).map(m=>({id:crypto.randomUUID(),tipo:m.tipo,resultado:m.resultado,observacoes:m.observacoes}));return {id:crypto.randomUUID(),nome:p.nome,localizacao:p.localizacao,observacoes:p.observacoes,medicoes:[...medicoes,...Array.from({length:Math.max(0,2-medicoes.length)},()=>novaMedicao())]}});
  setPontos([...pontosExistentes,...Array.from({length:Math.max(0,4-pontosExistentes.length)},()=>novoPonto())]);setPontoAtivo(0);
  setTela('formulario');setFormularioAlterado(false);
  if(chaveNavegacao)sessionStorage.setItem(chaveNavegacao,id);
  setMensagem(av.estado_vigencia==='em_elaboracao'?'Avaliação carregada para edição.':'Avaliação carregada somente para consulta.');
 }

 const selecao=(nome:string,valor:string,alterar:(s:string)=>void,itens:Item[],disabled=false)=><label>{nome}<select value={valor} onChange={e=>alterar(e.target.value)} disabled={disabled}><option value="">Selecione</option>{itens.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label>;
 const mudarPonto=(id:string,campo:'nome'|'localizacao'|'observacoes',valor:string)=>setPontos(ps=>ps.map(p=>p.id===id?{...p,[campo]:valor}:p));
 const mudarMedicao=(pid:string,mid:string,campo:keyof Omit<Medicao,'id'>,valor:string)=>setPontos(ps=>ps.map(p=>p.id===pid?{...p,medicoes:p.medicoes.map(m=>m.id===mid?{...m,[campo]:valor}:m)}:p));
 return <div className="ergobax-gestao-page" onChangeCapture={e=>{const tag=(e.target as HTMLElement).tagName;if(tela==='formulario'&&!bloqueada&&(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'))setFormularioAlterado(true)}}><header><nav><span className="ergobax-modulo-marca"><img src="/ergobax_logo_transparente.png" alt="ERGOBAX — Plataforma de Inteligência Ergonômica"/><strong>Condições Ambientais</strong></span></nav></header><main><section style={{maxWidth:1100}}>
 <p><Link href="/">← Voltar ao painel</Link></p><h1>Condições Ambientais</h1>
 <p style={{color:'#53657a'}}>Avaliações ambientais da Empresa Ativa. Consulte os registros ou inicie uma nova coleta.</p>
 <div style={{background:"#eef7f4",border:"1px solid #b9d8cb",borderLeft:"4px solid #239b65",padding:"14px 18px",borderRadius:8,margin:"16px 0 22px",overflowWrap:"anywhere"}}><div style={{fontSize:13,color:"#315e54",fontWeight:700,marginBottom:5}}>EMPRESA EM ANÁLISE</div><div style={{fontSize:"clamp(16px,2vw,20px)",fontWeight:700,color:"#102c4a",lineHeight:1.45}}>{clientes.find(c=>c.id===cliente)?.razao_social||"Nenhuma empresa selecionada"}</div></div>
 {erro&&<p role="alert" style={{color:'#b42318'}}>{erro}</p>}
 {mensagem&&<p role="status" style={{color:'#166534'}}>{mensagem}</p>}
 {tela==='lista'?<div>
 <div style={{borderLeft:'4px solid #239b65',paddingLeft:12,marginTop:8}}><h2 style={{fontSize:19,margin:'0 0 6px'}}>Selecionar estrutura física</h2><p style={{fontSize:13,margin:0}}>Selecione a planta, instalação e posto; informe a estação quando aplicável. Para avaliações gerais, escolha o nível correspondente. O histórico pertence à estrutura selecionada.</p></div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))',gap:8,margin:'12px 0 14px'}}>
 {nivelSelecionado!=='cliente'&&selecao('Planta',planta,v=>{setPlanta(v);setPagina(0)},plantas,!cliente)}
 {['instalacao','posto','estacao'].includes(nivelSelecionado)&&selecao('Instalação',instalacao,v=>{setInstalacao(v);setPagina(0)},instalacoes,!planta)}
 {['posto','estacao'].includes(nivelSelecionado)&&selecao('Posto de trabalho',posto,v=>{setPosto(v);setPagina(0)},postos,!instalacao)}
 <label style={{display:'grid',gap:6,minWidth:0,fontWeight:600,fontSize:13}}>Nível da avaliação<select style={{width:'100%',minWidth:0,padding:'9px 10px',border:'1px solid #cbd5e1',borderRadius:8,boxSizing:'border-box'}} value={nivelSelecionado} onChange={e=>{setNivelSelecionado(e.target.value as Nivel);setPagina(0)}}><option value="cliente">Cliente (avaliação geral)</option><option value="planta">Planta</option><option value="instalacao">Instalação</option><option value="posto">Posto de trabalho</option><option value="estacao">Estação de trabalho</option></select></label>
 {nivelSelecionado==='estacao'&&selecao('Estação de trabalho',estacao,v=>{setEstacao(v);setPagina(0)},estacoes,!posto)}
 </div>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><h2>Avaliações da estrutura selecionada</h2><button type="button" disabled={!cliente||!estruturaSelecionada} onClick={novaAvaliacao}>+ Nova avaliação</button></div>
 <div className="ambiental-grid">
 <label>Pesquisar por título<input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(0)}} placeholder="Digite o título da avaliação"/></label>

 <label>Data da coleta<input type="date" value={filtroData} onChange={e=>{setFiltroData(e.target.value);setPagina(0)}}/></label>
 </div>
 {!cliente?<p>Selecione uma Empresa Ativa no painel para consultar as avaliações.</p>:!estruturaSelecionada?<p>Selecione a estrutura para consultar suas avaliações.</p>:carregandoLista?<p>Carregando avaliações...</p>:avaliacoes.length===0?<p>Nenhuma avaliação encontrada para os filtros selecionados.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left'}}>Avaliação</th><th style={{textAlign:'left'}}>Data</th><th style={{textAlign:'left'}}>Nível</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{avaliacoes.map(a=><tr key={a.id} style={{borderTop:'1px solid #e2e8f0'}}><td style={{padding:'12px 6px'}}>{a.titulo}</td><td>{a.data_coleta||'—'}</td><td>{a.nivel}</td><td>{nomeEstado(a.estado_vigencia)}</td><td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button type="button" onClick={()=>carregarAvaliacao(a.id)}>{a.estado_vigencia==='em_elaboracao'?'Editar':'Consultar'}</button>{a.estado_vigencia==='em_elaboracao'&&<button type="button" disabled={salvando} onClick={()=>mudarSituacao('concluir',a.id)}>Concluir avaliação</button>}{a.estado_vigencia==='concluida'&&<button type="button" disabled={salvando} onClick={()=>mudarSituacao('vigente',a.id)}>Definir vigente</button>}</div></td></tr>)}</tbody></table></div>}
 <div style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}><button type="button" disabled={pagina===0||carregandoLista} onClick={()=>setPagina(p=>p-1)}>Anterior</button><span>Página {pagina+1} de {Math.max(1,Math.ceil(total/20))} — {total} avaliações</span><button type="button" disabled={(pagina+1)*20>=total||carregandoLista} onClick={()=>setPagina(p=>p+1)}>Próxima</button></div>
 </div>:<>
 <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><button type="button" onClick={()=>{if(formularioAlterado&&!window.confirm('Descartar as alterações não salvas e voltar à lista?'))return;if(chaveNavegacao)sessionStorage.removeItem(chaveNavegacao);setFormularioAlterado(false);setTela('lista');setErro('');setMensagem('')}}>← Voltar à lista</button><button type="button" onClick={salvar} disabled={salvando||!consultoriaId||bloqueada}>{salvando?'Salvando...':editandoId?'Salvar alterações':'Salvar avaliação'}</button><span style={{fontSize:12,color:'#53657a'}}>{editandoId?'Edição do registro existente. A estrutura vinculada permanece inalterada.':'Nova avaliação ambiental.'}</span></div>
 {editandoId&&<div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><strong>Situação: {nomeEstado(estadoVigencia)}</strong>{estadoVigencia==='em_elaboracao'&&<button type="button" disabled={salvando} onClick={()=>mudarSituacao('concluir')}>Concluir avaliação</button>}{estadoVigencia==='concluida'&&<button type="button" disabled={salvando} onClick={()=>mudarSituacao('vigente')}>Definir vigente</button>}</div>}
 {bloqueada&&<p style={{background:'#eef3f8',padding:12,borderRadius:8,fontWeight:700}}>Avaliação {nomeEstado(estadoVigencia)} — somente consulta. Para alterar informações, crie uma nova avaliação.</p>}
 <fieldset disabled={bloqueada} style={{border:0,padding:0,minWidth:0}}>

 <h2>Identificação da avaliação</h2>
 <div className="ambiental-grid">
 <label>Título da avaliação<input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex.: Avaliação ambiental do escritório"/></label>
 <label>Data da coleta<input type="date" value={data} onChange={e=>setData(e.target.value)}/></label>
 
 <label>Vincular a<select value={nivel} disabled onChange={e=>setNivel(e.target.value as Nivel)}>{([['cliente','Cliente'],['planta','Planta'],['instalacao','Instalação'],['posto','Posto de trabalho'],['estacao','Estação de trabalho']] as const).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 {editandoId&&<div style={{padding:'12px 14px',border:'1px solid #cbd5e1',borderRadius:8,background:'#f8fafc',marginBottom:12}}><strong>Ambiente vinculado à avaliação</strong><p style={{margin:'6px 0 0'}}>{nivel==='cliente'?clientes.find(c=>c.id===cliente)?.razao_social||'Empresa Ativa':(estruturasRisco[nivel].find(x=>x.id===estruturaOriginal)?.nome||'Carregando identificação do ambiente...')}</p><small style={{color:'#53657a'}}>Vínculo preservado e não editável nesta avaliação.</small></div>}
 {!editandoId&&nivel!=='cliente'&&selecao('Planta',planta,setPlanta,plantas,true)}
 {!editandoId&&['instalacao','posto','estacao'].includes(nivel)&&selecao('Instalação',instalacao,setInstalacao,instalacoes,true)}
 {!editandoId&&['posto','estacao'].includes(nivel)&&selecao('Posto',posto,setPosto,postos,true)}
 {!editandoId&&nivel==='estacao'&&selecao('Estação',estacao,setEstacao,estacoes,true)}
 </div>
 {empresaAtiva&&<p style={{fontSize:12,color:'#53657a',margin:'8px 0'}}>Empresa herdada do Painel da Consultoria. Para alterar, volte ao painel e selecione outra empresa.</p>}
 <h2>Critérios de referência</h2>
 <p style={{color:'#53657a',fontSize:13}}>Informe uma vez o critério aplicável a cada tipo de medição. Os critérios serão utilizados como referência nos pontos de coleta desta avaliação.</p>
 <div className="ambiental-grid">{(Object.entries(tipos) as [Medicao['tipo'],string][]).map(([tipo,nome])=><label key={tipo}>{nome}<input value={criterios[tipo]} onChange={e=>setCriterios(atual=>({...atual,[tipo]:e.target.value}))} placeholder="Ex.: norma, limite ou critério aplicável"/></label>)}</div>
 <h2>Pontos de coleta</h2>
 <p style={{fontSize:13,color:'#53657a'}}>Quatro pontos fixos, de preenchimento opcional. Selecione o ponto na lateral para registrar as medições. Pontos antigos adicionais continuam preservados.</p>
 <div className="ambiental-pontos-layout">
 <nav className="ambiental-pontos-menu" aria-label="Pontos de coleta">
 {pontos.map((p,i)=><button key={p.id} type="button" className={'ambiental-ponto-aba'+(pontoAtivo===i?' ativo':'')} onClick={()=>setPontoAtivo(i)} aria-current={pontoAtivo===i?'step':undefined}><strong>Ponto {String(i+1).padStart(2,'0')}</strong><span>{i>=4?'Registro anterior':pontoPreenchido(p)?'Preenchido':'Não preenchido'}</span></button>)}
 </nav>
 <div className="ambiental-ponto-conteudo">
 {pontos.map((p,i)=>pontoAtivo===i?<section key={p.id} style={{margin:0}}>
 <h3 style={{marginTop:0}}>Ponto {String(i+1).padStart(2,'0')}{i>=4?' — registro anterior':''}</h3>
 <div className="ambiental-grid"><label>Identificação<input value={p.nome} onChange={e=>mudarPonto(p.id,'nome',e.target.value)} placeholder="Ex.: Recepção"/></label><label>Localização<input value={p.localizacao} onChange={e=>mudarPonto(p.id,'localizacao',e.target.value)} placeholder="Ex.: Próximo à janela"/></label></div>
 <label>Observações do ponto<textarea rows={2} value={p.observacoes} onChange={e=>mudarPonto(p.id,'observacoes',e.target.value)}/></label>
 <h4>Medições — 01 e 02</h4><p style={{fontSize:12,color:'#53657a'}}>Duas medições principais por ponto. Medições adicionais sob demanda.</p>
 {p.medicoes.map((m,j)=><div key={m.id} style={{border:'1px solid #cbd5e1',borderRadius:10,padding:'14px 16px',margin:'12px 0',background:j%2===0?'#f8fafc':'#f1f7fa',boxShadow:'0 1px 2px rgba(15,23,42,.05)',display:j<2||mostrarExtras?'block':'none'}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:9,borderBottom:'1px solid #dbe4ed'}}><span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#0b2a4a',color:'#fff',borderRadius:6,minWidth:30,height:28,fontSize:13,fontWeight:700}}>{String(j+1).padStart(2,'0')}</span><strong style={{fontSize:14,color:'#0b2a4a'}}>Medição {String(j+1).padStart(2,'0')}{j>=2?' — adicional':''}</strong></div>
 <div className="ambiental-grid">
 <label>Tipo de medição<select value={m.tipo} onChange={e=>mudarMedicao(p.id,m.id,'tipo',e.target.value)}>{Object.entries(tipos).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label>Resultado<input value={m.resultado} onChange={e=>mudarMedicao(p.id,m.id,'resultado',e.target.value)} placeholder="Valor medido"/></label>
 </div>
 <label>Observações da medição<textarea rows={2} value={m.observacoes} onChange={e=>mudarMedicao(p.id,m.id,'observacoes',e.target.value)}/></label>
 <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:10}}>
 {j>=2&&<button type="button" disabled={bloqueada} onClick={()=>setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:x.medicoes.filter(y=>y.id!==m.id)}:x))}>Excluir medição adicional</button>}
 </div>
 </div>)}
 <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',margin:'12px 0'}}><button type="button" disabled={bloqueada} onClick={()=>{setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:[...x.medicoes,novaMedicao()]}:x));setMostrarExtras(true)}}>+ Adicionar medição adicional</button>{p.medicoes.length>2&&<button type="button" onClick={()=>setMostrarExtras(v=>!v)}>{mostrarExtras?'Ocultar':'Mostrar'} {p.medicoes.length-2} medição(ões) adicional(is)</button>}</div>
 <div style={{marginTop:14,padding:12,background:'#f1f7fa',border:'1px solid #cbd5e1',borderRadius:8}}><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>Riscos deste ponto ({riscosPonto.length})</strong><button type="button" disabled={bloqueada||!editandoId} onClick={()=>abrirRiscoPonto()}>+ Adicionar Risco</button></div>{!editandoId&&<p style={{fontSize:12}}>Salve primeiro a avaliação para cadastrar riscos neste ponto.</p>}{riscoInline&&<div style={{display:'grid',gap:8,background:'white',padding:12,marginTop:10,border:'1px solid #94a3b8',borderRadius:8}}><strong>{riscoInline.id?'Editar risco':'Novo risco'} — Ponto {String(i+1).padStart(2,'0')}</strong>{([['titulo','Título'],['observacoes','Observações'],['perfil_exposicao','Perfil de exposição'],['conclusao_tecnica','Conclusão técnica'],['medidas_existentes','Medidas existentes'],['medidas_recomendadas','Medidas recomendadas'],['plano_acao','Plano de ação'],['responsavel_acao','Responsável']] as const).map(([k,label])=><label key={k} style={{display:'grid',gap:4}}>{label}<textarea rows={k==='titulo'?1:2} value={riscoInline[k]} onChange={e=>setRiscoInline(v=>v?{...v,[k]:e.target.value}:v)}/></label>)}<label>Classificação<select value={riscoInline.classificacao} onChange={e=>setRiscoInline(v=>v?{...v,classificacao:e.target.value}:v)}><option value="nao_classificado">Não classificado</option><option value="baixo">Baixo</option><option value="moderado">Moderado</option><option value="alto">Alto</option><option value="critico">Crítico</option></select></label><label>Situação<select value={riscoInline.status} onChange={e=>setRiscoInline(v=>v?{...v,status:e.target.value}:v)}><option value="aberto">Aberto</option><option value="em_tratamento">Em tratamento</option><option value="controlado">Controlado</option><option value="encerrado">Encerrado</option></select></label><div style={{display:'flex',gap:8}}><button type="button" disabled={salvandoRiscoPonto} onClick={salvarRiscoPonto}>{salvandoRiscoPonto?'Salvando...':'Salvar risco'}</button><button type="button" disabled={salvandoRiscoPonto} onClick={()=>setRiscoInline(null)}>Cancelar</button></div></div>}{riscosPonto.length===0?<p style={{fontSize:12}}>Nenhum risco cadastrado neste ponto.</p>:<div style={{display:'grid',gap:6,marginTop:8}}>{riscosPonto.map(ri=><div key={ri.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:8,background:'white',borderRadius:7}}><span><strong>{ri.titulo}</strong> · {ri.classificacao} · {ri.status}</span><button type="button" disabled={bloqueada} onClick={()=>abrirRiscoPonto(ri.id)}>Editar risco</button></div>)}</div>}</div>

 
 </section>:null)}
 </div></div>
 <h2>Riscos gerais já vinculados</h2>
 <p style={{fontSize:13,color:'#53657a'}}>Os riscos existentes sem ponto específico permanecem preservados. Para novos riscos, utilize “+ Adicionar Risco” dentro do ponto de coleta correspondente.</p>
 <div style={{marginBottom:12,fontSize:12,color:'#53657a'}}>{riscosSelecionados.length} risco(s) geral(is) vinculado(s)</div>
 {!editandoId&&<p style={{fontSize:12,color:'#53657a'}}>Salve primeiro a avaliação ambiental para incluir riscos.</p>}
 {riscosSelecionados.length===0?<p>Nenhum risco vinculado a esta avaliação.</p>:<div style={{display:'grid',gap:8,marginBottom:16}}>{riscosSelecionados.map(id=>{const risco=riscos.find(r=>r.id===id);return <div key={id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,border:'1px solid #cbd5e1',padding:10,borderRadius:8}}><span>{risco?.titulo||'Risco cadastrado'}</span><button type="button" disabled={situacao==='concluida'} onClick={()=>setRiscosSelecionados(a=>a.filter(x=>x!==id))}>Remover vínculo</button></div>})}</div>}
 {seletorRiscoAberto&&<div role="presentation" style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',display:'flex',justifyContent:'center',alignItems:'center',padding:16,zIndex:1000}} onClick={()=>!criandoRisco&&setSeletorRiscoAberto(false)}>
 <div role="dialog" aria-modal="true" aria-label="Incluir novo risco" onClick={e=>e.stopPropagation()} style={{background:'#fff',color:'#0f172a',borderRadius:12,padding:20,width:'100%',maxWidth:640,maxHeight:'80vh',overflowY:'auto'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h3>Incluir novo risco</h3><button type="button" disabled={criandoRisco} onClick={()=>setSeletorRiscoAberto(false)}>Fechar</button></div>
 {erroRisco&&<p role="alert" style={{background:'#fef2f2',color:'#991b1b',border:'1px solid #fecaca',borderRadius:8,padding:12}}>{erroRisco}</p>}
 <label>Título do risco<input autoFocus value={riscoTitulo} onChange={e=>setRiscoTitulo(e.target.value)} placeholder="Identificação do risco"/></label>
 <label>Grupo de risco<input value={riscoGrupo} onChange={e=>setRiscoGrupo(e.target.value)} placeholder="Grupo ou categoria"/></label>
 <div style={{padding:12,border:'1px solid #cbd5e1',borderRadius:8,background:'#f8fafc',marginTop:12,marginBottom:12}}>
 <strong>Ambiente da avaliação (vínculo automático)</strong>
 <p style={{margin:'6px 0 0'}}>{({cliente:'Empresa',planta:'Planta',instalacao:'Instalação',posto:'Posto',estacao:'Estação'} as Record<Nivel,string>)[nivel]} — {nivel==='cliente'?'Empresa Ativa':(estruturasRisco[nivel].find(x=>x.id===estruturaOriginal)?.nome||estruturaOriginal||'Ambiente vinculado à avaliação')}</p>
 <small>O risco será associado somente a este ambiente.</small>
 </div>
 <label>Observações<textarea rows={3} value={riscoObservacoes} onChange={e=>setRiscoObservacoes(e.target.value)}/></label>
 <div style={{display:'flex',gap:10,marginTop:14}}><button type="button" disabled={criandoRisco} onClick={incluirRisco}>{criandoRisco?'Salvando...':'Salvar e vincular risco'}</button><button type="button" disabled={criandoRisco} onClick={()=>setSeletorRiscoAberto(false)}>Cancelar</button></div>
 </div></div>}
 <h2>Informações técnicas</h2><label>Metodologia<textarea rows={3} value={metodologia} onChange={e=>setMetodologia(e.target.value)}/></label>
 <label>Conclusão técnica<textarea rows={3} value={conclusao} onChange={e=>setConclusao(e.target.value)}/></label>
 <p style={{fontSize:13,color:'#53657a'}}>Os critérios de referência são informativos, definidos por tipo de medição nesta avaliação, e não classificam riscos automaticamente. O vínculo organizacional de uma avaliação existente não pode ser alterado nesta versão. Microfone e associação aos riscos serão integrados nas próximas etapas.</p>
 </fieldset></>}
 <style>{`.ambiental-pontos-layout{display:grid;grid-template-columns:165px minmax(0,1fr);gap:12px;align-items:start}.ambiental-pontos-menu{display:grid;gap:7px}.ambiental-ponto-aba{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#183653;padding:12px;cursor:pointer;width:100%}.ambiental-ponto-aba span{font-size:11px;font-weight:400;color:#53657a}.ambiental-ponto-aba.ativo{background:#e5f3ed;border-color:#239b65;box-shadow:inset 3px 0 #239b65}.ambiental-ponto-conteudo{min-width:0;border:1px solid #cbd5e1;border-radius:10px;padding:16px;background:white}@media(max-width:620px){.ambiental-pontos-layout{grid-template-columns:1fr}.ambiental-pontos-menu{grid-template-columns:repeat(2,minmax(0,1fr))}}.ambiental-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.ambiental-grid label,section>label,article>label{display:grid;gap:5px;margin-bottom:12px}input,select,textarea{max-width:100%;width:100%;box-sizing:border-box}`}</style>
 </section></main></div>;
}
