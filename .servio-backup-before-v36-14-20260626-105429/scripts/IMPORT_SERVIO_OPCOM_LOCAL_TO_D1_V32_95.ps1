param(
  [string]$From = "",
  [string]$To = "",
  [string]$DatabaseName = "servio-db",
  [string]$CsvFolder = "",
  [switch]$NoExecute,
  [switch]$UseCmdFallback
)
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NodeScript = Join-Path $Root "scripts\import-opcom-pzu-local-to-d1-v3295.mjs"
if(-not (Test-Path $NodeScript)){ throw "Missing importer: $NodeScript" }

if([string]::IsNullOrWhiteSpace($From)){ $From = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd") }
if([string]::IsNullOrWhiteSpace($To)){ $To = (Get-Date).AddDays(1).ToString("yyyy-MM-dd") }
$Out = Join-Path $Root "audit-results"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$nodeArgs = @($NodeScript, "--from", $From, "--to", $To, "--database", $DatabaseName, "--out", $Out, "--no-execute")
if(-not [string]::IsNullOrWhiteSpace($CsvFolder)){ $nodeArgs += @("--csv-folder", $CsvFolder) }

Write-Host "SERVIO v32.95 local OPCOM import + D1 no-transaction fix" -ForegroundColor Cyan
Write-Host "From: $From To: $To Database: $DatabaseName" -ForegroundColor Gray
Write-Host "Generating SQL locally..." -ForegroundColor Gray
& node @nodeArgs
if($LASTEXITCODE -ne 0){ throw "Node OPCOM importer failed with exit code $LASTEXITCODE" }

$SqlPath = Join-Path $Out "servio-v3295-opcom-import-$($From)_to_$($To).sql"
$ReportPath = Join-Path $Out "servio-v3295-opcom-import-$($From)_to_$($To).json"
if(-not (Test-Path $SqlPath)){ throw "Expected SQL file not found: $SqlPath" }
if(Test-Path $ReportPath){
  try {
    $Report = Get-Content $ReportPath -Raw | ConvertFrom-Json
    Write-Host "Parsed records in report: $($Report.records)" -ForegroundColor Green
    if([int]$Report.records -le 0){ throw "Report contains 0 parsed records. Nothing useful to import." }
  } catch {
    Write-Warning "Could not parse report JSON, continuing with SQL file: $ReportPath"
  }
}

Write-Host "SQL ready: $SqlPath" -ForegroundColor Green
if($NoExecute){
  Write-Host "NoExecute requested. Run this manually:" -ForegroundColor Yellow
  Write-Host "npx wrangler d1 execute $DatabaseName --remote --file=`"$SqlPath`"" -ForegroundColor Yellow
  return
}

Write-Host "Running Wrangler directly from PowerShell..." -ForegroundColor Cyan
$wranglerArgs = @("wrangler", "d1", "execute", $DatabaseName, "--remote", "--file=$SqlPath")
& npx @wranglerArgs
$Code = $LASTEXITCODE

if($Code -ne 0 -or $UseCmdFallback){
  Write-Warning "Direct npx wrangler returned exit code $Code. Trying cmd.exe fallback..."
  $CmdLine = "npx wrangler d1 execute $DatabaseName --remote --file=`"$SqlPath`""
  Write-Host "CMD: $CmdLine" -ForegroundColor Gray
  cmd.exe /d /s /c $CmdLine
  $Code = $LASTEXITCODE
}

if($Code -ne 0){
  Write-Host "Wrangler D1 execute failed with exit code $Code." -ForegroundColor Red
  Write-Host "Manual command to run:" -ForegroundColor Yellow
  Write-Host "npx wrangler d1 execute $DatabaseName --remote --file=`"$SqlPath`"" -ForegroundColor Yellow
  throw "D1 import failed. Check Wrangler output above."
}

Write-Host "Imported OPCOM local SQL into Cloudflare D1: $DatabaseName" -ForegroundColor Green
Write-Host "Now verify with:" -ForegroundColor Cyan
Write-Host "  `$Url = 'https://servio.vlad-it-taran.workers.dev'" -ForegroundColor Gray
Write-Host "  .\scripts\TEST_SERVIO_V32_95_LOCAL_OPCOM_IMPORT_RESULT.ps1 -Url `$Url" -ForegroundColor Gray
