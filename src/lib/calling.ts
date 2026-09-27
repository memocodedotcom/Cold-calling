export const outcomes = {no_answer:'No answer',wrong_number:'Wrong number',interested:'Interested',follow_up:'Follow-up',meeting_booked:'Meeting booked',not_interested:'Not interested'} as const;
export type Outcome = keyof typeof outcomes;
export function suggestedStatus(outcome:Outcome,current:string){
 if(outcome==='not_interested') return 'lost';
 if(outcome==='meeting_booked') return 'meeting_scheduled';
 if(outcome==='interested' && ['new','contact_attempt','contacted'].includes(current)) return 'interested';
 if(outcome==='follow_up' && ['new','contact_attempt'].includes(current)) return 'contacted';
 if(['no_answer','wrong_number'].includes(outcome) && current==='new') return 'contact_attempt';
 return current;
}
export function recommendedAngle(industry:string|null){
 if(/distribut|wholesale/i.test(industry??'')) return 'Ask how the team keeps stock availability and customer orders in sync.';
 return 'Ask how the team handles day-to-day work and which manual step takes the most time. Use their answer to guide the conversation.';
}
export function phoneHref(phone:string|null){
 const clean=(phone??'').replace(/[^+0-9]/g,'');
 return /^\+?\d{3,20}$/.test(clean)?'tel:'+clean:undefined;
}
