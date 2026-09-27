import {LeadScore} from '@/components/lead-score';
import {Recommendations} from '@/components/recommendations';
import {LeadTimeline,timelineKinds,type TimelineEvent} from '@/components/lead-timeline';
import Link from 'next/link';
import {getLead} from '@/lib/lead-data';
import {dateLabel,priorities,safeUrl} from '@/lib/crm';
import {StatusForm,ActivityForm} from '@/components/lead-forms';
export default async function LeadPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{history?:string;kind?:string}>}){
 const {id}=await params;const {lead,supabase}=await getLead(id);
 const query=await searchParams;
 const page=Math.max(1,Math.min(10000,parseInt(query.history??'1')||1));
 const kind=(query.kind&&Object.hasOwn(timelineKinds,query.kind)?query.kind:'all') as keyof typeof timelineKinds;
 let history=supabase.from('lead_timeline').select('*',{count:'exact'}).eq('lead_id',id);
 if(kind!=='all') history=history.eq('kind',kind);
 const {data:events,error,count}=await history.order('event_date',{ascending:false}).order('event_id').range((page-1)*30,page*30-1);
 if(error) throw new Error('Unable to load timeline. Check that the timeline database update is installed.');
 return <><Link href="/leads" className="back-link">← All leads</Link><div className="page-heading"><div><span className="eyebrow">{lead.industry||'PROSPECT'}</span><h1>{lead.company_name}</h1><p className="muted">{lead.city||'City not added'} · Added {dateLabel(lead.created_at)}</p></div><Link className="button secondary" href={'/leads/'+id+'/edit'}>Edit lead</Link></div>
 <div className="lead-detail-grid"><div><section className="panel"><h2>Company & contact</h2><dl className="details">{[['Contact',lead.contact_name],['Position',lead.position],['Phone',lead.phone],['Email',lead.email],['Address',lead.address],['Company size',lead.company_size],['Source',lead.source],['Priority',priorities[lead.priority]]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||'Not added'}</dd></div>)}</dl><div className="form-actions"><Link className="button" href={'/calling?lead='+id}>Open calling workspace ↗</Link>{safeUrl(lead.website)&&<a className="text-button" href={safeUrl(lead.website)} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}{safeUrl(lead.google_maps_url)&&<a className="text-button" href={safeUrl(lead.google_maps_url)} target="_blank" rel="noopener noreferrer">Open map ↗</a>}</div></section>
 <LeadTimeline events={(events??[]) as TimelineEvent[]} id={id} page={page} count={count??0} kind={kind}/></div>
 <aside><LeadScore id={id}/><Recommendations lead={lead}/><section className="panel"><h2>Next action</h2><Link className="company-link" href={'/calendar?lead='+id+'#new-reminder'}>Schedule reminder or meeting ↗</Link><p>{lead.next_action||'No follow-up scheduled'}</p>{lead.next_action_date&&<p className="muted">{dateLabel(lead.next_action_date)} UTC</p>}<StatusForm lead={lead}/></section><section className="panel"><h2>Add a note or activity</h2><ActivityForm id={id}/></section></aside></div></>;
}






