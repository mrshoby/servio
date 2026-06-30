import fs from 'node:fs';
const app = fs.readFileSync('public/Servio.jsx', 'utf8');
const required = 'dayAheadEntsoe: "/api/servio/day-ahead/pzu?source=entsoe",\n  intraday:';
if (!app.includes(required)) {
  console.error('Servio.jsx endpoint object syntax guard failed: missing comma after dayAheadEntsoe.');
  process.exit(1);
}
const forbidden = 'dayAheadEntsoe: "/api/servio/day-ahead/pzu?source=entsoe"\n  intraday:';
if (app.includes(forbidden)) {
  console.error('Servio.jsx still contains the white-page syntax bug.');
  process.exit(1);
}
console.log('Servio.jsx endpoint syntax guard OK.');
