param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev/",
  [ValidateSet("before","after","manual")][string]$Stage = "manual",
  [string]$RoutesFile = "audit-routes.json",
  [string]$OutputRoot = "audit",
  [switch]$InstallPlaywright,
  [switch]$AllowFailures
)
$ErrorActionPreference = "Stop"
Write-Host "SERVIO screenshot audit v36.12"
Write-Host "Url=$Url Stage=$Stage AllowFailures=$AllowFailures"
if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js nu este instalat sau nu este in PATH." }
if (!(Test-Path $RoutesFile)) { throw "Nu gasesc $RoutesFile" }
if ($InstallPlaywright -or !(Test-Path "node_modules\playwright")) {
  Write-Host "Instalez Playwright local fara sa modific package.json/package-lock..."
  npm install --no-audit --no-fund --no-save --package-lock=false playwright
  npx playwright install chromium
}
node "scripts/servio-screenshot-audit.mjs" --url $Url --stage $Stage --routes $RoutesFile --out $OutputRoot
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  if ($AllowFailures) { Write-Warning "Screenshot audit a raportat probleme si exit code $exitCode, dar continui pentru ca -AllowFailures este activ. Verifica raportul din $OutputRoot\reports." }
  else { throw "Screenshot audit failed cu exit code $exitCode. Pentru audit diagnostic foloseste -AllowFailures." }
}
Write-Host "Screenshot audit completed: $OutputRoot\screenshots\v36_12\$Stage"
