import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // donation, transfer, ngo_add, cash_donation
  amount: integer("amount").notNull().default(0),
  fromNgoId: integer("from_ngo_id").$default(() => null as any),
  toNgoId: integer("to_ngo_id").$default(() => null as any),
  ngoId: integer("ngo_id").$default(() => null as any),
  userId: integer("user_id").$default(() => null as any),
  notes: text("notes").$default(() => null as any),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });

export type Event = typeof eventsTable.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
