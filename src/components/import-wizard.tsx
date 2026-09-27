'use client';
import {useMemo,useState,useTransition} from 'react';
import Link from 'next/link';
import {previewImport,commitImport} from '@/app/(workspace)/leads/import/actions';
import {importFields,mapRows,suggestMapping,type ImportSheet,type Mapping,type ImportField} from '@/lib/import-model';
export function ImportWizard(){
 const [sheets,setSheets]=useState<ImportSheet[]>([]),[selected,setSelected]=useState(0);
 const [mapping,setMapping]=useState<Mapping>({company:-1,phone:-1,industry:-1,city:-1,notes:-1});
 const [source,setSource]=useState(''),[batch,setBatch]=useState(''),[error,setError]=useState('');
 const [result,setResult]=useState<{imported:number;skipped:number}|null>(null);
 const [review,setReview]=useState(false),[pending,start]=useTransition();
 const current=sheets[selected];
 const preview=useMemo(()=>current?mapRows(current,mapping):{rows:[],issues:[]},[current,mapping]);
 function upload(form:FormData){
  setError('');start(async()=>{try{
   const response=await previewImport(form);
   if(response.error){setError(response.error);return;}
   const data=response.sheets!;
   setSheets(data);setSelected(0);setMapping(suggestMapping(data[0].headers));setSource((form.get('file') as File).name);
   setBatch(crypto.randomUUID());setReview(false);setResult(null);
  }catch{setError('Upload failed. Check the file size and try again.');}});
 }
 function finish(){
  setError('');start(async()=>{try{
   const response=await commitImport(batch,source,preview.rows);
   if(response.error)setError(response.error);else setResult({imported:response.imported!,skipped:response.skipped!});
  }catch{setError('The connection was interrupted. Retry this same import to retrieve its result safely.');}});
 }
 if(result)return <section className="panel import-success"><span className="badge">Import complete</span><h2>{result.imported} leads added</h2><p className="muted">{result.skipped} duplicate rows skipped. Existing leads were not overwritten.</p><div className="form-actions"><Link className="button" href="/leads">View leads →</Link><button className="button secondary" onClick={()=>{setResult(null);setSheets([]);}}>Import another file</button></div></section>;
 return <div className="import-workspace"><ol className="import-steps" aria-label="Import progress"><li className={!current?'current':''}>1. Upload</li><li className={current&&!review?'current':''}>2. Match columns</li><li className={review?'current':''}>3. Review & import</li></ol>
 {error&&<p className="feedback error" role="alert">{error}</p>}
 {!current?<form action={upload} className="panel form"><h2>Choose your prospect list</h2><label>CSV or Excel file<input name="file" type="file" accept=".csv,.xlsx" required disabled={pending}/></label><label>CSV separator<select name="delimiter" disabled={pending}><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value={'\t'}>Tab</option></select></label><p className="muted">Up to 2 MB, 500 leads per sheet, and 50 columns. Put column names in the first row. Use .xlsx for Excel; older .xls files must be converted. For phone numbers, use text cells to preserve country codes and leading zeros.</p><button className="button" disabled={pending}>{pending?'Reading file…':'Continue to column mapping →'}</button></form>:
 <><div className="panel import-file"><strong>{source}</strong><span className="muted">{current.rows.length} rows</span><button className="text-button" disabled={pending} onClick={()=>{setSheets([]);setError('');}}>Choose another file</button></div>
 {!review?<section className="panel"><h2>Match your columns</h2>{sheets.length>1&&<label className="sheet-label">Worksheet<select value={selected} disabled={pending} onChange={e=>{const i=Number(e.target.value);setSelected(i);setMapping(suggestMapping(sheets[i].headers));setBatch(crypto.randomUUID());}}>{sheets.map((s,i)=><option value={i} key={i}>{s.name}</option>)}</select></label>}
 <p className="muted">Company is required. Other fields can be left unmapped.</p><div className="mapping-grid">{Object.entries(importFields).map(([key,label])=><label key={key}>{label}{key==='company'?' *':''}<select value={mapping[key as ImportField]} onChange={e=>setMapping({...mapping,[key]:Number(e.target.value)})}>{key!=='company'?<option value={-1}>Do not import</option>:<option value={-1}>Choose a column</option>}{current.headers.map((h,i)=><option key={i} value={i}>{i+1}. {h}</option>)}</select><span className="muted">{mapping[key as ImportField]>=0?current.rows[0]?.cells[mapping[key as ImportField]]||'Empty in first row':'Not mapped'}</span></label>)}</div>
 {preview.issues.length>0&&<div className="feedback error" role="alert"><strong>{preview.issues.length} issues to resolve</strong><ul>{preview.issues.slice(0,10).map((issue,i)=><li key={i}>Row {issue.line}: {issue.message}</li>)}</ul>{preview.issues.length>10&&<p>Showing the first 10 issues. Correct the source file and upload again.</p>}</div>}
 <div className="form-actions"><button className="button" disabled={!preview.rows.length||preview.issues.length>0} onClick={()=>{setReview(true);setBatch(crypto.randomUUID());setError('');}}>Review {preview.rows.length} leads →</button></div></section>:
 <section className="panel"><h2>Ready to import {preview.rows.length} rows</h2><p className="muted">New leads will be assigned to you with New status and Normal priority. Duplicates with the same company, city, and phone digits among leads you can access are skipped, including duplicates within this file. No existing lead is overwritten.</p><div className="table-wrap"><table><thead><tr>{Object.values(importFields).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{preview.rows.slice(0,20).map((row,i)=><tr key={i}>{Object.keys(importFields).map(k=><td key={k}>{row[k as ImportField]||'—'}</td>)}</tr>)}</tbody></table></div><p className="muted">Previewing the first {Math.min(20,preview.rows.length)} rows. All {preview.rows.length} valid rows will be processed.</p><div className="form-actions"><button className="button" disabled={pending} onClick={finish}>{pending?'Importing…':'Import '+preview.rows.length+' rows'}</button><button className="button secondary" disabled={pending} onClick={()=>{setReview(false);setError('');}}>Back to mapping</button></div><p className="help">Phone-only contacts are saved as “Primary contact”. Notes are added to each new lead’s activity history.</p></section>}</>}
 </div>;
}

