# SERVIO Claude JSX Good — BESS DB + Day-Ahead PZU Source Selector

Bază: versiunea bună `SERVIO_CLAUDE_JSX_EXACT_BESS_PEAK_EVENING_INOWATTIO_TARGET_FIX`.

Schimbări:
- păstrează UI-ul Claude JSX bun;
- păstrează baza Battery Revenue Calculator Inowattio;
- elimină pagina/meniul `Surse & relay`;
- mută alegerea sursei live direct în `Day-Ahead · PZU`;
- adaugă selector `OPCOM PZU` / `ENTSO-E`;
- `apiBase` este implicit `window.location.origin`, deci Worker-ul este folosit automat după deploy;
- OPCOM Day-Ahead încearcă fetch server-side din pagina publică OPCOM PZU / ROPEX_DAM_15min;
- ENTSO-E Day-Ahead încearcă Transparency API A44 pentru România și cere secret `ENTSOE_API_TOKEN`.

Endpoint-uri principale:
- `/api/servio/opcom/day-ahead?day=today|tomorrow`
- `/api/servio/entsoe/day-ahead?day=today|tomorrow`
- `/api/servio/day-ahead/pzu?source=opcom|entsoe&day=today|tomorrow`
- `/api/servio/simulate-market-period?preset=night|offpeak|pv`
