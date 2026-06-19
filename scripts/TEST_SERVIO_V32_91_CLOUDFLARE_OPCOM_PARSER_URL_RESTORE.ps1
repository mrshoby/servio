param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev",
  [switch]$SkipSync
)
$ErrorActionPreference = "Stop"
$Base = $Url.TrimEnd('/')
function Get-Json($Path){ Invoke-RestMethod -Method GET -Uri ($Base + $Path) -Headers @{ 'cache-control'='no-cache' } }
function Post-Json($Path, $Body){
  try { Invoke-RestMethod -Method POST -Uri ($Base + $Path) -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 12) -Headers @{ 'cache-control'='no-cache' } }
  catch {
    Write-Host "HTTP/Worker failure while calling $Path" -ForegroundColor Red
    if($_.ErrorDetails -and $_.ErrorDetails.Message){ Write-Host $_.ErrorDetails.Message }
    throw
  }
}
function Assert($Cond, $Msg){ if(-not $Cond){ throw $Msg } }
function IsoDate([datetime]$d){ $d.ToString('yyyy-MM-dd') }

Write-Host "Testing SERVIO v32.91 Cloudflare OPCOM parser/url restore..." -ForegroundColor Cyan
$today = Get-Date
$from = IsoDate($today.AddDays(-2))
$tomorrow = IsoDate($today.AddDays(1))

$health = Get-Json "/api/servio/health"
Assert $health.ok "Health endpoint failed"
Assert ([string]$health.version -like '*v32.91*') ("Wrong deployed version: " + $health.version)
Write-Host ("PASS health version " + $health.version) -ForegroundColor Green

$status = Get-Json "/api/servio/live/status"
Assert $status.ok "Live status failed"
Assert ([string]$status.mode -notlike '*no-mutation*') "Live status still reports no-mutation mode"
Write-Host ("PASS live/status mode=" + $status.mode + " tokenPresent=" + $status.tokenPresent) -ForegroundColor Green

$entsoeStatus = Get-Json "/api/servio/entsoe/status"
Assert $entsoeStatus.ok "ENTSO-E status endpoint failed"
Write-Host ("PASS entsoe/status tokenPresent=" + $entsoeStatus.tokenPresent) -ForegroundColor Green

if(-not $SkipSync){
  $opcom = Post-Json "/api/servio/opcom/day-ahead/sync-range" @{ opcomFrom=$from; opcomTo=$tomorrow; language='ro'; maxDays=4 }
  Assert ([string]$opcom.mode -notlike '*no-mutation*') "OPCOM sync is still no-mutation"
  Assert ($opcom.source -eq 'opcom_pzu_public_results') "Unexpected OPCOM sync payload"
  Assert ([string]$opcom.guard -like '*v32.91*' -or [string]$opcom.mode -like '*v3291*') "OPCOM v32.91 guard marker missing"
  Write-Host ("PASS opcom guarded sync ok=" + $opcom.ok + " fetchedDays=" + $opcom.fetchedDays + " failedDays=" + $opcom.failedDays + " parsedRecords=" + $opcom.parsedRecords + " cachedRecords=" + $opcom.cachedRecords) -ForegroundColor Green
  if(-not $opcom.ok -or [int]($opcom.parsedRecords ?? 0) -eq 0){
    Write-Warning "OPCOM sync did not parse records, but route returned guarded JSON instead of Cloudflare 1101. Run DIAGNOSE v32.91 script to inspect days[]."
  }

  $entsoe = Post-Json "/api/servio/entsoe/sync-delivery-day" @{ date=$tomorrow }
  Assert ([string]$entsoe.mode -notlike '*no-mutation*') "ENTSO-E sync is still no-mutation"
  Write-Host ("PASS entsoe guarded sync ok=" + $entsoe.ok + " records=" + $entsoe.records + " complete=" + $entsoe.complete) -ForegroundColor Green
}

$summary = Get-Json ("/api/servio/day-ahead/summary?date=" + [uri]::EscapeDataString($tomorrow))
Assert $summary.ok "Day-ahead summary failed"
Write-Host ("PASS day-ahead summary date=" + $summary.date + " records=" + $summary.records + " avgRonMwh=" + $summary.avgRonMwh + " d1Merged=" + $summary.d1LiveRecordsMerged) -ForegroundColor Green

$opcomSummary = Get-Json ("/api/servio/opcom/day-ahead/summary?date=" + [uri]::EscapeDataString($tomorrow) + "&from=" + [uri]::EscapeDataString($from) + "&to=" + [uri]::EscapeDataString($tomorrow) + "&autoSync=1")
Assert $opcomSummary.ok "OPCOM summary failed"
Write-Host ("PASS opcom summary date=" + $opcomSummary.date + " records=" + $opcomSummary.records + " cacheTotal=" + $opcomSummary.cacheRecordsTotal + " autoSyncAttempted=" + $opcomSummary.autoSyncAttempted) -ForegroundColor Green

$db = Get-Json "/api/servio/db/status"
Assert $db.ok "DB status failed"
Assert ([string]$db.runtime -like '*d1-live-sync*') ("DB runtime does not show D1 live sync: " + $db.runtime)
Write-Host ("PASS db/status rawRecords=" + $db.rawRecords + " d1Live=" + $db.d1Sync.liveRecords) -ForegroundColor Green

Write-Host "v32.91 Cloudflare OPCOM parser/url restore test passed." -ForegroundColor Green
