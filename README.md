# SERVIO v4.42 — Combined Dataset Analyzer FINAL

Build ID: `servio-grid-map-v4.42-combined-dataset-analyzer-final`

Acest build finalizează corect roadmap-ul v4.42 Combined Dataset Analyzer.

## Ce adaugă

- suport pentru fișiere consum + producție;
- suport pentru import/export;
- suport pentru full balance;
- calcule pentru autoconsum, surplus, import, export, acoperire consum, utilizare PV locală și balanță energetică;
- separare explicită între rezultat real și estimat.

## Regulă importantă

Dacă fișierul nu conține import/export, SERVIO nu marchează exportul/autoconsumul ca real. În acel caz afișează:
- autoconsum estimat;
- surplus estimat;
- deficit estimat.

Export/import real apar doar când există coloane import/export.

## Nu s-a schimbat

Nu s-a rescris aplicația, nu s-a schimbat shell-ul, nu s-au atins Auth/Login/UserMenu, Day-Ahead strict, Harta Rețea live sau BESS curățat.
