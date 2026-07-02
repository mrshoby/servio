import fs from "node:fs";

const app = fs.readFileSync("public/Servio.jsx", "utf8");
const worker = fs.readFileSync("src/worker.js", "utf8");
const workflow = fs.readFileSync(".github/workflows/opcom-pzu-cache.yml", "utf8");

const checks = [
  ["public unified OPCOM endpoint", app.includes('dayAheadOpcom: "/api/servio/day-ahead/pzu?source=opcom",')],
  ["public unified ENTSO-E endpoint comma", app.includes('dayAheadEntsoe: "/api/servio/day-ahead/pzu?source=entsoe",')],
  ["worker embedded unified OPCOM endpoint", worker.includes("/api/servio/day-ahead/pzu?source=opcom")],
  ["worker embedded unified ENTSO-E endpoint", worker.includes("/api/servio/day-ahead/pzu?source=entsoe")],
  ["live-flow arrows UI marker gridflowgeo", app.includes("gridflowgeo") && worker.includes("gridflowgeo")],
  ["flow inspector hover cards", app.includes("gridhoverflows") && worker.includes("gridhoverflows") && app.includes("gridhoverflowcol") && worker.includes("gridhoverflowcol")],
  ["flow relation highlighting", app.includes("related") && worker.includes("related") && app.includes("muted") && worker.includes("muted")],
  ["electricity maps first provider", worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes('/v4/electricity-flows/latest') && worker.includes('temporalGranularity:"15_minutes"')],
  ["v4.27 full Europe mode preserved", worker.includes('full-europe-single-signal-v4.27-loading-settings-overview-cleanup') && worker.includes('GRID_MAP_ZONES.length') && worker.includes('/v4/electricity-mix/latest')],
  ["build version v4.27", worker.includes('servio-grid-map-v4.27-loading-settings-overview-cleanup')],
  ["mouse wheel zoom handler", app.includes('handleMapWheel') && worker.includes('handleMapWheel') && app.includes('onWheel={handleMapWheel}') && worker.includes('onWheel={handleMapWheel}')],
  ["day-ahead source query join fix", app.includes('apiPathWithQuery') && worker.includes('apiPathWithQuery')],
  ["day-ahead keyed statistics/chart refresh", app.includes('daySourceKey') && worker.includes('daySourceKey') && app.includes('key={daySourceKey}') && worker.includes('key={daySourceKey}')],
  ["day-ahead strict source param in frontend", app.includes('strict: dayAheadSource === "opcom" ? "1" : ""') && worker.includes('strict: dayAheadSource === \\\"opcom\\\" ? \\\"1\\\" : \\\"\\\"')],
  ["day-ahead backend disables masked ENTSO-E fallback for strict OPCOM", worker.includes('strictSource') && worker.includes('fallbackDisabled') && worker.includes('allowStaleToday: true') && worker.includes('OPCOM strict indisponibil')],
  ["day-ahead per-day warnings are isolated", app.includes('warningToday') && app.includes('warningTomorrow') && app.includes('activeWarning') && worker.includes('warningToday') && worker.includes('warningTomorrow') && worker.includes('activeWarning')],
  ["OPCOM GitHub Actions auto refresh schedule", workflow.includes('*/15 * * * *') && workflow.includes('workflow_dispatch')],
  ["robust Electricity Maps mix parser", worker.includes('gridPickPayloadObject') && worker.includes('gridDeepNumber') && worker.includes('electricity-maps-empty-mix-payload') && worker.includes('v === null || v === undefined || v === ""')],
  ["overview attention card removed", !app.includes('Card title="Necesită atenție"') && !worker.includes('Card title=\\"Necesită atenție\\"')],
  ["settings reduced to aspect card", !app.includes('Card title="Surse de date · OPCOM & ENTSO-E"') && !worker.includes('Card title=\\"Surse de date · OPCOM & ENTSO-E\\"') && !app.includes('Card title="Conformitate"') && !worker.includes('Card title=\\"Conformitate\\"') && app.includes('Card title="Aspect"') && worker.includes('Card title=\\"Aspect\\"')],
  ["boot loader uses orange spinner", worker.includes('servio-boot-spinner') && worker.includes('Se încarcă Servio') && !worker.includes('Inițializez shell-ul Claude și modulele Energy Market OS.')],
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
console.log('SERVIO v4.27 syntax/source/flow-inspector/full-Europe/mouse-wheel/day-ahead/loader-cleanup guards OK.');
