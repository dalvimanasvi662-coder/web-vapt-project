# Web Vulnerability Assessment Lab

This project is an intentionally vulnerable, local-only web application and interactive documentation workspace for practicing authorized web application penetration testing. It presents nine core vulnerability categories through controlled exercises, compares vulnerable and remediated behavior where appropriate, and tracks each finding through **Open**, **Remediated**, and **Retested** states.

> Use this lab only in an authorized local environment. The interactive probes are deliberately constrained simulations designed for training and documentation, not for testing systems you do not own.

## Coverage

| Category | Practice surface | Severity baseline |
|---|---|---|
| SQL Injection | Vulnerable query form and parameterized comparison | Critical |
| XSS | Reflected, stored, and sanitized comparison concepts | High |
| IDOR | Object-level authorization review | High |
| Authentication weaknesses | Weak passwords and missing lockout controls | High |
| Broken access control | Privileged route authorization review | High |
| File upload vulnerabilities | Any-type upload versus policy-checked upload | Critical |
| CSRF | State-changing request and token review | Medium |
| Security misconfiguration | Debug output, headers, and exposed artifacts | Medium |
| Session management | Token entropy, cookie flags, rotation, and expiry | High |

## Deliverable structure

The project is organized around the requested assessment artifacts:

- `README.md` — scope, lab coverage, and resume bullet.
- `methodology.md` — OWASP-based testing workflow and tool references.
- `reconnaissance/` — target profile, Nmap notes, and endpoint mapping.
- `screenshots/` — evidence capture location for Burp Suite, OWASP ZAP, and browser screenshots.
- `vulnerability-reports/` — one report record per finding.
- `remediation/` — secure coding patterns and remediation notes.
- `retest-results/` — post-fix verification log.
- `final-report.pdf` — generated report artifact.

## Finding record format

Every finding includes the vulnerability name, severity, affected endpoint, reproduction steps, evidence area, business impact, remediation, and retest result. The tracker in the application uses the exact lifecycle labels **Open**, **Remediated**, and **Retested**.

## Tooling workflow

The methodology references **Burp Suite** for intercepting and replaying requests, **OWASP ZAP** for passive and active analysis in the authorized lab, and **Nmap** for local service discovery. A practical assessment sequence is: define scope, enumerate the application, establish a baseline, test each trust boundary, capture evidence, recommend a fix, and retest the original signal.

## Resume bullet

Conducted a structured web application vulnerability assessment using Burp Suite, Nmap and OWASP-based testing methodologies; identified, documented and remediated security weaknesses with evidence and remediation recommendations.
