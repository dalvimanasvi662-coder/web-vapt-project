# Backend Lab Endpoints

All raw endpoints are isolated under `/lab-api/` and are intended for authorized local testing only. Requests can be intercepted and replayed in Burp Suite or inspected with OWASP ZAP. Add `?safe=1` or `X-Lab-Mode: safe` to compare a remediated path.

| Module | Method and path | Vulnerable behavior | Safe comparison |
|---|---|---|---|
| SQL Injection | `GET /lab-api/sqli/products?search=` | Simulated query concatenation | Parameterized result with `safe=1` |
| XSS | `POST /lab-api/xss/reflect` | Reflected output simulation | Encoded output with `safe=1` |
| IDOR | `GET /lab-api/idor/invoices/:id` | Identifier access without ownership check | `X-Lab-User` ownership check with `safe=1` |
| Authentication | `POST /lab-api/auth/login` | Weak credential acceptance and no lockout | Strong policy and throttling with `safe=1` |
| Broken access control | `GET /lab-api/admin/export` | Privileged export without role enforcement | `X-Lab-Role: admin` required with `safe=1` |
| File upload | `POST /lab-api/upload` | Arbitrary-type upload simulation | Allow-listed file types and storage with `safe=1` |
| CSRF | `POST /lab-api/csrf/profile-email` | State change without token | `X-CSRF-Token: lab-csrf-token` required with `safe=1` |
| Misconfiguration | `GET /lab-api/misconfig/debug` | Verbose debug response | Diagnostic route unavailable with `safe=1` |
| Session management | `GET /lab-api/session/replay?token=` | Replayable token simulation | Rotated/revoked token behavior with `safe=1` |

## Evidence capture

Upload a screenshot or exported request/response through `POST /lab-api/findings/:findingId/evidence` with JSON fields `filename`, `mimeType`, and `data`. The dashboard provides the same workflow through the lab page's evidence panel. Download a manifest bundle using `GET /lab-api/findings/:findingId/evidence-bundle`; the response is an attachment named `{findingId}-evidence-bundle.json` containing indexed storage URLs.

## Role-based lab accounts

The database contains the seeded lab identities `lab-admin` with role `admin`, `lab-analyst` with role `analyst`, and `lab-viewer` with role `viewer`. They are training identities, not production credentials. The tracker displays them for role-aware test planning, while the raw authorization exercise uses `X-Lab-Role` and `X-Lab-User` headers to make role changes easy to reproduce in a proxy.

## Database-backed accounts and retest persistence

The login procedure validates the seeded account password hash in `lab_accounts` and returns a signed lab token containing the account username and role. Safe-mode authorization routes require that token in `Authorization: Bearer <token>`. The known training credentials are `lab-admin / admin-lab-2026`, `lab-analyst / analyst-lab-2026`, and `lab-viewer / viewer-lab-2026`; these credentials are for the isolated local lab only.

The `finding_tracker` table stores each finding's exact status and `retestLog`. The tracker UI loads those values from the database and lets an analyst edit and save the retest note without changing the finding lifecycle label.

The invoice records used by the IDOR and broken-access-control surfaces live in the seeded `lab_invoices` table. The evidence bundle route now returns a ZIP archive containing `manifest.json` and any available stored evidence files, with an error placeholder file when a storage object cannot be retrieved.

## Lab session cookie and logout testing

Successful safe-mode login issues the `vapt_lab_session` cookie with `HttpOnly`, `SameSite=Lax`, a one-hour lifetime, and `Secure` in production. The cookie can be inspected in Burp Suite or browser developer tools, then replayed against `GET /lab-api/auth/session` and any safe-mode authorization endpoint. `POST /lab-api/auth/logout` clears the cookie with `Max-Age=0` and revokes the token server-side, so replaying the old cookie returns an unauthenticated session. The dashboard login page exposes the active username and role and provides a logout-and-revoke control.

Each successful lab login now generates a unique session nonce. Issuing a second login for the same account revokes the prior token before setting the replacement cookie, allowing testers to verify rotation and replay resistance. Logout revokes the active token and clears the cookie.
