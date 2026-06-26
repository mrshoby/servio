# SERVIO Exact Claude JSX Preview + API Worker

Baza UI este fișierul încărcat `Servio (1).jsx` — același shell din captura Claude: sidebar, topbar, Overview, Day-Ahead, Prognoză, Baterie/BESS, Surse & relay, Settings, tema dark/light.

Nu include shell v36/custom, nu folosește Cloudflare Assets, nu folosește D1 și nu folosește `env.ASSETS.fetch()`.

Worker-ul servește aplicația React pentru `/`, `/dashboard/module-menu.html`, `/battery-revenue-simulator`, `/dashboard/battery-revenue-simulator.html` și păstrează endpointurile API minime SERVIO / OPCOM / ENTSO-E.
