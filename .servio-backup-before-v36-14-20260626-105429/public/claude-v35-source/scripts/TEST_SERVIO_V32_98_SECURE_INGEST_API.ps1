param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev",
  [string]$IngestSecret = ""
)
$ErrorActionPreference = "Stop"
function Get-Json($Path){ Invoke-RestMethod -Method GET -Uri ($Url.TrimEnd('/') + $Path) }
function Post-Json($Path, $Body, $Secret){
  $headers=@{}
  if(-not [string]::IsNullOrWhiteSpace($Secret)){ $headers["Authorization"] = "Bearer $Secret" }
  Invoke-RestMethod -Method POST -Uri ($Url.TrimEnd('/') + $Path) -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 20)
}
Write-Host "Testing SERVIO v32.98 secure ingest API..." -ForegroundColor Cyan
$health = Get-Json "/api/servio/health"
Write-Host "Health version: $($health.version)"
if($health.version -notlike "v32.98*"){ throw "Expected v32.98 Worker, got $($health.version)" }
$status = Get-Json "/api/servio/ingest/status"
Write-Host "Ingest authConfigured=$($status.authConfigured) d1Live=$($status.d1.liveRecords)"
if(-not $status.authConfigured){ throw "SERVIO_INGEST_SECRET is not configured in Cloudflare Worker. Run: `$secret | npx wrangler secret put SERVIO_INGEST_SECRET" }
if(-not [string]::IsNullOrWhiteSpace($IngestSecret)){
  $tomorrow=(Get-Date).AddDays(1).ToString("yyyy-MM-dd")
  $body=@{ dryRun=$true; sourceMode="opcom-pzu-live"; reason="v3298-dry-run-test"; records=@(@{ date=$tomorrow; interval=1; priceRonMwh=1; priceEurMwh=0.2; eurRon=5; sourceMode="opcom-pzu-live" }) }
  $dry=Post-Json "/api/servio/ingest/opcom?dryRun=1" $body $IngestSecret
  Write-Host "Dry-run preparedRecords=$($dry.preparedRecords) sourceMode=$($dry.sourceMode)"
  if(-not $dry.ok -or $dry.preparedRecords -lt 1){ throw "Dry-run ingest failed" }
} else {
  Write-Host "No -IngestSecret provided, skipped authenticated dry-run POST." -ForegroundColor Yellow
}
$sourceHealth = Get-Json ("/api/servio/live/source-health?date=" + (Get-Date).AddDays(1).ToString("yyyy-MM-dd"))
Write-Host "Source health final=$($sourceHealth.final.records)/$($sourceHealth.expectedIntervals) selected=$($sourceHealth.final.selectedSourceMode)"
Write-Host "v32.98 secure ingest API test passed." -ForegroundColor Green
