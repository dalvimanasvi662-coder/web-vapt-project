import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, evidenceFiles, findingTracker, labAccounts, labInvoices, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export const LAB_SESSION_COOKIE = "vapt_lab_session";
const revokedLabTokens = new Set<string>();
const activeLabTokens = new Map<string, string>();

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLabAccountByUsername(username: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(labAccounts).where(eq(labAccounts.username, username)).limit(1);
  return rows[0];
}

export function createLabToken(username: string, role: string) {
  const previous = activeLabTokens.get(username); if (previous) revokedLabTokens.add(previous);
  const secret = process.env.JWT_SECRET ?? "local-vapt-lab-secret";
  const body = `${username}:${role}:${randomUUID()}`;
  const token = `lab.${Buffer.from(body).toString("base64url")}.${createHmac("sha256", secret).update(body).digest("hex")}`;
  activeLabTokens.set(username, token);
  return token;
}

export function revokeLabToken(token: string) { revokedLabTokens.add(token); }
export function isLabTokenRevoked(token: string) { return revokedLabTokens.has(token); }

export async function verifyLabToken(token: string) {
  if (isLabTokenRevoked(token)) return undefined;
  const [prefix, encoded, signature] = token.split(".");
  if (prefix !== "lab" || !encoded || !signature) return undefined;
  const body = Buffer.from(encoded, "base64url").toString("utf8");
  const [username, role, nonce] = body.split(":");
  if (!username || !role || !nonce) return undefined;
  const secret = process.env.JWT_SECRET ?? "local-vapt-lab-secret";
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
  const account = await getLabAccountByUsername(username);
  return account?.role === role ? account : undefined;
}

export async function verifyLabAccount(username: string, password: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(labAccounts).where(eq(labAccounts.username, username)).limit(1);
  const account = rows[0];
  if (!account) return undefined;
  const passwordHash = createHash("sha256").update(password).digest("hex");
  return passwordHash === account.passwordHash ? account : undefined;
}

export async function listLabAccounts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: labAccounts.id, username: labAccounts.username, displayName: labAccounts.displayName, role: labAccounts.role, passwordHint: labAccounts.passwordHint }).from(labAccounts).orderBy(labAccounts.id);
}

export async function listLabInvoices() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: labInvoices.externalId, owner: labInvoices.ownerUsername, amount: labInvoices.amount, status: labInvoices.status }).from(labInvoices).orderBy(labInvoices.externalId);
}

export async function listFindings() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(findingTracker).orderBy(findingTracker.id);
}

export async function updateFindingStatus(findingId: string, status: "Open" | "Remediated" | "Retested", retestLog: string | null, updatedBy?: number) {
  const db = await getDb(); if (!db) return undefined;
  await db.update(findingTracker).set({ status, retestLog, updatedBy: updatedBy ?? null, updatedAt: new Date() }).where(eq(findingTracker.findingId, findingId));
  const rows = await db.select().from(findingTracker).where(eq(findingTracker.findingId, findingId)).limit(1);
  return rows[0];
}

export async function createEvidence(row: typeof evidenceFiles.$inferInsert) {
  const db = await getDb(); if (!db) return undefined;
  await db.insert(evidenceFiles).values(row);
  const rows = await db.select().from(evidenceFiles).where(eq(evidenceFiles.findingId, row.findingId)).orderBy(desc(evidenceFiles.id)).limit(1);
  return rows[0];
}

export async function listEvidence(findingId: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(evidenceFiles).where(eq(evidenceFiles.findingId, findingId)).orderBy(desc(evidenceFiles.id));
}
