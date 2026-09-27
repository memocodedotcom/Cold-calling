'use server';
import {revalidatePath} from 'next/cache';
import {requireProfile} from '@/lib/auth';
import {parseImportFile,MAX_FILE_BYTES} from '@/lib/import-parser';
import {validateRows,type ImportSheet} from '@/lib/import-model';
export async function previewImport(form:FormData):Promise<{sheets?:ImportSheet[];error?:string}>{
 await requireProfile();
 const file=form.get('file');
 if(!(file instanceof File)||file.size===0||file.size>MAX_FILE_BYTES)return {error:'Choose a CSV or XLSX file up to 2 MB.'};
 try{return {sheets:await parseImportFile(file.name,new Uint8Array(await file.arrayBuffer()),String(form.get('delimiter')??','))};}
 catch(e){return {error:e instanceof Error?e.message:'Unable to read this file.'};}
}
export async function commitImport(batch:string,source:string,input:unknown):Promise<{imported?:number;skipped?:number;error?:string}>{
 const {supabase}=await requireProfile();
 if(!/^[0-9a-f-]{36}$/i.test(batch))return {error:'Invalid import. Upload the file again.'};
 let rows;
 try{rows=validateRows(input);}catch(e){return {error:e instanceof Error?e.message:'Invalid rows.'};}
 const {data,error}=await supabase.rpc('import_leads',{p_batch:batch,p_rows:rows,p_source:source.slice(0,250)});
 if(error?.code==='PGRST202')return {error:'The import database update is not installed yet. Ask your administrator to apply migration 0004 before importing.'};
 if(error)return {error:'Import could not finish. No partial rows were saved. Retry this same import safely, or check your workspace access.'};
 revalidatePath('/leads');revalidatePath('/dashboard');
 return {imported:data.imported,skipped:data.skipped};
}
