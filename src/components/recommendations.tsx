import Link from 'next/link';
import {requireProfile} from '@/lib/auth';
import type {Lead} from '@/lib/crm';
import {recommend} from '@/lib/recommendations';
export async function Recommendations({lead}:{lead:Lead}){
 const {supabase}=await requireProfile();
 const now=new Date();
 const [calls,activities,meetings,tasks,completed]=await Promise.all([
  supabase.from('calls').select('date,outcome').eq('lead_id',lead.id).lte('date',now.toISOString()).order('date',{ascending:false}).order('id').limit(1),
  supabase.from('activities').select('date').eq('lead_id',lead.id).in('type',['call','whatsapp','email','meeting']).lte('date',now.toISOString()).order('date',{ascending:false}).limit(1),
  supabase.from('meetings').select('date').eq('lead_id',lead.id).eq('status','scheduled').order('date').limit(1),
  supabase.from('tasks').select('due_date').eq('lead_id',lead.id).eq('status','pending').order('due_date').limit(1),
  supabase.from('meetings').select('date').eq('lead_id',lead.id).eq('status','completed').lte('date',now.toISOString()).order('date',{ascending:false}).limit(1),
 ]);
 if([calls,activities,meetings,tasks,completed].some(r=>r.error))return <section className="panel"><h2>Suggested next steps</h2><p role="status">Recommendations could not be loaded. Refresh to try again.</p></section>;
 const dates=[calls.data?.[0]?.date,activities.data?.[0]?.date,completed.data?.[0]?.date].filter((value):value is string=>Boolean(value)).sort((a,b)=>Date.parse(b)-Date.parse(a));
 const suggestions=recommend({status:lead.status,industry:lead.industry,phone:lead.phone,createdAt:lead.created_at,lastOutreach:dates[0]??null,lastOutcome:calls.data?.[0]?.outcome??null,nextTask:tasks.data?.[0]?.due_date??null,nextMeeting:meetings.data?.[0]?.date??null},now);
 const links={call:'/calling?lead='+lead.id,schedule:'/calendar?lead='+lead.id+'#new-reminder',edit:'/leads/'+lead.id+'/edit',calendar:'/calendar',review:'/leads/'+lead.id+'#timeline'};
 const labels={call:'Open calling workspace',schedule:'Schedule next step',edit:'Edit contact',calendar:'Review calendar',review:'Review history'};
 return <section className="panel recommendations"><h2>Suggested next steps</h2><p className="muted">Based on saved details and recorded activity. Review before acting.</p><ul>{suggestions.map(item=><li key={item.id}><strong>{item.title}</strong>{item.priority==='high'&&<span className="badge">Needs attention</span>}<p>{item.reason}</p><Link className="company-link" href={links[item.action]}>{labels[item.action]} →</Link></li>)}</ul></section>;
}
