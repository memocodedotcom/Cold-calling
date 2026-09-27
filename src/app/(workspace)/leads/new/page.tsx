import Link from 'next/link';
import { LeadForm } from '@/components/lead-forms';
import { requireProfile } from '@/lib/auth';
export default async function NewLead(){await requireProfile();return <><Link href="/leads" className="back-link">← All leads</Link><h1>Add a lead</h1><p className="muted">Start with a company. Add the contact details you already know.</p><LeadForm/></>;}
