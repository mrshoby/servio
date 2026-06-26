param([string]$Url = "https://servio.vlad-it-taran.workers.dev")
$ErrorActionPreference = "Stop"
function Get-Json($Path){ Write-Host "GET $Path" -ForegroundColor Cyan; Invoke-RestMethod -Method GET -Uri ($Url.TrimEnd('/') + $Path) | ConvertTo-Json -Depth 30 }
function Post-Json($Path, $Body){ Write-Host "POST $Path" -ForegroundColor Cyan; Invoke-RestMethod -Method POST -Uri ($Url.TrimEnd('/') + $Path) -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 12) | ConvertTo-Json -Depth 30 }
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Get-Json "/api/servio/health"
Get-Json "/api/servio/live/status"
Get-Json "/api/servio/entsoe/status"
Post-Json "/api/servio/entsoe/sync-delivery-day" @{ date=$tomorrow; maxDays=1 }
Get-Json "/api/servio/live/source-health?date=$tomorrow"
Get-Json "/api/servio/day-ahead/summary?date=$tomorrow"
Get-Json "/api/servio/opcom/day-ahead/summary?date=$tomorrow&autoSync=0"
Get-Json "/api/servio/transelectrica/status"
Get-Json "/api/servio/db/status"