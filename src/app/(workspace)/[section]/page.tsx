import { notFound } from 'next/navigation';
import Link from 'next/link';
const sections: Record<string, [string, string, string]> = { leads: ['Leads', 'Your prospect directory', 'Lead management begins in Mission 3, after the CRM database is created.'], calling: ['Calling', 'Every conversation, in context', 'The calling queue and prospect workspace arrive in Mission 5.'], pipeline: ['Pipeline', 'See the next opportunity', 'The pipeline board arrives in Mission 7.'], calendar: ['Calendar', 'Make room for the next step', 'Meetings and follow-up scheduling arrive in Mission 8.'], analytics: ['Analytics', 'Understand what works', 'Campaign metrics and performance charts arrive in Mission 9.'] };
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const content = sections[section];
  if (!content) notFound();
  return <><span className="eyebrow">{content[0]}</span><h1>{content[1]}</h1><section className="empty-state panel"><span className="badge">Upcoming mission</span><h2>This workspace is next on the roadmap.</h2><p className="muted">{content[2]}</p><Link href="/dashboard" className="button secondary">Back to dashboard</Link></section></>;
}
