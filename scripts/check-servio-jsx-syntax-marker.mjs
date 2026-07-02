import fs from "node:fs";

const app = fs.readFileSync("public/Servio.jsx", "utf8");
const worker = fs.readFileSync("src/worker.js", "utf8");
const workflow = fs.readFileSync(".github/workflows/opcom-pzu-cache.yml", "utf8");

const checks = [
  ["build version v4.31", worker.includes("servio-grid-map-v4.31-workbook-sheet-detection-engine")],
  ["xlsx import support", app.includes('import * as XLSX from "xlsx"') && worker.includes('xlsx@0.18.5') && worker.includes('XLSX')],
  ["auth endpoints preserved", worker.includes('path === "/api/servio/auth/login"') && worker.includes('path === "/api/servio/auth/me"') && worker.includes('path === "/api/servio/auth/logout"')],
  ["auth frontend preserved", app.includes("function AuthGate") && app.includes("function LoginView") && app.includes("function UserMenu") && worker.includes("function AuthGate")],
  ["Data Learning Center admin-only", app.includes("function DataLearningCenter") && app.includes('currentUser.role === "admin"') && app.includes("{isAdmin && <DataLearningCenter") && worker.includes("function DataLearningCenter")],
  ["workbook reader exists", app.includes("async function readWorkbookInfo") && app.includes("worksheetToRows") && app.includes("buildSheetProfile") && app.includes("buildWorkbookInfoFromSheets")],
  ["sheet detection modes exist", app.includes("monthly_sheets") && app.includes("daily_sheets") && app.includes("multiple_relevant_sheets") && app.includes("multi_table_sheet")],
  ["sheet profile fields exist", app.includes("detectedSheets") && app.includes("ignoredSheets") && app.includes("sheetProfiles") && app.includes("periodType") && app.includes("periodLabel")],
  ["sheet UI exists", app.includes("dlcsheets") && app.includes("dlcsheet") && app.includes("active /") && app.includes("XLS / XLSX analizate")],
  ["template save foundation preserved", app.includes("Salvează ca template") && app.includes("template_saved")],
  ["loading orange spinner preserved", worker.includes("servio-boot-spinner") && worker.includes("Se încarcă Servio") && !worker.includes("Inițializez shell-ul Claude și modulele Energy Market OS.")],
  ["old removed sections stay removed", !app.includes("Necesită atenție") && !app.includes("Surse de date · OPCOM & ENTSO-E") && !app.includes("Conformitate") && !app.includes("Price Thresholds · Inowattio old engine")],
  ["no old Inowattio debugging in UI", !app.includes("Inowattio old engine") && !app.includes("Inowattio parity") && !app.includes("DB locked")],
  ["day-ahead strict source preserved", app.includes('strict: dayAheadSource === "opcom" ? "1" : ""') && app.includes("warningToday") && app.includes("warningTomorrow")],
  ["Electricity Maps live grid preserved", worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes("/v4/electricity-mix/latest") && worker.includes("GRID_MAP_ZONES.length") && worker.includes("full-europe-single-signal-v4.31-workbook-sheet-detection-engine")],
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
console.log("SERVIO v4.31 workbook and sheet detection guards OK.");
