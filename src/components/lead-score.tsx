import {requireProfile} from '@/lib/auth';
import {scoreBand,scoreBreakdown,type Qualification} from '@/lib/scoring';
import {ScoreForm} from '@/components/score-form';
export async function LeadScore({id}:{id:string}){
 const {supabase}=await requireProfile();const {data,error}=await supabase.from('leads').select('score,qualification,updated_at,status').eq('id',id).maybeSingle();
 if(error||!data)return <section className="panel"><h2>Lead score</h2><p>Scoring is unavailable. Check the scoring database update and refresh.</p></section>;
 const qualification=data.qualification as Qualification;const rows=scoreBreakdown(qualification);const known=rows.filter(row=>row.value!=='Unknown').length;
 return <section className="panel lead-score"><h2>Lead score <span className="badge">{scoreBand(data.score)}</span></h2><strong className="score-total">{data.score}<small> / 100</small></strong><p className="muted">{known}/5 factors qualified. Unknown factors add no points; a low score may mean missing information.</p>{['won','lost'].includes(data.status)&&<p className="muted">This lead is closed. The score describes qualification, not permission to resume outreach.</p>}<dl className="details">{rows.map(row=><div key={row.key}><dt>{row.label}</dt><dd>{row.value} <strong>+{row.points}</strong></dd></div>)}</dl><p className="muted">Hot: 80–100 · Warm: 50–79 · Cold: 0–49. A qualification aid, not a conversion probability.</p><ScoreForm key={data.updated_at} id={id} updatedAt={data.updated_at} qualification={qualification}/></section>;
}
