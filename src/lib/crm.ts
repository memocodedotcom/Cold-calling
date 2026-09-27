export const statuses = { new:'New', contact_attempt:'Contact attempt', contacted:'Contacted', interested:'Interested', meeting_scheduled:'Meeting scheduled', demo:'Demo', trial:'Trial', won:'Won', lost:'Lost' } as const;
export const priorities = { low:'Low', normal:'Normal', high:'High', urgent:'Urgent' } as const;
export type Lead = {
 id:string; company_id:string; contact_id:string|null; company_name:string; industry:string|null; city:string|null;
 address:string|null; website:string|null; google_maps_url:string|null; company_size:string|null; source:string|null;
 company_created_by:string|null; contact_name:string|null; phone:string|null; email:string|null; position:string|null;
 status:keyof typeof statuses; priority:keyof typeof priorities; score:number; created_at:string; updated_at:string;
 last_activity:string|null; next_action:string|null; next_action_date:string|null;
};
export function safeUrl(value:string|null) {
 if (!value) return undefined;
 try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : undefined; } catch { return undefined; }
}
export function dateLabel(value:string|null) {
 return value ? new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value)) : '—';
}
export function readLeadForm(form:FormData) {
 const field = (name:string,max=250) => {
  const value=String(form.get(name)??'').trim();
  if(value.length>max) throw new Error(`${name.replaceAll('_',' ')} is too long.`);
  return value || null;
 };
 const status=field('status'), priority=field('priority');
 if(!status || !Object.hasOwn(statuses,status) || !priority || !Object.hasOwn(priorities,priority)) throw new Error('Choose a valid status and priority.');
 const company_name=field('company_name');
 const company = form.get('company_readonly')==='true' ? null : {
  company_name, industry:field('industry'), city:field('city'), address:field('address',1000),
  website:field('website',2000), google_maps_url:field('google_maps_url',2000), company_size:field('company_size'), source:field('source'),
 };
 if(company && !company_name) throw new Error('Company name is required.');
 if(company) for(const url of [company.website,company.google_maps_url]) if(url && !safeUrl(url)) throw new Error('Use a full website URL starting with https:// or http://.');
 const name=field('contact_name',150), phone=field('phone',60), email=field('email',254), position=field('position');
 if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid contact email.');
 if(!name && (phone || email || position)) throw new Error('Add the contact’s name with their details.');
 return { company, contact:name?{name,phone,email,position}:null, status, priority };
}
