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
  ['v4.16 robust flow parser', worker.includes('flowsProvider') && worker.includes('electricitymaps-mix-breakdown') && worker.includes('breakdownType:"normal"')],
  ['build version v4.16', worker.includes('servio-grid-map-v4.16-electricitymaps-coverage-flow-parser')],
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
console.log('SERVIO v4.16 syntax/source/flow-arrow/Electricity-Maps guards OK.');
