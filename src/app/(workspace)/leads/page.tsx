import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { statuses,priorities,dateLabel,type Lead } from '@/lib/crm';
export default async function Leads({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {supabase}=await requireProfile();
 const params=await searchParams;
 const get=(key:string)=>typeof params[key]==='string'?(params[key] as string).slice(0,250):'';
 const q=get('q'),industry=get('industry'),city=get('city'),status=get('status'),priority=get('priority'),from=get('from'),to=get('to');
 const page=Math.max(1,Math.min(100000,Number.parseInt(get('page'))||1));
 let query=supabase.from('lead_directory').select('*',{count:'exact'});
 const search=q.replace(/[^\p{L}\p{N} @+.'-]/gu,'');
 if(search) query=query.or(`company_name.ilike."%${search}%",phone.ilike."%${search}%",contact_name.ilike."%${search}%"`);
 if(industry) query=query.ilike('industry',industry.replace(/[%_]/g,''));
 if(city) query=query.ilike('city',city.replace(/[%_]/g,''));
 if(Object.hasOwn(statuses,status)) query=query.eq('status',status);
 if(Object.hasOwn(priorities,priority)) query=query.eq('priority',priority);
 const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(validDate(from)) query=query.gte('created_at',from+'T00:00:00Z');
 if(validDate(to)) query=query.lte('created_at',to+'T23:59:59.999999Z');
 const {data,error,count}=await query.order('created_at',{ascending:false}).order('id').range((page-1)*25,page*25-1);
 if(error) throw new Error('Unable to load leads.');
 const leads=(data??[]) as Lead[];
 const pageLink=(n:number)=>{const next=new URLSearchParams();for(const [k,v]of Object.entries(params))if(typeof v==='string'&&k!=='page')next.set(k,v);next.set('page',String(n));return '/leads?'+next;};
 return <><div className="page-heading"><div><span className="eyebrow">PROSPECT DIRECTORY</span><h1>Leads</h1><p className="muted">Every prospect, with the context to move forward.</p></div><div className="form-actions"><Link className="button secondary" href="/leads/import">Import leads</Link><Link className="button" href="/leads/new">+ Add lead</Link></div></div>
 <form className="panel filters" action="/leads"><label className="search-field">Search<input name="q" defaultValue={q} placeholder="Company, phone, or contact"/></label><label>Industry<input name="industry" defaultValue={industry} placeholder="Any industry"/></label><label>City<input name="city" defaultValue={city} placeholder="Any city"/></label><label>Status<select name="status" defaultValue={status}><option value="">All statuses</option>{Object.entries(statuses).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Priority<select name="priority" defaultValue={priority}><option value="">All priorities</option>{Object.entries(priorities).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Added from (UTC)<input type="date" name="from" defaultValue={from}/></label><label>Added through (UTC)<input type="date" name="to" defaultValue={to}/></label><div className="filter-actions"><button className="button secondary">Apply filters</button><Link href="/leads" className="text-button">Reset</Link></div></form>
 <div className="section-heading"><h2>{count??0} {(count??0)===1?'lead':'leads'}</h2><span className="muted">Newest first · Dates in UTC</span></div>
 {leads.length?<section className="panel lead-table"><div className="table-wrap"><table><thead><tr>{['Company','Industry','Phone','Status','Priority','Last activity','Next action'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{leads.map(l=><tr key={l.id}><td><Link className="company-link" href={'/leads/'+l.id}>{l.company_name}</Link><span className="table-email">{[l.contact_name,l.city].filter(Boolean).join(' · ')||'No contact added'}</span></td><td>{l.industry||'—'}</td><td>{l.phone||'—'}</td><td><span className={'status-pill status-'+l.status}>{statuses[l.status]}</span></td><td><span className={'priority priority-'+l.priority}>{priorities[l.priority]}</span></td><td>{dateLabel(l.last_activity)}</td><td>{l.next_action||'Not scheduled'}{l.next_action_date&&<span className="table-email">{dateLabel(l.next_action_date)}</span>}</td></tr>)}</tbody></table></div></section>:<section className="panel empty-state"><h2>{q||industry||city||status||priority||from||to||page>1?'No leads match this view.':'Your next conversation starts here.'}</h2><p className="muted">Add a prospect, or adjust your filters to find an existing lead.</p><Link className="button" href="/leads/new">Add your first lead</Link></section>}
 <nav className="pagination" aria-label="Lead pages">{page>1&&<Link className="button secondary" href={pageLink(page-1)}>← Previous</Link>}<span>Page {page} of {Math.max(1,Math.ceil((count??0)/25))}</span>{page*25<(count??0)&&<Link className="button secondary" href={pageLink(page+1)}>Next →</Link>}</nav></>;
}
