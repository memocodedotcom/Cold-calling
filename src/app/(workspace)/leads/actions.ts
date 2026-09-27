'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { readLeadForm, statuses } from '@/lib/crm';
import type { ActionState } from '@/app/actions';
const uuid = (s:string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export async function saveLead(_:ActionState, form:FormData):Promise<ActionState> {
 const {supabase}=await requireProfile();
 const id=String(form.get('id')??'');
 if(id && !uuid(id)) return {error:'Invalid lead.'};
 let values:ReturnType<typeof readLeadForm>;
 try { values=readLeadForm(form); } catch(e) { return {error:e instanceof Error?e.message:'Check your entries.'}; }
 const {data,error}=await supabase.rpc('save_lead',{
  p_id:id||null,p_company:values.company,p_contact:values.contact,p_status:values.status,p_priority:values.priority,
  p_updated_at:form.get('updated_at')||null,
 });
 if(error) return {error:error.message.includes('Lead changed')?'Someone updated this lead. Reload the page before saving.':'Unable to save. Check your access and try again.'};
 revalidatePath('/pipeline'); revalidatePath('/calling'); revalidatePath('/leads'); revalidatePath('/dashboard');
 redirect('/leads/'+data);
}
export async function changeStatus(_:ActionState,form:FormData):Promise<ActionState>{
 const {supabase}=await requireProfile();
 const id=String(form.get('id')),status=String(form.get('status'));
 if(!uuid(id)||!Object.hasOwn(statuses,status)) return {error:'Invalid status.'};
 const {data,error}=await supabase.from('leads').update({status}).eq('id',id).eq('updated_at',String(form.get('updated_at'))).select('id');
 if(error||!data?.length) return {error:'Unable to update. Reload to get the latest version.'};
 revalidatePath('/pipeline'); revalidatePath('/calling'); revalidatePath('/leads'); revalidatePath('/leads/'+id); return {success:'Status updated.'};
}
export async function addActivity(_:ActionState,form:FormData):Promise<ActionState>{
 const {supabase}=await requireProfile();
 const id=String(form.get('id')),type=String(form.get('type')),notes=String(form.get('notes')??'').trim();
 if(!uuid(id)||!['note','call','whatsapp','email','meeting'].includes(type)||!notes||notes.length>20000) return {error:'Choose an activity and add a note (up to 20,000 characters).'};
 const {error}=await supabase.from('activities').insert({lead_id:id,type,notes});
 if(error) return {error:'Could not save this activity. Check your access and try again.'};
 revalidatePath('/pipeline'); revalidatePath('/calling'); revalidatePath('/leads'); revalidatePath('/leads/'+id); return {success:'Activity saved.'};
}


