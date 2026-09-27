'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { outcomes, suggestedStatus, type Outcome } from '@/lib/calling';
import { statuses, type Lead } from '@/lib/crm';
import { recordCall } from '@/app/(workspace)/calling/actions';
export function CallForm({lead}:{lead:Lead}){
 const router=useRouter();
 const [choice,setChoice]=useState<Outcome|''|null>(null),[request,setRequest]=useState('');
 const [status,setStatus]=useState<string>(lead.status),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const [pending,startTransition]=useTransition();
 function open(outcome:Outcome|'') {setChoice(outcome);setRequest(crypto.randomUUID());setStatus(outcome?suggestedStatus(outcome,lead.status):lead.status);setError('');}
 if(saved) return <section className="panel" role="status"><h2>Call saved</h2><p>The call is in this prospect’s history.</p><button className="button" onClick={()=>router.push('/calling')}>Next prospect →</button></section>;
 return <section className="panel" id="record-call"><h2>Record your call</h2><p className="muted">Make the call manually, then choose what happened.</p>
 {choice===null?<div className="call-outcomes"><button className="button" onClick={()=>open('')}>Call completed</button>{(Object.entries(outcomes) as [Outcome,string][]).filter(([k])=>k!=='wrong_number').map(([key,label])=><button className="button secondary" key={key} onClick={()=>open(key)}>{label}</button>)}</div>:
 <form className="form" action={form=>{setError('');startTransition(async()=>{try{const local=String(form.get('next_local')??'');form.set('next_at',local?new Date(local).toISOString():'');const result=await recordCall(form);if(result.error)setError(result.error);else{setSaved(true);router.refresh();}}catch{setError('The call could not be confirmed. Try saving again.');}});}}>
 <input type="hidden" name="id" value={lead.id}/><input type="hidden" name="updated_at" value={lead.updated_at}/><input type="hidden" name="request" value={request}/>
 <fieldset disabled={pending}><div className="field-grid"><label>Outcome<select name="outcome" required value={choice} onChange={e=>{const value=e.target.value as Outcome;setChoice(value);setStatus(suggestedStatus(value,lead.status));}}><option value="" disabled>Choose an outcome</option>{Object.entries(outcomes).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>
 <label>Lead status after call<select name="status" value={status} onChange={e=>setStatus(e.target.value)}>{Object.entries(statuses).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label></div>
 <label>Notes<textarea name="notes" maxLength={20000} rows={4} placeholder="What did you learn? What should happen next?" autoFocus/></label>
 <label>Duration in seconds<input type="number" name="duration" min={0} max={86400} defaultValue={0} required/></label>
 {(choice==='follow_up'||choice==='meeting_booked')&&<label>{choice==='follow_up'?'Follow-up':'Meeting'} date and time<input type="datetime-local" name="next_local" required/><span className="muted">Uses your device’s time zone. Creates a new {choice==='follow_up'?'task':'meeting'}; existing scheduled items stay open.</span></label>}
 {error&&<p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button className="button" disabled={pending}>{pending?'Saving…':'Save call'}</button><button className="button secondary" type="button" onClick={()=>setChoice(null)}>Cancel</button></div></fieldset></form>}
 </section>;
}

