import { Router, type IRouter } from "express";
import { db, articlesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

type LangCode = "en" | "yo" | "ig" | "ha";

function serializePublic(a: typeof articlesTable.$inferSelect, lang: LangCode) {
  const title = (lang === "yo" ? a.titleYo : lang === "ig" ? a.titleIg : lang === "ha" ? a.titleHa : null) ?? a.titleEn;
  const body = (lang === "yo" ? a.bodyYo : lang === "ig" ? a.bodyIg : lang === "ha" ? a.bodyHa : null) ?? a.bodyEn;
  const excerpt = (lang === "yo" ? a.excerptYo : lang === "ig" ? a.excerptIg : lang === "ha" ? a.excerptHa : null) ?? a.excerptEn;
  return {
    id: a.id,
    title,
    excerpt,
    body,
    category: a.category,
    readMin: a.readMin,
  };
}

router.get("/articles", async (req, res): Promise<void> => {
  const lang = (req.query.lang as LangCode) ?? "en";
  const category = req.query.category as string | undefined;

  const validLangs: LangCode[] = ["en", "yo", "ig", "ha"];
  if (!validLangs.includes(lang)) {
    res.status(400).json({ error: "Invalid lang. Use: en, yo, ig, ha" });
    return;
  }

  const rows = await db
    .select()
    .from(articlesTable)
    .where(
      category
        ? and(eq(articlesTable.published, true), eq(articlesTable.category, category as typeof articlesTable.$inferSelect["category"]))
        : eq(articlesTable.published, true)
    )
    .orderBy(articlesTable.createdAt);

  res.json(rows.map((a) => serializePublic(a, lang)));
});

export default router;
