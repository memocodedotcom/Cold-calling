import Link from 'next/link';
import {requireProfile} from '@/lib/auth';
import type {Lead} from '@/lib/crm';
import {prepareCall} from '@/lib/preparation';
import {outcomes,type Outcome} from '@/lib/calling';
export async function CallPreparation({lead}:{lead:Lead}){
 const {supabase}=await requireProfile();
 const [qualification,calls,notes]=await Promise.all([
  supabase.from('leads').select('qualification').eq('id',lead.id).single(),
  supabase.from('calls').select('date,outcome,notes').eq('lead_id',lead.id).lte('date',new Date().toISOString()).order('date',{ascending:false}).order('id').limit(1),
  supabase.from('activities').select('id,date,notes').eq('lead_id',lead.id).eq('type','note').order('date',{ascending:false}).order('id').limit(2),
 ]);
 if(qualification.error||calls.error||notes.error)return <section className="panel"><h2>Before you call</h2><p>Preparation could not be loaded. Refresh before relying on the brief.</p></section>;
 const lastCall=calls.data?.[0];const q=qualification.data?.qualification??{};
 const brief=prepareCall({company:lead.company_name,industry:lead.industry,city:lead.city,contact:lead.contact_name,status:lead.status,lastOutcome:lastCall?.outcome??null,inventory:q.inventory,locations:q.locations});
 return <section className="panel preparation" id="call-preparation"><span className="eyebrow">BEFORE YOU CALL</span><h2>{brief.mode}</h2><p>{brief.objective}</p><dl className="details">{brief.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
 <details><summary>Recent context from your records</summary>{lastCall?<div className="preparation-excerpt"><strong>Last call · {outcomes[lastCall.outcome as Outcome]}</strong><time>{new Date(lastCall.date).toISOString().slice(0,16).replace('T',' ')} UTC</time><p>{lastCall.notes||'No call notes recorded.'}</p></div>:<p className="muted">No structured calls recorded.</p>}{notes.data?.map(note=><div className="preparation-excerpt" key={note.id}><strong>Saved note</strong><time>{new Date(note.date).toISOString().slice(0,16).replace('T',' ')} UTC</time><p>{note.notes}</p></div>)}{!notes.data?.length&&<p className="muted">No preparation notes recorded.</p>}<Link href={'/leads/'+lead.id+'#timeline'} className="company-link">Review full timeline →</Link></details>
 {brief.opener&&<><h3>Suggested opening</h3><p className="preparation-opener">{brief.opener}</p></>}
 {brief.painPoints.length>0&&<><h3>Possible pain points to explore</h3><p className="muted">{brief.basis} These are hypotheses to confirm, not known company problems.</p><ul>{brief.painPoints.map(point=><li key={point}>{point}</li>)}</ul><h3>Questions to ask</h3><ol>{brief.questions.map(question=><li key={question}>{question}</li>)}</ol></>}
 <p className="muted">Generated from saved CRM details and fixed templates. Review the suggested next steps below for timing before making contact.</p></section>;
}

