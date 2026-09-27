import Link from 'next/link';
import {requireProfile} from '@/lib/auth';
import {ImportWizard} from '@/components/import-wizard';
export default async function ImportPage(){
 await requireProfile();
 return <><Link href="/leads" className="back-link">← All leads</Link><span className="eyebrow">GROW YOUR PROSPECT DIRECTORY</span><h1>Import leads</h1><p className="muted">Upload your list, match the columns, and review before importing.</p><ImportWizard/></>;
}
