# SERVIO Harta Rețea v4.18 — ENTSO-E Flow Edges Constant Fix

Fix pentru v4.17: fallback-ul ENTSO-E pentru flows folosea `GRID_MAP_FLOW_EDGES`, constantă inexistentă.

Corecții:
- folosește `GRID_ENTSOE_EDGE_PAIRS` / `gridEntsoeOrderedEdges(...)`
- păstrează bugetul de subrequests Cloudflare Worker
- păstrează Electricity Maps first
- păstrează demo count = 0
- păstrează OPCOM ca sursă principală PZU România
- păstrează ENTSO-E A44 partial-normalized pentru comparație
