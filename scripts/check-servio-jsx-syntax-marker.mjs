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
  ["electricity maps first provider", worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes('/v4/electricity-flows/latest') && worker.includes('temporalGranularity:"15_minutes"')],
  ["v4.28 full Europe mode preserved", worker.includes('full-europe-single-signal-v4.28-bess-clean-dispatch-period') && worker.includes('GRID_MAP_ZONES.length') && worker.includes('/v4/electricity-mix/latest')],
  ["build version v4.28", worker.includes('servio-grid-map-v4.28-bess-clean-dispatch-period')],
  ["mouse wheel zoom handler", app.includes('handleMapWheel') && worker.includes('handleMapWheel') && app.includes('onWheel={handleMapWheel}') && worker.includes('onWheel={handleMapWheel}')],
  ["day-ahead strict source param in frontend", app.includes('strict: dayAheadSource === "opcom" ? "1" : ""') && worker.includes('strict: dayAheadSource === \\"opcom\\" ? \\"1\\" : \\"\\"')],
  ["day-ahead per-day warnings are isolated", app.includes('warningToday') && app.includes('warningTomorrow') && app.includes('activeWarning') && worker.includes('warningToday') && worker.includes('warningTomorrow') && worker.includes('activeWarning')],
  ["OPCOM GitHub Actions auto refresh schedule", workflow.includes('*/15 * * * *') && workflow.includes('workflow_dispatch')],
  ["overview attention card removed", !app.includes('Card title="Necesită atenție"') && !worker.includes('Card title=\\"Necesită atenție\\"')],
  ["settings reduced to aspect card", !app.includes('Card title="Surse de date · OPCOM & ENTSO-E"') && !worker.includes('Card title=\\"Surse de date · OPCOM & ENTSO-E\\"') && !app.includes('Card title="Conformitate"') && !worker.includes('Card title=\\"Conformitate\\"') && app.includes('Card title="Aspect"') && worker.includes('Card title=\\"Aspect\\"')],
  ["boot loader uses orange spinner", worker.includes('servio-boot-spinner') && worker.includes('Se încarcă Servio') && !worker.includes('Inițializez shell-ul Claude și modulele Energy Market OS.')],
  ["BESS debugging threshold card removed", !app.includes('Price Thresholds') && !worker.includes('Price Thresholds') && !app.includes('Inowattio old engine') && !worker.includes('Inowattio old engine') && !app.includes('Inowattio parity') && !worker.includes('Inowattio parity')],
  ["BESS custom period moved into dispatch strategy header", app.includes('dispatchheadcontrols') && worker.includes('dispatchheadcontrols') && app.includes('dispatchperiod') && worker.includes('dispatchperiod') && app.includes('Custom simulation period') && worker.includes('Custom simulation period')],
  ["BESS standalone custom simulation card removed", !app.includes('Card title="Custom Simulation Period"') && !worker.includes('Card title=\\"Custom Simulation Period\\"') && !app.includes('Use full dataset') && !worker.includes('Use full dataset') && !app.includes('Reset Inowattio specs') && !worker.includes('Reset Inowattio specs')],
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
console.log('SERVIO v4.28 syntax/source/flow-inspector/full-Europe/mouse-wheel/day-ahead/loader-bess-cleanup guards OK.');
