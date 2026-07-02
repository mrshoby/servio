import fs from "node:fs";

const app = fs.readFileSync("public/Servio.jsx", "utf8");
const worker = fs.readFileSync("src/worker.js", "utf8");
const workflow = fs.readFileSync(".github/workflows/opcom-pzu-cache.yml", "utf8");

const checks = [
  ["build version v4.35", worker.includes("servio-grid-map-v4.35-metadata-extraction-trainer")],
  ["xlsx import support", app.includes('import * as XLSX from "xlsx"') && worker.includes('xlsx@0.18.5') && worker.includes('XLSX')],
  ["auth endpoints preserved", worker.includes('path === "/api/servio/auth/login"') && worker.includes('path === "/api/servio/auth/me"') && worker.includes('path === "/api/servio/auth/logout"')],
  ["auth frontend preserved", app.includes("function AuthGate") && app.includes("function LoginView") && app.includes("function UserMenu") && worker.includes("function AuthGate")],
  ["Data Learning Center admin-only", app.includes("function DataLearningCenter") && app.includes('currentUser.role === "admin"') && app.includes("{isAdmin && <DataLearningCenter") && worker.includes("function DataLearningCenter")],
  ["workbook/layout/file type detection preserved", app.includes("async function readWorkbookInfo") && app.includes("buildSheetProfile") && app.includes("function analyzeLearningLayout") && app.includes("function detectLearningFileTypeProfile")],
  ["column mapping trainer exists", app.includes("LEARNING_COLUMN_MAP_FIELDS") && app.includes("buildLearningColumnCandidates") && app.includes("buildDefaultLearningColumnMap") && app.includes("updateColumnMapping")],
  ["matrix mapping trainer exists", app.includes("LEARNING_MATRIX_VALUE_FIELDS") && app.includes("buildDefaultLearningMatrixMap") && app.includes("updateMatrixMapping") && app.includes("Column & Matrix Mapping Trainer")],
  ["mapping fields exist", app.includes("consumptionKwh") && app.includes("productionKwh") && app.includes("importKwh") && app.includes("exportKwh") && app.includes("intervalStart") && app.includes("intervalEnd")],
  ["mapping persisted into templates", app.includes("importTemplate") && app.includes("columnMap: f.mappingDraft?.columnMap") && app.includes("matrixMap: f.mappingDraft?.matrixMap")],
  ["metadata extraction trainer exists", app.includes("LEARNING_METADATA_MAP_FIELDS") && app.includes("buildLearningMetadataDraft") && app.includes("updateMetadataMapping") && app.includes("Metadata Extraction Trainer")],
  ["metadata persisted into templates", app.includes("metadataMap: f.metadataDraft?.metadataMap") && app.includes("metadataPatterns") && app.includes("extractedMetadata")],
  ["file type categories preserved", app.includes("ibd") && app.includes("meter") && app.includes("pvgis") && app.includes("inverter") && app.includes("ems_scada") && app.includes("full_balance_file")],
  ["sheet detection modes preserved", app.includes("monthly_sheets") && app.includes("daily_sheets") && app.includes("multiple_relevant_sheets") && app.includes("multi_table_sheet")],
  ["layout modes preserved", app.includes("matrix_day_by_interval") && app.includes("matrix_interval_by_day") && app.includes("metadata_plus_table") && app.includes("multi_table") && app.includes("vertical_table")],
  ["loading orange spinner preserved", worker.includes("servio-boot-spinner") && worker.includes("Se încarcă Servio") && !worker.includes("Inițializez shell-ul Claude și modulele Energy Market OS.")],
  ["old removed sections stay removed", !app.includes("Necesită atenție") && !app.includes("Surse de date · OPCOM & ENTSO-E") && !app.includes("Conformitate") && !app.includes("Price Thresholds · Inowattio old engine")],
  ["no old Inowattio debugging in UI", !app.includes("Inowattio old engine") && !app.includes("Inowattio parity") && !app.includes("DB locked")],
  ["day-ahead strict source preserved", app.includes('strict: dayAheadSource === "opcom" ? "1" : ""') && app.includes("warningToday") && app.includes("warningTomorrow")],
  ["Electricity Maps live grid preserved", worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes("/v4/electricity-mix/latest") && worker.includes("GRID_MAP_ZONES.length") && worker.includes("full-europe-single-signal-v4.35-metadata-extraction-trainer")],
  ["live-flow and inspector preserved", app.includes("gridflowgeo") && app.includes("gridhoverflows") && app.includes("gridhoverflowcol") && worker.includes("gridflowgeo")],
  ["mouse wheel zoom preserved", app.includes("handleMapWheel") && app.includes("onWheel={handleMapWheel}") && worker.includes("handleMapWheel")],
  ["OPCOM auto refresh schedule preserved", workflow.includes("*/15 * * * *") && workflow.includes("workflow_dispatch")],
];

let failed = false;
for (const [name, ok] of checks) {
  if (!ok) { console.error(`FAIL: ${name}`); failed = true; }
  else console.log(`OK: ${name}`);
}
if (failed) process.exit(1);
console.log("SERVIO v4.35 metadata extraction trainer guards OK.");
