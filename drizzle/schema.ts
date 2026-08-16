import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const labAccounts = mysqlTable("lab_accounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  role: mysqlEnum("role", ["admin", "analyst", "viewer"]).default("viewer").notNull(),
  passwordHint: varchar("passwordHint", { length: 160 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const labInvoices = mysqlTable("lab_invoices", {
  id: int("id").autoincrement().primaryKey(),
  externalId: int("externalId").notNull().unique(),
  ownerUsername: varchar("ownerUsername", { length: 64 }).notNull(),
  amount: int("amount").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
});

export const findingTracker = mysqlTable("finding_tracker", {
  id: int("id").autoincrement().primaryKey(),
  findingId: varchar("findingId", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["Open", "Remediated", "Retested"]).default("Open").notNull(),
  retestLog: text("retestLog"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const evidenceFiles = mysqlTable("evidence_files", {
  id: int("id").autoincrement().primaryKey(),
  findingId: varchar("findingId", { length: 32 }).notNull(),
  filename: varchar("filename", { length: 180 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  capturedBy: int("capturedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LabAccount = typeof labAccounts.$inferSelect;
export type FindingTracker = typeof findingTracker.$inferSelect;
export type EvidenceFile = typeof evidenceFiles.$inferSelect;