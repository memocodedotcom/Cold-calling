export type Recommendation={id:string;title:string;reason:string;action:'call'|'schedule'|'edit'|'calendar'|'review';priority:'high'|'normal'};
export type RecommendationContext={status:string;industry:string|null;phone:string|null;createdAt:string;lastOutreach:string|null;lastOutcome:string|null;nextTask:string|null;nextMeeting:string|null};
export const recommendationVersion='rules-v1';
export function recommend(context:RecommendationContext,now=new Date()):Recommendation[]{
 const {status,industry,phone,createdAt,lastOutreach,lastOutcome,nextTask,nextMeeting}=context;
 const results:Recommendation[]=[];
 const add=(id:string,title:string,reason:string,action:Recommendation['action'],priority:Recommendation['priority']='normal')=>results.push({id,title,reason,action,priority});
 const time=(v:string|null)=>v&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
 const current=now.getTime(),meeting=time(nextMeeting),task=time(nextTask),outreach=time(lastOutreach);
 if(['won','lost'].includes(status)){add('closed','Review before reopening',`This prospect is marked ${status}. Routine cold-call suggestions are paused.`,'review');return results;}
 if(lastOutcome==='not_interested'){add('declined','Review the last conversation','The latest recorded call was Not interested. Review the notes before planning further outreach.','review','high');return results;}
 if(meeting!==null){add(meeting<current?'meeting-overdue':'meeting-prep',meeting<current?'Update the meeting outcome':'Prepare discovery questions',meeting<current?'A scheduled meeting time has passed. Record its outcome or review the schedule.':'A meeting is already scheduled. Review previous notes and prepare questions about the current workflow.','calendar',meeting<current?'high':'normal');}
 else if(status==='meeting_scheduled'){add('missing-meeting','Confirm the meeting date','The lead is in Meeting scheduled, but no scheduled meeting record was found.','schedule','high');}
 else if(['demo','trial'].includes(status)){add('advanced-stage','Agree on the next milestone',`This prospect is in ${status}. Review progress and confirm the next step instead of using an opening cold-call pitch.`,'review');}
 else if(!phone?.trim()||lastOutcome==='wrong_number'){add('phone','Verify the phone number',lastOutcome==='wrong_number'?'The latest call was marked Wrong number. Correct the contact before calling again.':'No phone number is saved for this prospect.','edit','high');}
 else if(task!==null&&task>current){add('scheduled','Keep the agreed follow-up','A future follow-up is already scheduled. Check its timing before adding another.','calendar');}
 else if(outreach!==null&&new Date(outreach).toISOString().slice(0,10)===now.toISOString().slice(0,10)){add('recent','Review today’s outreach','An outreach interaction is already recorded today (UTC). Review the result before trying again.','review');}
 else if(task!==null){add('due','Follow up today','A pending follow-up is due. Review the previous notes before contacting the prospect.','call','high');}
 else if(current-(outreach??time(createdAt)??current)>3*86400000){add('stale','Follow up today',outreach===null?'This lead was added more than three days ago with no recorded outreach.':'The last recorded outreach was more than three days ago and no next step is scheduled.','call','high');}
 else if(status==='interested'){add('interest','Agree on a next step','This prospect is Interested and has no scheduled follow-up or meeting.','schedule');}
 else{add('introduce','Prepare your next conversation','Review the prospect details and decide what you want to learn before calling.','call');}
 if(!['demo','trial','meeting_scheduled'].includes(status)&&meeting===null&&lastOutcome!=='wrong_number'&&phone?.trim()){
  if(/distribut|wholesale/i.test(industry??''))add('inventory-angle','Use an inventory management angle','The saved industry suggests distribution or wholesale. Ask how stock availability and customer orders are kept in sync; confirm whether this is a real pain point.','review');
  else add('discovery-angle','Start with the current workflow','Ask which manual step takes the most time. This is a conversation prompt, not an inferred fact about the company.','review');
 }
 return results;
}
