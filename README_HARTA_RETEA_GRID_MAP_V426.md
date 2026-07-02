# SERVIO Grid Map v4.26 — Day-Ahead per-day warning + OPCOM auto cache UX

Patch peste v4.25.

- OPCOM rămâne strict OPCOM; ENTSO-E rămâne strict ENTSO-E.
- GitHub Actions OPCOM cache rămâne automat la 15 minute (`*/15 * * * *`) plus manual `workflow_dispatch`.
- Warningul de mâine nu se mai afișează pe tabul Astăzi.
- `external-cache-github-stale` rămâne explicit dacă latest.json este vechi.
- Păstrează v4.23 mouse-wheel zoom și v4.22 flow inspector.
