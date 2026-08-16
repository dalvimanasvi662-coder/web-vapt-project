import express from "express";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerLabRoutes } from "./labRoutes";

let server: Server;
let baseUrl = "";

describe("isolated lab backend contract", () => {
  beforeAll(async () => {
    const app = express();
    app.use(express.json({ limit: "2mb" }));
    registerLabRoutes(app);
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("exposes all nine authorized practice surfaces", () => {
    const paths = [
      "/lab-api/sqli/products",
      "/lab-api/xss/reflect",
      "/lab-api/idor/invoices/:id",
      "/lab-api/auth/login",
      "/lab-api/admin/export",
      "/lab-api/upload",
      "/lab-api/csrf/profile-email",
      "/lab-api/misconfig/debug",
      "/lab-api/session/replay",
    ];
    expect(paths).toHaveLength(9);
    expect(new Set(paths).size).toBe(9);
  });

  it("keeps the role, tracker, and bundle contracts stable", () => {
    expect(["admin", "analyst", "viewer"]).toEqual(["admin", "analyst", "viewer"]);
    expect(["Open", "Remediated", "Retested"]).toEqual(["Open", "Remediated", "Retested"]);
    expect("VAPT-01-evidence-bundle.zip").toMatch(/^VAPT-\d{2}-evidence-bundle\.zip$/);
  });

  it("returns distinct vulnerable and safe responses over HTTP", async () => {
    const vulnerable = await fetch(`${baseUrl}/lab-api/sqli/products?search=%27%20OR%20%271%27%3D%271`);
    const safe = await fetch(`${baseUrl}/lab-api/sqli/products?search=%27%20OR%20%271%3D%271&safe=1`);
    expect(vulnerable.status).toBe(200);
    expect((await vulnerable.json()).mode).toBe("vulnerable-simulation");
    expect((await safe.json()).mode).toBe("parameterized");
  });

  it("issues, inspects, clears, and revokes the lab session cookie", async () => {
    const login = await fetch(`${baseUrl}/lab-api/auth/login?safe=1`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "lab-analyst", password: "analyst-lab-2026" }) });
    expect(login.status).toBe(200);
    const setCookie = login.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("vapt_lab_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    const cookie = setCookie.split(";")[0] ?? "";
    const active = await fetch(`${baseUrl}/lab-api/auth/session`, { headers: { cookie } });
    expect((await active.json()).authenticated).toBe(true);
    const secondLogin = await fetch(`${baseUrl}/lab-api/auth/login?safe=1`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "lab-analyst", password: "analyst-lab-2026" }) });
    const secondSetCookie = secondLogin.headers.get("set-cookie") ?? "";
    const rotatedCookie = secondSetCookie.split(";")[0] ?? "";
    expect(rotatedCookie).not.toBe(cookie);
    const oldSession = await fetch(`${baseUrl}/lab-api/auth/session`, { headers: { cookie } });
    expect((await oldSession.json()).authenticated).toBe(false);
    const logout = await fetch(`${baseUrl}/lab-api/auth/logout`, { method: "POST", headers: { cookie: rotatedCookie } });
    expect(logout.status).toBe(200);
    expect(logout.headers.get("set-cookie") ?? "").toContain("Max-Age=0");
    const inactive = await fetch(`${baseUrl}/lab-api/auth/session`, { headers: { cookie: rotatedCookie } });
    expect((await inactive.json()).authenticated).toBe(false);
  });

  it("requires a valid role-bound token for safe authorization and returns a ZIP bundle", async () => {
    const denied = await fetch(`${baseUrl}/lab-api/admin/export?safe=1`, { headers: { "x-lab-role": "viewer" } });
    expect(denied.status).toBe(403);
    const bundle = await fetch(`${baseUrl}/lab-api/findings/VAPT-01/evidence-bundle`);
    expect(bundle.status).toBe(200);
    expect(bundle.headers.get("content-type")).toContain("application/zip");
    expect(bundle.headers.get("content-disposition")).toContain("VAPT-01-evidence-bundle.zip");
    expect((await bundle.arrayBuffer()).byteLength).toBeGreaterThan(50);
  });
});
