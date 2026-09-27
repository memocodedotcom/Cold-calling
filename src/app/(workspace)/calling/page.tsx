import {CallPreparation} from '@/components/call-preparation';
import {LeadScore} from '@/components/lead-score';
import {Recommendations} from '@/components/recommendations';
import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { getLead } from '@/lib/lead-data';
import { dateLabel, priorities, safeUrl, statuses, type Lead } from '@/lib/crm';
import { outcomes, phoneHref, type Outcome } from '@/lib/calling';
import { CallForm } from '@/components/call-form';
export default async function CallingPage({searchParams}:{searchParams:Promise<{lead?:string;page?:string}>}){
 const params=await searchParams;
 const page=Math.max(1,Math.min(10000,Number.parseInt(params.page??'1')||1));
 const {supabase}=await requireProfile();
 const {data,error,count}=await supabase.from('calling_queue').select('*',{count:'exact'})
  .order('due_rank').order('next_action_date',{nullsFirst:false}).order('priority',{ascending:false}).order('created_at').order('id').range((page-1)*25,page*25-1);
 if(error) throw new Error('Unable to load the calling queue. Check that the calling database update is installed.');
 const queue=(data??[]) as Lead[];
 const selected=params.lead??queue[0]?.id;
 const detail=selected?await getLead(selected):null;
 const lead=detail?.lead;
 const [notes,calls]=lead?await Promise.all([
  supabase.from('activities').select('id,date,notes,type').eq('lead_id',lead.id).neq('type','status_change').order('date',{ascending:false}).limit(10),
  supabase.from('calls').select('id,date,notes,outcome,duration').eq('lead_id',lead.id).order('date',{ascending:false}).limit(10),
 ]):[null,null];
 if(notes?.error||calls?.error) throw new Error('Unable to load call history. Try again.');
 const telephone=phoneHref(lead?.phone??null);
 return <><div className="page-heading"><div><span className="eyebrow">FOCUSED OUTREACH</span><h1>Calling workspace</h1><p className="muted">One prospect at a time. Context before every conversation.</p></div><Link className="button secondary" href="/leads">All leads ↗</Link></div>
 <div className="calling-layout"><aside className="panel calling-queue"><h2>Today’s queue <span className="badge">{count??0}</span></h2><p className="muted">Due follow-ups first, then priority. Today uses UTC.</p>
 <nav aria-label="Daily calling queue">{queue.map(item=><Link href={'/calling?lead='+item.id+'&page='+page+'#prospect'} key={item.id} aria-current={item.id===selected?'page':undefined} className={'queue-item '+(item.id===selected?'selected':'')}><strong>{item.company_name}</strong><span>{[item.industry,item.city].filter(Boolean).join(' · ')||'Company details not added'}</span><span>{item.next_action?item.next_action+' · '+dateLabel(item.next_action_date):'First or next conversation'}</span><span>{statuses[item.status]} · {priorities[item.priority]}</span></Link>)}</nav>
 {!queue.length&&<p>No prospects in this queue. Add a phone number to an active lead, or return when a follow-up is due.</p>}
 <div className="pagination">{page>1&&<Link href={'/calling?page='+(page-1)}>← Previous</Link>}{(count??0)>page*25&&<Link href={'/calling?page='+(page+1)}>Next →</Link>}</div><p className="queue-help muted">Excludes leads called today, future scheduled actions, and leads beyond the Interested stage. Open any other prospect from All leads.</p></aside>
 <div className="calling-profile" id="prospect">{lead?<><div className="mobile-call-actions">{telephone&&<a href={telephone} className="button">Call</a>}<a href="#call-preparation" className="button secondary">Prepare</a><a href="#record-call" className="button secondary">Log call</a></div><section className="panel"><div className="page-heading"><div><span className={'status-pill status-'+lead.status}>{statuses[lead.status]}</span><h2 className="prospect-title">{lead.company_name}</h2><p className="muted">{[lead.industry,lead.city].filter(Boolean).join(' · ')||'Industry and city not added'}</p></div><Link href={'/leads/'+lead.id} className="button secondary">Lead details ↗</Link></div>
 <dl className="details"><div><dt>Contact</dt><dd>{lead.contact_name||'Not added'}{lead.position?' · '+lead.position:''}</dd></div><div><dt>Phone</dt><dd>{telephone?<a className="company-link" href={telephone}>{lead.phone}</a>:lead.phone||'Not added'}</dd></div><div><dt>Email</dt><dd>{lead.email||'Not added'}</dd></div><div><dt>Address</dt><dd>{lead.address||'Not added'}</dd></div><div><dt>Company size</dt><dd>{lead.company_size||'Not added'}</dd></div><div><dt>Website</dt><dd>{safeUrl(lead.website)?<a href={safeUrl(lead.website)} target="_blank" rel="noreferrer" className="company-link">Visit website ↗</a>:'Not added'}</dd></div></dl>
 <div className="call-brief"><h3>Next action</h3><p>{lead.next_action?lead.next_action+' · '+dateLabel(lead.next_action_date):'No next action scheduled.'}</p></div></section>
 <CallPreparation lead={lead}/><details className="score-disclosure"><summary>Lead score & qualification</summary><LeadScore id={lead.id}/></details><Recommendations lead={lead}/><CallForm key={lead.id} lead={lead}/><div className="call-history"><section className="panel"><h2>Previous notes & interactions</h2><p className="muted">Latest 10 entries</p><ul className="activity-list">{notes?.data?.map(note=><li key={note.id}><div><strong>{note.type}</strong><time>{dateLabel(note.date)}</time></div><p>{note.notes||'No notes added.'}</p></li>)}</ul>{!notes?.data?.length&&<p className="muted">No previous notes.</p>}</section><section className="panel"><h2>Previous calls</h2><p className="muted">Latest 10 calls</p><ul className="activity-list">{calls?.data?.map(call=><li key={call.id}><div><strong>{outcomes[call.outcome as Outcome]}</strong><time>{dateLabel(call.date)} · {call.duration}s</time></div><p>{call.notes||'No notes added.'}</p></li>)}</ul>{!calls?.data?.length&&<p className="muted">No calls recorded yet.</p>}</section></div></>:<section className="panel empty-state"><h2>You’re clear for now</h2><p className="muted">Choose a prospect from your leads to prepare a call.</p><Link href="/leads" className="button">Browse leads</Link></section>}</div></div></>;
}





