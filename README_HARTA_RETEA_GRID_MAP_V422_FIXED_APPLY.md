# Harta Retea v4.22 - Fixed Apply Package

Build: `servio-grid-map-v4.22-live-more-countries-flow-inspector`

Acest pachet repară arhiva v4.22 inițială astfel încât apply-ul să aibă script propriu v4.22 și verificări compatibile cu noua interfață.

Păstrează baza stabilă v4.21:

- 25 zone cerute / 24 live confirmate anterior;
- demo count = 0;
- valori reale Electricity Maps din `data.mix`;
- OPCOM PZU principal;
- fluxuri reale ENTSO-E fallback dacă Electricity Maps flows nu este disponibil;
- shell-ul Claude neschimbat.

Adaugă din v4.22:

- inspector pe țară cu blocuri `Primește` / `Dă`;
- total import/export pe țara inspectată;
- primele conexiuni import/export afișate direct în hover/click card;
- highlight pentru săgețile legate de țara inspectată;
- estompare pentru săgețile fără legătură.
