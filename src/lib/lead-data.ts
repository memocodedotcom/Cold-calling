import 'server-only';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import type { Lead } from '@/lib/crm';
export async function getLead(id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id)) notFound();
 const {supabase,profile}=await requireProfile();
 const {data,error}=await supabase.from('lead_directory').select('*').eq('id',id).maybeSingle();
 if(error) throw new Error('Unable to load lead.');
 if(!data) notFound();
 return {lead:data as Lead,supabase,profile};
}
