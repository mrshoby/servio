param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev"
)
$ErrorActionPreference = "Stop"
Write-Host "Testing SERVIO v32.87 Cloudflare routes..." -ForegroundColor Cyan
$routes = @("/api/servio/health","/api/servio/data","/api/servio/db/status","/api/servio/db/market-prices?limit=16&sort=desc","/battery-revenue-simulator","/battery-calculator","/module-menu")
foreach($r in $routes){ $resp = Invoke-WebRequest "$Url$r"; Write-Host "PASS $r $($resp.StatusCode)" -ForegroundColor Green }
$periodResp = Invoke-WebRequest "$Url/api/servio/period/completeness" -Method POST -ContentType "application/json" -Body '{"from":"2024-01-08","to":"2024-01-31","market":"DAY_AHEAD"}'
$period = $periodResp.Content | ConvertFrom-Json
Write-Host "PASS /api/servio/period/completeness $($periodResp.StatusCode)" -ForegroundColor Green
Write-Host "Completeness: $($period.completionPct)% fastIndex=$($period.fastIndex) records=$($period.query.matched)"
if($period.fastIndex -ne $true){ throw "Expected fastIndex=true" }
$simResp = Invoke-WebRequest "$Url/api/servio/simulate-market-period" -Method POST -ContentType "application/json" -Body '{"from":"2024-01-08","to":"2024-01-31","params":{"capacityMWh":2,"powerMW":1},"preset":"default"}'
$sim = $simResp.Content | ConvertFrom-Json
Write-Host "PASS /api/servio/simulate-market-period preset=default $($simResp.StatusCode)" -ForegroundColor Green
if($sim.ok -ne $true){ throw "simulate-market-period returned ok=false: $($sim.error)" }
if(-not $sim.result){ throw "simulate-market-period missing result" }
Write-Host "Simulation result: revenueEur=$($sim.result.totalRevenueEur) cycles=$($sim.result.totalCycles) days=$($sim.result.totalDays)"
$status = (Invoke-WebRequest "$Url/api/servio/db/status").Content | ConvertFrom-Json
Write-Host "DB records: raw=$($status.rawRecords) selected=$($status.selectedRecords) allMarkets=$($status.selectedAllMarkets)"
if([int]$status.rawRecords -ne 76028){ throw "Expected rawRecords 76028, got $($status.rawRecords)" }
Write-Host "v32.87 Cloudflare simulate preset guard test passed." -ForegroundColor Cyan