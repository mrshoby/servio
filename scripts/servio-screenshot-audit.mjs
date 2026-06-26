import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
const args = Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith('--')?[v.slice(2),a[i+1] && !a[i+1].startsWith('--') ? a[i+1] : true]:null).filter(Boolean));
const baseUrl = String(args.url || 'https://servio.vlad-it-taran.workers.dev/').replace(/\/+$/,'');
const stage = String(args.stage || 'manual');
const routesFile = String(args.routes || 'audit-routes.json');
const outRoot = String(args.out || 'audit');
const raw = JSON.parse(await fs.readFile(routesFile,'utf8'));
const routes = Array.isArray(raw) ? raw : (Array.isArray(raw.routes) ? raw.routes : []);
const viewports = [
  {name:'desktop-1440', width:1440, height:1000, full:false},
  {name:'desktop-full', width:1440, height:1000, full:true},
  {name:'laptop-1366', width:1366, height:768, full:false},
  {name:'tablet-768', width:768, height:1024, full:false},
  {name:'mobile-390', width:390, height:844, full:false}
];
const shotDir = path.join(outRoot,'screenshots','v36_13',stage);
const reportDir = path.join(outRoot,'reports');
await fs.mkdir(shotDir,{recursive:true}); await fs.mkdir(reportDir,{recursive:true});
function safeName(s){return String(s).replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() || 'page'}
function resolveUrl(p){ if(/^https?:/i.test(p)) return p; return baseUrl + (p.startsWith('/')?p:'/'+p); }
if(routes.length===0){
  const summary={ok:false,version:'v36.13',stage,baseUrl,routes:0,screenshots:0,failed:0,whiteScreens:0,overflow:0,consoleErrors:0,error:'audit-routes.json has no visual routes',generatedAtUtc:new Date().toISOString()};
  await fs.writeFile(path.join(reportDir,'servio-v36-13-screenshot-audit.json'), JSON.stringify({summary,results:[]},null,2),'utf8');
  await fs.writeFile(path.join(reportDir,'SERVIO_v36_13_SCREENSHOT_AUDIT_REPORT.md'), '# SERVIO v36.13 Screenshot Audit Report\n\nInvalid: routes=0.\n','utf8');
  console.log(JSON.stringify(summary,null,2)); process.exit(2);
}
const browser = await chromium.launch({headless:true});
const results=[];
for(const route of routes){
  for(const vp of viewports){
    const page = await browser.newPage({viewport:{width:vp.width,height:vp.height}, deviceScaleFactor:1});
    const consoleErrors=[]; const pageErrors=[]; let responseStatus=null; let ok=false; let error=null;
    page.on('console',msg=>{ if(['error'].includes(msg.type())) consoleErrors.push({type:msg.type(), text:msg.text().slice(0,500)}); });
    page.on('pageerror',err=>pageErrors.push(String(err?.message||err).slice(0,500)));
    const url=resolveUrl(route.path);
    try{
      const res = await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000}); responseStatus = res?.status() || null; ok = !!res && responseStatus < 400;
      await page.waitForLoadState('load',{timeout:8000}).catch(()=>{});
      await page.waitForTimeout(1400);
      const metrics = await page.evaluate(()=>{
        const body=document.body, de=document.documentElement;
        const text=(body?.innerText||'').trim();
        const visibleControls=[...document.querySelectorAll('button,a,input,select,textarea')].filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'}).length;
        const hasShell=!!document.querySelector('.layout,.sidebar,.topbar,.ws-header');
        const forbidden=['original simulator','preserved','open full screen','appframe'];
        const lower=text.toLowerCase();
        const forbiddenVisible=forbidden.filter(x=>lower.includes(x));
        const iframeCount=document.querySelectorAll('iframe').length;
        return { title:document.title, textLength:text.length, elementCount:document.querySelectorAll('*').length, hasShell, whiteScreen:!hasShell && (text.length<80 || document.querySelectorAll('*').length<10), horizontalOverflow:de.scrollWidth > de.clientWidth + 3, scrollWidth:de.scrollWidth, clientWidth:de.clientWidth, visibleControls, iframeCount, forbiddenVisible };
      });
      const file = path.join(shotDir, vp.name, `${safeName(route.name || route.path)}.png`); await fs.mkdir(path.dirname(file),{recursive:true});
      await page.screenshot({path:file, fullPage:!!vp.full});
      results.push({route, viewport:vp, url, ok, status:responseStatus, screenshot:file, consoleErrors, pageErrors, ...metrics});
    }catch(e){ error=String(e?.message||e); results.push({route, viewport:vp, url, ok:false, status:responseStatus, error, consoleErrors, pageErrors}); }
    await page.close();
  }
}
await browser.close();
const summary={ ok:results.every(r=>r.ok && !r.whiteScreen && !r.horizontalOverflow && !(r.iframeCount>0) && !(r.forbiddenVisible||[]).length) && results.filter(r=>r.screenshot).length>0 && results.reduce((a,r)=>a+(r.consoleErrors?.length||0),0)===0, version:'v36.13', stage, baseUrl, routes:routes.length, screenshots:results.filter(r=>r.screenshot).length, failed:results.filter(r=>!r.ok).length, whiteScreens:results.filter(r=>r.whiteScreen).length, overflow:results.filter(r=>r.horizontalOverflow).length, consoleErrors:results.reduce((a,r)=>a+(r.consoleErrors?.length||0),0), iframes:results.reduce((a,r)=>a+(r.iframeCount||0),0), forbiddenVisible:[...new Set(results.flatMap(r=>r.forbiddenVisible||[]))], generatedAtUtc:new Date().toISOString() };
const jsonReport={summary, results};
await fs.writeFile(path.join(reportDir,'servio-v36-13-screenshot-audit.json'), JSON.stringify(jsonReport,null,2),'utf8');
const consoleLines = results.flatMap(r => (r.consoleErrors||[]).map(e => `- ${r.route?.name||r.route?.path} / ${r.viewport?.name}: ${e.text}`));
const md = ['# SERVIO v36.13 Screenshot Audit Report','',`Stage: **${stage}**`, `Base URL: ${baseUrl}`, `Generated: ${summary.generatedAtUtc}`,'', '## Summary','',`- Routes: ${summary.routes}`,`- Screenshots: ${summary.screenshots}`,`- Failed navigations: ${summary.failed}`,`- White screens: ${summary.whiteScreens}`,`- Horizontal overflow: ${summary.overflow}`,`- Console errors: ${summary.consoleErrors}`,`- Iframes: ${summary.iframes||0}`,`- Forbidden visible text: ${(summary.forbiddenVisible||[]).join(', ') || 'none'}`,'','## Routes'].concat(results.map(r=>`- ${r.route?.name||r.route?.path} / ${r.viewport?.name}: status=${r.status||'n/a'} ok=${!!r.ok} shell=${!!r.hasShell} white=${!!r.whiteScreen} overflow=${!!r.horizontalOverflow}${r.error?' error='+r.error:''}`)).concat(['','## Console error details','']).concat(consoleLines.length?consoleLines:['- none']).join('\n');
await fs.writeFile(path.join(reportDir,'SERVIO_v36_13_SCREENSHOT_AUDIT_REPORT.md'), md,'utf8');
console.log(JSON.stringify(summary,null,2));
process.exit((summary.failed || summary.whiteScreens || summary.overflow || summary.consoleErrors || summary.iframes || (summary.forbiddenVisible||[]).length || summary.screenshots===0) ? 2 : 0);
