import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readLeadForm,safeUrl} from '../src/lib/crm.ts';

const form=(values={})=>{
 const result=new FormData();
 for(const [k,v]of Object.entries({company_name:'Example Company',status:'new',priority:'normal',...values})) result.set(k,v);
 return result;
};
test('lead validation rejects unsafe links, invalid options, and incomplete contacts',()=>{
 assert.equal(safeUrl('javascript:alert(1)'),undefined);
 assert.equal(safeUrl('https://example.com'),'https://example.com/');
 assert.throws(()=>readLeadForm(form({website:'javascript:alert(1)'})),/full website URL/);
 assert.throws(()=>readLeadForm(form({status:'toString'})),/valid status/);
 assert.throws(()=>readLeadForm(form({phone:'123'})),/contact’s name/);
 assert.throws(()=>readLeadForm(form({contact_name:'Person',email:'invalid'})),/valid contact email/);
 assert.throws(()=>readLeadForm(form({company_name:'  '})),/required/);
 assert.equal(readLeadForm(form({company_readonly:'true'})).company,null);
 assert.equal(readLeadForm(form({company_name:'  Example  '})).company.company_name,'Example');
});
