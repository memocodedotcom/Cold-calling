'use server';
import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/auth';
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function refresh(id:string){for(const path of ['/calendar','/calling','/leads','/pipeline','/leads/'+id])revalidatePath(path);}
export async function saveSchedule(form:FormData):Promise<{error?:string;success?:string}>{
 const {supabase}=await requireProfile();
 const value=(key:string)=>String(form.get(key)??'').trim();
 const kind=value('kind'),lead=value('lead_id'),title=value('title'),notes=value('notes'),date=value('date');
 if(!['task','meeting'].includes(kind)||!uuid(lead)||!title||title.length>250||notes.length>20000||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'Z'))||new Date(date+'Z').toISOString().slice(0,16)!==date||Date.parse(date+'Z')<=Date.now())return {error:'Choose a prospect, a title, and a future UTC date and time.'};
 const {error}=kind==='task'?await supabase.from('tasks').insert({lead_id:lead,title,due_date:date+'Z'}):await supabase.from('meetings').insert({lead_id:lead,date:date+'Z',notes:title+(notes?'\n'+notes:'')});
 if(error)return {error:'Could not confirm the save. Check the calendar before trying again.'};
 refresh(lead);return {success:kind==='task'?'Reminder created.':'Meeting scheduled.'};
}
export async function updateSchedule(form:FormData):Promise<{error?:string;success?:string}>{
 const {supabase}=await requireProfile();const field=(key:string)=>String(form.get(key)??'');
 const kind=field('kind'),id=field('id'),status=field('status');
 if(!uuid(id)||!['task','meeting'].includes(kind)||!(kind==='task'?['pending','completed','cancelled']:['scheduled','completed','cancelled','no_show']).includes(status))return {error:'Invalid scheduled item.'};
 const {data,error}=await supabase.from(kind==='task'?'tasks':'meetings').update({status}).eq('id',id).eq('updated_at',field('updated_at')).select('lead_id');
 if(error||!data?.length)return {error:'This item changed or is unavailable. Refresh before trying again.'};
 refresh(data[0].lead_id);return {success:'Schedule updated.'};
}

