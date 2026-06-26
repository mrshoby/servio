param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev",
  [string]$IngestSecret = ""
)
$ErrorActionPreference = "Stop"
function Get-Json($Path){ Invoke-RestMethod -Method GET -Uri ($Url.TrimEnd('/') + $Path) }
function Post-Json($Path, $Body, $Secret){
  if([string]::IsNullOrWhiteSpace($Secret)){ throw "Missing -IngestSecret for dry-run auth test." }
  $headers=@{ Authorization = "Bearer $Secret" }
  Invoke-RestMethod -Method POST -Uri ($Url.TrimEnd('/') + $Path) -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 20)
}
function BucharestDate([int]$AddDays=0){
  $tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("E. Europe Standard Time")
  $now = [System.TimeZoneInfo]::ConvertTimeFromUtc((Get-Date).ToUniversalTime(), $tz)
  return $now.AddDays($AddDays).ToString("yyyy-MM-dd")
}
$today = BucharestDate 0
$tomorrow = BucharestDate 1
Write-Host "Testing SERVIO v32.99 hybrid relay status..." -ForegroundColor Cyan
$health = Get-Json "/api/servio/health"
Write-Host "Health version: $($health.version)"
if($health.version -notlike "v32.99*"){ throw "Expected v32.99 Worker, got $($health.version)" }
$relay = Get-Json "/api/servio/relay/status"
Write-Host "Relay mode: $($relay.mode) cloud=$($relay.cloudRelay) local=$($relay.localRelay)"
$ingest = Get-Json "/api/servio/ingest/status"
Write-Host "Ingest authConfigured=$($ingest.authConfigured) liveRecords=$($ingest.d1.liveRecords)"
if(-not $ingest.authConfigured){ throw "SERVIO_INGEST_SECRET is not configured in Cloudflare Worker." }
if(-not [string]::IsNullOrWhiteSpace($IngestSecret)){
  $body=@{ dryRun=$true; sourceMode="opcom-pzu-live"; reason="v3299-dry-run-test"; records=@(@{ date=$tomorrow; interval=1; priceRonMwh=1; priceEurMwh=0.2; eurRon=5; sourceMode="opcom-pzu-live" }) }
  $dry=Post-Json "/api/servio/ingest/opcom?dryRun=1" $body $IngestSecret
  Write-Host "Dry-run preparedRecords=$($dry.preparedRecords) sourceMode=$($dry.sourceMode)"
}
$todayHealth = Get-Json "/api/servio/live/source-health?date=$today"
$tomorrowHealth = Get-Json "/api/servio/live/source-health?date=$tomorrow"
Write-Host "Today final: $($todayHealth.final.records)/$($todayHealth.expectedIntervals) complete=$($todayHealth.final.complete) selected=$($todayHealth.final.selectedSourceMode)"
Write-Host "Tomorrow final: $($tomorrowHealth.final.records)/$($tomorrowHealth.expectedIntervals) complete=$($tomorrowHealth.final.complete) selected=$($tomorrowHealth.final.selectedSourceMode)"
$db = Get-Json "/api/servio/db/status"
Write-Host "D1 live records=$($db.d1Sync.liveRecords) sources=$(($db.d1Sync.sources | ConvertTo-Json -Compress))"
Write-Host "SERVIO v32.99 hybrid relay test completed." -ForegroundColor Green
