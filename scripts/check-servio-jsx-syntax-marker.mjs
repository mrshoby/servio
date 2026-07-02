import fs from "node:fs";

const app = fs.readFileSync("public/Servio.jsx", "utf8");
const worker = fs.readFileSync("src/worker.js", "utf8");
const workflow = fs.readFileSync(".github/workflows/opcom-pzu-cache.yml", "utf8");

const checks = [
  ["build version v4.42", worker.includes("servio-grid-map-v4.42-combined-dataset-analyzer")],
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
  ["template registry exists", app.includes("Template Registry") && app.includes("templateRegistry") && app.includes("updateTemplateRegistryItem") && app.includes("duplicateTemplate") && app.includes("testTemplate")],
  ["template registry controls exist", app.includes("templateStatusFilter") && app.includes("templateQuery") && app.includes("dlcregistry") && app.includes("usageCount") && app.includes("averageConfidence")],
  ["smart parser runtime exists", app.includes("SMART_PARSER_ACTION_LABELS") && app.includes("scoreLearningTemplateMatch") && app.includes("getLearningSmartParserRuntime") && app.includes("Smart Parser Runtime")],
  ["smart parser runtime UI exists", app.includes("dlcruntime") && app.includes("Import automat") && app.includes("Confirmă template") && app.includes("Mapare manuală")],
  ["granularity normalization exists", app.includes("buildLearningGranularityNormalization") && app.includes("detectLearningTimeStepMinutes") && app.includes("detectLearningUnitProfile") && app.includes("GRANULARITY_NORMALIZATION_LABELS")],
  ["granularity normalization UI exists", app.includes("dlcnormalization") && app.includes("Granularity Normalization") && app.includes("60 min → 15 min") && app.includes("15 min → 60 min")],
  ["granularity normalization persisted", app.includes("normalizedGranularity: f.granularityProfile?.normalizedGranularity") && app.includes("canExpandTo15m") && app.includes("canAggregateTo60m") && app.includes("estimated15mRule")],
  ["data quality engine exists", app.includes("buildLearningDataQuality") && app.includes("DATA_QUALITY_ANALYSIS_LABELS") && app.includes("qualityProfile")],
  ["data quality UI exists", app.includes("Data Quality & Validation") && app.includes("dlcquality") && app.includes("allowedAnalyses")],
  ["data quality persisted", app.includes("qualityRules") && app.includes("blockedAnalyses") && app.includes("recommendedNextStep")],
  ["consumption dataset analyzer exists", app.includes("buildConsumptionDatasetProfile") && app.includes("extractLearningConsumptionSamples") && app.includes("CONSUMPTION_PROFILE_LABELS")],
  ["consumption dataset UI exists", app.includes("Consumption Dataset Analyzer") && app.includes("dlcconsumption") && app.includes("Consumption ready")],
  ["consumption profile persisted", app.includes("consumptionProfile") && app.includes("consumptionRules") && app.includes("loadFactorPct")],
  ["production dataset analyzer exists", app.includes("buildProductionDatasetProfile") && app.includes("extractLearningProductionSamples") && app.includes("PRODUCTION_PROFILE_LABELS")],
  ["production dataset UI exists", app.includes("Production Dataset Analyzer") && app.includes("dlcproduction") && app.includes("Production ready")],
  ["production profile persisted", app.includes("productionProfile") && app.includes("productionRules") && app.includes("capacityFactorPct") && app.includes("peakGenerationKw")],
  ["combined dataset analyzer exists", app.includes("buildCombinedDatasetProfile") && app.includes("extractLearningBalanceSamples") && app.includes("COMBINED_DATASET_PROFILE_LABELS")],
  ["combined dataset UI exists", app.includes("Combined Dataset Analyzer") && app.includes("dlccombined") && app.includes("Combined ready")],
  ["combined dataset profile persisted", app.includes("combinedDatasetProfile") && app.includes("combinedDatasetRules") && app.includes("selfConsumedKwh") && app.includes("coveragePct") && app.includes("pvUtilizationPct")],
  ["storage migrated to v4.42", app.includes("servio.dataLearning.v442") && app.includes("servio.dataLearning.v441") && app.includes("servio.dataLearning.v440")],
  ["file type categories preserved", app.includes("ibd") && app.includes("meter") && app.includes("pvgis") && app.includes("inverter") && app.includes("ems_scada") && app.includes("full_balance_file")],
  ["sheet detection modes preserved", app.includes("monthly_sheets") && app.includes("daily_sheets") && app.includes("multiple_relevant_sheets") && app.includes("multi_table_sheet")],
  ["layout modes preserved", app.includes("matrix_day_by_interval") && app.includes("matrix_interval_by_day") && app.includes("metadata_plus_table") && app.includes("multi_table") && app.includes("vertical_table")],
  ["loading orange spinner preserved", worker.includes("servio-boot-spinner") && worker.includes("Se încarcă Servio") && !worker.includes("Inițializez shell-ul Claude și modulele Energy Market OS.")],
  ["old removed sections stay removed", !app.includes("Necesită atenție") && !app.includes("Surse de date · OPCOM & ENTSO-E") && !app.includes("Conformitate") && !app.includes("Price Thresholds · Inowattio old engine")],
  ["no old Inowattio debugging in UI", !app.includes("Inowattio old engine") && !app.includes("Inowattio parity") && !app.includes("DB locked")],
  ["day-ahead strict source preserved", app.includes('strict: dayAheadSource === "opcom" ? "1" : ""') && app.includes("warningToday") && app.includes("warningTomorrow")],
  ["Electricity Maps live grid preserved", worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes("/v4/electricity-mix/latest") && worker.includes("GRID_MAP_ZONES.length") && worker.includes("full-europe-single-signal-v4.42-combined-dataset-analyzer")],
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
console.log("SERVIO v4.42 combined dataset analyzer guards OK.");
