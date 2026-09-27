'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {saveSchedule,updateSchedule} from '@/app/(workspace)/calendar/actions';
import type {CalendarEntry} from '@/lib/calendar';
export function ScheduleForm({leads}:{leads:{id:string;company_name:string}[]}){
 const [saved,setSaved]=useState(false);
 const [kind,setKind]=useState('task'),[message,setMessage]=useState(''),[pending,start]=useTransition();const router=useRouter();
 return <form className="form" action={form=>start(async()=>{try{const result=await saveSchedule(form);setMessage(result.error??result.success??'');if(result.success){setSaved(true);router.refresh();}}catch{setMessage('Could not confirm the save. Check the calendar before retrying.');}})}><fieldset disabled={pending||saved||!leads.length}><label>Prospect<select name="lead_id" required>{leads.map(lead=><option value={lead.id} key={lead.id}>{lead.company_name}</option>)}</select></label><label>Type<select name="kind" value={kind} onChange={e=>setKind(e.target.value)}><option value="task">Follow-up reminder</option><option value="meeting">Meeting</option></select></label><label>{kind==='task'?'Reminder':'Meeting title'}<input name="title" maxLength={250} required placeholder="Call prospect about next steps"/></label><label>Date and time (UTC)<input name="date" type="datetime-local" required/></label>{kind==='meeting'&&<label>Meeting notes<textarea name="notes" maxLength={19000}/></label>}<button className="button" disabled={pending}>{pending?'Saving…':'Create '+(kind==='task'?'reminder':'meeting')}</button></fieldset><p role="status">{message}</p>{saved&&<button type="button" className="button secondary" onClick={()=>{setSaved(false);setMessage('');}}>Create another</button>}</form>;
}
export function ScheduleStatus({entry}:{entry:CalendarEntry}){
 const [message,setMessage]=useState(''),[pending,start]=useTransition();const router=useRouter();
 if(entry.kind==='call')return null;
 return <form className="schedule-status" action={form=>start(async()=>{try{const result=await updateSchedule(form);setMessage(result.error??result.success??'');router.refresh();}catch{setMessage('Could not confirm the update. Refresh to check its status.');}})}><input type="hidden" name="id" value={entry.id}/><input type="hidden" name="kind" value={entry.kind}/><input type="hidden" name="updated_at" value={entry.updated_at}/><select key={entry.status} name="status" defaultValue={entry.status} aria-label={'Status for '+entry.title} disabled={pending}>{(entry.kind==='task'?['pending','completed','cancelled']:['scheduled','completed','cancelled','no_show']).map(s=><option value={s} key={s}>{s.replaceAll('_',' ')}</option>)}</select><button className="button secondary" disabled={pending}>Save</button><span role="status">{message}</span></form>;
}

