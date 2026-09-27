import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { statuses, type Lead } from '@/lib/crm';
import { PipelineBoard } from '@/components/pipeline-board';
export default async function PipelinePage(){
 const {supabase}=await requireProfile();
 const columns=await Promise.all((Object.keys(statuses) as Lead['status'][]).map(async status=>{
  const {data,count,error}=await supabase.from('lead_directory').select('*',{count:'exact'}).eq('status',status).order('updated_at',{ascending:false}).order('id').limit(25);
  if(error) throw new Error('Unable to load the pipeline. Try again.');
  return {status,leads:(data??[]) as Lead[],count:count??0};
 }));
 return <><div className="page-heading"><div><span className="eyebrow">FROM FIRST CONTACT TO CLIENT</span><h1>Pipeline</h1><p className="muted">Move prospects forward and keep the next conversation in context.</p></div><Link className="button secondary" href="/leads/new">Add lead</Link></div><PipelineBoard columns={columns}/></>;
}
