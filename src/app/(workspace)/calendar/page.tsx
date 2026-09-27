import Link from 'next/link';
import {requireProfile} from '@/lib/auth';
import {calendarRange,type CalendarEntry} from '@/lib/calendar';
import {ScheduleForm,ScheduleStatus} from '@/components/calendar-forms';
import {outcomes,type Outcome} from '@/lib/calling';
export default async function CalendarPage({searchParams}:{searchParams:Promise<{date?:string;view?:string;q?:string;lead?:string}>}){
 const params=await searchParams;const range=calendarRange(params.date,params.view);const {supabase}=await requireProfile();
 const results=await Promise.all([
  supabase.from('tasks').select('*').gte('due_date',range.start).lt('due_date',range.end).order('due_date').order('id').limit(501),
  supabase.from('meetings').select('*').gte('date',range.start).lt('date',range.end).order('date').order('id').limit(501),
  supabase.from('calls').select('*').gte('date',range.start).lt('date',range.end).order('date').order('id').limit(501),
  supabase.from('tasks').select('*').eq('status','pending').lt('due_date',new Date().toISOString()).order('due_date').order('id').limit(51),
 ]);
 if(results.some(result=>result.error))throw new Error('Unable to load the calendar. Please try again.');
 const ids=[...new Set(results.flatMap(result=>(result.data??[]).map(row=>row.lead_id as string)))];
 const names=new Map<string,string>();
 // Bound each query and avoid exceeding the API response limit with large periods.
 for(let i=0;i<ids.length;i+=100){const {data,error}=await supabase.from('lead_directory').select('id,company_name').in('id',ids.slice(i,i+100));if(error)throw new Error('Unable to load prospect names.');for(const row of data??[])names.set(row.id,row.company_name);}
 const entries:CalendarEntry[]=results.slice(0,3).flatMap((result,index)=>(result.data??[]).slice(0,500).map(row=>({id:row.id,lead_id:row.lead_id,kind:(['task','meeting','call'] as const)[index],date:row.due_date??row.date,title:index===0?row.title:index===1?'Meeting':outcomes[row.outcome as Outcome]??'Call',notes:row.notes??'',status:row.status??'recorded',updated_at:row.updated_at,company:names.get(row.lead_id)??'Prospect'}))).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const overdue:CalendarEntry[]=(results[3].data??[]).slice(0,50).map(row=>({id:row.id,lead_id:row.lead_id,kind:'task',date:row.due_date,title:row.title,status:row.status,notes:'',updated_at:row.updated_at,company:names.get(row.lead_id)??'Prospect'}));
 const q=(params.q??'').slice(0,100).replace(/[%_]/g,'');
 let prospects=supabase.from('lead_directory').select('id,company_name').order('company_name').order('id').limit(20);
 if(params.lead&&/^[0-9a-f-]{36}$/i.test(params.lead))prospects=prospects.eq('id',params.lead);else if(q)prospects=prospects.ilike('company_name','%'+q+'%');
 const {data:leads,error}=await prospects;if(error)throw new Error('Unable to load prospects.');
 const previous=new Date(range.start),next=new Date(range.end);if(range.mode==='month')previous.setUTCMonth(previous.getUTCMonth()-1);else previous.setUTCDate(previous.getUTCDate()-(range.mode==='week'?7:1));
 const link=(date:string,view=range.mode)=>'/calendar?date='+date+'&view='+view;
 function card(entry:CalendarEntry){return <article className={'calendar-entry kind-'+entry.kind} key={entry.kind+entry.id}><div><span className="badge">{entry.kind==='task'?'Follow-up':entry.kind==='call'?'Call':'Meeting'}</span><time dateTime={entry.date}>{entry.date.slice(11,16)} UTC</time></div><Link className="company-link" href={'/leads/'+entry.lead_id}>{entry.company}</Link><h3>{entry.title}</h3><p className="muted">{entry.status.replaceAll('_',' ')}</p>{entry.notes&&<p className="calendar-notes">{entry.notes}</p>}<ScheduleStatus entry={entry}/></article>;}
 return <><div className="page-heading"><div><span className="eyebrow">KEEP THE NEXT STEP VISIBLE</span><h1>Calendar & follow-ups</h1><p className="muted">Calls, reminders, and meetings. All times shown in UTC.</p></div><a href="#new-reminder" className="button">Create reminder</a></div>
 <form className="calendar-toolbar"><label>Date<input name="date" type="date" defaultValue={range.date} required/></label><label>View<select name="view" defaultValue={range.mode}><option value="today">Today / day</option><option value="week">Week</option><option value="month">Month</option></select></label><button className="button secondary">Show</button><Link href="/calendar" className="text-button">Today</Link></form>
 <div className="calendar-period"><Link href={link(previous.toISOString().slice(0,10))}>← Previous</Link><strong>{range.days[0]}{range.days.length>1?' — '+range.days.at(-1):''}</strong><Link href={link(next.toISOString().slice(0,10))}>Next →</Link></div>
 {results.slice(0,3).some(r=>(r.data?.length??0)>500)&&<p role="status">This period has more than 500 items of one type. Only the first 500 are shown; choose a day to narrow the results.</p>}
 <div className={'calendar-days calendar-'+range.mode}>{range.days.map(day=><section className="calendar-day" key={day}><h2><Link href={link(day,'today')}>{new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(day))}</Link></h2>{entries.filter(e=>e.date.slice(0,10)===day).map(card)}{!entries.some(e=>e.date.slice(0,10)===day)&&<p className="muted">Nothing scheduled</p>}</section>)}</div>
 <div className="calendar-bottom"><section className="panel"><h2>Overdue follow-ups</h2><p className="muted">Oldest 50 pending reminders, across all dates.</p>{overdue.map(entry=><div key={entry.id}><p className="muted">Due {entry.date.slice(0,10)}</p>{card(entry)}</div>)}{!overdue.length&&<p>No overdue follow-ups.</p>}{(results[3].data?.length??0)>50&&<p>More overdue reminders remain. Complete these to reveal the next ones.</p>}</section>
 <section className="panel" id="new-reminder"><h2>Create a reminder or meeting</h2><p className="muted">Reminders appear here and in the calling queue. They do not send email or push notifications.</p><form className="form"><input type="hidden" name="date" value={range.date}/><input type="hidden" name="view" value={range.mode}/><label>Find prospect by company<input name="q" defaultValue={q} maxLength={100}/></label><button className="button secondary">Search prospects</button></form><p className="muted">Showing up to 20 matches. Refine the search if needed.</p>{leads?.length?<ScheduleForm key={leads.map(l=>l.id).join(',')} leads={leads}/>:<p>No matching prospects. <Link className="company-link" href="/leads/new">Add a lead</Link> first.</p>}</section></div></>;
}
