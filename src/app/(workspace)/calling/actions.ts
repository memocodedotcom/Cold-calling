'use server';
import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/auth';
import { outcomes } from '@/lib/calling';
import { statuses } from '@/lib/crm';
export async function recordCall(form:FormData):Promise<{error?:string;success?:boolean}>{
 const {supabase}=await requireProfile();
 const field=(key:string)=>String(form.get(key)??'');
 const id=field('id'),request=field('request'),outcome=field('outcome'),status=field('status');
 const notes=field('notes').trim(),duration=Number(field('duration')),next=field('next_at');
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(id)||!uuid.test(request)||!Object.hasOwn(outcomes,outcome)||!Object.hasOwn(statuses,status)||notes.length>20000||!Number.isInteger(duration)||duration<0||duration>86400) return {error:'Check the outcome, notes, and duration (0–86,400 seconds).'};
 if(['follow_up','meeting_booked'].includes(outcome) && (!next||!Number.isFinite(Date.parse(next))||Date.parse(next)<=Date.now())) return {error:'Choose a future date and time.'};
 const {error}=await supabase.rpc('record_call',{p_request:request,p_lead:id,p_updated_at:field('updated_at'),p_outcome:outcome,p_notes:notes,p_duration:duration,p_status:status,p_next_at:next||null});
 if(error) return {error:error.code==='PGRST202'?'The calling database update is not installed yet.':error.message.includes('reload')?'This lead or saved call changed. Reload before recording another call.':'Unable to save the call. Check your access and date, then try again.'};
 revalidatePath('/calling'); revalidatePath('/leads'); revalidatePath('/leads/'+id);
 return {success:true};
}
