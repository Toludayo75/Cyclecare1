import { Router, type IRouter } from "express";
import { eq, count, and, gte, lt, desc } from "drizzle-orm";
import { db, usersTable, articlesTable, ngosTable, ngoWorkersTable, padRequestsTable, eventsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { authenticate } from "../../middlewares/authenticate";
import { requireRole } from "../../middlewares/requireRole";

const PUBLIC_STOCK_NGO_NAME = "CycleCare Charity";

const router: IRouter = Router();
const adminAuth = [authenticate, requireRole("admin")];

function serializeArticle(a: typeof articlesTable.$inferSelect) {
  return {
    id: a.id,
    titleEn: a.titleEn,
    titleYo: a.titleYo ?? null,
    titleIg: a.titleIg ?? null,
    titleHa: a.titleHa ?? null,
    bodyEn: a.bodyEn,
    bodyYo: a.bodyYo ?? null,
    bodyIg: a.bodyIg ?? null,
    bodyHa: a.bodyHa ?? null,
    excerptEn: a.excerptEn,
    excerptYo: a.excerptYo ?? null,
    excerptIg: a.excerptIg ?? null,
    excerptHa: a.excerptHa ?? null,
    category: a.category,
    readMin: a.readMin,
    published: a.published,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function serializeNgo(n: typeof ngosTable.$inferSelect) {
  return {
    id: n.id,
    name: n.name,
    region: n.region,
    state: n.state,
    contactEmail: n.contactEmail,
    monthlyQuota: n.monthlyQuota,
    availablePads: n.availablePads,
    createdAt: n.createdAt.toISOString(),
  };
}

function serializeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? null,
    phone: u.phone ?? null,
    role: u.role,
    hasCompletedOnboarding: u.hasCompletedOnboarding,
    age: u.age ?? null,
    city: u.city ?? null,
    state: u.state ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

function extractReferenceFromNotes(notes: string | null): { reference: string | null; cleanNote: string | null } {
  if (!notes) return { reference: null, cleanNote: null };
  
  const match = notes.match(/\(Paystack ref: ([^)]+)\)\s*$/i);
  const reference = match ? match[1] : null;
  const cleanNote = notes.replace(/\s*\(Paystack ref: [^)]+\)\s*$/i, "").trim() || null;
  
  return { reference, cleanNote };
}

function serializeCashDonation(event: {
  id: number;
  amount: number;
  notes: string | null;
  createdAt: Date;
  userName: string | null;
}) {
  const { reference, cleanNote } = extractReferenceFromNotes(event.notes);
  
  return {
    id: event.id,
    amount: event.amount,
    donorName: event.userName || "Anonymous Donor",
    referenceNumber: reference || "N/A",
    transactionId: reference || "N/A",
    notes: cleanNote,
    createdAt: event.createdAt.toISOString(),
  };
}

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get("/admin/stats", ...adminAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const results = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db.select({ activeNgos: count() }).from(ngosTable),
    db.select({ pendingRequests: count() }).from(padRequestsTable).where(eq(padRequestsTable.status, "pending")),
    db.select({ publishedArticles: count() }).from(articlesTable).where(eq(articlesTable.published, true)),
    db
      .select({ requestsThisMonth: count() })
      .from(padRequestsTable)
      .where(and(gte(padRequestsTable.createdAt, monthStart), lt(padRequestsTable.createdAt, monthEnd))),
  ]);

  // Extract and coerce counts to numbers for consistent JSON shape and logging
  const totalUsers = Number(results[0]?.[0]?.totalUsers ?? 0);
  const activeNgos = Number(results[1]?.[0]?.activeNgos ?? 0);
  const pendingRequests = Number(results[2]?.[0]?.pendingRequests ?? 0);
  const publishedArticles = Number(results[3]?.[0]?.publishedArticles ?? 0);
  const requestsThisMonth = Number(results[4]?.[0]?.requestsThisMonth ?? 0);

  // Log the counts to help debugging when dashboard shows zeros
  try {
    req.log.info({ totalUsers, activeNgos, pendingRequests, publishedArticles, requestsThisMonth }, "Admin dashboard counts");
  } catch {
    // ignore logging errors
  }

  res.json({ totalUsers, activeNgos, pendingRequests, publishedArticles, requestsThisMonth });
});

// ── Articles ──────────────────────────────────────────────────────────────────
router.get("/admin/articles", ...adminAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(articlesTable).orderBy(articlesTable.createdAt);
  res.json(rows.map(serializeArticle));
});

router.post("/admin/articles", ...adminAuth, async (req, res): Promise<void> => {
  const { titleEn, bodyEn, excerptEn, category, readMin, published } = req.body as {
    titleEn?: string;
    bodyEn?: string;
    excerptEn?: string;
    category?: string;
    readMin?: number;
    published?: boolean;
  };

  if (!titleEn || !bodyEn || !excerptEn || !category) {
    res.status(400).json({ error: "titleEn, bodyEn, excerptEn, and category are required" });
    return;
  }

  const validCategories = [
    "catIrregularPeriods", "catCramps", "catHormones", "catNutrition",
    "catMentalHealth", "catEducation", "catWellness", "catSupport",
  ] as const;
  if (!validCategories.includes(category as typeof validCategories[number])) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  const [created] = await db
    .insert(articlesTable)
    .values({
      titleEn,
      bodyEn,
      excerptEn,
      category: category as typeof validCategories[number],
      readMin: readMin ?? 5,
      published: published ?? false,
    })
    .returning();

  req.log.info({ id: created.id }, "Article created");
  res.status(201).json(serializeArticle(created));
});

