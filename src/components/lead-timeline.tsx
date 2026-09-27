import Link from 'next/link';
import { outcomes, type Outcome } from '@/lib/calling';
import { statuses } from '@/lib/crm';
export const timelineKinds={all:'All activity',call:'Calls',note:'Notes',status_change:'Status changes',meeting:'Meetings',whatsapp:'WhatsApp',email:'Email'};
export type TimelineEvent={event_id:string;kind:string;event_date:string;notes:string;outcome:string|null;duration:number|null;meeting_status:string|null};
function statusNote(note:string){return note.split(' → ').map(value=>statuses[value as keyof typeof statuses]??value).join(' → ');}
export function LeadTimeline({events,id,page,count,kind}:{events:TimelineEvent[];id:string;page:number;count:number;kind:keyof typeof timelineKinds}){
 const href=(n:number)=>`/leads/${id}?history=${n}&kind=${kind}#timeline`;
 return <section className="panel" id="timeline"><div className="section-heading"><h2>Activity timeline</h2><span className="muted">{count} entries · UTC</span></div>
 <form className="timeline-filter" action={'/leads/'+id+'#timeline'}><label htmlFor="timeline-kind">Show</label><select id="timeline-kind" name="kind" defaultValue={kind}>{Object.entries(timelineKinds).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><button className="button secondary">Apply</button></form>
 <p className="muted">Newest first. Meetings appear at their scheduled time; their status shows whether they took place.</p>
 {events.length?<ol className="activity-list timeline-list">{events.map(event=><li key={event.event_id}><div><strong>{event.kind==='status_change'?'Status changed':event.kind==='call'?(event.outcome?'Call recorded':'Call activity'):event.kind==='meeting'?(event.meeting_status?'Meeting · '+event.meeting_status.replaceAll('_',' '):'Meeting activity'):timelineKinds[event.kind as keyof typeof timelineKinds]??event.kind}</strong><time dateTime={event.event_date}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(event.event_date))} UTC</time></div>
 {event.outcome&&<p><strong>Result: {outcomes[event.outcome as Outcome]??event.outcome}</strong>{event.duration!==null&&<span className="muted"> · {event.duration} seconds</span>}</p>}
 {event.notes?<p>{event.kind==='status_change'?statusNote(event.notes):event.notes}</p>:<p className="muted">No notes added.</p>}</li>)}</ol>:<p className="muted">No matching activity yet.</p>}
 <nav className="pagination" aria-label="Timeline pages">{page>1&&<Link href={href(page-1)}>← Newer</Link>}<span>Page {page}</span>{count>page*30&&<Link href={href(page+1)}>Older →</Link>}</nav></section>;
}
