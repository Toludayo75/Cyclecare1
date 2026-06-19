import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const pushTokensTable = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).default(null),
  token: text("token").notNull(),
  platform: text("platform").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushTokenSchema = undefined; // placeholder for future Drizzle-Zod schema
