import {test} from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {parseImportFile} from '../src/lib/import-parser.ts';
import {mapRows,suggestMapping,validateRows} from '../src/lib/import-model.ts';
const bytes=(s)=>new TextEncoder().encode(s);
test('CSV preserves phone text, quoted delimiters, multiline notes and BOM',async()=>{
 const [sheet]=await parseImportFile('leads.csv',bytes('\ufeffCompany Name,Phone,Industry,City,Notes\n"Acme, Ltd",001234,Medical,Paris,"First line\nSecond line"'));
 const preview=mapRows(sheet,suggestMapping(sheet.headers));
 assert.equal(preview.issues.length,0);
 assert.equal(preview.rows[0].company,'Acme, Ltd');
 assert.equal(preview.rows[0].phone,'001234');
 assert.equal(preview.rows[0].notes,'First line\nSecond line');
});
test('CSV separator and bad rows produce useful errors',async()=>{
 const [sheet]=await parseImportFile('leads.csv',bytes('Company;Phone\nExample;00123'),';');
 assert.equal(sheet.rows[0].cells[1],'00123');
 await assert.rejects(parseImportFile('bad.csv',bytes('Company,Phone\nExample,123,extra')),/Could not read CSV/);
 await assert.rejects(parseImportFile('old.xls',bytes('abc')),/older .xls/);
 await assert.rejects(parseImportFile('large.csv',new Uint8Array(2*1024*1024+1)),/2 MB/);
});
test('mapping is by column index and rejects missing companies and reused columns',()=>{
 const sheet={name:'Leads',headers:['Company','Company','Phone'],rows:[{line:2,cells:['','Actual','00123']}]};
 assert.equal(mapRows(sheet,{company:1,phone:2,industry:-1,city:-1,notes:-1}).rows[0].company,'Actual');
 assert.equal(mapRows(sheet,{company:0,phone:2,industry:-1,city:-1,notes:-1}).issues.length,1);
 assert.equal(mapRows(sheet,{company:1,phone:1,industry:-1,city:-1,notes:-1}).issues.length,1);
 assert.throws(()=>validateRows([{company:'',phone:'',industry:'',city:'',notes:''}]),/Company is required/);
 assert.throws(()=>validateRows(Array(501).fill({})),/500/);
});
test('XLSX supports sheet selection and formatted leading zeros, rejects formulas',async()=>{
 const book=new ExcelJS.Workbook();
 const first=book.addWorksheet('Prospects');
 first.addRow(['Company','Phone']);first.addRow(['Example',123]);first.getCell('B2').numFmt='00000';
 book.addWorksheet('Other').addRows([['Company'],['Second']]);
 let sheets=await parseImportFile('leads.xlsx',new Uint8Array(await book.xlsx.writeBuffer()));
 assert.equal(sheets.length,2);assert.equal(sheets[0].rows[0].cells[1],'00123');
 first.getCell('B2').value={formula:'1+1',result:2};
 await assert.rejects(parseImportFile('leads.xlsx',new Uint8Array(await book.xlsx.writeBuffer())),/Replace formulas/);
});

