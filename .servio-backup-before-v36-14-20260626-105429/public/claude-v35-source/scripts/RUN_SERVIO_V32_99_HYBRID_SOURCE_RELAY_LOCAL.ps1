param(
  [string]$ConfigPath = "$env:APPDATA\SERVIO\servio-v3299-relay-config.json",
  [string]$Url = "",
  [string]$IngestSecret = "",
  [string]$EntsoeToken = "",
  [string]$From = "",
  [string]$To = "",
  [string]$Source = "all",
  [switch]$Strict,
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"

function Get-BucharestDate([int]$AddDays = 0) {
  $tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("E. Europe Standard Time")
  $now = [System.TimeZoneInfo]::ConvertTimeFromUtc((Get-Date).ToUniversalTime(), $tz)
  return $now.AddDays($AddDays).ToString("yyyy-MM-dd")
}

if(Test-Path $ConfigPath){
  $cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json
  if([string]::IsNullOrWhiteSpace($Url) -and $cfg.ServioUrl){ $Url = [string]$cfg.ServioUrl }
  if([string]::IsNullOrWhiteSpace($IngestSecret) -and $cfg.ServioIngestSecret){ $IngestSecret = [string]$cfg.ServioIngestSecret }
  if([string]::IsNullOrWhiteSpace($EntsoeToken) -and $cfg.EntsoeApiToken){ $EntsoeToken = [string]$cfg.EntsoeApiToken }
  if($cfg.Source -and $Source -eq "all"){ $Source = [string]$cfg.Source }
}

if([string]::IsNullOrWhiteSpace($Url)){ $Url = "https://servio.vlad-it-taran.workers.dev" }
if([string]::IsNullOrWhiteSpace($From)){ $From = Get-BucharestDate 0 }
if([string]::IsNullOrWhiteSpace($To)){ $To = Get-BucharestDate 1 }
if([string]::IsNullOrWhiteSpace($IngestSecret)){ throw "Missing SERVIO_INGEST_SECRET. Pass -IngestSecret or install config with INSTALL_SERVIO_V32_99_LOCAL_OPCOM_RELAY_TASK.ps1" }

$RepoRoot = Split-Path -Parent $PSScriptRoot
$NodeScript = Join-Path $PSScriptRoot "servio-official-source-ingestion-v3299.mjs"
if(!(Test-Path $NodeScript)){ throw "Missing node relay script: $NodeScript" }

$env:SERVIO_URL = $Url
$env:SERVIO_INGEST_SECRET = $IngestSecret
$env:SERVIO_RELAY_MODE = "windows-local-task"
$env:SERVIO_SYNC_SOURCE = $Source
if(-not [string]::IsNullOrWhiteSpace($EntsoeToken)){ $env:ENTSOE_API_TOKEN = $EntsoeToken }
if($DryRun){ $env:SERVIO_DRY_RUN = "true" } else { $env:SERVIO_DRY_RUN = "false" }
if($Strict){ $env:SERVIO_STRICT_COMPLETE = "true" } else { $env:SERVIO_STRICT_COMPLETE = "false" }

$AuditDir = Join-Path $RepoRoot "audit-results"
if(!(Test-Path $AuditDir)){ New-Item -ItemType Directory -Path $AuditDir -Force | Out-Null }
$env:SERVIO_AUDIT_DIR = $AuditDir

Write-Host "SERVIO v32.99 local hybrid relay" -ForegroundColor Cyan
Write-Host "Url: $Url"
Write-Host "Range: $From -> $To"
Write-Host "Source: $Source"
Write-Host "Mode: windows-local-task"

Push-Location $RepoRoot
try{
  $args = @($NodeScript, "--url", $Url, "--from", $From, "--to", $To, "--source", $Source, "--relay-mode", "windows-local-task")
  if($DryRun){ $args += "--dry-run" }
  if($Strict){ $args += "--strict" }
  node @args
  if($LASTEXITCODE -ne 0){ throw "Node relay exited with code $LASTEXITCODE" }
} finally {
  Pop-Location
}
