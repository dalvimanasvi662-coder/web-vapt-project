import type { Express, Request, Response } from "express";
import { parse } from "cookie";
import { createEvidence, createLabToken, LAB_SESSION_COOKIE, listEvidence, listLabInvoices, revokeLabToken, verifyLabAccount, verifyLabToken } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";

const authAttempts = new Map<string, number>();
const revokedTokens = new Set<string>();
const findingTitles: Record<string, string> = { "VAPT-01": "SQL Injection", "VAPT-02": "Cross-Site Scripting", "VAPT-03": "IDOR", "VAPT-04": "Authentication Weaknesses", "VAPT-05": "Broken Access Control", "VAPT-06": "File Upload", "VAPT-07": "CSRF", "VAPT-08": "Security Misconfiguration", "VAPT-09": "Session Management" };

function json(res: Response, status: number, body: unknown) { res.status(status).json({ labOnly: true, ...body as object }); }
function safeMode(req: Request) { return req.query.safe === "1" || req.header("x-lab-mode") === "safe"; }
const labCookie = (value: string, maxAge: number) => `${LAB_SESSION_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
function requestLabToken(req: Request) { const header = req.header("authorization") ?? ""; if (header.startsWith("Bearer ")) return header.slice(7); return parse(req.headers.cookie ?? "")[LAB_SESSION_COOKIE]; }
async function authenticatedLabAccount(req: Request) { const token = requestLabToken(req); return token ? verifyLabToken(token) : undefined; }

export function registerLabRoutes(app: Express) {
  app.get("/lab-api/sqli/products", (req, res) => {
    const search = String(req.query.search ?? "");
    const safe = safeMode(req);
    const injected = /('|%27|\bor\b|--|union)/i.test(search);
    if (safe) return json(res, 200, { endpoint: "/lab-api/sqli/products", mode: "parameterized", queryValue: search, records: injected ? [] : [{ id: 1, name: "blue team handbook" }] });
    return json(res, 200, { endpoint: "/lab-api/sqli/products", mode: "vulnerable-simulation", query: `SELECT * FROM products WHERE name LIKE '%${search}%'`, records: injected ? [{ id: 1, name: "admin" }, { id: 2, name: "analyst" }, { id: 3, name: "billing" }] : [{ id: 1, name: "blue team handbook" }] });
  });

  app.post("/lab-api/xss/reflect", (req, res) => {
    const value = String(req.body?.value ?? "");
    return safeMode(req) ? json(res, 200, { mode: "encoded", rendered: value.replaceAll("<", "&lt;").replaceAll(">", "&gt;") }) : json(res, 200, { mode: "reflected-simulation", rendered: value, warning: "A browser would interpret this in an unsafe output context." });
  });

  app.get("/lab-api/idor/invoices/:id", async (req, res) => {
    const invoices = await listLabInvoices();
    const invoice = invoices.find((item) => item.id === Number(req.params.id));
    const account = await authenticatedLabAccount(req);
    const role = account?.username ?? req.header("x-lab-user") ?? "lab-viewer";
    if (safeMode(req) && (!account || invoice?.owner !== role)) return json(res, 403, { mode: "authorized", error: "Valid lab token and object ownership are required." });
    return json(res, 200, { mode: safeMode(req) ? "authorized" : "idor-simulation", invoice: invoice ?? null, requestedBy: role });
  });

  app.post("/lab-api/auth/login", async (req, res) => {
    const username = String(req.body?.username ?? "lab-viewer");
    const password = String(req.body?.password ?? "password");
    const attempts = (authAttempts.get(username) ?? 0) + 1;
    authAttempts.set(username, attempts);
    if (safeMode(req) && attempts > 3) return json(res, 429, { mode: "rate-limited", attempts, error: "Authentication temporarily throttled." });
    const account = await verifyLabAccount(username, password);
    if (safeMode(req) && !account) return json(res, 401, { mode: "strong-policy", attempts, error: "Database-backed lab credential rejected." });
    if (account) { const token = createLabToken(account.username, account.role); res.setHeader("Set-Cookie", labCookie(token, 60 * 60)); return json(res, 200, { mode: safeMode(req) ? "database-authenticated" : "weak-auth-simulation", username, role: account.role, token, cookieName: LAB_SESSION_COOKIE, attempts, authenticated: true, lockout: false }); }
    return json(res, 200, { mode: "weak-auth-simulation", username, role: "viewer", attempts, authenticated: true, lockout: false });
  });

  app.get("/lab-api/auth/session", async (req, res) => { const account = await authenticatedLabAccount(req); return json(res, 200, account ? { authenticated: true, username: account.username, role: account.role, cookieName: LAB_SESSION_COOKIE } : { authenticated: false, cookieName: LAB_SESSION_COOKIE }); });
  app.post("/lab-api/auth/logout", (req, res) => { const token = requestLabToken(req); if (token) revokeLabToken(token); res.setHeader("Set-Cookie", labCookie("", 0)); return json(res, 200, { loggedOut: true, revoked: Boolean(token), cookieName: LAB_SESSION_COOKIE }); });

  app.get("/lab-api/admin/export", async (req, res) => {
    const account = await authenticatedLabAccount(req);
    const role = account?.role ?? req.header("x-lab-role") ?? "viewer";
    if (safeMode(req) && (!account || role !== "admin")) return json(res, 403, { mode: "deny-by-default", error: "Valid admin lab token required." });
    return json(res, 200, { mode: safeMode(req) ? "authorized-admin" : "broken-access-simulation", role, rows: await listLabInvoices() });
  });

  app.post("/lab-api/upload", async (req, res) => {
    const filename = String(req.body?.filename ?? "payload.txt");
    const content = String(req.body?.content ?? "controlled lab evidence");
    const safe = safeMode(req);
    const allowed = /\.(txt|png|jpg|jpeg|webp|pdf)$/i.test(filename);
    if (safe && !allowed) return json(res, 415, { mode: "content-policy", error: "File type rejected by the remediated upload policy." });
    try {
      const uploaded = await storagePut(`lab-uploads/${filename}`, Buffer.from(content), String(req.body?.mimeType ?? "text/plain"));
      return json(res, 201, { mode: safe ? "private-storage" : "unrestricted-upload-simulation", filename, storage: uploaded });
    } catch (error) {
      return json(res, 503, { mode: "storage-unavailable", error: error instanceof Error ? error.message : "Upload unavailable in this environment." });
    }
  });

  app.post("/lab-api/csrf/profile-email", (req, res) => {
    const token = req.header("x-csrf-token");
    if (safeMode(req) && token !== "lab-csrf-token") return json(res, 403, { mode: "token-protected", error: "Missing or invalid CSRF token." });
    return json(res, 200, { mode: safeMode(req) ? "token-protected" : "csrf-simulation", email: String(req.body?.email ?? "analyst@example.test") });
  });

  app.get("/lab-api/misconfig/debug", (req, res) => {
    if (safeMode(req)) return json(res, 404, { mode: "hardened", error: "Diagnostic route unavailable." });
    return json(res, 200, { mode: "verbose-debug-simulation", debug: true, stack: "Error: simulated stack trace at lab/controller.ts:42" });
  });

  app.get("/lab-api/session/replay", (req, res) => {
    const token = String(req.query.token ?? "sess-1234");
    if (safeMode(req)) {
      if (revokedTokens.has(token) || token === "sess-1234") return json(res, 401, { mode: "rotated-and-revoked", valid: false });
      return json(res, 200, { mode: "rotated-and-revoked", valid: true, tokenPrefix: token.slice(0, 12) });
    }
    return json(res, 200, { mode: "insecure-session-simulation", valid: !revokedTokens.has(token), token });
  });

  app.post("/lab-api/findings/:findingId/evidence", async (req, res) => {
    const findingId = req.params.findingId.toUpperCase();
    if (!findingTitles[findingId]) return json(res, 404, { error: "Unknown finding." });
    const filename = String(req.body?.filename ?? `${findingId}-evidence.txt`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const mimeType = String(req.body?.mimeType ?? "text/plain");
    const raw = String(req.body?.data ?? "");
    const data = raw.startsWith("data:") ? Buffer.from(raw.split(",")[1] ?? "", "base64") : Buffer.from(raw);
    const uploaded = await storagePut(`evidence/${findingId}/${filename}`, data, mimeType);
    const row = await createEvidence({ findingId, filename, storageKey: uploaded.key, storageUrl: uploaded.url, mimeType, capturedBy: undefined });
    return json(res, 201, { findingId, evidence: row });
  });

  app.get("/lab-api/findings/:findingId/evidence-bundle", async (req, res) => {
    const findingId = req.params.findingId.toUpperCase();
    if (!findingTitles[findingId]) return json(res, 404, { error: "Unknown finding." });
    const evidence = await listEvidence(findingId);
    const chunks: Buffer[] = [];
    const archive = new ZipArchive({ zlib: { level: 9 } }); archive.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    archive.append(JSON.stringify({ bundle: "web-vapt-evidence", findingId, vulnerability: findingTitles[findingId], generatedAt: new Date().toISOString(), evidence }, null, 2), { name: "manifest.json" });
    for (const item of evidence) { try { const signed = await storageGetSignedUrl(item.storageKey); const response = await fetch(signed); if (response.ok) archive.append(Buffer.from(await response.arrayBuffer()), { name: item.filename }); } catch { archive.append("Evidence object unavailable at bundle generation time.", { name: `${item.filename}.error.txt` }); } }
    await archive.finalize();
    res.setHeader("Content-Type", "application/zip"); res.setHeader("Content-Disposition", `attachment; filename=${findingId}-evidence-bundle.zip`); return res.status(200).send(Buffer.concat(chunks));
  });
}
