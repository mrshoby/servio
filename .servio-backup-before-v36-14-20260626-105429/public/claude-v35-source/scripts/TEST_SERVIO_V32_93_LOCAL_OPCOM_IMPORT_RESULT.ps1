param([string]$Url = "https://servio.vlad-it-taran.workers.dev")
$ErrorActionPreference = "Stop"
$Base = $Url.TrimEnd('/')
function GetJson($Path){ Invoke-RestMethod -Method GET -Uri ($Base + $Path) -Headers @{ 'Cache-Control'='no-cache' } }
$tomorrow = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
Write-Host "Testing SERVIO v32.93 local OPCOM D1 import result..." -ForegroundColor Cyan
$health = GetJson "/api/servio/health"
Write-Host "Health version: $($health.version)"
$db = GetJson "/api/servio/db/status"
Write-Host "D1 live=$($db.d1Sync.liveRecords) sources=$($db.sources | ConvertTo-Json -Compress)"
$op = GetJson "/api/servio/opcom/day-ahead/summary?date=$tomorrow&autoSync=0"
Write-Host "OPCOM tomorrow $tomorrow records=$($op.records) avgRonMwh=$($op.avgRonMwh) cacheTotal=$($op.cacheRecordsTotal)"
$day = GetJson "/api/servio/day-ahead/summary?date=$tomorrow"
Write-Host "Day-ahead tomorrow $tomorrow records=$($day.records) sourceMode=$($day.sourceMode) avgRonMwh=$($day.avgRonMwh) d1Merged=$($day.d1LiveRecordsMerged)"
if([int]($op.records ?? 0) -ge 24 -or [int]($day.records ?? 0) -ge 24){
  Write-Host "PASS: Day-ahead data is populated after local import fallback." -ForegroundColor Green
} else {
  Write-Host "WARNING: Tomorrow still has fewer than 24 records. Check OPCOM manual CSV import or ENTSO-E completeness." -ForegroundColor Yellow
}
