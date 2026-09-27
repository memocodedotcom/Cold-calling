export type PreparationInput={company:string;industry:string|null;city:string|null;contact:string|null;status:string;lastOutcome:string|null;inventory?:string;locations?:string};
export function prepareCall(input:PreparationInput){
 const facts=[{label:'Company',value:input.company},{label:'Industry',value:input.industry||'Not recorded'},{label:'City',value:input.city||'Not recorded'},{label:'Contact',value:input.contact||'Not recorded'}];
 const paused=['won','lost'].includes(input.status)||input.lastOutcome==='not_interested';
 if(paused)return {facts,mode:'Review only',basis:'Closed lead or a recorded Not interested outcome.',objective:'Review the history and confirm whether further contact is appropriate.',painPoints:[],questions:[],opener:null};
 if(input.lastOutcome==='wrong_number')return {facts,mode:'Verify contact',basis:'Latest call outcome: Wrong number.',objective:'Verify the contact number before preparing another call.',painPoints:[],questions:[],opener:null};
 const stock=/distribut|wholesale|construction|building|btp|equipment/i.test(input.industry??'')||['moderate','complex'].includes(input.inventory??'');
 const painPoints=stock?['Stock visibility across orders','Manual stock updates','Coordination between sales and operations']:['Manual handoffs','Tracking customer requests','Team coordination'];
 const questions=stock?['How do you currently track stock availability?','What happens when an order changes or an item is unavailable?','Which update takes the most time to keep accurate?']:['How do you currently track customer requests?','Where does work get handed from one person to another?','Which manual step takes the most time each week?'];
 if(input.locations==='yes'){painPoints.push('Consistency across locations');questions.push('How do your locations share updates and avoid duplicate work?');}
 const advanced=['meeting_scheduled','demo','trial'].includes(input.status);
 if(advanced)questions.unshift('What has changed since our last conversation, and what should we focus on today?');
 else if(input.status==='interested')questions.unshift('Which issue would be most useful to explore next?');
 questions.push('Who else should be involved, and what next step would be useful?');
 return {facts,mode:advanced?'Continue discovery':'Prepare discovery',basis:stock?'Saved industry or confirmed inventory complexity.':'General workflow discovery; no industry-specific assumption.',objective:advanced?'Confirm progress, unanswered questions, and the next decision.':'Understand the current workflow and agree on one useful next step.',painPoints,questions,opener:advanced?'Thanks for making time. What would make this conversation useful for you today?':'Hello, I would like to understand how your team manages day-to-day work. Is now a suitable time for a brief question?'};
}
