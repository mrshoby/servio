# SERVIO Grid Map v4.29 — Auth Login Shell Integration

Patch peste v4.28.

- Adaugă sistem de autentificare înainte de dashboard.
- Login screen păstrează tema SERVIO: dark, card premium, accent orange, fără texte tehnice.
- Backend Worker expune `POST /api/servio/auth/login`, `GET /api/servio/auth/me`, `POST /api/servio/auth/logout`.
- Sesiune prin cookie `HttpOnly; Secure; SameSite=Lax`.
- Config utilizatori prin secret/env `SERVIO_AUTH_USERS_JSON` și semnare prin `SERVIO_AUTH_SECRET`.
- Topbar afișează avatar, nume, rol și dropdown profil/logout.
- Include structură RBAC: `user.role`, `user.permissions`, `canAccess(moduleId)`, `hasPermission(permission)`.
- Păstrează shell-ul actual, Harta Rețea, Day-Ahead strict source, BESS v4.28, Settings/Overview cleanup și loading screen orange.

Fallback development dacă nu există `SERVIO_AUTH_USERS_JSON`:

- email: `admin@servio.local`
- parolă: `servio-admin`

Pentru producție setează secretele în Cloudflare:

```powershell
npx wrangler secret put SERVIO_AUTH_SECRET --config ".\wrangler.toml"
npx wrangler secret put SERVIO_AUTH_USERS_JSON --config ".\wrangler.toml"
```
