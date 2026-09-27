import {test} from 'node:test';import assert from 'node:assert/strict';import {recommend} from '../src/lib/recommendations.ts';
const now=new Date('2026-09-22T12:00:00Z');const base={status:'new',industry:'Distributor',phone:'+3312345',createdAt:'2026-09-01T00:00:00Z',lastOutreach:null,lastOutcome:null,nextTask:null,nextMeeting:null};
test('recommendations prioritize scheduling and suppress conflicting cold-call prompts',()=>{
 assert.equal(recommend(base,now)[0].id,'stale');assert.equal(recommend(base,now)[1].id,'inventory-angle');
 assert.deepEqual(recommend({...base,status:'won'},now).map(r=>r.id),['closed']);
 assert.deepEqual(recommend({...base,lastOutcome:'not_interested'},now).map(r=>r.id),['declined']);
 assert.equal(recommend({...base,nextTask:'2026-09-25T12:00:00Z'},now)[0].id,'scheduled');
 assert.equal(recommend({...base,nextTask:'2026-09-20T12:00:00Z'},now)[0].id,'due');
 assert.equal(recommend({...base,nextMeeting:'2026-09-25T12:00:00Z'},now)[0].id,'meeting-prep');
 assert.equal(recommend({...base,nextMeeting:'2026-09-20T12:00:00Z'},now)[0].id,'meeting-overdue');
 assert.equal(recommend({...base,phone:null},now)[0].id,'phone');
 assert.equal(recommend({...base,lastOutcome:'wrong_number'},now)[0].id,'phone');
 assert.equal(recommend({...base,lastOutreach:'2026-09-22T10:00:00Z'},now)[0].id,'recent');
 assert.equal(recommend({...base,status:'meeting_scheduled'},now)[0].id,'missing-meeting');
 assert.equal(recommend({...base,status:'trial'},now)[0].id,'advanced-stage');
});
