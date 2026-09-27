export const importFields = {company:'Company',phone:'Phone',industry:'Industry',city:'City',notes:'Notes'} as const;
export type ImportField=keyof typeof importFields;
export type Mapping=Record<ImportField,number>;
export type ImportRow={company:string;phone:string;industry:string;city:string;notes:string};
export type ImportSheet={name:string;headers:string[];rows:{line:number;cells:string[]}[]};
export type ImportPreview={rows:ImportRow[];issues:{line:number;message:string}[]};
export function suggestMapping(headers:string[]):Mapping{
 const aliases={company:['company','companyname','business','businessname','entreprise','societe'],phone:['phone','phonenumber','telephone','tel','mobile'],industry:['industry','sector','industrie','secteur'],city:['city','ville','town'],notes:['notes','note','comments','commentaires']};
 return Object.fromEntries(Object.entries(aliases).map(([key,names])=>[key,headers.findIndex(h=>names.includes(h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'')))])) as Mapping;
}
export function validateRows(value:unknown):ImportRow[]{
 if(!Array.isArray(value)||value.length<1||value.length>500) throw new Error('Import between 1 and 500 rows at a time.');
 const limits={company:250,phone:60,industry:250,city:250,notes:20000};
 return value.map((row,i)=>{
  if(!row||typeof row!=='object')throw new Error('Invalid row '+(i+1));
  const clean={} as ImportRow;
  for(const key of Object.keys(limits) as ImportField[]){
   const cell=(row as Record<string,unknown>)[key];
   if(typeof cell!=='string'||cell.length>limits[key]||cell.includes('\u0000'))throw new Error('Invalid '+key+' in row '+(i+1)+'.');
   clean[key]=cell.trim();
  }
  if(!clean.company)throw new Error('Company is required in row '+(i+1)+'.');
  return clean;
 });
}
export function mapRows(sheet:ImportSheet,mapping:Mapping):ImportPreview{
 const selected=Object.values(mapping).filter(v=>v>=0);
 if(mapping.company<0) return {rows:[],issues:[{line:1,message:'Map a column to Company.'}]};
 if(new Set(selected).size!==selected.length)return {rows:[],issues:[{line:1,message:'Use each source column only once.'}]};
 if(selected.some(v=>!Number.isInteger(v)||v>=sheet.headers.length))return {rows:[],issues:[{line:1,message:'Choose valid source columns.'}]};
 const rows:ImportRow[]=[],issues:ImportPreview['issues']=[];
 for(const entry of sheet.rows){
  const row=Object.fromEntries(Object.entries(mapping).map(([key,index])=>[key,index<0?'':entry.cells[index]??'']));
  try { rows.push(validateRows([row])[0]); } catch(e){issues.push({line:entry.line,message:e instanceof Error?e.message.replace(/ in row 1\./,'.'):'Invalid row.'});}
 }
 return {rows,issues};
}

