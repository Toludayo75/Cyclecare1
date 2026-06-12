import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cycleProfilesTable = pgTable("cycle_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lastPeriodDate: text("last_period_date").notNull(),
  cycleLength: integer("cycle_length").notNull().default(28),
  periodDuration: integer("period_duration").notNull().default(5),
  flowType: text("flow_type", { enum: ["light", "medium", "heavy"] }).notNull().default("medium"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  rolloverBalance: integer("rollover_balance").notNull().default(0),
  rolloverMonth: text("rollover_month"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCycleProfileSchema = createInsertSchema(cycleProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCycleProfile = z.infer<typeof insertCycleProfileSchema>;
export type CycleProfile = typeof cycleProfilesTable.$inferSelect;
