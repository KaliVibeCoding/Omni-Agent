import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tenantCredentials = pgTable("tenant_credentials", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  accountSid: text("account_sid").notNull(),
  authTokenEncrypted: text("auth_token_encrypted").notNull(),
  accountName: text("account_name"),
  plan: text("plan").notNull().default("starter"),
  apiKeySid: text("api_key_sid"),
  apiKeySecretEncrypted: text("api_key_secret_encrypted"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertTenantCredentialsSchema = createInsertSchema(tenantCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantCredentials = typeof tenantCredentials.$inferSelect;
export type InsertTenantCredentials = z.infer<typeof insertTenantCredentialsSchema>;
