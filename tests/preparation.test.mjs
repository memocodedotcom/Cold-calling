import {test} from 'node:test';import assert from 'node:assert/strict';import {prepareCall} from '../src/lib/preparation.ts';
const base={company:'Example',industry:null,city:null,contact:null,status:'new',lastOutcome:null};
test('preparation distinguishes saved facts, hypotheses, advanced stages and suppressed outreach',()=>{
 const generic=prepareCall(base);assert.equal(generic.facts[1].value,'Not recorded');assert.ok(!generic.painPoints.some(p=>p.includes('Stock')));
 const inventory=prepareCall({...base,industry:'BTP equipment',locations:'yes'});assert.ok(inventory.painPoints.includes('Stock visibility across orders'));assert.ok(inventory.questions.some(q=>q.includes('locations')));
 assert.ok(prepareCall({...base,inventory:'complex'}).painPoints.some(p=>p.includes('Stock')));
 assert.equal(prepareCall({...base,status:'trial'}).mode,'Continue discovery');
 for(const input of [{status:'won'},{status:'lost'},{lastOutcome:'not_interested'},{lastOutcome:'wrong_number'}]){const brief=prepareCall({...base,...input});assert.equal(brief.opener,null);assert.equal(brief.questions.length,0);}
});
