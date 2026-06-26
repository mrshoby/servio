#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION = 'v32.98-github-official-source-ingestion-api';
const DEFAULT_SERVIO_URL = 'https://servio.vlad-it-taran.workers.dev';

function arg(name, fallback=null){
  const i = process.argv.indexOf(`--${name}`);
  if(i >= 0 && i + 1 < process.argv.length) return process.argv[i+1];
  const eq = process.argv.find(a => a.startsWith(`--${name}=`));
  if(eq) return eq.slice(name.length + 3);
  return fallback;
}
function hasFlag(name){ return process.argv.includes(`--${name}`); }
function pad(n){ return String(n).padStart(2,'0'); }
function isoDate(d){ return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; }
function addDaysIso(date, days){ const d=new Date(`${String(date).slice(0,10)}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+Number(days||0)); return isoDate(d); }
function todayBucharest(){
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Bucharest', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date()).reduce((a,p)=>(a[p.type]=p.value,a),{});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function dateRange(from,to,max=10){ const out=[]; let d=new Date(`${from}T00:00:00Z`); const e=new Date(`${to}T00:00:00Z`); for(let i=0; d<=e && i<max; i++){ out.push(isoDate(d)); d.setUTCDate(d.getUTCDate()+1); } return out; }
function round2(v){ const n=Number(v); return Number.isFinite(n)?Math.round(n*100)/100:null; }
function htmlDecode(value){
  const map={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return String(value||'').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(m,e)=>{ const k=String(e).toLowerCase(); if(k.startsWith('#x')){ const n=parseInt(k.slice(2),16); return Number.isFinite(n)?String.fromCodePoint(n):m; } if(k.startsWith('#')){ const n=parseInt(k.slice(1),10); return Number.isFinite(n)?String.fromCodePoint(n):m; } return map[k] ?? m; });
}
async function mkdirp(dir){ await fs.mkdir(dir,{recursive:true}); }
async function fetchText(url, options={}, timeoutMs=25000){
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  try{
    const res=await fetch(url,{...options,signal:ctrl.signal});
    const text=await res.text();
    if(!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0,300)}`);
    return text;
  } finally { clearTimeout(timer); }
}
async function fetchBnrEurRon(){
  try{ const xml=await fetchText('https://www.bnr.ro/nbrfxrates.xml',{headers:{accept:'application/xml,text/xml,*/*'}},9000); const m=xml.match(/<Rate\s+currency=["']EUR["'][^>]*>([^<]+)<\/Rate>/i); const n=m?Number(String(m[1]).replace(',','.')):NaN; return Number.isFinite(n)?n:5; }
  catch{ return 5; }
}
function lastSundayDate(year, monthIndex){ const d=new Date(Date.UTC(year, monthIndex+1,0)); while(d.getUTCDay()!==0) d.setUTCDate(d.getUTCDate()-1); return isoDate(d); }
function bucharestOffsetForDate(date){ const d=String(date||'').slice(0,10); const y=Number(d.slice(0,4)); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(y)) return '+02:00'; const spring=lastSundayDate(y,2), autumn=lastSundayDate(y,9); return d>=spring&&d<autumn?'+03:00':'+02:00'; }
function intervalBounds(date, interval){ const i=Math.max(1,Math.min(100,Number(interval)||1)); const base=Date.parse(`${date}T00:00:00Z`); const start=new Date(base+(i-1)*15*60000); const end=new Date(base+i*15*60000); const off=bucharestOffsetForDate(date); const fmt=d=>`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00${off}`; return { start:`${date}T${fmt(start)}`, end:`${date}T${fmt(end)}`}; }
function normalizeRecord(raw, forcedSourceMode){
  const date=String(raw.date||raw.deliveryDay||'').slice(0,10);
  const interval=Number(raw.interval||raw.position||0);
  const eurRon=Number(raw.eurRon||raw.exchangeRate||5);
  const priceRon=Number(raw.priceRonMwh ?? raw.price_ron_mwh ?? raw.valueRonMwh ?? raw.price);
  let priceEur=raw.priceEurMwh ?? raw.price_eur_mwh ?? raw.valueEurMwh;
  priceEur=Number.isFinite(Number(priceEur))?Number(priceEur):(Number.isFinite(priceRon)&&eurRon>0?priceRon/eurRon:null);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(interval)||interval<1||interval>100||!Number.isFinite(priceRon)) return null;
  const sourceMode=forcedSourceMode || raw.sourceMode || raw.source_mode || 'official-live';
  const b=intervalBounds(date,interval);
  const market=String(raw.market||'DAY_AHEAD').toUpperCase(); const country=String(raw.country||'RO').toUpperCase();
  return {
    id: raw.id || `${country}|${market}|${date}|${interval}|${sourceMode}`,
    source: raw.source || (sourceMode==='opcom-pzu-live'?'OPCOM PZU ROPEX_DAM official CSV':sourceMode==='official-live'?'ENTSO-E Transparency Platform':'Transelectrica official source'),
    sourceMode, market, country, date, interval,
    intervalStart: raw.intervalStart || raw.interval_start || b.start,
    intervalEnd: raw.intervalEnd || raw.interval_end || b.end,
    priceEurMwh: round2(priceEur), priceRonMwh: round2(priceRon), currency:'RON/MWh',
    sourceCurrency: raw.sourceCurrency || raw.source_currency || (sourceMode==='opcom-pzu-live'?'RON/MWh':'EUR/MWh'),
    eurRon: Number.isFinite(eurRon)?eurRon:null, resolutionMinutes:15,
    sourceRank: sourceMode==='official-live'?1:sourceMode==='opcom-pzu-live'?2:3,
    importedAtUtc:new Date().toISOString(), firstImportedAtUtc:new Date().toISOString(),
    sourceUrl: raw.sourceUrl || raw.source_url || null, sourceLabel: raw.sourceLabel || raw.source_label || null, settlementType: raw.settlementType || raw.settlement_type || null,
    rawJson: JSON.stringify(raw)
  };
}
function expectedPt15IntervalsForDate(){ return 96; }
function utcStamp(d){ return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`; }
function localDayUtcWindow(date){ const d=String(date).slice(0,10); const next=addDaysIso(d,1); return { date:d, periodStart:utcStamp(new Date(`${d}T00:00:00${bucharestOffsetForDate(d)}`)), periodEnd:utcStamp(new Date(`${next}T00:00:00${bucharestOffsetForDate(next)}`)), expectedIntervals:96 }; }
function entsoeUtcDayWindow(date, offset=0){ const d=addDaysIso(date,offset); const n=addDaysIso(d,1); return {date, periodStart:`${d.replaceAll('-','')}0000`, periodEnd:`${n.replaceAll('-','')}0000`, expectedIntervals:96}; }
function entsoeBroadUtcWindow(date){ const p=addDaysIso(date,-1); const n=addDaysIso(date,2); return {date, periodStart:`${p.replaceAll('-','')}0000`, periodEnd:`${n.replaceAll('-','')}0000`, expectedIntervals:96}; }
function entsoeVariants(date){ const local=localDayUtcWindow(date), utc=entsoeUtcDayWindow(date,0), prev=entsoeUtcDayWindow(date,-1), broad=entsoeBroadUtcWindow(date); return [
  {name:'local-bucharest-day-with-process',...local, processType:'A01'},
  {name:'local-bucharest-day-no-process',...local},
  {name:'utc-calendar-day-no-process',...utc},
  {name:'utc-calendar-day-with-process',...utc, processType:'A01'},
  {name:'previous-utc-day-no-process',...prev},
  {name:'broad-three-day-no-process',...broad}
]; }
function stripXmlPrefixes(xml){ return String(xml||'').replace(/<\/?[A-Za-z0-9_\-]+:/g, m => m.replace(/([<\/])[^:]+:/, '$1')); }
function tagValue(block, tag){ const re=new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'); const m=String(block||'').match(re); return m?String(m[1]||'').trim():''; }
function entsoeResolutionMinutes(res){ const r=String(res||'PT60M').toUpperCase(); const m=r.match(/PT(\d+)M/); if(m) return Number(m[1]); const h=r.match(/PT(\d+)H/); if(h) return Number(h[1])*60; return 60; }
function romanianMarketParts(date){ const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).reduce((a,p)=>(a[p.type]=p.value,a),{}); const minutes=Number(parts.hour||0)*60+Number(parts.minute||0); return {date:`${parts.year}-${parts.month}-${parts.day}`, interval:Math.floor(minutes/15)+1}; }
function parseEntsoeXml(xml, eurRon){
  const text=stripXmlPrefixes(xml).replace(/\r/g,'').replace(/<(price\.amount|amount|value)>\s*([^<]+?)\s*<\/(price\.amount|amount|value)>/gi,(m,a,b,c)=>`<${a}>${String(b).replace(',','.')}</${c}>`);
  const out=[]; const periodRe=/<Period\b[^>]*>[\s\S]*?<timeInterval\b[^>]*>[\s\S]*?<start\b[^>]*>([^<]+)<\/start>[\s\S]*?<end\b[^>]*>([^<]+)<\/end>[\s\S]*?<\/timeInterval>[\s\S]*?<resolution\b[^>]*>([^<]+)<\/resolution>([\s\S]*?)<\/Period>/gi;
  let pm; while((pm=periodRe.exec(text))){ const start=new Date(pm[1]); const minutes=entsoeResolutionMinutes(pm[3]); const body=pm[4]||''; const pointRe=/<Point\b[^>]*>([\s\S]*?)<\/Point>/gi; let m; while((m=pointRe.exec(body))){ const block=m[1]||''; const pos=Number(tagValue(block,'position')); const raw=tagValue(block,'price\\.amount')||tagValue(block,'price.amount')||tagValue(block,'amount')||tagValue(block,'value'); const priceEur=Number(String(raw).replace(',','.')); if(!Number.isFinite(pos)||!Number.isFinite(priceEur)||!Number.isFinite(start.getTime())) continue; const span=Math.max(1,Math.round(minutes/15)); const base=new Date(start.getTime()+(pos-1)*minutes*60000); for(let q=0;q<span;q++){ const slot=new Date(base.getTime()+q*15*60000); const loc=romanianMarketParts(slot); out.push(normalizeRecord({date:loc.date,interval:loc.interval,priceEurMwh:priceEur,priceRonMwh:priceEur*eurRon,eurRon,sourceMode:'official-live',source:'ENTSO-E Transparency Platform',sourceUrl:'https://web-api.tp.entsoe.eu/api',sourceLabel:'ENTSO-E Day-Ahead Romania',sourceCurrency:'EUR/MWh',rawForecastUtc:slot.toISOString()},'official-live')); } } }
  const map=new Map(); for(const r of out.filter(Boolean)) map.set(`${r.date}|${r.interval}|${r.sourceMode}`,r); return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.interval-b.interval);
}
async function fetchEntsoeDate(date, token, eurRon){
  const attempts=[]; let best=[]; let bestName=null;
  for(const v of entsoeVariants(date)){
    const url=new URL('https://web-api.tp.entsoe.eu/api'); url.searchParams.set('securityToken',token||'MISSING'); url.searchParams.set('documentType','A44'); if(v.processType) url.searchParams.set('processType',v.processType); url.searchParams.set('in_Domain','10YRO-TEL------P'); url.searchParams.set('out_Domain','10YRO-TEL------P'); url.searchParams.set('periodStart',v.periodStart); url.searchParams.set('periodEnd',v.periodEnd);
    try{ const xml=await fetchText(url.toString(),{headers:{accept:'application/xml,text/xml,*/*','user-agent':'SERVIO-v32.98-official-ingestion'}},30000); const records=parseEntsoeXml(xml,eurRon).filter(r=>r.date===date); attempts.push({name:v.name,ok:true,records:records.length,complete:records.length>=96,periodStart:v.periodStart,periodEnd:v.periodEnd,bytes:xml.length}); if(records.length>best.length){best=records; bestName=v.name;} if(records.length>=96) break; }
    catch(e){ attempts.push({name:v.name,ok:false,error:String(e.message||e),periodStart:v.periodStart,periodEnd:v.periodEnd}); }
  }
  return {date,source:'entsoe',records:best,bestAttempt:bestName,attempts,complete:best.length>=96};
}
function detectDelimiter(sample){ const choices=[';','\t',',','|']; return choices.map(d=>({d,c:(sample.match(new RegExp(d==='\t'?'\\t':`\\${d}`,'g'))||[]).length})).sort((a,b)=>b.c-a.c)[0]?.d||';'; }
function splitDelimited(line, delimiter){ const out=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){ if(q&&line[i+1]==='"'){cur+='"';i++;} else q=!q; } else if(ch===delimiter&&!q){ out.push(cur.trim()); cur=''; } else cur+=ch; } out.push(cur.trim()); return out; }
function parseRows(text){ let src=htmlDecode(String(text||'')).replace(/^\uFEFF/,''); if(/<\s*(html|table|tr|td|body|pre)\b/i.test(src)){ src=src.replace(/<\s*br\s*\/?\s*>/gi,'\n').replace(/<\s*\/\s*(tr|p|div|li|pre|table)\s*>/gi,'\n').replace(/<\s*\/\s*(td|th)\s*>/gi,';').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' '); } const lines=src.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); const d=detectDelimiter(lines.slice(0,100).join('\n')); return lines.map(l=>splitDelimited(l,d).map(c=>htmlDecode(c).trim())); }
function parseLooseNumber(value){ const raw=String(value??'').trim(); if(!raw) return null; let s=raw.replace(/\s/g,'').replace(/[A-Za-z€$£RONlei\/]+/gi,''); const c=s.lastIndexOf(','), d=s.lastIndexOf('.'); if(c>=0&&d>=0) s=c>d?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,''); else if(c>=0) s=s.replace(',','.'); const n=Number(s.replace(/[^0-9+\-.]/g,'')); return Number.isFinite(n)?n:null; }
function parseClockMinutes(value){ const m=String(value||'').match(/(\d{1,2})\s*[:.]\s*(\d{2})/); if(!m) return null; return Math.min(1440,Number(m[1])*60+Number(m[2])); }
function parseTimeInfo(value){ const s=htmlDecode(value).replace(/\s+/g,' ').trim(); const matches=[...s.matchAll(/(\d{1,2})\s*[:.]\s*(\d{2})/g)]; if(!matches.length) return null; const start=parseClockMinutes(`${matches[0][1]}:${matches[0][2]}`); const end=matches[1]?parseClockMinutes(`${matches[1][1]}:${matches[1][2]}`):null; if(start===null) return null; let resolutionMinutes=null; if(end!==null){ let delta=end-start; if(delta<=0) delta+=1440; if([15,30,60].includes(delta)) resolutionMinutes=delta; } return {interval:Math.floor(start/15)+1,resolutionMinutes:resolutionMinutes||15}; }
function parseOpcomText(text,date,eurRon,sourceUrl){
  const rows=parseRows(text); const raw=[]; let intervalCol=-1, priceCol=-1, zoneCol=-1, currency='RON';
  for(const cells of rows){ const lower=cells.map(c=>c.toLowerCase()); const header=lower.some(c=>c.includes('interval')||c.includes('ora')||c.includes('hour')) && lower.some(c=>c.includes('ropex')||c.includes('pret')||c.includes('preț')||c.includes('price')||c.includes('lei/mwh')||c.includes('eur/mwh')); if(header){ intervalCol=lower.findIndex(c=>c.includes('interval')||c.includes('ora')||c.includes('hour')); zoneCol=lower.findIndex(c=>c.includes('zona')||c.includes('trading zone')); const preferred=lower.findIndex(c=>c.includes('ropex_dam')||c.includes('ropex dam')||c.includes('ropex')); priceCol=preferred>=0?preferred:lower.findIndex(c=>c.includes('lei/mwh')||c.includes('eur/mwh')||c.includes('pret')||c.includes('preț')||c.includes('price')); currency=lower.join(' ').includes('eur')?'EUR':'RON'; continue; }
    if(zoneCol>=0 && cells[zoneCol] && !/romania|\bro\b/i.test(cells[zoneCol])) continue; let interval=null, resolutionMinutes=null, price=null;
    if(intervalCol>=0 && priceCol>=0 && cells.length>Math.max(intervalCol,priceCol)){ const info=parseTimeInfo(cells[intervalCol]); interval=info?.interval??parseLooseNumber(cells[intervalCol]); resolutionMinutes=info?.resolutionMinutes||null; price=parseLooseNumber(cells[priceCol]); }
    if(!Number.isFinite(interval)||price===null){ const time=cells.map(c=>parseTimeInfo(c)).find(Boolean); if(time){interval=time.interval;resolutionMinutes=time.resolutionMinutes;} const nums=cells.map(c=>parseLooseNumber(c)).filter(n=>n!==null); if(!Number.isFinite(interval)){ const cand=nums.find(n=>Number.isInteger(n)&&n>=1&&n<=100); if(cand) interval=cand; } if(price===null){ const vals=nums.filter(n=>!(Number.isInteger(n)&&n>=1&&n<=100)); if(vals.length) price=vals[vals.length-1]; } }
    if(Number.isFinite(interval)&&interval>=1&&interval<=100&&price!==null){ raw.push({date,interval:Number(interval),resolutionMinutes:resolutionMinutes||null,priceRonMwh:currency==='EUR'?price*eurRon:price,priceEurMwh:currency==='EUR'?price:price/eurRon,eurRon,sourceCurrency:currency==='EUR'?'EUR/MWh':'RON/MWh',sourceUrl,row:cells}); }
  }
  const res=raw.length<=30?60:raw.length<=60?30:15; const expanded=[];
  for(const r of raw){ const step=Math.max(1,Math.round((r.resolutionMinutes||res)/15)); const base=(Number(r.interval)-1)*step+1; for(let k=0;k<step;k++){ const interval=base+k; if(interval>=1&&interval<=100) expanded.push(normalizeRecord({...r,interval,sourceMode:'opcom-pzu-live',source:'OPCOM PZU ROPEX_DAM official CSV',sourceLabel:'OPCOM PZU ROPEX_DAM'},'opcom-pzu-live')); } }
  const map=new Map(); for(const r of expanded.filter(Boolean)) map.set(`${r.date}|${r.interval}|opcom-pzu-live`,r); return [...map.values()].sort((a,b)=>a.interval-b.interval);
}
function opcomCandidates(date){ const [y,m,d]=String(date).split('-'); const hosts=['https://www.opcom.ro','https://opcom.ro','http://www.opcom.ro']; const langs=['ro','en']; const out=[]; for(const lang of langs) for(const h of hosts) out.push(`${h}/rapoarte-pzu-raportPIP-export-csv/${Number(d)}/${Number(m)}/${y}/${lang}`); return out; }
async function fetchOpcomDate(date,eurRon){ const attempts=[]; for(const url of opcomCandidates(date)){ try{ const text=await fetchText(url,{headers:{'User-Agent':'Mozilla/5.0 SERVIO-v32.98','Accept':'text/csv,text/plain,text/html,*/*','Accept-Language':'ro-RO,ro;q=0.9,en;q=0.8','Referer':'https://www.opcom.ro/rapoarte-pzu/ro'}},25000); const records=parseOpcomText(text,date,eurRon,url); attempts.push({url,ok:true,records:records.length}); if(records.length) return {date,source:'opcom',records,attempts,complete:records.length>=96}; }catch(e){ attempts.push({url,ok:false,error:String(e.message||e)}); } } return {date,source:'opcom',records:[],attempts,complete:false}; }
async function pushRecords(servioUrl, secret, pathName, payload){
  if(!secret) throw new Error('Missing SERVIO_INGEST_SECRET. Add it both in GitHub Secrets and Cloudflare Worker secrets.');
  const url=`${servioUrl.replace(/\/$/,'')}${pathName}`;
  const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${secret}`},body:JSON.stringify(payload)});
  const text=await res.text(); let json=null; try{ json=JSON.parse(text); }catch{ json={ok:false,raw:text}; }
  if(!res.ok || !json.ok) throw new Error(`SERVIO ingest failed ${res.status}: ${JSON.stringify(json).slice(0,1200)}`);
  return json;
}
async function probeTranselectrica(){
  const urls=(process.env.TRANSELECTRICA_BALANCING_URLS||'https://www.transelectrica.ro/web/tel/rezultate-decontare-piata-de-echilibrare,https://www.transelectrica.ro/web/tel/piata-de-echilibrare').split(',').map(s=>s.trim()).filter(Boolean);
  const out=[]; for(const url of urls){ try{ const text=await fetchText(url,{headers:{'User-Agent':'SERVIO-v32.98-source-health'}},20000); out.push({url,ok:true,bytes:text.length,hasBalancing:/echilibrare|balancing|dezechilibru/i.test(text)}); }catch(e){ out.push({url,ok:false,error:String(e.message||e)}); } }
  return out;
}
function mdReport(report){ return `# SERVIO v32.98 Official Source Ingestion Report\n\n- Generated: ${report.finishedAtUtc}\n- Range: ${report.from} → ${report.to}\n- SERVIO URL: ${report.servioUrl}\n- Dry run: ${report.dryRun}\n\n## Summary\n\n| Source | Records | Complete days | Failed days |\n|---|---:|---:|---:|\n| ENTSO-E | ${report.summary.entsoeRecords} | ${report.summary.entsoeCompleteDays} | ${report.summary.entsoeFailedDays} |\n| OPCOM | ${report.summary.opcomRecords} | ${report.summary.opcomCompleteDays} | ${report.summary.opcomFailedDays} |\n| Transelectrica probe | ${report.transelectrica.filter(x=>x.ok).length}/${report.transelectrica.length} ok | - | - |\n\n## Notes\n\n- ENTSO-E uses token from ENTSOE_API_TOKEN.\n- OPCOM is fetched by the runner/relay, then pushed to SERVIO API. This avoids Cloudflare Worker direct-fetch 403.\n- SERVIO API writes to Cloudflare D1 via /api/servio/ingest/*.\n`; }
async function main(){
  const today=todayBucharest();
  const from=arg('from', process.env.SERVIO_SYNC_FROM || addDaysIso(today,0));
  const to=arg('to', process.env.SERVIO_SYNC_TO || addDaysIso(today,1));
  const source=arg('source', process.env.SERVIO_SYNC_SOURCE || 'all');
  const servioUrl=arg('url', process.env.SERVIO_URL || DEFAULT_SERVIO_URL);
  const secret=arg('secret', process.env.SERVIO_INGEST_SECRET || '');
  const dryRun=hasFlag('dry-run') || String(process.env.SERVIO_DRY_RUN||'').toLowerCase()==='true';
  const outDir=arg('out', process.env.SERVIO_AUDIT_DIR || 'audit-results'); await mkdirp(outDir);
  const eurRon=Number(arg('eur-ron', process.env.SERVIO_EUR_RON || await fetchBnrEurRon())) || 5;
  const token=arg('entsoe-token', process.env.ENTSOE_API_TOKEN || process.env.ENTSOE_SECURITY_TOKEN || '');
  const report={version:VERSION,servioUrl,from,to,source,eurRon,dryRun,startedAtUtc:new Date().toISOString(),days:[],pushes:[],transelectrica:[],summary:{entsoeRecords:0,entsoeCompleteDays:0,entsoeFailedDays:0,opcomRecords:0,opcomCompleteDays:0,opcomFailedDays:0}};
  const days=dateRange(from,to,10);
  for(const date of days){
    const day={date};
    if((source==='all'||source==='entsoe') && token){ const r=await fetchEntsoeDate(date,token,eurRon); day.entsoe={records:r.records.length,complete:r.complete,bestAttempt:r.bestAttempt,attempts:r.attempts}; report.summary.entsoeRecords+=r.records.length; if(r.complete) report.summary.entsoeCompleteDays++; else report.summary.entsoeFailedDays++; if(r.records.length && !dryRun){ const push=await pushRecords(servioUrl,secret,'/api/servio/ingest/entsoe',{sourceMode:'official-live',source:'ENTSO-E Transparency Platform',reason:'github-actions-entsoe-v3298',records:r.records,expectedIntervals:96,pushedBy:'github-actions-servio-v3298'}); report.pushes.push({date,source:'entsoe',prepared:r.records.length,push}); } }
    else if(source==='all'||source==='entsoe'){ day.entsoe={records:0,complete:false,warning:'Missing ENTSOE_API_TOKEN'}; report.summary.entsoeFailedDays++; }
    if(source==='all'||source==='opcom'){ const r=await fetchOpcomDate(date,eurRon); day.opcom={records:r.records.length,complete:r.complete,attempts:r.attempts}; report.summary.opcomRecords+=r.records.length; if(r.complete) report.summary.opcomCompleteDays++; else report.summary.opcomFailedDays++; if(r.records.length && !dryRun){ const push=await pushRecords(servioUrl,secret,'/api/servio/ingest/opcom',{sourceMode:'opcom-pzu-live',source:'OPCOM PZU official relay fetch',reason:'github-actions-opcom-v3298',records:r.records,expectedIntervals:96,pushedBy:'github-actions-servio-v3298'}); report.pushes.push({date,source:'opcom',prepared:r.records.length,push}); } }
    report.days.push(day);
  }
  if(source==='all'||source==='transelectrica') report.transelectrica=await probeTranselectrica();
  report.finishedAtUtc=new Date().toISOString();
  const stamp=`${from}_to_${to}`.replace(/[^0-9A-Za-z_\-]+/g,'_');
  const jsonPath=path.join(outDir,`servio-v3298-official-ingestion-${stamp}.json`);
  const mdPath=path.join(outDir,`servio-v3298-official-ingestion-${stamp}.md`);
  await fs.writeFile(jsonPath,JSON.stringify(report,null,2));
  await fs.writeFile(mdPath,mdReport(report));
  console.log(JSON.stringify({ok:true,version:VERSION,from,to,source,summary:report.summary,report:jsonPath,markdown:mdPath,pushes:report.pushes.length},null,2));
  if(!dryRun && !report.pushes.length) process.exitCode=2;
}
main().catch(e=>{ console.error(e); process.exit(1); });
