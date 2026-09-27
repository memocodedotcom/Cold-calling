import {test} from 'node:test';import assert from 'node:assert/strict';import {summarizeAnalytics} from '../src/lib/analytics.ts';
test('analytics deduplicates prospects, counts attempts, excludes cancelled meetings and handles UTC',()=>{
 const leads=[{id:'a',industry:'Medical',status:'won'},{id:'b',industry:' medical ',status:'new'},{id:'c',industry:null,status:'lost'}];
 const calls=[{lead_id:'a',date:'2026-09-21T23:30:00-02:00',outcome:'interested'},{lead_id:'a',date:'2026-09-22T02:00:00Z',outcome:'interested'},{lead_id:'b',date:'2026-09-22T03:00:00Z',outcome:'no_answer'},{lead_id:'private',date:'2026-09-22T00:00:00Z',outcome:'interested'}];
 const stats=summarizeAnalytics(leads,calls,[{lead_id:'a',status:'scheduled'},{lead_id:'a',status:'completed'},{lead_id:'b',status:'cancelled'}],7,new Date('2026-09-22T12:00:00Z'));
 assert.equal(stats.calls,3);assert.equal(stats.reached,1);assert.equal(stats.meetingProspects,1);assert.equal(stats.daily.at(-1).count,3);assert.equal(stats.niches.find(n=>n.industry==='Medical').leads,2);assert.equal(stats.funnel[1].count,2);assert.ok(Math.abs(stats.conversion-100/3)<0.0001);assert.equal(stats.meetingsBooked,2);
 const empty=summarizeAnalytics([],[],[],30);assert.equal(empty.conversion,0);assert.equal(empty.daily.length,30);
});

