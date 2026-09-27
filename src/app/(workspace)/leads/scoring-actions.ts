'use server';
import {requireProfile} from '@/lib/auth';
import {revalidatePath} from 'next/cache';
import {scoringFields} from '@/lib/scoring';
export async function saveQualification(form:FormData):Promise<{error?:string;success?:string}>{
 const {supabase}=await requireProfile();const id=String(form.get('id')??'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return {error:'Invalid prospect.'};
 const qualification:Record<string,string>={};
 for(const [key,field] of Object.entries(scoringFields)){const value=String(form.get(key)??'unknown');if(!Object.hasOwn(field.options,value))return {error:'Choose valid qualification values.'};qualification[key]=value;}
 const {data,error}=await supabase.from('leads').update({qualification}).eq('id',id).eq('updated_at',String(form.get('updated_at'))).select('score');
 if(error||!data?.length)return {error:'Could not save qualification. Refresh to check your access and the latest lead version.'};
 for(const path of ['/leads','/leads/'+id,'/calling','/pipeline'])revalidatePath(path);
 return {success:'Qualification saved. Score: '+data[0].score+'/100.'};
}
