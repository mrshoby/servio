# SERVIO Grid Map v4.11 — White Page Client Loader Fix

Fix pentru pagina albă pe Cloudflare Workers după Harta Rețea / ENTSO-E patches.

## Cauză
Worker-ul servea `/app.jsx` ca `type=module`, dar fișierul conține JSX brut. Browserul nu compilează JSX nativ, deci React nu pornea și rămânea loader/pagină albă.

## Fix
- păstrează shell-ul Claude / Servio;
- nu modifică logica Day-Ahead / ENTSO-E / OPCOM;
- încarcă Babel Standalone doar pentru runtime JSX în Worker single-file;
- folosește `type=text/babel` + `data-type=module` pentru `/app.jsx`;
- adaugă boot error overlay ca să nu mai fie pagină albă mută.

Build: `servio-grid-map-v4.11-white-page-client-loader-fix`
