'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {scoringFields,type Qualification} from '@/lib/scoring';
import {saveQualification} from '@/app/(workspace)/leads/scoring-actions';
export function ScoreForm({id,updatedAt,qualification}:{id:string;updatedAt:string;qualification:Qualification}){
 const [message,setMessage]=useState(''),[pending,start]=useTransition();const router=useRouter();
 return <details><summary>Update qualification</summary><form className="form" action={form=>start(async()=>{try{const result=await saveQualification(form);setMessage(result.error??result.success??'');router.refresh();}catch{setMessage('Could not confirm the save. Refresh before trying again.');}})}><input name="id" type="hidden" value={id}/><input name="updated_at" type="hidden" value={updatedAt}/>{Object.entries(scoringFields).map(([key,field])=><label key={key}>{field.label}<select name={key} defaultValue={qualification[key as keyof Qualification]??'unknown'} disabled={pending}>{Object.entries(field.options).map(([value,[label,points]])=><option value={value} key={value}>{label} (+{points})</option>)}</select><small className="muted">{field.help}</small></label>)}<p role="status">{message}</p><button className="button" disabled={pending}>{pending?'Saving…':'Save qualification'}</button></form></details>;
}
