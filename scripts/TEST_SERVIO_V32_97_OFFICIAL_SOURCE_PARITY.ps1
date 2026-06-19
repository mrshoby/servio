param([string]$Url = "https://servio.vlad-it-taran.workers.dev")
$ErrorActionPreference = "Stop"
function Get-Json($Path){ Invoke-RestMethod -Method GET -Uri ($Url.TrimEnd('/') + $Path) }
function Post-Json($Path, $Body){ Invoke-RestMethod -Method POST -Uri ($Url.TrimEnd('/') + $Path) -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 12) }
function IsoDate($d){ ([DateTime]$d).ToString("yyyy-MM-dd") }
$tomorrow = IsoDate((Get-Date).AddDays(1))
Write-Host "Testing SERVIO v32.97 official source parity autosync..." -ForegroundColor Cyan
$health = Get-Json "/api/servio/health"
if($health.version -notlike "v32.97*"){ throw "Expected v32.97 health, got $($health.version)" }
Write-Host "PASS health version $($health.version)" -ForegroundColor Green
$status = Get-Json "/api/servio/live/status"
if(-not $status.tokenPresent){ throw "ENTSO-E tokenPresent=False. Set Cloudflare secret ENTSOE_API_TOKEN." }
Write-Host "PASS live/status tokenPresent=$($status.tokenPresent) mode=$($status.mode)" -ForegroundColor Green
$sync = Post-Json "/api/servio/entsoe/sync-delivery-day" @{ date=$tomorrow; maxDays=1 }
Write-Host "ENTSO-E sync records=$($sync.records) complete=$($sync.complete) expected=$($sync.expectedIntervals) bestAttempt=$($sync.bestAttempt)" -ForegroundColor Yellow
if(-not $sync.ok){ throw "ENTSO-E sync failed: $($sync.error)" }
$health2 = Get-Json "/api/servio/live/source-health?date=$tomorrow"
Write-Host "Source health final records=$($health2.final.records) complete=$($health2.final.complete) selected=$($health2.final.selectedSourceMode) primary=$($health2.final.primarySource)" -ForegroundColor Green
Write-Host "ENTSOE intervals=$($health2.entsoe.intervals)/$($health2.expectedIntervals) complete=$($health2.entsoe.complete) OPCOM intervals=$($health2.opcom.intervals)/$($health2.expectedIntervals) complete=$($health2.opcom.complete)" -ForegroundColor Green
$summary = Get-Json "/api/servio/day-ahead/summary?date=$tomorrow"
Write-Host "Day-ahead summary $tomorrow records=$($summary.records) raw=$($summary.rawRecords) source=$($summary.sourceMode) selected=$($summary.selectedSourceMode) primary=$($summary.primarySource) avgRonMwh=$($summary.avgRonMwh)" -ForegroundColor Green
if([int]($summary.records ?? 0) -lt 96){ throw "Day-ahead effective summary has less than 96 intervals for $tomorrow. Run SYNC_SERVIO_OFFICIAL_SOURCES_PARITY_V32_97.ps1 to import OPCOM fallback." }
$tr = Get-Json "/api/servio/transelectrica/status"
Write-Host "Transelectrica balancing records=$($tr.balancingRecords) mode=$($tr.mode)" -ForegroundColor Green
Write-Host "v32.97 source parity test completed." -ForegroundColor Green