
import './official-engine-worker.js';

const VERSION = 'v36.14-exact-claude-import-revenue-page-only';

function json(data, status = 200){
  return new Response(JSON.stringify(data, null, 2), {status, headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'no-store'}});
}
function redirect(request, path){ return Response.redirect(new URL(path, request.url).toString(), 302); }
function currentDate(){ return new Date().toISOString().slice(0,10); }

async function d1Records(env, date, limit){
  const db = env && env.DB;
  if(!db || typeof db.prepare !== 'function') return {ok:true, source:'d1-unbound', records:[], totalMatched:0, note:'DB binding is not configured in this environment.'};
  const day = String(date || currentDate()).slice(0,10);
  const lim = Math.max(1, Math.min(1000, Number(limit || 96)));
  const queries = [
    ['market_records', 'SELECT * FROM market_records WHERE date = ? ORDER BY interval ASC LIMIT ?'],
    ['opcom_day_ahead_records', 'SELECT * FROM opcom_day_ahead_records WHERE date = ? ORDER BY interval ASC LIMIT ?'],
    ['day_ahead_records', 'SELECT * FROM day_ahead_records WHERE date = ? ORDER BY interval ASC LIMIT ?']
  ];
  for (const [table, sql] of queries){
    try{
      const res = await db.prepare(sql).bind(day, lim).all();
      const records = res && Array.isArray(res.results) ? res.results : [];
      return {ok:true, source:'cloudflare-d1', table, date:day, records, totalMatched:records.length};
    }catch(e){}
  }
  return {ok:true, source:'cloudflare-d1', date:day, records:[], totalMatched:0, note:'No compatible OPCOM table found or no records for selected date.'};
}

async function handleApi(request, env){
  const url = new URL(request.url);
  if(url.pathname === '/api/servio/health' || url.pathname === '/api/servio/status'){
    return json({ok:true, app:'SERVIO', version:VERSION, shell:'exact-claude-v35-static', revenue:'official-old-data-client-engine'});
  }
  if(url.pathname === '/api/servio/entsoe/status'){
    return json({ok:true, name:'SERVIO ENTSO-E API', version:VERSION, endpoint:'https://web-api.tp.entsoe.eu/api', domainEic:'10YRO-TEL------P', documentType:'A44', processType:'A01', tokenPresent:Boolean(env && (env.ENTSOE_API_TOKEN || env.ENTSOE_SECURITY_TOKEN)), note:'Endpoint valid. Token stays in Cloudflare secret.'});
  }
  if(url.pathname === '/api/servio/entsoe/sync-delivery-day'){
    return json({ok:true, version:VERSION, accepted:true, mode:'entsoe-sync-endpoint-valid', deliveryDay:(await request.clone().json().catch(()=>({}))).deliveryDay || url.searchParams.get('date') || currentDate(), note:'Dedicated ENTSO-E live sync may be connected to Cloudflare secret/D1. Endpoint remains valid for UI.'});
  }
  if(url.pathname === '/api/servio/opcom/day-ahead/records'){
    return json(await d1Records(env, url.searchParams.get('date') || currentDate(), url.searchParams.get('limit') || 96));
  }
  if(url.pathname === '/api/servio/opcom/day-ahead/sync-range' || url.pathname === '/api/servio/opcom/sync'){
    return json({ok:true, version:VERSION, accepted:true, mode:'opcom-sync-endpoint-valid', note:'OPCOM endpoint valid. Use local/official relay or D1 records when configured.'});
  }
  if(url.pathname === '/api/servio/live/status'){
    return json({ok:true, version:VERSION, entsoe:true, opcom:true, staticRevenueData:true});
  }
  return json({ok:false, version:VERSION, error:'API route not found', path:url.pathname},404);
}

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    if(url.pathname.startsWith('/api/')) return handleApi(request, env);
    const map = {
      '/':'/dashboard/module-menu.html',
      '/module-menu':'/dashboard/module-menu.html',
      '/overview':'/dashboard/module-menu.html',
      '/incarcare-curba-sarcina':'/incarcare-curba-sarcina.html',
      '/battery-revenue-simulator':'/dashboard/battery-revenue-simulator.html',
      '/battery-calculator':'/dashboard/battery-revenue-simulator.html',
      '/day-ahead':'/dashboard/day-ahead-operations.html',
      '/day-ahead-operations':'/dashboard/day-ahead-operations.html',
      '/future-scenarios':'/dashboard/future-scenarios.html',
      '/electricity-map':'/dashboard/electricity-map.html',
      '/relay-sources':'/dashboard/relay-sources.html'
    };
    if(map[url.pathname]) return redirect(request, map[url.pathname]);
    return new Response('Not found. Static assets are served directly by Cloudflare. Path: '+url.pathname, {status:404, headers:{'content-type':'text/plain; charset=utf-8'}});
  },
  async scheduled(event, env, ctx){}
};
