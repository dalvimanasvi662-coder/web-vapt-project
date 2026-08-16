import { COOKIE_NAME } from "@shared/const";
import { parse } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createEvidence, createLabToken, LAB_SESSION_COOKIE, listEvidence, listFindings, listLabAccounts, revokeLabToken, updateFindingStatus, verifyLabAccount, verifyLabToken } from "./db";
import { storagePut } from "./storage";

const statusSchema = z.enum(["Open", "Remediated", "Retested"]);
const labCookie = (value: string, maxAge: number) => `${LAB_SESSION_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  lab: router({
    accounts: publicProcedure.query(() => listLabAccounts()),
    login: publicProcedure.input(z.object({ username: z.string().min(1), password: z.string().min(1) })).mutation(async ({ input, ctx }) => { const account = await verifyLabAccount(input.username, input.password); if (!account) return { success: false as const, message: "Invalid lab credentials." }; const token = createLabToken(account.username, account.role); ctx.res.setHeader("Set-Cookie", labCookie(token, 60 * 60)); return { success: true as const, username: account.username, displayName: account.displayName, role: account.role, token, cookieName: LAB_SESSION_COOKIE }; }),
    logout: publicProcedure.mutation(({ ctx }) => { const token = parse(ctx.req.headers.cookie ?? "")[LAB_SESSION_COOKIE]; if (token) revokeLabToken(token); ctx.res.setHeader("Set-Cookie", labCookie("", 0)); return { success: true as const, revoked: Boolean(token) }; }),
    session: publicProcedure.query(async ({ ctx }) => { const token = parse(ctx.req.headers.cookie ?? "")[LAB_SESSION_COOKIE]; const account = token ? await verifyLabToken(token) : undefined; return account ? { authenticated: true as const, username: account.username, role: account.role } : { authenticated: false as const }; }),
    findings: publicProcedure.query(() => listFindings()),
    updateFinding: publicProcedure.input(z.object({ findingId: z.string().min(1), status: statusSchema, retestLog: z.string().max(4000).nullable().optional() })).mutation(({ input }) => updateFindingStatus(input.findingId, input.status, input.retestLog ?? null)),
    evidence: publicProcedure.input(z.object({ findingId: z.string().min(1) })).query(({ input }) => listEvidence(input.findingId)),
    captureEvidence: publicProcedure.input(z.object({ findingId: z.string().min(1), filename: z.string().min(1).max(180), mimeType: z.string().max(120), dataUrl: z.string().max(8_000_000) })).mutation(async ({ input }) => {
      const base64 = input.dataUrl.split(",")[1] ?? input.dataUrl;
      const uploaded = await storagePut(`evidence/${input.findingId}/${input.filename}`, Buffer.from(base64, "base64"), input.mimeType);
      return createEvidence({ findingId: input.findingId, filename: input.filename, storageKey: uploaded.key, storageUrl: uploaded.url, mimeType: input.mimeType });
    }),
    surfaces: publicProcedure.query(() => [
      { id: "SQLI", method: "GET", path: "/lab-api/sqli/products", note: "Controlled search query surface" },
      { id: "XSS", method: "POST", path: "/lab-api/xss/reflect", note: "Reflected output comparison" },
      { id: "IDOR", method: "GET", path: "/lab-api/idor/invoices/:id", note: "Object authorization surface" },
      { id: "AUTH", method: "POST", path: "/lab-api/auth/login", note: "Weak password and lockout simulation" },
      { id: "BAC", method: "GET", path: "/lab-api/admin/export", note: "Role-gated privileged route" },
      { id: "UPLOAD", method: "POST", path: "/lab-api/upload", note: "Controlled arbitrary-type upload simulation" },
      { id: "CSRF", method: "POST", path: "/lab-api/csrf/profile-email", note: "Token validation surface" },
      { id: "MISCFG", method: "GET", path: "/lab-api/misconfig/debug", note: "Configuration exposure comparison" },
      { id: "SESSION", method: "GET", path: "/lab-api/session/replay", note: "Token lifecycle simulation" },
    ]),
  }),
});

export type AppRouter = typeof appRouter;