router.put("/admin/articles/:id", ...adminAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid article ID" }); return; }

  const { titleEn, bodyEn, excerptEn, titleYo, bodyYo, excerptYo, titleIg, bodyIg, excerptIg, titleHa, bodyHa, excerptHa, category, readMin, published } = req.body as Record<string, string | number | boolean | undefined>;

  const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Article not found" }); return; }

  const [updated] = await db
    .update(articlesTable)
    .set({
      titleEn: (titleEn as string) ?? existing.titleEn,
      bodyEn: (bodyEn as string) ?? existing.bodyEn,
      excerptEn: (excerptEn as string) ?? existing.excerptEn,
      titleYo: (titleYo as string | undefined) ?? existing.titleYo,
      bodyYo: (bodyYo as string | undefined) ?? existing.bodyYo,
      excerptYo: (excerptYo as string | undefined) ?? existing.excerptYo,
      titleIg: (titleIg as string | undefined) ?? existing.titleIg,
      bodyIg: (bodyIg as string | undefined) ?? existing.bodyIg,
      excerptIg: (excerptIg as string | undefined) ?? existing.excerptIg,
      titleHa: (titleHa as string | undefined) ?? existing.titleHa,
      bodyHa: (bodyHa as string | undefined) ?? existing.bodyHa,
      excerptHa: (excerptHa as string | undefined) ?? existing.excerptHa,
      category: (category as typeof existing.category) ?? existing.category,
      readMin: (readMin as number | undefined) ?? existing.readMin,
      published: (published as boolean | undefined) ?? existing.published,
    })
    .where(eq(articlesTable.id, id))
    .returning();

  res.json(serializeArticle(updated));
});

router.delete("/admin/articles/:id", ...adminAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid article ID" }); return; }

  const [existing] = await db.select({ id: articlesTable.id }).from(articlesTable).where(eq(articlesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Article not found" }); return; }

  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  res.json({ message: "Article deleted" });
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get("/admin/users", ...adminAuth, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 20), 10)));
  const offset = (page - 1) * limit;

  const [allUsers, [{ total }]] = await Promise.all([
    db.select().from(usersTable).orderBy(usersTable.createdAt).limit(limit).offset(offset),
    db.select({ total: count() }).from(usersTable),
  ]);

  res.json({ users: allUsers.map(serializeUser), total, page, limit });
});

router.get("/admin/users/:id", ...adminAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json(serializeUser(user));
});

router.get("/admin/cash-donations", ...adminAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: eventsTable.id,
      amount: eventsTable.amount,
      notes: eventsTable.notes,
      createdAt: eventsTable.createdAt,
      userName: usersTable.name,
    })
    .from(eventsTable)
    .leftJoin(usersTable, eq(eventsTable.userId, usersTable.id))
    .where(eq(eventsTable.type, "cash_donation"))
    .orderBy(desc(eventsTable.createdAt))
    .limit(100);

  res.json({ donations: rows.map(serializeCashDonation) });
});

// ── NGOs ──────────────────────────────────────────────────────────────────────
router.get("/admin/ngos", ...adminAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(ngosTable).orderBy(ngosTable.name);
  res.json(rows.map(serializeNgo));
});

router.post("/admin/ngos", ...adminAuth, async (req, res): Promise<void> => {
  const { name, region, state, contactEmail, monthlyQuota } = req.body as {
    name?: string; region?: string; state?: string; contactEmail?: string; monthlyQuota?: number;
  };

  if (!name || !region || !state || !contactEmail) {
    res.status(400).json({ error: "name, region, state, and contactEmail are required" });
    return;
  }

  if (name === PUBLIC_STOCK_NGO_NAME) {
    const [existingPublicStock] = await db
      .select({ id: ngosTable.id })
      .from(ngosTable)
      .where(eq(ngosTable.name, PUBLIC_STOCK_NGO_NAME))
      .limit(1);
    if (existingPublicStock) {
      res.status(400).json({ error: "Only one NGO named CycleCare Charity is allowed" });
      return;
    }
  }

  const [created] = await db
    .insert(ngosTable)
    .values({ name, region, state, contactEmail, monthlyQuota: monthlyQuota ?? 50 })
    .returning();

  req.log.info({ id: created.id, name }, "NGO created");
  res.status(201).json(serializeNgo(created));
});

