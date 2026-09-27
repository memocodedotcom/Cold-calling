import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { dateLabel, priorities, statuses, type Lead } from '@/lib/crm';

export default async function Dashboard() {
  const { profile, supabase } = await requireProfile();
  const now = new Date();
  const start = new Date(now); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  const [queue, tasks, meetings, calls, leads, won] = await Promise.all([
    supabase.from('calling_queue').select('id,company_name,status,priority,next_action,next_action_date,last_activity', { count: 'exact' })
      .order('due_rank').order('next_action_date', { nullsFirst: false }).order('priority', { ascending: false }).order('created_at').order('id').limit(5),
    supabase.from('tasks').select('id,lead_id,title,due_date', { count: 'exact' }).eq('status', 'pending').lt('due_date', end.toISOString()).order('due_date').order('id').limit(5),
    supabase.from('meetings').select('id,lead_id,date', { count: 'exact' }).eq('status', 'scheduled').gte('date', start.toISOString()).lt('date', end.toISOString()).order('date').order('id').limit(5),
    supabase.from('calls').select('id', { head: true, count: 'exact' }).gte('date', start.toISOString()).lte('date', now.toISOString()),
    supabase.from('leads').select('id', { head: true, count: 'exact' }),
    supabase.from('leads').select('id', { head: true, count: 'exact' }).eq('status', 'won'),
  ]);
  if ([queue, tasks, meetings, calls, leads, won].some(result => result.error)) throw new Error('Unable to load your daily overview. Please try again.');
  const ids = [...new Set([...(tasks.data ?? []), ...(meetings.data ?? [])].map(row => row.lead_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const result = await supabase.from('lead_directory').select('id,company_name').in('id', ids);
    if (result.error) throw new Error('Unable to load prospect names.');
    for (const row of result.data ?? []) names.set(row.id, row.company_name);
  }
  const prospects = (queue.data ?? []) as Pick<Lead, 'id' | 'company_name' | 'status' | 'priority' | 'next_action' | 'next_action_date' | 'last_activity'>[];
  const time = (value: string) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));
  return <>
    <div className="page-heading"><div><span className="eyebrow">YOUR DAILY OVERVIEW</span><h1>Welcome, {profile.full_name.split(' ')[0] || 'there'}.</h1><p className="muted">{dateLabel(now.toISOString())} · UTC · {profile.role === 'admin' ? 'Workspace-wide' : 'Your assigned prospects'}</p></div><Link className="button" href="/calling">Start calling →</Link></div>
    <div className="analytics-kpis">{[['Ready to call', queue.count ?? 0], ['Follow-ups due by today', tasks.count ?? 0], ['Meetings today', meetings.count ?? 0], ['Calls recorded today', calls.count ?? 0], ['Total leads', leads.count ?? 0], ['Clients won', won.count ?? 0]].map(([label, value]) => <section className="panel analytics-kpi" key={label}><span>{label}</span><strong>{value}</strong></section>)}</div>
    <section className="panel analytics-section"><div className="section-heading"><h2>Who to call next</h2><Link className="company-link" href="/calling">Full calling queue →</Link></div><p className="muted">First five prospects, ordered by due action and priority. Open a prospect for preparation, previous notes, and call recording.</p>
      <ul className="activity-list">{prospects.map(lead => <li key={lead.id}><Link className="company-link" href={'/calling?lead=' + lead.id + '#prospect'}>{lead.company_name}</Link><p>{lead.next_action ? lead.next_action + ' · Due ' + dateLabel(lead.next_action_date) : lead.status === 'new' ? 'Introduce yourself and confirm the right contact.' : 'Continue the conversation and agree on a next step.'}</p><p className="muted">{statuses[lead.status]} · {priorities[lead.priority]} priority · {lead.last_activity ? 'Last interaction ' + dateLabel(lead.last_activity) : 'No recorded interactions'}</p></li>)}</ul>
      {!prospects.length && <p>No prospects are ready in the daily queue. <Link className="company-link" href="/leads">Review your leads</Link> for missing phone numbers or upcoming actions.</p>}
    </section>
    <div className="calendar-bottom"><section className="panel"><h2>Follow-ups to handle</h2><p className="muted">Oldest five pending reminders due today or earlier, including overdue work.</p><ul className="activity-list">{tasks.data?.map(task => <li key={task.id}><Link className="company-link" href={'/leads/' + task.lead_id}>{names.get(task.lead_id) ?? 'Prospect'}</Link><p>{task.title}</p><p className="muted">Due {dateLabel(task.due_date)} · {time(task.due_date)} UTC{Date.parse(task.due_date) < now.getTime() ? ' · Overdue' : ''}</p></li>)}</ul>{!tasks.data?.length && <p>No follow-ups due today.</p>}<Link className="button secondary" href="/calendar">Manage follow-ups</Link></section>
      <section className="panel"><h2>Meetings today</h2><p className="muted">First five scheduled meetings. Update outcomes in Calendar.</p><ul className="activity-list">{meetings.data?.map(meeting => <li key={meeting.id}><Link className="company-link" href={'/leads/' + meeting.lead_id}>{names.get(meeting.lead_id) ?? 'Prospect'}</Link><p>{time(meeting.date)} UTC{Date.parse(meeting.date) < now.getTime() ? ' · Review meeting outcome' : ''}</p></li>)}</ul>{!meetings.data?.length && <p>No meetings scheduled today.</p>}<Link className="button secondary" href="/calendar">Open calendar</Link></section></div>
    <section className="panel analytics-section"><h2>How is the campaign performing?</h2><p className="muted">Review calls, conversion, and industry performance. Totals reflect currently accessible prospects and their records.</p><Link className="button secondary" href="/analytics">Review analytics →</Link></section>
  </>;
}
