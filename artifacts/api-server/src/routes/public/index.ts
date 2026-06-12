import { Router } from "express";
import { db, eventsTable, ngosTable, usersTable, pool } from "@workspace/db";
import { desc, eq, inArray } from "drizzle-orm";

function sanitizeEventNotes(note?: string | null) {
  if (!note) return null;
  const sanitized = note.replace(/\s*\(Paystack ref: [^)]+\)\s*$/i, "").trim();
  return sanitized || null;
}

const router = Router();

// Recent public events (donations, transfers, ngo additions).
router.get("/public/events", async (_req, res) => {
  try {
    const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt)).limit(100);

    // Fetch related NGO and user names where present
    const ngoIds = Array.from(new Set(rows.flatMap((r) => [r.fromNgoId, r.toNgoId, r.ngoId].filter(Boolean) as number[])));
    const userIds = Array.from(new Set(rows.flatMap((r) => (r.userId ? [r.userId] : []))));

    const ngos = ngoIds.length > 0 ? await db.select({ id: ngosTable.id, name: ngosTable.name }).from(ngosTable).where(inArray(ngosTable.id, ngoIds)) : [];
    const users = userIds.length > 0 ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, userIds)) : [];

    const ngoMap = new Map(ngos.map((n) => [n.id, n.name]));
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const formatted = rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      fromNgo: r.fromNgoId ? ngoMap.get(r.fromNgoId) ?? null : null,
      toNgo: r.toNgoId ? ngoMap.get(r.toNgoId) ?? null : null,
      ngo: r.ngoId ? ngoMap.get(r.ngoId) ?? null : null,
      user: r.userId ? userMap.get(r.userId) ?? null : null,
      notes: sanitizeEventNotes(r.notes),
      createdAt: r.createdAt.toISOString(),
    }));

    // Also return an aggregated total of pads across all historical events
    const agg = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_pads FROM events WHERE type IN ('donation','transfer','ngo_add')`
    );
    const totalPads = agg?.rows?.[0]?.total_pads ?? 0;

    res.json({ events: formatted, totalPads });
  } catch (e) {
    // log full error for diagnostics
    // eslint-disable-next-line no-console
    console.error('public/events error', e);
    res.status(500).json({ error: "Failed to fetch public events" });
  }
});

// Remove legacy HTML dashboard endpoint (was serving a static HTML page).
// Return 410 Gone to indicate it's intentionally removed.
router.get("/public/dashboard", (_req, res) => {
  res.status(410).json({ error: "Public dashboard removed. Use the React web dashboard instead." });
});
export default router;
