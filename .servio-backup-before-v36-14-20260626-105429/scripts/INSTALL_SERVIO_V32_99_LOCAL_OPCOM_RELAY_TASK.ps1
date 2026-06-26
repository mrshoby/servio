param(
  [string]$RepoPath = "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX",
  [string]$ServioUrl = "https://servio.vlad-it-taran.workers.dev",
  [string]$IngestSecret = "",
  [string]$EntsoeToken = "",
  [string]$Source = "all",
  [string]$TaskName = "SERVIO v32.99 Official Source Local Relay",
  [string[]]$Times = @("11:45","12:15","13:15","14:15","15:15","16:15","17:15"),
  [switch]$RunOnceNow
)
$ErrorActionPreference = "Stop"
if(!(Test-Path $RepoPath)){ throw "RepoPath not found: $RepoPath" }
$RunScript = Join-Path $RepoPath "scripts\RUN_SERVIO_V32_99_HYBRID_SOURCE_RELAY_LOCAL.ps1"
if(!(Test-Path $RunScript)){ throw "Missing local relay runner: $RunScript. Apply v32.99 first." }
if([string]::IsNullOrWhiteSpace($IngestSecret)){ throw "Missing -IngestSecret. Use the same SERVIO_INGEST_SECRET as Cloudflare/GitHub." }

$ConfigDir = Join-Path $env:APPDATA "SERVIO"
if(!(Test-Path $ConfigDir)){ New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null }
$ConfigPath = Join-Path $ConfigDir "servio-v3299-relay-config.json"
$config = [ordered]@{
  ServioUrl = $ServioUrl
  ServioIngestSecret = $IngestSecret
  EntsoeApiToken = $EntsoeToken
  Source = $Source
  RepoPath = $RepoPath
  InstalledAt = (Get-Date).ToString("s")
}
$config | ConvertTo-Json -Depth 5 | Set-Content -Path $ConfigPath -Encoding UTF8

$Triggers = @()
foreach($t in $Times){
  $Triggers += New-ScheduledTaskTrigger -Daily -At ([datetime]::ParseExact($t, "HH:mm", $null))
}
$Arg = "-NoProfile -ExecutionPolicy Bypass -File `"$RunScript`" -ConfigPath `"$ConfigPath`""
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Arg -WorkingDirectory $RepoPath
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Triggers -Settings $Settings -Description "SERVIO v32.99 local official source relay: ENTSO-E/OPCOM/Transelectrica probe -> secure SERVIO API -> D1" -Force | Out-Null

Write-Host "Installed scheduled task: $TaskName" -ForegroundColor Green
Write-Host "Config: $ConfigPath"
Write-Host "Times: $($Times -join ', ')"
Write-Host "Manual run command:" -ForegroundColor Cyan
Write-Host ".\scripts\RUN_SERVIO_V32_99_HYBRID_SOURCE_RELAY_LOCAL.ps1 -ConfigPath `"$ConfigPath`""

if($RunOnceNow){
  Push-Location $RepoPath
  try{
    & $RunScript -ConfigPath $ConfigPath
  } finally { Pop-Location }
}
