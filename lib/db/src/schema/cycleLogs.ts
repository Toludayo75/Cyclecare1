import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cycleLogsTable = pgTable("cycle_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  flowIntensity: text("flow_intensity", { enum: ["light", "medium", "heavy"] }).notNull(),
  symptoms: text("symptoms").array().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCycleLogSchema = createInsertSchema(cycleLogsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCycleLog = z.infer<typeof insertCycleLogSchema>;
export type CycleLog = typeof cycleLogsTable.$inferSelect;
