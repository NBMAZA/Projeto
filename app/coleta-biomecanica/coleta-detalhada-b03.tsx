'use client';
import type {Dispatch,SetStateAction} from 'react';
export type OcorrenciaB03={id:string;atividade:string;segmento:string;movimento:string;frequencia:string;vezes:string;duracao:string;total:string;observacoes:string};
export const novaOcorrenciaB03=():OcorrenciaB03=>({id:crypto.randomUUID(),atividade:'',segmento:'',movimento:'',frequencia:'',vezes:'',duracao:'',total:'',observacoes:''});
type Props={ocorrencias:OcorrenciaB03[];onChange:(items:OcorrenciaB03[])=>void;somenteLeitura:boolean};
const campos=[['atividade','Atividade'],['segmento','Segmento corporal'],['movimento','Movimento/postura'],['frequencia','Frequência por semana'],['vezes','Quantas vezes ao dia'],['duracao','Por quanto tempo em cada ocorrência'],['total','Tempo total diário'],['observacoes','Observações']] as const;
export default function ColetaDetalhadaB03({ocorrencias,onChange,somenteLeitura}:Props){
return <section style={{border:'1px solid #cbd5e1',borderRadius:9,padding:14,background:'#f4f8fc',display:'grid',gap:12}}>
<h3>CD-B03 — Exigência de Posturas Incômodas</h3>
<p style={{fontSize:12}}>Registre cada postura observada. Para persistir os detalhes, salve a avaliação biomecânica.</p>
{ocorrencias.map((o,i)=><article key={o.id} style={{border:'1px solid #d5dfeb',borderRadius:8,padding:12,background:'#fff',display:'grid',gap:10}}>
<div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><strong>Ocorrência {i+1}</strong><button type="button" disabled={somenteLeitura} onClick={()=>{if(window.confirm('Excluir esta ocorrência?'))onChange(ocorrencias.filter(x=>x.id!==o.id))}}>Excluir</button></div>
{campos.map(([k,t])=><label key={k} style={{display:'grid',gap:4,fontSize:13,fontWeight:600}}>{t}{k==='atividade'||k==='movimento'||k==='observacoes'?<textarea rows={2} disabled={somenteLeitura} value={o[k]} onChange={e=>onChange(ocorrencias.map(x=>x.id===o.id?{...x,[k]:e.target.value}:x))}/>:<input type={k==='vezes'?'number':'text'} min={k==='vezes'?0:undefined} disabled={somenteLeitura} value={o[k]} onChange={e=>onChange(ocorrencias.map(x=>x.id===o.id?{...x,[k]:e.target.value}:x))}/>}</label>)}
</article>)}
<button type="button" disabled={somenteLeitura} onClick={()=>onChange([...ocorrencias,novaOcorrenciaB03()])}>+ Adicionar ocorrência</button>
</section>
}