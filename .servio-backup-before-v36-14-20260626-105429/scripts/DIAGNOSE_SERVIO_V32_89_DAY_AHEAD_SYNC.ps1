param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev"
)
$ErrorActionPreference = "Continue"
$Base = $Url.TrimEnd('/')
$today = Get-Date
$from = $today.AddDays(-2).ToString('yyyy-MM-dd')
$tomorrow = $today.AddDays(1).ToString('yyyy-MM-dd')
function CallGet($Path){
  Write-Host "GET $Path" -ForegroundColor Cyan
  try { (Invoke-RestMethod -Method GET -Uri ($Base + $Path) -Headers @{ 'cache-control'='no-cache' }) | ConvertTo-Json -Depth 20 }
  catch { Write-Host $_.Exception.Message -ForegroundColor Red; if($_.ErrorDetails){ Write-Host $_.ErrorDetails.Message } }
}
function CallPost($Path,$Body){
  Write-Host "POST $Path" -ForegroundColor Cyan
  try { (Invoke-RestMethod -Method POST -Uri ($Base + $Path) -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 20) -Headers @{ 'cache-control'='no-cache' }) | ConvertTo-Json -Depth 30 }
  catch { Write-Host $_.Exception.Message -ForegroundColor Red; if($_.ErrorDetails){ Write-Host $_.ErrorDetails.Message } }
}
CallGet "/api/servio/health"
CallGet "/api/servio/live/status"
CallGet "/api/servio/entsoe/status"
CallGet "/api/servio/opcom/status"
CallPost "/api/servio/opcom/day-ahead/sync-range" @{ opcomFrom=$from; opcomTo=$tomorrow; language='ro'; maxDays=4 }
CallPost "/api/servio/entsoe/sync-delivery-day" @{ date=$tomorrow }
CallGet ("/api/servio/day-ahead/summary?date=" + [uri]::EscapeDataString($tomorrow))
CallGet ("/api/servio/opcom/day-ahead/summary?date=" + [uri]::EscapeDataString($tomorrow) + "&from=" + [uri]::EscapeDataString($from) + "&to=" + [uri]::EscapeDataString($tomorrow) + "&autoSync=1")
CallGet ("/api/servio/opcom/day-ahead/records?date=" + [uri]::EscapeDataString($tomorrow) + "&limit=120&autoSync=0")
CallGet "/api/servio/db/status"
