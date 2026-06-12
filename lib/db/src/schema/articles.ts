import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  titleEn: text("title_en").notNull(),
  titleYo: text("title_yo"),
  titleIg: text("title_ig"),
  titleHa: text("title_ha"),
  bodyEn: text("body_en").notNull(),
  bodyYo: text("body_yo"),
  bodyIg: text("body_ig"),
  bodyHa: text("body_ha"),
  excerptEn: text("excerpt_en").notNull(),
  excerptYo: text("excerpt_yo"),
  excerptIg: text("excerpt_ig"),
  excerptHa: text("excerpt_ha"),
  category: text("category", {
    enum: ["catIrregularPeriods", "catCramps", "catHormones", "catNutrition", "catMentalHealth", "catEducation", "catWellness", "catSupport"],
  }).notNull(),
  readMin: integer("read_min").notNull().default(5),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
