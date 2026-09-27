import ExcelJS from 'exceljs';
import {parse} from 'csv-parse/sync';
import {unzipSync} from 'fflate';
import type {ImportSheet} from './import-model.ts';
export const MAX_FILE_BYTES=2*1024*1024;
function sheet(name:string,records:{line:number;cells:string[]}[]):ImportSheet{
 const useful=records.filter(row=>row.cells.some(c=>c.trim()));
 if(useful.length<2)throw new Error('Include a header row and at least one data row.');
 const first=useful[0];
 if(first.cells.length>50)throw new Error('Use no more than 50 columns.');
 if(useful.length>501)throw new Error('Use no more than 500 data rows per sheet.');
 return {name,headers:first.cells.map((h,i)=>h.trim()||'Column '+(i+1)),rows:useful.slice(1).map(r=>({line:r.line,cells:first.cells.map((_,i)=>r.cells[i]??'')}))};
}
export async function parseImportFile(name:string,bytes:Uint8Array,delimiter=','):Promise<ImportSheet[]>{
 if(bytes.byteLength===0||bytes.byteLength>MAX_FILE_BYTES)throw new Error('Choose a nonempty file up to 2 MB.');
 if(/\.csv$/i.test(name)){
  if(![',',';','\t'].includes(delimiter))throw new Error('Choose a supported delimiter.');
  let records:string[][];
  try{
   const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   records=parse(text,{bom:true,delimiter,skip_empty_lines:true,max_record_size:25000,relax_column_count:false}) as string[][];
  }catch{throw new Error('Could not read CSV. Use UTF-8, check the delimiter, and make sure each row has the same number of columns.');}
  return [sheet(name,records.map((cells,i)=>({line:i+1,cells})))];
 }
 if(!/\.xlsx$/i.test(name))throw new Error('Use a .csv or .xlsx file. Save older .xls files as .xlsx first.');
 try{
  let total=0,entries=0;
  unzipSync(bytes,{filter(entry){
   total+=entry.originalSize;entries++;
   if(total>20*1024*1024||entries>300)throw new Error('Workbook expands beyond the supported size.');
   return false;
  }});
 }catch{throw new Error('This workbook is invalid or too large when expanded. Export the lead sheet as CSV instead.');}
 const book=new ExcelJS.Workbook();
 try{await book.xlsx.load(bytes as unknown as ExcelJS.Buffer);}catch{throw new Error('Could not read this workbook. Save an unencrypted .xlsx file and try again.');}
 const result:ImportSheet[]=[];
 for(const ws of book.worksheets.filter(w=>w.state==='visible')){
  if(ws.rowCount>501||ws.columnCount>50)throw new Error('Each sheet may contain up to 500 rows plus a header and 50 columns.');
  const records:{line:number;cells:string[]}[]=[];
  ws.eachRow((row,line)=>{
   const cells:string[]=[];
   for(let i=1;i<=ws.columnCount;i++){
    const cell=row.getCell(i),value=cell.value;
    if(value&&typeof value==='object'&&('formula'in value||'sharedFormula'in value))throw new Error('Replace formulas with pasted values before importing (sheet '+ws.name+', row '+line+').');
    let text=cell.text;
    if(typeof value==='number'&&/^0{2,30}$/.test(cell.numFmt)) text=String(value).padStart(cell.numFmt.length,'0');
    if(text.length>20000)throw new Error('A cell exceeds 20,000 characters.');
    cells.push(text);
   }
   records.push({line,cells});
  });
  if(records.filter(r=>r.cells.some(c=>c.trim())).length>=2)result.push(sheet(ws.name,records));
 }
 if(!result.length)throw new Error('No visible sheet contains headers and data.');
 if(new TextEncoder().encode(JSON.stringify(result)).length>2*1024*1024)throw new Error('The extracted worksheet data is too large. Split it into smaller files.');
 if(result.reduce((n,s)=>n+s.rows.length,0)>1000)throw new Error('Use a workbook with at most 1,000 data rows in total, and 500 per sheet.');
 return result;
}
