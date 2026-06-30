# SERVIO — implementare Harta Rețea din fișierul încărcat v4.5

Sursa implementată: `servio-main-harta-retea-v45-entsoe-hover-inspector.zip`.

Build: `servio-grid-map-v4.5-entsoe-hover-inspector`.

Ce conține:
- Harta Rețea v4.5 cu ENTSO-E-first provider.
- Hover/click inspector pentru zone.
- Hover/click inspector pentru fluxuri.
- `powerBreakdownMw` pe zone live.
- ENTSO-E A75/A16 generation, A65/A16 load, A11 flows.
- OPCOM GitHub cache pentru PZU România.
- fallback/demo dacă lipsește tokenul ENTSO-E.

Aplicare:
```powershell
.\APPLY_SERVIO_IMPLEMENT_HARTA_RETEA_V45_ENTSOE_HOVER_INSPECTOR.ps1 `
  -RepoPath "D:\01_digitalizare_automatizare\07_servio\servio-github-cache" `
  -PushToGitHub `
  -Deploy
```

Secret necesar pentru live ENTSO-E:
```powershell
npx wrangler secret put ENTSOE_API_TOKEN --config ".\wrangler.toml"
```

Verificare:
```powershell
Invoke-RestMethod "https://servio.vlad-it-taran.workers.dev/api/servio/health" | ConvertTo-Json -Depth 10
Invoke-RestMethod "https://servio.vlad-it-taran.workers.dev/api/servio/grid-map/live?zone=RO" | ConvertTo-Json -Depth 8
```
