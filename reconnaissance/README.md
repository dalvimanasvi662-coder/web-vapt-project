# Reconnaissance Notes

## Target profile

The target is the local Web VAPT Lab web server. Testing is restricted to the project preview and its simulated practice surfaces. No external target is in scope.

## Nmap baseline

Representative authorized command:

```text
nmap -sV -Pn localhost
```

Expected application service:

| Port | State | Service | Purpose |
|---:|---|---|---|
| 3000 | open | http | Local lab web application |

## Endpoint map

| Endpoint | Module | Observation |
|---|---|---|
| `/api/products?search=` | SQL Injection | Search input is the controlled injection surface. |
| `/feedback` | XSS | Reflected and stored output contexts are compared. |
| `/api/invoices/:id` | IDOR | Object identifier authorization is reviewed. |
| `/login` | Authentication | Password policy and lockout assumptions are documented. |
| `/admin/export` | Broken access control | Privileged function authorization is reviewed. |
| `/upload` | File upload | Any-type behavior is compared with policy enforcement. |
| `/profile/email` | CSRF | State-changing request token controls are reviewed. |
| `/.env` and server headers | Misconfiguration | Exposure and hardening checks are documented. |
| `/session` | Session management | Token lifecycle and cookie controls are reviewed. |

## Evidence handling

Store screenshots and exported request/response evidence under `screenshots/`. Each evidence item should be named with the finding short code and test stage, such as `SQLI-before.png`, `SQLI-after.png`, or `XSS-retest.txt`.
