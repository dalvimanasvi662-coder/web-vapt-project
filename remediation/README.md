# Remediation Guide

| Finding | Secure control | Verification signal |
|---|---|---|
| SQL Injection | Parameterized queries and least-privilege DB user | Payload is treated as data |
| XSS | Contextual encoding, sanitization, CSP | Marker renders inert |
| IDOR | Server-side object ownership checks | Cross-user object denied |
| Authentication | Strong policy, MFA, throttling, lockout | Weak/repeated attempts controlled |
| Broken access control | Central deny-by-default role middleware | Direct privileged request denied |
| File upload | Type/content validation, random names, private storage, scanning | Arbitrary file rejected |
| CSRF | Synchronizer token and Origin validation | Missing token denied |
| Misconfiguration | Harden headers, remove debug and secrets | Generic errors and no diagnostic exposure |
| Session management | Random tokens, secure flags, rotation, expiry, revocation | Old token becomes invalid |

## Secure implementation principles

Remediation should be enforced server-side. Client-side hiding, route obscurity, or a visual toggle is not an authorization control. The lab interface intentionally makes this distinction visible by presenting the unsafe and safe paths as separate comparison surfaces.
