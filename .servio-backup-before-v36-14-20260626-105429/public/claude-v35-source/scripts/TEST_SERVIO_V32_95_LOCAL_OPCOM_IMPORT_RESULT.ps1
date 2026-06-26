param([string]$Url = "https://servio.vlad-it-taran.workers.dev")
$ErrorActionPreference = "Stop"
$Base = $Url.TrimEnd('/')
function GetJson($Path){ Invoke-RestMethod -Method GET -Uri ($Base + $Path) -TimeoutSec 45 }
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Write-Host "Testing SERVIO v32.95 local OPCOM D1 import no-transaction result..." -ForegroundColor Cyan
$health = GetJson "/api/servio/health"
Write-Host "Health version: $($health.version)" -ForegroundColor Green
$db = GetJson "/api/servio/db/status"
Write-Host "D1 live records: $($db.d1Sync.liveRecords)" -ForegroundColor Green
Write-Host "Sources: $($db.sources | ConvertTo-Json -Compress)" -ForegroundColor Green
Write-Host "Tomorrow $tomorrow records=$($db.tomorrow.records) source=$($db.tomorrow.sourceMode) avgRonMwh=$($db.tomorrow.avgRonMwh)" -ForegroundColor Green
$summary = GetJson "/api/servio/day-ahead/summary?date=$tomorrow"
Write-Host "Day-ahead summary $tomorrow records=$($summary.records) source=$($summary.sourceMode) d1Merged=$($summary.d1LiveRecordsMerged) avgRonMwh=$($summary.avgRonMwh)" -ForegroundColor Green
$opcom = GetJson "/api/servio/opcom/day-ahead/summary?date=$tomorrow&autoSync=0"
Write-Host "OPCOM summary $tomorrow records=$($opcom.records) cacheTotal=$($opcom.cacheRecordsTotal) avgRonMwh=$($opcom.avgRonMwh)" -ForegroundColor Green
if([int]$opcom.records -lt 90){
  Write-Warning "OPCOM D+1 still has fewer than 90 records. Import may not have reached D1 or summary endpoint may filter by source/date."
} else {
  Write-Host "PASS OPCOM D+1 imported with $($opcom.records) records." -ForegroundColor Green
}
