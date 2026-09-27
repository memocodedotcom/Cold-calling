'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { saveLead,changeStatus,addActivity } from '@/app/(workspace)/leads/actions';
import { statuses,priorities,type Lead } from '@/lib/crm';
import type { ActionState } from '@/app/actions';
function Feedback({state}:{state:ActionState}) { return <div aria-live="polite">{state.error&&<p className="feedback error" role="alert">{state.error}</p>}{state.success&&<p className="feedback success">{state.success}</p>}</div>; }
function Options({values}:{values:Record<string,string>}) { return Object.entries(values).map(([v,label])=><option key={v} value={v}>{label}</option>); }
export function LeadForm({lead,companyEditable=true}:{lead?:Lead;companyEditable?:boolean}){
 const [state,action,pending]=useActionState(saveLead,{});
 return <form action={action} className="form lead-form"><input type="hidden" name="id" value={lead?.id??''}/><input type="hidden" name="updated_at" value={lead?.updated_at??''}/><input type="hidden" name="company_readonly" value={String(!companyEditable)}/>
 <section className="panel"><h2>Company</h2>{!companyEditable&&<p className="muted">Company details are managed by its owner or an administrator.</p>}
 <div className="field-grid">{[['company_name','Company name'],['industry','Industry'],['city','City'],['company_size','Company size'],['website','Website'],['google_maps_url','Google Maps URL'],['address','Address'],['source','Source']].map(([name,label])=><label key={name}>{label}<input name={name} defaultValue={String(lead?.[name as keyof Lead]??'')} required={name==='company_name'} readOnly={!companyEditable} type={['website','google_maps_url'].includes(name)?'url':'text'} maxLength={['website','google_maps_url'].includes(name)?2000:name==='address'?1000:250}/></label>)}</div></section>
 <section className="panel"><h2>Primary contact</h2><p className="muted">Optional for new leads. Company and contact edits also appear on other leads that reference them.</p><div className="field-grid">{[['contact_name','Contact name'],['phone','Phone'],['email','Email'],['position','Position']].map(([name,label])=><label key={name}>{label}<input name={name} defaultValue={String(lead?.[name as keyof Lead]??'')} required={name==='contact_name'&&Boolean(lead?.contact_id)} type={name==='email'?'email':name==='phone'?'tel':'text'} maxLength={name==='contact_name'?150:name==='phone'?60:254}/></label>)}</div></section>
 <section className="panel"><h2>Lead details</h2><div className="field-grid"><label>Status<select name="status" defaultValue={lead?.status??'new'}><Options values={statuses}/></select></label><label>Priority<select name="priority" defaultValue={lead?.priority??'normal'}><Options values={priorities}/></select></label></div></section>
 <Feedback state={state}/><div className="form-actions"><button className="button" disabled={pending}>{pending?'Saving…':lead?'Save changes':'Create lead'}</button><Link href={lead?'/leads/'+lead.id:'/leads'} className="button secondary">Cancel</Link></div></form>;
}
export function StatusForm({lead}:{lead:Lead}){
 const [state,action,pending]=useActionState(changeStatus,{});
 return <form action={action} className="form"><input type="hidden" name="id" value={lead.id}/><input type="hidden" name="updated_at" value={lead.updated_at}/><label>Status<select name="status" defaultValue={lead.status} key={lead.status}><Options values={statuses}/></select></label><Feedback state={state}/><button className="button secondary" disabled={pending}>{pending?'Updating…':'Update status'}</button></form>;
}
export function ActivityForm({id}:{id:string}){
 const [state,action,pending]=useActionState(addActivity,{});
 return <form action={action} className="form"><input name="id" type="hidden" value={id}/><label>Activity type<select name="type"><Options values={{note:'Note',call:'Call',whatsapp:'WhatsApp',email:'Email',meeting:'Meeting'}}/></select></label><label>Notes<textarea name="notes" rows={5} required maxLength={20000} placeholder="What happened? What should happen next?"/></label><p className="muted">Recorded with the current time. Use Calling for structured call outcomes and Calendar to schedule follow-ups or meetings.</p><Feedback state={state}/><button className="button" disabled={pending}>{pending?'Saving…':'Add activity'}</button></form>;
}


