# SERVIO v4.42.1 — Energy Lab Upload Workspace

Build intermediar înainte de următorul pas de roadmap. Pornește din `SERVIO v4.42 — Combined Dataset Analyzer` și păstrează shell-ul profesional SERVIO / Energy Market OS.

## Ce adaugă

- Buton nou în sidebar: **Energy Lab**.
- Rută nouă: `/energy-lab`.
- Pagină enterprise pentru operator/admin unde pot fi încărcate fișiere de analiză:
  - curbă de sarcină / consum;
  - curbă de producție PV;
  - consum + producție;
  - import/export;
  - full energy balance.
- Upload CSV / XLSX / XLS folosind engine-ul existent de Data Learning Center.
- Mod de analiză selectabil: Auto, Consum, Producție, Consum + PV, Full balance.
- Rezultate afișate în UI:
  - data quality;
  - template match;
  - granularitate;
  - consum detectat;
  - producție detectată;
  - autoconsum;
  - acoperire consum;
  - import/export;
  - peak surplus/deficit;
  - capabilități de analiză: consum, PV, autoconsum, BESS, contract, raport.

## Ce NU schimbă

- Nu rescrie aplicația.
- Nu schimbă shell-ul global, sidebar-ul, topbar-ul, layout-ul sau design tokens.
- Nu schimbă Auth/Login/UserMenu.
- Nu schimbă Day-Ahead OPCOM/ENTSO-E strict.
- Nu schimbă Harta Rețea live.
- Nu schimbă BESS curățat v4.28.
- Nu reintroduce texte/debugging/old engine eliminate.

## Validare

`npm run check` trebuie să confirme:

- v4.42.1 build marker;
- Energy Lab în meniu;
- pagina de upload;
- rezultate Combined Dataset Analyzer;
- Data Learning Center admin-only păstrat;
- guard-urile v4.42 păstrate.
