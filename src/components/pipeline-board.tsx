'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { statuses, priorities, type Lead } from '@/lib/crm';
import { changeStatus, addActivity } from '@/app/(workspace)/leads/actions';
type Column={status:Lead['status'];leads:Lead[];count:number};
export function PipelineBoard({columns}:{columns:Column[]}){
 const router=useRouter();
 const [dragged,setDragged]=useState<string|null>(null),[over,setOver]=useState<string|null>(null);
 const [message,setMessage]=useState(''),[error,setError]=useState(false),[pending,startTransition]=useTransition();
 const [noteLead,setNoteLead]=useState<Lead|null>(null),[note,setNote]=useState('');
 function move(lead:Lead,status:string){
  if(pending||lead.status===status)return;
  const form=new FormData();form.set('id',lead.id);form.set('status',status);form.set('updated_at',lead.updated_at);
  setMessage('');startTransition(async()=>{try{const result=await changeStatus({},form);setError(Boolean(result.error));setMessage(result.error??`${lead.company_name} moved to ${statuses[status as Lead['status']]}.`);router.refresh();}catch{setError(true);setMessage('Could not confirm the move. Refresh the board before trying again.');}});
 }
 return <><p className="muted">Drag a card into a stage, or use its Move to menu on keyboard and touch devices. Each column shows its 25 most recently updated leads.</p>
 <div className="pipeline-feedback" role="status" aria-live="polite"><span className={error?'feedback error':'muted'}>{pending?'Saving…':message}</span><button className="text-button" disabled={pending} onClick={()=>router.refresh()}>Refresh board</button></div>
 {noteLead&&<section className="panel pipeline-note" aria-label="Quick note"><h2>Note for {noteLead.company_name}</h2><form className="form" action={()=>{const form=new FormData();form.set('id',noteLead.id);form.set('type','note');form.set('notes',note);startTransition(async()=>{try{const result=await addActivity({},form);setError(Boolean(result.error));setMessage(result.error??'Note added to the lead timeline.');if(!result.error){setNoteLead(null);setNote('');router.refresh();}}catch{setError(true);setMessage('Could not confirm the note. Check the lead timeline before trying again.');}});}}><label>Quick note<textarea autoFocus required maxLength={20000} value={note} onChange={e=>setNote(e.target.value)} disabled={pending}/></label><div className="form-actions"><button className="button" disabled={pending}>Save note</button><button type="button" className="button secondary" disabled={pending} onClick={()=>{setNoteLead(null);setNote('');}}>Cancel</button></div></form></section>}
 <div className="pipeline-board" aria-label="Sales pipeline" tabIndex={0}>{columns.map(column=><section key={column.status} className={'pipeline-column '+(over===column.status?'drop-target':'')} aria-label={statuses[column.status]} onDragOver={event=>{if(dragged&&!pending){event.preventDefault();event.dataTransfer.dropEffect='move';setOver(column.status);}}} onDragLeave={()=>setOver(null)} onDrop={event=>{event.preventDefault();const lead=columns.flatMap(c=>c.leads).find(l=>l.id===dragged);setDragged(null);setOver(null);if(lead)move(lead,column.status);}}><h2>{statuses[column.status]} <span className="badge">{column.count}</span></h2>
 {column.leads.map(lead=><article key={lead.id} className="pipeline-card" draggable={!pending&&!noteLead} onDragStart={event=>{event.dataTransfer.setData('text/plain',lead.id);event.dataTransfer.effectAllowed='move';setDragged(lead.id);}} onDragEnd={()=>{setDragged(null);setOver(null);}}><Link className="company-link" href={'/leads/'+lead.id}>{lead.company_name}</Link><p className="muted">{[lead.industry,lead.city].filter(Boolean).join(' · ')||'Details not added'}</p><span className={'priority priority-'+lead.priority}>{priorities[lead.priority]} priority</span><label>Move to<select aria-label={'Move '+lead.company_name+' to'} value={lead.status} disabled={pending} onChange={e=>move(lead,e.target.value)}>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button className="text-button" disabled={pending||Boolean(noteLead)} onClick={()=>{setNoteLead(lead);setNote('');setMessage('');}}>+ Quick note</button></article>)}
 {!column.count&&<p className="pipeline-empty">No leads in this stage</p>}{column.count>25&&<Link className="company-link" href={'/leads?status='+column.status}>View all {column.count} leads →</Link>}</section>)}</div></>;
}
