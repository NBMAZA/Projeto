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
 const selecao=(nome:string,valor:string,alterar:(s:string)=>void,itens:Item[],disabled=false)=><label>{nome}<select value={valor} onChange={e=>alterar(e.target.value)} disabled={disabled}><option value="">Selecione</option>{itens.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label>;
 const mudarPonto=(id:string,campo:'nome'|'localizacao'|'observacoes',valor:string)=>setPontos(ps=>ps.map(p=>p.id===id?{...p,[campo]:valor}:p));
 const mudarMedicao=(pid:string,mid:string,campo:keyof Omit<Medicao,'id'>,valor:string)=>setPontos(ps=>ps.map(p=>p.id===pid?{...p,medicoes:p.medicoes.map(m=>m.id===mid?{...m,[campo]:valor}:m)}:p));
 return <><header><nav><strong>Portal NR-17 — Condições Ambientais</strong></nav></header><main><section style={{maxWidth:1100}}>
 <p><Link href="/">← Voltar ao painel</Link></p><h1>Condições Ambientais</h1>
 <p style={{color:'#53657a'}}>Protótipo de preenchimento. Os dados ainda não são salvos; não utilize para registros definitivos.</p>
 {erro&&<p role="alert">{erro}</p>}
 <h2>Identificação da avaliação</h2>
 <div className="ambiental-grid">
 <label>Título da avaliação<input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex.: Avaliação ambiental do escritório"/></label>
 <label>Data da coleta<input type="date" value={data} onChange={e=>setData(e.target.value)}/></label>
 <label>Cliente<select value={cliente} disabled={empresaAtiva} onChange={e=>setCliente(e.target.value)}><option value="">Selecione</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></label>
 <label>Vincular a<select value={nivel} onChange={e=>setNivel(e.target.value as Nivel)}>{([['cliente','Cliente'],['planta','Planta'],['instalacao','Instalação'],['posto','Posto de trabalho'],['estacao','Estação de trabalho']] as const).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 {nivel!=='cliente'&&selecao('Planta',planta,setPlanta,plantas,!cliente)}
 {['instalacao','posto','estacao'].includes(nivel)&&selecao('Instalação',instalacao,setInstalacao,instalacoes,!planta)}
 {['posto','estacao'].includes(nivel)&&selecao('Posto',posto,setPosto,postos,!instalacao)}
 {nivel==='estacao'&&selecao('Estação',estacao,setEstacao,estacoes,!posto)}
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
 <button type="button" onClick={()=>setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:x.medicoes.filter(y=>y.id!==m.id)}:x))}>Excluir medição {j+1}</button>
 </div>)}
 <button type="button" onClick={()=>setPontos(ps=>ps.map(x=>x.id===p.id?{...x,medicoes:[...x.medicoes,novaMedicao()]}:x))}>+ Adicionar medição</button>
 </article>)}
 <button type="button" onClick={()=>setPontos(ps=>[...ps,novoPonto()])}>+ Adicionar ponto de coleta</button>
 <h2>Informações técnicas</h2><label>Metodologia<textarea rows={3} value={metodologia} onChange={e=>setMetodologia(e.target.value)}/></label>
 <label>Conclusão técnica<textarea rows={3} value={conclusao} onChange={e=>setConclusao(e.target.value)}/></label>
 <p style={{fontSize:13,color:'#53657a'}}>Os critérios de referência são informativos, definidos por tipo de medição nesta avaliação, e não classificam riscos automaticamente. Salvamento, microfone e associação aos riscos serão integrados nas próximas etapas.</p>
 <style>{`.ambiental-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.ambiental-grid label,section>label,article>label{display:grid;gap:5px;margin-bottom:12px}input,select,textarea{max-width:100%;width:100%;box-sizing:border-box}`}</style>
 </section></main></>;
}
