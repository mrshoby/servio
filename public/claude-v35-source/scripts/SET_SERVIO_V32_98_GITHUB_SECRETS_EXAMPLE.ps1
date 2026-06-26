param(
  [string]$Repo = "mrshoby/servio",
  [string]$ServioUrl = "https://servio.vlad-it-taran.workers.dev",
  [string]$IngestSecret = "",
  [string]$EntsoeToken = ""
)
$ErrorActionPreference = "Stop"
Write-Host "SERVIO v32.98 GitHub secrets setup example" -ForegroundColor Cyan
Write-Host "Repo: $Repo"
if([string]::IsNullOrWhiteSpace($IngestSecret)){
  $IngestSecret = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
  Write-Host "Generated random SERVIO_INGEST_SECRET for this run." -ForegroundColor Yellow
}
Write-Host "Setting GitHub Actions secrets/vars with gh CLI..." -ForegroundColor Yellow
gh secret set SERVIO_INGEST_SECRET --repo $Repo --body $IngestSecret
gh secret set SERVIO_URL --repo $Repo --body $ServioUrl
if(-not [string]::IsNullOrWhiteSpace($EntsoeToken)){ gh secret set ENTSOE_API_TOKEN --repo $Repo --body $EntsoeToken }
Write-Host "Now set the same secret in Cloudflare Worker:" -ForegroundColor Green
Write-Host "cd \"D:\\01_digitalizare_automatizare\\07_servio\\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX\""
Write-Host "`$secret = '$IngestSecret'"
Write-Host "`$secret | npx wrangler secret put SERVIO_INGEST_SECRET"
