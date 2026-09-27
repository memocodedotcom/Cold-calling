export function calendarRange(value:string|undefined,view:string|undefined){
 const today=new Date().toISOString().slice(0,10);
 const valid=value&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 const date=valid?value:today;
 const mode=view==='week'||view==='month'?view:'today';
 const start=new Date(date+'T00:00:00Z');
 if(mode==='week')start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);
 if(mode==='month')start.setUTCDate(1);
 const end=new Date(start);
 if(mode==='month')end.setUTCMonth(end.getUTCMonth()+1);else end.setUTCDate(end.getUTCDate()+(mode==='week'?7:1));
 const days:string[]=[];for(let d=new Date(start);d<end;d.setUTCDate(d.getUTCDate()+1))days.push(d.toISOString().slice(0,10));
 return {date,mode,start:start.toISOString(),end:end.toISOString(),days};
}
export type CalendarEntry={id:string;lead_id:string;kind:'task'|'meeting'|'call';date:string;title:string;status:string;notes:string;updated_at:string;company:string};
