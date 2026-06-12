import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ngosTable = pgTable("ngos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  state: text("state").notNull(),
  contactEmail: text("contact_email").notNull(),
  monthlyQuota: integer("monthly_quota").notNull().default(50),
  availablePads: integer("available_pads").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ngoWorkersTable = pgTable("ngo_workers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  ngoId: integer("ngo_id").notNull().references(() => ngosTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pickupCentersTable = pgTable("pickup_centers", {
  id: serial("id").primaryKey(),
  ngoId: integer("ngo_id").notNull().references(() => ngosTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  landmark: text("landmark"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNgoSchema = createInsertSchema(ngosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNgoWorkerSchema = createInsertSchema(ngoWorkersTable).omit({
  id: true,
  createdAt: true,
});

export const insertPickupCenterSchema = createInsertSchema(pickupCentersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNgo = z.infer<typeof insertNgoSchema>;
export type Ngo = typeof ngosTable.$inferSelect;
export type NgoWorker = typeof ngoWorkersTable.$inferSelect;
export type PickupCenter = typeof pickupCentersTable.$inferSelect;
