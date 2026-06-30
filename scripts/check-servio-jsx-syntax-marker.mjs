import fs from 'node:fs';

const app = fs.readFileSync('public/Servio.jsx', 'utf8');
const worker = fs.readFileSync('src/worker.js', 'utf8');

const checks = [
  ['public unified OPCOM endpoint', /dayAheadOpcom:\s*"\/api\/servio\/day-ahead\/pzu\?source=opcom"\s*,/s.test(app)],
  ['public unified ENTSO-E endpoint comma', /dayAheadEntsoe:\s*"\/api\/servio\/day-ahead\/pzu\?source=entsoe"\s*,/s.test(app)],
  ['worker embedded unified OPCOM endpoint', worker.includes('/api/servio/day-ahead/pzu?source=opcom')],
  ['worker embedded unified ENTSO-E endpoint', worker.includes('/api/servio/day-ahead/pzu?source=entsoe')],
  ['live-flow arrows UI marker gridflowgeo', app.includes('gridflowgeo') && worker.includes('gridflowgeo')],
  ['live-flow arrowhead marker', app.includes('markerEnd="url(#gridArrow)"') && worker.includes('markerEnd=\\\"url(#gridArrow)\\\"')],
  ['no old ENTSO-E day-ahead endpoint in public', !app.includes('/api/servio/entsoe/day-ahead')],
  ['electricity maps first provider', worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes('/v4/electricity-flows/latest') && worker.includes('temporalGranularity:"15_minutes"')],
  ['no fake demo fallback when live provider fails', worker.includes('external-live-unavailable') && worker.includes('unavailableZones')],
  ['v4.17 subrequest-aware flow parser', worker.includes('flowsProvider') && worker.includes('subrequest-budget-v4.17') && worker.includes('gridRomaniaDayWindowUtc')],
  ['build version v4.17', worker.includes('servio-grid-map-v4.17-subrequest-budget-live-flows-fix')],
];

let failed = false;
for (const [name, ok] of checks) {
  if (!ok) {
    console.error(`FAIL: ${name}`);
    failed = true;
  } else {
    console.log(`OK: ${name}`);
  }
}
if (failed) process.exit(1);
console.log('SERVIO v4.17 syntax/source/flow-arrow/subrequest guards OK.');
