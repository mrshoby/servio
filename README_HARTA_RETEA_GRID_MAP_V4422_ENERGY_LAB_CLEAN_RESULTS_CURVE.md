# SERVIO v4.42.2 — Clean Energy Lab Results Curve

Build intermediar înainte de v4.43.

Scop: curățare Energy Lab astfel încât pagina să fie workspace operator, nu Data Learning Center.

Modificări:
- Energy Lab afișează inițial doar butonul de upload.
- După upload, afișează curba/graficul și rezultatele calculate.
- Elimină din Energy Lab lista tehnică „Analize încărcate”, search, dump sheet/preview, warnings brute, scoruri template/runtime și texte de training.
- Parserul local păstrează raw CSV complet pentru Energy Lab, ca fișierele PVGIS mari să producă grafic și totaluri, nu doar preview metadata.
- Suportă curbe de sarcină, curbe producție PV, consum + producție, import/export și full balance.
- Păstrează shell-ul SERVIO / Energy Market OS, Auth v4.29, Day-Ahead strict, Harta Rețea live, BESS v4.28 și Data Learning Center admin-only.

Validare:
- npm run check
- guard dedicat: `SERVIO v4.42.2 clean energy lab results curve guards OK.`
