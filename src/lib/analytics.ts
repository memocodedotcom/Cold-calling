export type AnalyticsLead={id:string;industry:string|null;status:string};
export type AnalyticsCall={lead_id:string;date:string;outcome:string};
export type AnalyticsMeeting={lead_id:string;status:string};
export function summarizeAnalytics(leads:AnalyticsLead[],calls:AnalyticsCall[],meetings:AnalyticsMeeting[],days:number,now=new Date()){
 const ids=new Set(leads.map(l=>l.id));
 const validCalls=calls.filter(c=>ids.has(c.lead_id)&&Date.parse(c.date)<=now.getTime());
 const booked=new Set(meetings.filter(m=>ids.has(m.lead_id)&&m.status!=='cancelled').map(m=>m.lead_id));
 const called=new Set(validCalls.map(c=>c.lead_id));
 const reached=new Set(validCalls.filter(c=>['interested','follow_up','meeting_booked','not_interested'].includes(c.outcome)).map(c=>c.lead_id));
 const interested=new Set(validCalls.filter(c=>['interested','meeting_booked'].includes(c.outcome)).map(c=>c.lead_id));
 const won=new Set(leads.filter(l=>l.status==='won').map(l=>l.id));
 for(const lead of leads){if(['contact_attempt','contacted'].includes(lead.status))called.add(lead.id);if(['meeting_scheduled','demo','trial','won'].includes(lead.status))booked.add(lead.id);if(['interested','meeting_scheduled','demo','trial','won'].includes(lead.status))interested.add(lead.id);}
 // Later stages imply earlier milestones even when older calls were not imported.
 for(const id of booked)interested.add(id);for(const id of interested)called.add(id);
 const daily=Array.from({length:days},(_,index)=>{const date=new Date(now);date.setUTCHours(0,0,0,0);date.setUTCDate(date.getUTCDate()-days+index+1);return {date:date.toISOString().slice(0,10),count:0};});
 const dailyMap=new Map(daily.map(d=>[d.date,d]));for(const call of validCalls){const day=dailyMap.get(new Date(call.date).toISOString().slice(0,10));if(day)day.count++;}
 const niches=new Map<string,{industry:string;leads:number;calls:number;meetings:number;won:number}>();
 const industryByLead=new Map<string,string>();for(const lead of leads){const industry=lead.industry?.trim()||'Unspecified';const key=industry.toLocaleLowerCase('en');industryByLead.set(lead.id,key);const row=niches.get(key)??{industry,leads:0,calls:0,meetings:0,won:0};row.leads++;if(booked.has(lead.id))row.meetings++;if(won.has(lead.id))row.won++;niches.set(key,row);}
 for(const call of validCalls){const key=industryByLead.get(call.lead_id);if(key)niches.get(key)!.calls++;}
 return {total:leads.length,calls:validCalls.length,reached:reached.size,meetingProspects:booked.size,meetingsBooked:meetings.filter(m=>ids.has(m.lead_id)&&m.status!=='cancelled').length,won:won.size,conversion:leads.length?won.size/leads.length*100:0,daily,niches:[...niches.values()].sort((a,b)=>b.leads-a.leads||a.industry.localeCompare(b.industry)),funnel:[{label:'Leads',count:leads.length},{label:'Contact attempted',count:called.size},{label:'Interested',count:interested.size},{label:'Meeting stage',count:booked.size},{label:'Clients (Won)',count:won.size}]};
}

