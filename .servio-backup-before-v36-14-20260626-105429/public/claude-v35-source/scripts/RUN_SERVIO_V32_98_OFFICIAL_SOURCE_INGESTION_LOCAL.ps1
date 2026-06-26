param(
  [string]$Url = "https://servio.vlad-it-taran.workers.dev",
  [string]$From = "",
  [string]$To = "",
  [string]$Source = "all",
  [string]$IngestSecret = "",
  [string]$EntsoeToken = "",
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"
if([string]::IsNullOrWhiteSpace($From)){ $From = (Get-Date).ToString("yyyy-MM-dd") }
if([string]::IsNullOrWhiteSpace($To)){ $To = (Get-Date).AddDays(1).ToString("yyyy-MM-dd") }
if(-not [string]::IsNullOrWhiteSpace($IngestSecret)){ $env:SERVIO_INGEST_SECRET = $IngestSecret }
if(-not [string]::IsNullOrWhiteSpace($EntsoeToken)){ $env:ENTSOE_API_TOKEN = $EntsoeToken }
$env:SERVIO_URL = $Url
$args = @("scripts/servio-official-source-ingestion-v3298.mjs", "--url", $Url, "--from", $From, "--to", $To, "--source", $Source)
if($DryRun){ $args += "--dry-run" }
Write-Host "Running SERVIO v32.98 official source ingestion local relay..." -ForegroundColor Cyan
node @args
