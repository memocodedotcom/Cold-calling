import Link from 'next/link';
import {getLead} from '@/lib/lead-data';
import {LeadForm} from '@/components/lead-forms';
export default async function EditLead({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const {lead,profile}=await getLead(id);
 return <><Link className="back-link" href={'/leads/'+id}>← Back to lead</Link><h1>Edit {lead.company_name}</h1><LeadForm lead={lead} companyEditable={profile.role==='admin'||lead.company_created_by===profile.id}/></>;
}
