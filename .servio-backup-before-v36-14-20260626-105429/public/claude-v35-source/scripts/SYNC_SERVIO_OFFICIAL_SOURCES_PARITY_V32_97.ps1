param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev",
  [string]$Date = "",
  [switch]$SkipOpcomFallback
)
$ErrorActionPreference = "Stop"
if([string]::IsNullOrWhiteSpace($Date)){ $Date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd") }
function Get-Json($Path){ Invoke-RestMethod -Method GET -Uri ($Url.TrimEnd('/') + $Path) }
function Post-Json($Path, $Body){ Invoke-RestMethod -Method POST -Uri ($Url.TrimEnd('/') + $Path) -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 12) }
Write-Host "SERVIO v32.97 official source parity sync for $Date" -ForegroundColor Cyan
$entsoe = Post-Json "/api/servio/entsoe/sync-delivery-day" @{ date=$Date; maxDays=1 }
Write-Host "ENTSO-E: records=$($entsoe.records) complete=$($entsoe.complete) expected=$($entsoe.expectedIntervals)" -ForegroundColor Yellow
$health = Get-Json "/api/servio/live/source-health?date=$Date"
Write-Host "Before fallback: final=$($health.final.records)/$($health.expectedIntervals) selected=$($health.final.selectedSourceMode) ENT=$($health.entsoe.intervals) OPCOM=$($health.opcom.intervals)" -ForegroundColor Yellow
if(-not $SkipOpcomFallback -and (-not $health.final.complete)){
  Write-Host "Final source is incomplete. Running local OPCOM import fallback for $Date..." -ForegroundColor Cyan
  $script = Join-Path $PSScriptRoot "IMPORT_SERVIO_OPCOM_LOCAL_TO_D1_V32_95.ps1"
  if(!(Test-Path $script)){ throw "Missing OPCOM local import script: $script" }
  & $script -From $Date -To $Date
  if($LASTEXITCODE -ne 0){ throw "OPCOM local import fallback failed with exit code $LASTEXITCODE" }
}
$health2 = Get-Json "/api/servio/live/source-health?date=$Date"
$summary = Get-Json "/api/servio/day-ahead/summary?date=$Date"
Write-Host "After sync: final=$($health2.final.records)/$($health2.expectedIntervals) complete=$($health2.final.complete) selected=$($health2.final.selectedSourceMode) primary=$($health2.final.primarySource)" -ForegroundColor Green
Write-Host "Summary: records=$($summary.records) raw=$($summary.rawRecords) avgRonMwh=$($summary.avgRonMwh) source=$($summary.sourceMode)" -ForegroundColor Green
if(-not $health2.final.complete){ throw "Official source parity still incomplete for $Date" }