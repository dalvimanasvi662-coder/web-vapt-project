# Project TODO

- [x] Build cyberpunk lab shell with neon black/cyan/pink visual system
- [x] Add sidebar navigation for all 9 vulnerability categories
- [x] Add dedicated practice pages for SQL Injection
- [x] Add dedicated practice pages for XSS
- [x] Add dedicated practice pages for IDOR
- [x] Add dedicated practice pages for authentication weaknesses
- [x] Add dedicated practice pages for broken access control
- [x] Add dedicated practice pages for file upload vulnerabilities
- [x] Add dedicated practice pages for CSRF
- [x] Add dedicated practice pages for security misconfiguration
- [x] Add dedicated practice pages for session-management issues
- [x] Add side-by-side vulnerable and remediated SQL injection lab
- [x] Add reflected, stored, and sanitized XSS comparison lab
- [x] Add insecure and remediated file upload comparison lab
- [x] Add authentication and session weakness demos with remediation notes
- [x] Add vulnerability report tracker with exact statuses Open, Remediated, Retested
- [x] Add retest result log per finding
- [x] Add methodology page with OWASP checklist and Burp Suite, OWASP ZAP, and Nmap references
- [x] Add reconnaissance documentation page
- [x] Add final report page matching README, methodology, reconnaissance, vulnerability reports, remediation, and retest results
- [x] Add vitest coverage for lab metadata and report status contract
- [x] Verify responsive layout, navigation, lab toggles, and report tracker in preview
- [x] Generate final-report.pdf and ensure deliverable directories exist

- [x] Create dedicated routes/pages for each of the 9 vulnerability labs
- [x] Implement distinct reflected, stored, and sanitized XSS flows
- [x] Add explicit weak-password, no-lockout, and insecure-session-token demos
- [x] Verify desktop/mobile routes, navigation, comparison toggles, and tracker interactions

- [x] Add database-backed role-based lab test accounts
- [x] Persist vulnerability tracker statuses and retest logs in the database
- [x] Add isolated backend practice endpoints for the nine lab categories
- [x] Add per-finding evidence capture workflow
- [x] Add downloadable evidence bundle generation
- [x] Add evidence bundle and endpoint tests
- [x] Verify persistence, downloads, screenshot workflow, and authorized proxy testing surfaces

- [x] Add dedicated user login page route and form
- [x] Connect top-right user control to the login page
- [x] Make top-center VAPT.LAB reference link back to the starting overview
- [x] Verify login and return navigation on desktop and mobile

- [x] Verify login and return-navigation flows on desktop and mobile with route and control checks

- [x] Perform and document end-to-end verification of top-right login, top-center VAPT.LAB return, and login-page return controls

- [x] Tie lab login authentication to seeded lab_accounts and use role-bound authorization
- [x] Display and edit persisted retestLog values in the tracker
- [x] Replace in-memory practice data with database-seeded lab data
- [x] Package evidence files into a true downloadable archive with error states
- [x] Add endpoint and evidence-flow integration coverage

- [x] Issue lab tokens through a real HttpOnly session cookie
- [x] Validate cookie-backed lab sessions on safe endpoints
- [x] Add logout revocation and cookie clearing
- [x] Add session rotation and authentication-test metadata
- [x] Add UI controls and tests for cookie login/logout behavior

- [x] Add a unique per-login session nonce so each lab cookie rotates
- [x] Invalidate the prior token when a session is reissued
- [x] Test second-login rotation and prior-token rejection
- [x] Document session rotation behavior for authentication testing

- [x] Remove the dedicated login page and /login route
- [x] Remove the top-right user/login navigation control
- [x] Preserve backend cookie authentication endpoints for authorized testing
- [x] Verify remaining overview and lab routes after removal

- [x] Verify all remaining lab and workspace routes after login-page removal and record the results
