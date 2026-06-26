#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION = 'v32.95-local-opcom-d1-no-transaction-fix';

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
function addDaysIso(date, days){ const d = new Date(`${String(date).slice(0,10)}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+Number(days||0)); return isoDate(d); }
function todayBucharest(){
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Bucharest', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date()).reduce((a,p)=>(a[p.type]=p.value,a),{});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function dateRange(from,to){ const out=[]; let d=new Date(`${from}T00:00:00Z`); const e=new Date(`${to}T00:00:00Z`); for(let i=0; d<=e && i<31; i++){ out.push(isoDate(d)); d.setUTCDate(d.getUTCDate()+1); } return out; }
function htmlDecode(value){
  const map={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return String(value||'').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(m,e)=>{const k=String(e).toLowerCase(); if(k[0]==='#'){const base=k[1]==='x'?16:10; const code=parseInt(k.replace(/^#x?/,''),base); return Number.isFinite(code)?String.fromCharCode(code):m;} return map[k]??m;});
}
function detectDelimiter(sample){
  const choices=[';','\t',',','|'];
  return choices.map(d=>({d,c:(sample.match(new RegExp(d==='\t'?'\t':`\\${d}`,'g'))||[]).length})).sort((a,b)=>b.c-a.c)[0]?.d || ';';
}
function splitDelimited(line, delimiter){
  const out=[]; let cur=''; let q=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(q && line[i+1]==='"'){ cur+='"'; i++; }
      else q=!q;
    } else if(ch===delimiter && !q){ out.push(cur); cur=''; }
    else cur+=ch;
  }
  out.push(cur); return out;
}
function parseDelimitedRows(text){
  let src = htmlDecode(String(text||'')).replace(/^\uFEFF/, '');
  if(/<\s*(html|table|tr|td|body|pre)\b/i.test(src)){
    src = src.replace(/<\s*br\s*\/?\s*>/gi,'\n').replace(/<\s*\/\s*(tr|p|div|li|pre|table)\s*>/gi,'\n').replace(/<\s*\/\s*(td|th)\s*>/gi,';').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
  }
  const lines = src.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const delimiter = detectDelimiter(lines.slice(0,80).join('\n'));
  return lines.map(line=>splitDelimited(line, delimiter).map(c=>htmlDecode(c).trim()));
}
function parseLooseNumber(value){
  const raw = String(value ?? '').trim();
  if(!raw) return null;
  const cleaned = raw.replace(/\s/g,'').replace(/[A-Za-z€$£RONlei\/]+/gi,'');
  let s = cleaned;
  const lastComma=s.lastIndexOf(','); const lastDot=s.lastIndexOf('.');
  if(lastComma>=0 && lastDot>=0){ s = lastComma > lastDot ? s.replace(/\./g,'').replace(',', '.') : s.replace(/,/g,''); }
  else if(lastComma>=0){ s=s.replace(',', '.'); }
  const n = Number(s.replace(/[^0-9+\-.]/g,''));
  return Number.isFinite(n) ? n : null;
}
function parseClockMinutes(value){ const m=String(value||'').match(/(\d{1,2})\s*[:.]\s*(\d{2})/); if(!m) return null; const h=Number(m[1]), min=Number(m[2]); if(!Number.isFinite(h)||!Number.isFinite(min)||h<0||h>24||min<0||min>59) return null; return Math.min(1440,h*60+min); }
function parseTimeRangeIntervalInfo(value){
  const s=htmlDecode(value).replace(/\s+/g,' ').trim();
  const matches=[...s.matchAll(/(\d{1,2})\s*[:.]\s*(\d{2})/g)];
  if(!matches.length) return null;
  const start=parseClockMinutes(`${matches[0][1]}:${matches[0][2]}`);
  const end=matches[1]?parseClockMinutes(`${matches[1][1]}:${matches[1][2]}`):null;
  if(start===null) return null;
  let resolutionMinutes=null;
  if(end!==null){ let delta=end-start; if(delta<=0) delta+=1440; if([15,30,60].includes(delta)) resolutionMinutes=delta; }
  const interval=Math.floor(start/15)+1;
  if(interval<1||interval>100) return null;
  return { interval, resolutionMinutes: resolutionMinutes||15 };
}
function parseMarketIntervalToken(value){
  const s=htmlDecode(value).trim();
  const direct=parseLooseNumber(s);
  if(Number.isInteger(direct)&&direct>=1&&direct<=100) return direct;
  const info=parseTimeRangeIntervalInfo(s); return info?.interval ?? null;
}
function opcomCurrencyFromHeader(header){ const joined=(header||[]).join(' ').toLowerCase(); return /\b(eur|euro)\b|eur\s*\/\s*mwh/i.test(joined) ? 'EUR' : 'RON'; }
function round2(n){ const x=Number(n); return Number.isFinite(x)?Math.round(x*100)/100:null; }
function intervalLabel(interval){ const i=Math.max(1,Math.min(100,Number(interval)||1)); const start=(i-1)*15; const end=i*15; const fmt=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`; return `${fmt(start)}-${fmt(end)}`; }
function lastSundayDate(year, monthIndex){ const d=new Date(Date.UTC(year, monthIndex+1,0)); while(d.getUTCDay()!==0) d.setUTCDate(d.getUTCDate()-1); return isoDate(d); }
function bucharestOffsetForDate(date){ const d=String(date||'').slice(0,10); const y=Number(d.slice(0,4)); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(y)) return '+02:00'; const spring=lastSundayDate(y,2), autumn=lastSundayDate(y,9); return d>=spring&&d<autumn?'+03:00':'+02:00'; }
function intervalBounds(date, interval){ const i=Math.max(1,Math.min(100,Number(interval)||1)); const base=Date.parse(`${date}T00:00:00Z`); const start=new Date(base+(i-1)*15*60000); const end=new Date(base+i*15*60000); const off=bucharestOffsetForDate(date); const fmt=d=>`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00${off}`; return { start:`${date}T${fmt(start)}`, end:`${date}T${fmt(end)}`}; }
function inferResolution(rawRecords){ const max=Math.max(0,...rawRecords.map(r=>Number(r.interval)).filter(Number.isFinite)); const count=rawRecords.length; if(max<=24||count<=30) return 60; if(max<=48||count<=60) return 30; return 15; }
function expandRecord(raw, minutes){
  const step=Math.max(1,Math.round(Number(minutes||15)/15));
  const base=((Number(raw.interval)-1)*step)+1;
  const out=[];
  for(let k=0;k<step;k++){
    const interval=base+k; if(interval<1||interval>100) continue;
    const b=intervalBounds(raw.date, interval);
    out.push({
      id:`RO|DAY_AHEAD|${raw.date}|${interval}|opcom-pzu-live`,
      source:'OPCOM PZU ROPEX_DAM official CSV', source_mode:'opcom-pzu-live', market:'DAY_AHEAD', country:'RO', date:raw.date, interval,
      interval_start:b.start, interval_end:b.end, price_eur_mwh:round2(raw.priceEurMwh), price_ron_mwh:round2(raw.priceRonMwh), currency:'RON/MWh',
      source_currency:raw.sourceCurrency, eur_ron:raw.eurRon, resolution_minutes:15, source_rank:2, imported_at_utc:new Date().toISOString(),
      first_imported_at_utc:new Date().toISOString(), source_url:raw.sourceUrl, source_label:'OPCOM PZU ROPEX_DAM', settlement_type:null,
      raw_json:JSON.stringify({ sourceResolutionMinutes:minutes, originalInterval:raw.interval, intervalLabel:intervalLabel(interval), row:raw.row })
    });
  }
  return out;
}
function parseOpcomPzuText(text, date, eurRon, sourceUrl){
  const rows=parseDelimitedRows(text); const raw=[];
  let header=[], intervalCol=-1, priceCol=-1, zoneCol=-1, currency='RON';
  for(const row of rows){
    const cells=row.map(c=>htmlDecode(c).trim()); const lower=cells.map(c=>c.toLowerCase());
    const hasHeaderSignal=lower.some(c=>c.includes('interval')||c.includes('ropex')||c.includes('pret')||c.includes('preț')||c.includes('price')||c.includes('lei/mwh')||c.includes('eur/mwh'));
    if(hasHeaderSignal && lower.some(c=>c.includes('ropex')||c.includes('pret')||c.includes('preț')||c.includes('price')||c.includes('lei/mwh')||c.includes('eur/mwh'))){
      header=cells; currency=opcomCurrencyFromHeader(header); intervalCol=lower.findIndex(c=>c.includes('interval')||c.includes('ora')||c.includes('hour')); zoneCol=lower.findIndex(c=>c.includes('zona')||c.includes('trading zone')); const preferred=lower.findIndex(c=>c.includes('ropex_dam')||c.includes('ropex dam')||c.includes('ropex')); priceCol=preferred>=0?preferred:lower.findIndex(c=>c.includes('lei/mwh')||c.includes('eur/mwh')||c.includes('pret')||c.includes('preț')||c.includes('price')); continue;
    }
    if(!cells.length) continue;
    if(zoneCol>=0 && cells[zoneCol] && !/romania|\bro\b/i.test(cells[zoneCol])) continue;
    let interval=null, sourceResolutionMinutes=null, price=null;
    if(intervalCol>=0 && priceCol>=0 && cells.length>Math.max(intervalCol,priceCol)){
      const info=parseTimeRangeIntervalInfo(cells[intervalCol]); interval=info?.interval ?? parseMarketIntervalToken(cells[intervalCol]); sourceResolutionMinutes=info?.resolutionMinutes || null; price=parseLooseNumber(cells[priceCol]);
    }
    if(!Number.isFinite(interval)||interval<1||interval>100||price===null){
      const timeInfo=cells.map((c,i)=>({i,info:parseTimeRangeIntervalInfo(c)})).find(x=>x.info); if(timeInfo){ interval=timeInfo.info.interval; sourceResolutionMinutes=timeInfo.info.resolutionMinutes || sourceResolutionMinutes; }
      const numeric=cells.map((c,i)=>({i,n:parseLooseNumber(c),c})).filter(x=>x.n!==null&&Number.isFinite(x.n));
      if(!Number.isFinite(interval)){ const cand=numeric.find(x=>Number.isInteger(x.n)&&x.n>=1&&x.n<=100); if(cand) interval=cand.n; }
      if(price===null){ const candidates=numeric.filter(x=>!(Number.isInteger(x.n)&&x.n>=1&&x.n<=100)&&x.n>-100000&&x.n<100000); price=candidates.length?candidates[candidates.length-1].n:null; }
    }
    if(Number.isFinite(interval)&&interval>=1&&interval<=100&&price!==null){ const priceRon=currency==='EUR'?round2(price*eurRon):round2(price); const priceEur=currency==='EUR'?round2(price):round2(price/eurRon); raw.push({date,interval:Number(interval),priceRonMwh:priceRon,priceEurMwh:priceEur,sourceCurrency:currency==='EUR'?'EUR/MWh':'RON/MWh',eurRon,sourceUrl,row:cells,sourceResolutionMinutes}); }
  }
  const inferred=inferResolution(raw); const dedup=new Map();
  for(const r of raw){ for(const expanded of expandRecord(r, r.sourceResolutionMinutes || inferred)) dedup.set(`${expanded.date}|${expanded.interval}`, expanded); }
  return [...dedup.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.interval-b.interval);
}
function opcomCsvUrl(date, language='ro'){ const [y,m,d]=date.split('-'); return `https://www.opcom.ro/rapoarte-pzu-raportPIP-export-csv/${Number(d)}/${Number(m)}/${y}/${language}`; }
function opcomCandidates(date){ const [y,m,d]=date.split('-'); const dd=Number(d), mm=Number(m), yy=y; const hosts=['https://www.opcom.ro','https://opcom.ro','http://www.opcom.ro']; const langs=['ro','en']; const out=[]; for(const l of langs) for(const h of hosts) out.push(`${h}/rapoarte-pzu-raportPIP-export-csv/${dd}/${mm}/${yy}/${l}`); return out; }
async function fetchText(url){ const res=await fetch(url,{headers:{'Accept':'text/csv,text/plain,application/csv,application/octet-stream,text/html,*/*;q=0.8','Accept-Language':'ro-RO,ro;q=0.9,en-US;q=0.7,en;q=0.6','Cache-Control':'no-cache','Pragma':'no-cache','Referer':'https://www.opcom.ro/rapoarte-pzu/ro','Origin':'https://www.opcom.ro','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0'}}); const text=await res.text(); if(!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0,180).replace(/\s+/g,' ')}`); return text; }
async function readTextForDate(date, csvFolder){
  if(csvFolder){
    const candidates=[`opcom_${date}.csv`,`${date}.csv`,`${date.replaceAll('-','_')}.csv`,`${date.replaceAll('-','')}.csv`];
    for(const file of candidates){ const full=path.join(csvFolder,file); try{ return { text: await fs.readFile(full,'utf8'), url:`file://${full}`, source:'file' }; }catch{} }
  }
  const attempts=[];
  for(const url of opcomCandidates(date)){
    try{ return { text: await fetchText(url), url, source:'url' }; }
    catch(e){ attempts.push({url,error:String(e.message||e)}); }
  }
  const err=new Error(`No OPCOM CSV for ${date}. All URL attempts failed and no matching local file found.`); err.attempts=attempts; throw err;
}
function sqlString(v){ if(v===null||v===undefined) return 'NULL'; return `'${String(v).replaceAll("'","''")}'`; }
function sqlNumber(v){ const n=Number(v); return Number.isFinite(n)?String(n):'NULL'; }
function recordSql(r){
  const cols=['id','source','source_mode','market','country','date','interval','interval_start','interval_end','price_eur_mwh','price_ron_mwh','currency','source_currency','eur_ron','resolution_minutes','source_rank','imported_at_utc','first_imported_at_utc','source_url','source_label','settlement_type','raw_json'];
  const vals=[r.id,r.source,r.source_mode,r.market,r.country,r.date,Number(r.interval),r.interval_start,r.interval_end,Number(r.price_eur_mwh),Number(r.price_ron_mwh),r.currency,r.source_currency,Number(r.eur_ron),Number(r.resolution_minutes),Number(r.source_rank),r.imported_at_utc,r.first_imported_at_utc,r.source_url,r.source_label,r.settlement_type,r.raw_json];
  const rendered=vals.map((v,i)=> typeof v==='number' ? sqlNumber(v) : sqlString(v));
  return `INSERT INTO servio_live_market_prices (${cols.join(',')}) VALUES (${rendered.join(',')}) ON CONFLICT(id) DO UPDATE SET source=excluded.source, source_mode=excluded.source_mode, market=excluded.market, country=excluded.country, date=excluded.date, interval=excluded.interval, interval_start=excluded.interval_start, interval_end=excluded.interval_end, price_eur_mwh=excluded.price_eur_mwh, price_ron_mwh=excluded.price_ron_mwh, currency=excluded.currency, source_currency=excluded.source_currency, eur_ron=excluded.eur_ron, resolution_minutes=excluded.resolution_minutes, source_rank=excluded.source_rank, imported_at_utc=excluded.imported_at_utc, source_url=excluded.source_url, source_label=excluded.source_label, settlement_type=excluded.settlement_type, raw_json=excluded.raw_json;`;
}
async function main(){
  const today=todayBucharest();
  const from=arg('from', addDaysIso(today,-2));
  const to=arg('to', addDaysIso(today,1));
  const db=arg('database','servio-db');
  const outDir=arg('out','audit-results');
  const csvFolder=arg('csv-folder', null);
  const eurRon=Number(arg('eur-ron','5.2339')) || 5.2339;
  await fs.mkdir(outDir,{recursive:true});
  const all=[]; const days=[];
  for(const date of dateRange(from,to)){
    try{
      const got=await readTextForDate(date,csvFolder);
      const records=parseOpcomPzuText(got.text,date,eurRon,got.url);
      all.push(...records);
      days.push({date,ok:true,source:got.source,url:got.url,records:records.length});
      console.log(`OK ${date}: ${records.length} records from ${got.source}`);
    }catch(e){
      days.push({date,ok:false,error:String(e.message||e),attempts:e.attempts||[]});
      console.warn(`FAIL ${date}: ${String(e.message||e)}`);
    }
  }
  const now=new Date().toISOString();
  const runId=`sync-${Date.now()}-local-opcom-v3293`;
  const schema=`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);\nCREATE TABLE IF NOT EXISTS servio_live_market_prices (id TEXT PRIMARY KEY, source TEXT, source_mode TEXT, market TEXT, country TEXT, date TEXT, interval INTEGER, interval_start TEXT, interval_end TEXT, price_eur_mwh REAL, price_ron_mwh REAL, currency TEXT, source_currency TEXT, eur_ron REAL, resolution_minutes INTEGER, source_rank INTEGER, imported_at_utc TEXT, first_imported_at_utc TEXT, source_url TEXT, source_label TEXT, settlement_type TEXT, raw_json TEXT);\nCREATE INDEX IF NOT EXISTS idx_servio_live_market_prices_market_date_interval ON servio_live_market_prices(market, date, interval);\nCREATE INDEX IF NOT EXISTS idx_servio_live_market_prices_source_mode ON servio_live_market_prices(source_mode);\nCREATE TABLE IF NOT EXISTS servio_live_sync_runs (id TEXT PRIMARY KEY, reason TEXT, inserted INTEGER, updated INTEGER, skipped INTEGER, total_raw INTEGER, finished_at_utc TEXT, raw_json TEXT);\nCREATE INDEX IF NOT EXISTS idx_servio_live_sync_runs_finished ON servio_live_sync_runs(finished_at_utc);\n`;
  const body=all.map(recordSql).join('\n');
  const run={id:runId,reason:'v32.95-local-opcom-csv-import-no-transaction-fix',inserted:all.length,updated:0,skipped:0,totalRaw:all.length,preparedRecords:all.length,finishedAtUtc:now,days};
  const syncSql=`INSERT OR REPLACE INTO servio_live_sync_runs (id, reason, inserted, updated, skipped, total_raw, finished_at_utc, raw_json) VALUES (${sqlString(runId)}, 'v32.95-local-opcom-csv-import-no-transaction-fix', ${all.length}, 0, 0, ${all.length}, ${sqlString(now)}, ${sqlString(JSON.stringify(run))});\n`;
  const sql=schema+body+'\n'+syncSql;
  const sqlPath=path.join(outDir,`servio-v3295-opcom-import-${from}_to_${to}.sql`);
  const reportPath=path.join(outDir,`servio-v3295-opcom-import-${from}_to_${to}.json`);
  await fs.writeFile(sqlPath,sql,'utf8');
  await fs.writeFile(reportPath,JSON.stringify({version:VERSION,from,to,records:all.length,days,sqlPath,reportPath},null,2),'utf8');
  console.log(`Generated SQL: ${sqlPath}`);
  console.log(`Generated report: ${reportPath}`);
  if(hasFlag('no-execute')){ console.log('No execute requested.'); return; }
  if(!all.length){ console.error('No records parsed. SQL was generated with schema only, not executed. Download CSV manually from a browser into local-opcom-csv and rerun with --csv-folder local-opcom-csv.'); process.exitCode=2; return; }
  const cmd=process.platform==='win32'?'npx.cmd':'npx';
  const args=['wrangler','d1','execute',db,'--remote','--file',sqlPath];
  console.log(`Running: ${cmd} ${args.join(' ')}`);
  const r=spawnSync(cmd,args,{stdio:'inherit',shell:false});
  if(r.status!==0){ console.error(`Wrangler D1 execute failed with code ${r.status}`); process.exitCode=r.status||1; return; }
  console.log(`Imported ${all.length} OPCOM records into D1 ${db}.`);
}
main().catch(e=>{ console.error(e); process.exit(1); });