router.post("/admin/ngos/transfer-stock", ...adminAuth, async (req, res): Promise<void> => {
  const { toNgoId, quantity } = req.body as { toNgoId?: number; quantity?: number };
  if (!toNgoId || !quantity || !Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({ error: "toNgoId and quantity must be set to valid positive integers" });
    return;
  }

  const [publicStockNgo] = await db
    .select({ id: ngosTable.id, availablePads: ngosTable.availablePads })
    .from(ngosTable)
    .where(eq(ngosTable.name, PUBLIC_STOCK_NGO_NAME))
    .limit(1);

  if (!publicStockNgo) {
    res.status(404).json({ error: "Public stock NGO not found" });
    return;
  }

  if (publicStockNgo.id === toNgoId) {
    res.status(400).json({ error: "Cannot transfer stock to the public stock NGO" });
    return;
  }

  const [targetNgo] = await db
    .select()
    .from(ngosTable)
    .where(eq(ngosTable.id, toNgoId))
    .limit(1);

  if (!targetNgo) {
    res.status(404).json({ error: "Target NGO not found" });
    return;
  }

  const [updatedPublicStock] = await db
    .update(ngosTable)
    .set({ availablePads: publicStockNgo.availablePads - quantity })
    .where(eq(ngosTable.id, publicStockNgo.id))
    .returning();

  const [updatedTargetNgo] = await db
    .update(ngosTable)
    .set({ availablePads: targetNgo.availablePads + quantity })
    .where(eq(ngosTable.id, targetNgo.id))
    .returning();

  try {
    await db.insert(eventsTable).values({
      type: "transfer",
      amount: quantity,
      fromNgoId: publicStockNgo.id,
      toNgoId: targetNgo.id,
      ngoId: null,
      userId: null,
      notes: `Transfer to ${targetNgo.name}`,
    });
  } catch (e) {
    req.log.warn({ err: e }, "Failed to log transfer event");
  }

  req.log.info({ fromNgoId: publicStockNgo.id, toNgoId, quantity }, "Transferred stock from public stock to NGO");
  res.json({ fromNgo: serializeNgo(updatedPublicStock), toNgo: serializeNgo(updatedTargetNgo) });
});

router.put("/admin/ngos/:id", ...adminAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid NGO ID" }); return; }

  const { name, region, state, contactEmail, monthlyQuota } = req.body as {
    name?: string; region?: string; state?: string; contactEmail?: string; monthlyQuota?: number;
  };

  const [existing] = await db.select().from(ngosTable).where(eq(ngosTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "NGO not found" }); return; }

  const [updated] = await db
    .update(ngosTable)
    .set({
      name: name ?? existing.name,
      region: region ?? existing.region,
      state: state ?? existing.state,
      contactEmail: contactEmail ?? existing.contactEmail,
      monthlyQuota: monthlyQuota ?? existing.monthlyQuota,
    })
    .where(eq(ngosTable.id, id))
    .returning();

  res.json(serializeNgo(updated));
});

router.delete("/admin/ngos/:id", ...adminAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid NGO ID" }); return; }

  const [existing] = await db.select({ id: ngosTable.id }).from(ngosTable).where(eq(ngosTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "NGO not found" }); return; }

  await db.delete(ngosTable).where(eq(ngosTable.id, id));
  res.json({ message: "NGO deleted" });
});

router.get("/admin/ngos/:id/workers", ...adminAuth, async (req, res): Promise<void> => {
  const ngoId = parseInt(String(req.params.id), 10);
  if (isNaN(ngoId)) { res.status(400).json({ error: "Invalid NGO ID" }); return; }

  const [ngo] = await db.select({ id: ngosTable.id }).from(ngosTable).where(eq(ngosTable.id, ngoId)).limit(1);
  if (!ngo) { res.status(404).json({ error: "NGO not found" }); return; }

  const workers = await db
    .select({ user: usersTable })
    .from(ngoWorkersTable)
    .innerJoin(usersTable, eq(ngoWorkersTable.userId, usersTable.id))
    .where(eq(ngoWorkersTable.ngoId, ngoId));

  res.json(workers.map(({ user }) => serializeUser(user)));
});

router.post("/admin/ngos/:id/workers", ...adminAuth, async (req, res): Promise<void> => {
  const ngoId = parseInt(String(req.params.id), 10);
  if (isNaN(ngoId)) { res.status(400).json({ error: "Invalid NGO ID" }); return; }

  const { userId } = req.body as { userId?: number };
  if (!userId) { res.status(400).json({ error: "userId is required" }); return; }

  const [ngo] = await db.select({ id: ngosTable.id }).from(ngosTable).where(eq(ngosTable.id, ngoId)).limit(1);
  if (!ngo) { res.status(404).json({ error: "NGO not found" }); return; }

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(ngoWorkersTable).values({ userId, ngoId });
  await db.update(usersTable).set({ role: "ngo" }).where(eq(usersTable.id, userId));

  req.log.info({ userId, ngoId }, "NGO worker added");
  res.status(201).json({ message: "Worker added and role updated to ngo" });
});

router.put("/admin/users/:id/reset-password", ...adminAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "newPassword must be at least 6 characters" });
    return;
  }

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: hashed }).where(eq(usersTable.id, id));

  req.log.info({ userId: id }, "Admin reset user password");
  res.json({ message: "Password updated successfully" });
});

export default router;