param(
  [string]$From = "",
  [string]$To = "",
  [string]$DatabaseName = "servio-db",
  [string]$CsvFolder = "",
  [switch]$NoExecute
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NodeScript = Join-Path $Root "scripts\import-opcom-pzu-local-to-d1-v3293.mjs"
if(-not (Test-Path $NodeScript)){ throw "Missing importer: $NodeScript" }
if([string]::IsNullOrWhiteSpace($From)){ $From = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd") }
if([string]::IsNullOrWhiteSpace($To)){ $To = (Get-Date).AddDays(1).ToString("yyyy-MM-dd") }
$Out = Join-Path $Root "audit-results"
$args = @($NodeScript, "--from", $From, "--to", $To, "--database", $DatabaseName, "--out", $Out)
if(-not [string]::IsNullOrWhiteSpace($CsvFolder)){ $args += @("--csv-folder", $CsvFolder) }
if($NoExecute){ $args += "--no-execute" }
Write-Host "SERVIO v32.93 local OPCOM import fallback" -ForegroundColor Cyan
Write-Host "From: $From To: $To Database: $DatabaseName" -ForegroundColor Gray
node @args
