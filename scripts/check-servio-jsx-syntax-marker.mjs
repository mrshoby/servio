import fs from "node:fs";

const app = fs.readFileSync("public/Servio.jsx", "utf8");
const worker = fs.readFileSync("src/worker.js", "utf8");
const workflow = fs.readFileSync(".github/workflows/opcom-pzu-cache.yml", "utf8");

const checks = [
  ["build version v4.29", worker.includes("servio-grid-map-v4.29-auth-login-shell-integration")],
  ["auth login endpoint", worker.includes('path === "/api/servio/auth/login"')],
  ["auth me endpoint", worker.includes('path === "/api/servio/auth/me"')],
  ["auth logout endpoint", worker.includes('path === "/api/servio/auth/logout"')],
  ["auth env users support", worker.includes("SERVIO_AUTH_USERS_JSON") && worker.includes("SERVIO_AUTH_SECRET")],
  ["auth session cookie", worker.includes("HttpOnly") && worker.includes("SameSite=Lax") && worker.includes("Secure") && worker.includes("servio_session")],
  ["frontend AuthGate", app.includes("function AuthGate") && worker.includes("function AuthGate")],
  ["frontend LoginView", app.includes("function LoginView") && worker.includes("function LoginView")],
  ["frontend UserMenu", app.includes("function UserMenu") && worker.includes("function UserMenu")],
  ["frontend AuthProvider/useAuth", app.includes("function AuthProvider") && app.includes("function useAuth") && worker.includes("function AuthProvider") && worker.includes("function useAuth")],
  ["avatar initials", app.includes("avatarInitials") && worker.includes("avatarInitials")],
  ["RBAC helpers", app.includes("canAccess") && app.includes("hasPermission") && worker.includes("canAccess") && worker.includes("hasPermission")],
  ["loading orange spinner", worker.includes("servio-boot-spinner") && worker.includes("Se încarcă Servio") && !worker.includes("Inițializez shell-ul Claude și modulele Energy Market OS.")],
  ["no old overview attention card", !app.includes("Necesită atenție") && !worker.includes('Card title=\\"Necesită atenție\\"')],
  ["no old settings cards", !app.includes("Surse de date · OPCOM & ENTSO-E") && !app.includes("Conformitate") && !worker.includes('Card title=\\"Surse de date · OPCOM & ENTSO-E\\"') && !worker.includes('Card title=\\"Conformitate\\"')],
  ["no old BESS price thresholds card", !app.includes("Price Thresholds · Inowattio old engine") && !worker.includes("Price Thresholds · Inowattio old engine")],
  ["no old Inowattio debugging in UI", !app.includes("Inowattio old engine") && !app.includes("Inowattio parity") && !app.includes("DB locked")],
  ["day-ahead strict source param preserved", app.includes('strict: dayAheadSource === "opcom" ? "1" : ""') && worker.includes('strict: dayAheadSource === \\\"opcom\\\" ? \\\"1\\\" : \\\"\\\"')],
  ["day-ahead per-day warnings preserved", app.includes("warningToday") && app.includes("warningTomorrow") && app.includes("activeWarning") && worker.includes("warningToday") && worker.includes("warningTomorrow") && worker.includes("activeWarning")],
  ["Electricity Maps live grid preserved", worker.includes('GRID_MAP_PROVIDER || "electricitymaps"') && worker.includes("/v4/electricity-mix/latest") && worker.includes("GRID_MAP_ZONES.length") && worker.includes("full-europe-single-signal-v4.29-auth-login-shell-integration")],
  ["live-flow arrows preserved", app.includes("gridflowgeo") && worker.includes("gridflowgeo")],
  ["flow inspector preserved", app.includes("gridhoverflows") && app.includes("gridhoverflowcol") && worker.includes("gridhoverflows") && worker.includes("gridhoverflowcol")],
  ["mouse wheel zoom preserved", app.includes("handleMapWheel") && app.includes("onWheel={handleMapWheel}") && worker.includes("handleMapWheel") && worker.includes("onWheel={handleMapWheel}")],
  ["OPCOM auto refresh schedule preserved", workflow.includes("*/15 * * * *") && workflow.includes("workflow_dispatch")],
];

let failed = false;
for (const [name, ok] of checks) {
  if (!ok) { console.error(`FAIL: ${name}`); failed = true; }
  else console.log(`OK: ${name}`);
}
if (failed) process.exit(1);
console.log("SERVIO v4.29 auth/login shell integration guards OK.");
