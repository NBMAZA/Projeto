'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';

type Item={id:string;nome:string};
type Fator={codigo:string;grupo:string;titulo:string;sugestao:string};
type Resposta={situacao:string;descricao:string;observacoes:string;comentario:string;plano:string};
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
 const [clientes,setClientes]=useState<{id:string;razao_social:string}[]>([]);
 const [cliente,setCliente]=useState(''),[plantas,setPlantas]=useState<Item[]>([]),[planta,setPlanta]=useState(''),[instalacoes,setInstalacoes]=useState<Item[]>([]),[instalacao,setInstalacao]=useState(''),[postos,setPostos]=useState<Item[]>([]),[posto,setPosto]=useState(''),[estacoes,setEstacoes]=useState<Item[]>([]),[estacao,setEstacao]=useState('');
 const [nivel,setNivel]=useState<'posto'|'estacao'>('posto'),[grupo,setGrupo]=useState('Posturas'),[respostas,setRespostas]=useState<Record<string,Resposta>>({}),[geral,setGeral]=useState({observacoes:'',comentario:'',plano:''});
 const [erro,setErro]=useState('');
 useEffect(()=>{supabase().from('clientes').select('id,razao_social').order('razao_social').then(({data,error})=>{if(error)setErro(error.message);else setClientes(data||[])})},[]);
 useEffect(()=>{setPlanta('');setPlantas([]);if(cliente)supabase().from('plantas').select('id,nome').eq('cliente_id',cliente).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPlantas(data||[])})},[cliente]);
 useEffect(()=>{setInstalacao('');setInstalacoes([]);if(planta)supabase().from('instalacoes').select('id,nome').eq('planta_id',planta).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setInstalacoes(data||[])})},[planta]);
 useEffect(()=>{setPosto('');setPostos([]);if(instalacao)supabase().from('postos_trabalho').select('id,nome').eq('instalacao_id',instalacao).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setPostos(data||[])})},[instalacao]);
 useEffect(()=>{setEstacao('');setEstacoes([]);if(posto)supabase().from('estacoes_trabalho').select('id,nome').eq('posto_id',posto).order('nome').then(({data,error})=>{if(error)setErro(error.message);else setEstacoes(data||[])})},[posto]);
 function alterar(codigo:string,campo:keyof Resposta,valor:string){setRespostas(prev=>({...prev,[codigo]:{...(prev[codigo]||inicial()),[campo]:valor}}))}
 function sugerir(f:Fator){alterar(f.codigo,'descricao',f.sugestao)}
 const campo=(rotulo:string,valor:string,onChange:(v:string)=>void,lista:Item[],bloqueado=false)=><label style={{display:'grid',gap:5,fontSize:13,minWidth:0,fontWeight:600}}>{rotulo}<select title={lista.find(x=>x.id===valor)?.nome||rotulo} style={{width:'100%',minWidth:0,maxWidth:'100%',height:40,fontWeight:400,textOverflow:'ellipsis'}} value={valor} disabled={bloqueado} onChange={e=>onChange(e.target.value)}><option value="">Selecione</option>{lista.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>;
 const selecionado=nivel==='posto'?posto:estacao;
 return <><header><nav><strong>Portal NR-17 — Coleta Biomecânica</strong></nav></header><main><section style={{maxWidth:1120}}><p><Link href="/">← Voltar ao painel</Link></p><h1>Coleta de Dados Biomecânicos</h1><p style={{fontSize:13}}>Formulário de desenvolvimento. As informações desta tela ainda não são gravadas no banco de dados.</p>{erro&&<p role="alert" style={{color:'#b42318'}}>{erro}</p>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(12,minmax(0,1fr))',gap:'12px 14px',alignItems:'end'}}>
 <div style={{gridColumn:'span 8',minWidth:0}}><label style={{display:'grid',gap:5,fontSize:13,fontWeight:600}}>Cliente<select title={clientes.find(x=>x.id===cliente)?.razao_social||'Cliente'} style={{width:'100%',minWidth:0,height:40,fontWeight:400,textOverflow:'ellipsis'}} value={cliente} onChange={e=>setCliente(e.target.value)}><option value="">Selecione</option>{clientes.map(x=><option key={x.id} value={x.id}>{x.razao_social}</option>)}</select></label></div>
 <div style={{gridColumn:'span 4',minWidth:0}}><label style={{display:'grid',gap:5,fontSize:13,fontWeight:600}}>Vincular a<select style={{width:'100%',minWidth:0,height:40,fontWeight:400}} value={nivel} onChange={e=>setNivel(e.target.value as 'posto'|'estacao')}><option value="posto">Posto de trabalho</option><option value="estacao">Estação de trabalho</option></select></label></div>
 </div>
 <div className="biomecanica-seletores" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'12px 14px',marginTop:12}}>
 {campo('Planta',planta,setPlanta,plantas,!cliente)}{campo('Instalação',instalacao,setInstalacao,instalacoes,!planta)}{campo('Posto',posto,setPosto,postos,!instalacao)}{nivel==='estacao'&&campo('Estação',estacao,setEstacao,estacoes,!posto)}
 </div>
 <style>{`@media(max-width:720px){.biomecanica-seletores{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:460px){.biomecanica-seletores{grid-template-columns:minmax(0,1fr)!important}}`}</style>
 <p style={{fontSize:12,color:'#53657a'}}>{selecionado?'Vínculo selecionado.':'Selecione um posto ou estação para identificar o local da coleta.'} O preenchimento é demonstrativo até a integração da persistência.</p>
 <div style={{display:'flex',gap:7,flexWrap:'wrap',margin:'16px 0'}}>{grupos.map(g=><button type="button" key={g} aria-pressed={grupo===g} onClick={()=>setGrupo(g)} style={{padding:'7px 10px',fontWeight:grupo===g?700:400}}>{g}</button>)}</div>
 {grupo==='Avaliação geral'?<div style={{display:'grid',gap:12}}>{([['observacoes','Observações gerais'],['comentario','Comentário técnico geral'],['plano','Plano de ação geral']] as const).map(([k,t])=><label key={k} style={{display:'grid',gap:5}}>{t}<textarea rows={3} value={geral[k]} onChange={e=>setGeral(p=>({...p,[k]:e.target.value}))}/></label>)}</div>:<div style={{border:'1px solid #d5dfeb',borderRadius:10,overflow:'hidden'}}>{fatores.filter(f=>f.grupo===grupo).map(f=>{const r=respostas[f.codigo]||inicial();return <div key={f.codigo} style={{padding:12,borderBottom:'1px solid #e3e9f0',display:'grid',gap:8}}><div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><strong style={{fontSize:13}}>{f.codigo} — {f.titulo}</strong><select aria-label={'Situação: '+f.titulo} value={r.situacao} onChange={e=>alterar(f.codigo,'situacao',e.target.value)}><option value="">Não avaliado</option><option value="sim">Situação identificada</option><option value="nao">Não identificada</option><option value="na">Não se aplica</option></select></div><label style={{display:'grid',gap:4,fontSize:12}}>Descrição técnica editável<textarea rows={2} value={r.descricao} onChange={e=>alterar(f.codigo,'descricao',e.target.value)} placeholder="Descreva a condição observada..."/></label><div><button type="button" onClick={()=>sugerir(f)} style={{fontSize:12}}>Usar texto sugerido</button><span style={{fontSize:11,marginLeft:8,color:'#53657a'}}>Confira se o texto corresponde à situação real.</span></div><details><summary style={{cursor:'pointer',fontSize:12}}>Observações, comentário técnico e plano de ação</summary><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginTop:8}}>{([['observacoes','Observações'],['comentario','Comentário técnico'],['plano','Plano de ação']] as const).map(([k,t])=><label key={k} style={{display:'grid',gap:4,fontSize:12}}>{t}<textarea rows={2} value={r[k]} onChange={e=>alterar(f.codigo,k,e.target.value)}/></label>)}</div></details></div>})}</div>}
 <p style={{fontSize:12,color:'#53657a'}}>Protótipo sem salvamento. A avaliação técnica e a caracterização da exposição dependem da análise da profissional responsável.</p>
 </section></main></>
}
