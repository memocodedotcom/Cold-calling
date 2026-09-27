export const scoringFields={
 industry_fit:{label:'Industry fit',help:'Confirm that the industry matches your target customer profile.',options:{unknown:['Unknown',0],yes:['Confirmed fit',30],no:['Not a fit',0]}},
 company_size:{label:'Company size',help:'Use the confirmed employee count.',options:{unknown:['Unknown',0],small:['1–9 employees',5],medium:['10–49 employees',10],large:['50+ employees',20]}},
 inventory:{label:'Inventory complexity',help:'Simple: one straightforward stock flow. Moderate: several stock flows. Complex: many stock flows or systems.',options:{unknown:['Unknown',0],simple:['Simple / no inventory',0],moderate:['Moderate',10],complex:['Complex',20]}},
 locations:{label:'Multiple locations',help:'Confirm whether the company operates from more than one location.',options:{unknown:['Unknown',0],yes:['Yes',15],no:['No',0]}},
 interest:{label:'Previous interest',help:'Confirm expressed interest from conversation history; this is not inferred from a status.',options:{unknown:['Unknown',0],yes:['Confirmed interest',15],no:['No confirmed interest',0]}},
} as const;
export type Qualification=Partial<Record<keyof typeof scoringFields,string>>;
export function scoreBand(score:number){return score>=80?'Hot':score>=50?'Warm':'Cold';}
export function scoreBreakdown(q:Qualification){return Object.entries(scoringFields).map(([key,field])=>{const value=q[key as keyof Qualification]??'unknown';const choice=(field.options as Record<string,readonly [string,number]>)[value]??['Unknown',0];return {key,label:field.label,value:choice[0],points:choice[1]};});}
