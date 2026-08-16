# Methodology

## Scope and rules of engagement

Testing is limited to the local Web VAPT lab. The objective is to identify, document, remediate, and retest weaknesses without targeting third-party systems. Evidence should include the request, the response, the affected input, and the behavior after remediation.

## OWASP-based checklist

| Phase | Activity | Evidence |
|---|---|---|
| 1. Scope | Confirm local target, test accounts, and prohibited actions | Scope note |
| 2. Reconnaissance | Identify ports, services, routes, parameters, and roles | Nmap output and endpoint map |
| 3. Authentication | Test password policy, lockout, MFA assumptions, and error consistency | Request/response pair |
| 4. Session management | Review token entropy, cookie flags, expiry, rotation, and revocation | Cookie capture |
| 5. Input validation | Test SQL injection, XSS, and upload handling with controlled payloads | Burp Repeater evidence |
| 6. Authorization | Compare users, roles, and object identifiers for IDOR and broken access control | Before/after authorization response |
| 7. Browser controls | Test CSRF tokens, SameSite behavior, and security headers | Header and form evidence |
| 8. Reporting | Assign severity, impact, remediation, and retest criteria | Vulnerability report |

## Tool references

**Burp Suite** is used as the interception and request-manipulation proxy. Use HTTP history to establish a baseline, Repeater to replay controlled requests, and Intruder only inside the local lab when rate limits and authorization are understood.

**OWASP ZAP** is used for passive analysis, spidering, alert review, and authorized active scanning. Review scanner output manually and retain only relevant evidence.

**Nmap** is used for local service discovery and version detection. A representative command is `nmap -sV -Pn localhost`; the result should be treated as reconnaissance, not as proof of exploitability.

## Retesting standard

A finding moves to **Remediated** when the secure control is implemented. It moves to **Retested** only when the original reproduction steps have been repeated and the vulnerable behavior is no longer observed. The retest log records the date, test input, expected result, observed result, and tester.
