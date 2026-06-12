import { Router, type IRouter } from "express";
import { eq, and, gte, lt, count, inArray } from "drizzle-orm";
import { db, padRequestsTable, usersTable, ngoWorkersTable, ngosTable, pickupCentersTable, eventsTable } from "@workspace/db";
import { authenticate } from "../../middlewares/authenticate";
import { requireRole } from "../../middlewares/requireRole";

const router: IRouter = Router();
const ngoAuth = [authenticate, requireRole("ngo")];

function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function getNgoForUser(userId: number) {
  const [worker] = await db
    .select({ ngoId: ngoWorkersTable.ngoId })
    .from(ngoWorkersTable)
    .where(eq(ngoWorkersTable.userId, userId))
    .limit(1);
  return worker?.ngoId ?? null;
}

async function getNgoState(ngoId: number): Promise<string | null> {
  const [ngo] = await db
    .select({ state: ngosTable.state })
    .from(ngosTable)
    .where(eq(ngosTable.id, ngoId))
    .limit(1);
  return ngo?.state ?? null;
}

function serializeRequest(
  r: typeof padRequestsTable.$inferSelect,
  user: { name: string; email: string | null; address?: string | null; city?: string | null; state?: string | null }
) {
  return {
    id: r.id,
    userId: r.userId,
    userName: user.name,
    userEmail: user.email ?? null,
    userAddress: user.address ?? null,
    userCity: user.city ?? null,
    userState: user.state ?? null,
    quantity: r.quantity,
    status: r.status,
    pickupCode: r.pickupCode ?? null,
    pickupLocation: r.pickupLocation ?? null,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

// ── NGO Profile ───────────────────────────────────────────────────────────────
router.get("/ngo/me", ...ngoAuth, async (req, res): Promise<void> => {
  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) {
    res.status(404).json({ error: "No NGO association found for this user" });
    return;
  }

  const [ngo] = await db.select().from(ngosTable).where(eq(ngosTable.id, ngoId)).limit(1);
  if (!ngo) { res.status(404).json({ error: "NGO not found" }); return; }

  res.json({
    id: ngo.id,
    name: ngo.name,
    region: ngo.region,
    state: ngo.state,
    contactEmail: ngo.contactEmail,
    monthlyQuota: ngo.monthlyQuota,
    availablePads: ngo.availablePads,
    createdAt: ngo.createdAt.toISOString(),
  });
});

// ── NGO Stats ─────────────────────────────────────────────────────────────────
router.get("/ngo/stats", ...ngoAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const allStatuses = ["pending", "approved", "rejected", "collected"] as const;
  const countsByStatus: Record<string, number> = {};
  for (const s of allStatuses) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(padRequestsTable)
      .where(eq(padRequestsTable.status, s));
    countsByStatus[s] = n;
  }

  const [{ totalThisMonth }] = await db
    .select({ totalThisMonth: count() })
    .from(padRequestsTable)
    .where(and(gte(padRequestsTable.createdAt, monthStart), lt(padRequestsTable.createdAt, monthEnd)));

  res.json({
    pending: countsByStatus.pending ?? 0,
    approved: countsByStatus.approved ?? 0,
    rejected: countsByStatus.rejected ?? 0,
    collected: countsByStatus.collected ?? 0,
    totalThisMonth,
  });
});

// ── Request Queue ─────────────────────────────────────────────────────────────
router.get("/ngo/requests", ...ngoAuth, async (req, res): Promise<void> => {
  const statusFilter = req.query.status as string | undefined;
  const validStatuses = ["pending", "approved", "ready", "collected", "rejected"];

  const whereClause =
    statusFilter && validStatuses.includes(statusFilter)
      ? eq(padRequestsTable.status, statusFilter as typeof padRequestsTable.$inferSelect["status"])
      : undefined;

  const requests = await db
    .select()
    .from(padRequestsTable)
    .where(whereClause)
    .orderBy(padRequestsTable.createdAt);

  const requestUserIds = [...new Set(requests.map((r) => r.userId))];
  const users =
    requestUserIds.length > 0
      ? await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            address: usersTable.address,
            city: usersTable.city,
            state: usersTable.state,
          })
          .from(usersTable)
          .where(inArray(usersTable.id, requestUserIds))
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  res.json(
    requests.map((r) => {
      const user = userMap.get(r.userId) ?? { name: "Unknown", email: null, address: null, city: null, state: null };
      return serializeRequest(r, user);
    })
  );
});

// ── Add Inventory ──────────────────────────────────────────────────────────────
router.post("/ngo/inventory/add", ...ngoAuth, async (req, res): Promise<void> => {
  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) { res.status(403).json({ error: "Not associated with an NGO" }); return; }

  const { quantity } = req.body as { quantity?: number };
  if (!quantity || typeof quantity !== "number" || quantity < 1 || !Number.isInteger(quantity)) {
    res.status(400).json({ error: "quantity must be a positive integer" });
    return;
  }

  const [ngo] = await db
    .select({ availablePads: ngosTable.availablePads })
    .from(ngosTable)
    .where(eq(ngosTable.id, ngoId))
    .limit(1);
  if (!ngo) { res.status(404).json({ error: "NGO not found" }); return; }

  const [updated] = await db
    .update(ngosTable)
    .set({ availablePads: ngo.availablePads + quantity })
    .where(eq(ngosTable.id, ngoId))
    .returning();

  req.log.info({ ngoId, added: quantity, total: updated.availablePads }, "NGO inventory updated");

  // Log NGO inventory addition event
  try {
    const note = `${updated.name ?? 'An NGO'} donated ${quantity} pads.`;
    await db.insert(eventsTable).values({
      type: "ngo_add",
      amount: quantity,
      fromNgoId: null,
      toNgoId: null,
      ngoId: ngoId,
      userId: null,
      notes: note,
    });
  } catch (e) {
    req.log.warn({ err: e }, "Failed to log ngo_add event");
  }

  res.json({
    id: updated.id,
    name: updated.name,
    region: updated.region,
    state: updated.state,
    contactEmail: updated.contactEmail,
    monthlyQuota: updated.monthlyQuota,
    availablePads: updated.availablePads,
    createdAt: updated.createdAt.toISOString(),
  });
});

// ── Approve ───────────────────────────────────────────────────────────────────
router.put("/ngo/requests/:id/approve", ...ngoAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid request ID" }); return; }

  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) { res.status(403).json({ error: "Not associated with an NGO" }); return; }

  const { pickupCenterId, pickupLocation } = req.body as { pickupCenterId?: number; pickupLocation?: string };
  if (!pickupLocation?.trim()) {
    res.status(400).json({ error: "pickupLocation is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(padRequestsTable)
    .where(eq(padRequestsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
  if (existing.status !== "pending") {
    res.status(400).json({ error: `Cannot approve a request with status: ${existing.status}` });
    return;
  }

  // Check NGO has enough stock
  const [ngo] = await db
    .select({ availablePads: ngosTable.availablePads })
    .from(ngosTable)
    .where(eq(ngosTable.id, ngoId))
    .limit(1);

  if (!ngo || ngo.availablePads < existing.quantity) {
    res.status(400).json({
      error: `Insufficient stock. You have ${ngo?.availablePads ?? 0} pads available but this request needs ${existing.quantity}.`,
    });
    return;
  }

  const pickupCode = generatePickupCode();

  // Approve request and deduct pads atomically
  const [[updated]] = await Promise.all([
    db
      .update(padRequestsTable)
      .set({ status: "approved", pickupCode, pickupLocation: pickupLocation.trim() })
      .where(eq(padRequestsTable.id, id))
      .returning(),
    db
      .update(ngosTable)
      .set({ availablePads: ngo.availablePads - existing.quantity })
      .where(eq(ngosTable.id, ngoId)),
  ]);

  req.log.info({ id, pickupCode, pickupCenterId, deducted: existing.quantity }, "Pad request approved, stock deducted");

  const [user] = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, existing.userId))
    .limit(1);

  res.json(serializeRequest(updated, user ?? { name: "Unknown", email: null }));
});

// ── Mark Ready ────────────────────────────────────────────────────────────────
router.put("/ngo/requests/:id/ready", ...ngoAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid request ID" }); return; }

  const [existing] = await db
    .select()
    .from(padRequestsTable)
    .where(eq(padRequestsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
  if (existing.status !== "approved") {
    res.status(400).json({ error: `Can only mark approved requests as ready (current status: ${existing.status})` });
    return;
  }

  const [updated] = await db
    .update(padRequestsTable)
    .set({ status: "ready" })
    .where(eq(padRequestsTable.id, id))
    .returning();

  req.log.info({ id }, "Request marked ready for pickup");

  const [user] = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, existing.userId))
    .limit(1);

  res.json(serializeRequest(updated, user ?? { name: "Unknown", email: null }));
});

// ── Pickup Centers ─────────────────────────────────────────────────────────────
router.get("/ngo/pickup-centers", ...ngoAuth, async (req, res): Promise<void> => {
  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) { res.status(403).json({ error: "Not associated with an NGO" }); return; }

  const centers = await db
    .select()
    .from(pickupCentersTable)
    .where(eq(pickupCentersTable.ngoId, ngoId))
    .orderBy(pickupCentersTable.createdAt);

  res.json(centers.map((c) => ({
    id: c.id,
    ngoId: c.ngoId,
    name: c.name,
    address: c.address,
    city: c.city,
    state: c.state,
    landmark: c.landmark ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  })));
});

router.post("/ngo/pickup-centers", ...ngoAuth, async (req, res): Promise<void> => {
  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) { res.status(403).json({ error: "Not associated with an NGO" }); return; }

  const { name, address, city, state, landmark } = req.body as {
    name?: string; address?: string; city?: string; state?: string; landmark?: string;
  };

  if (!name?.trim() || !address?.trim() || !city?.trim() || !state?.trim()) {
    res.status(400).json({ error: "name, address, city, and state are required" });
    return;
  }

  const [center] = await db
    .insert(pickupCentersTable)
    .values({ ngoId, name: name.trim(), address: address.trim(), city: city.trim(), state: state.trim(), landmark: landmark?.trim() ?? null })
    .returning();

  req.log.info({ ngoId, centerId: center.id }, "Pickup center created");

  res.status(201).json({
    id: center.id, ngoId: center.ngoId, name: center.name, address: center.address,
    city: center.city, state: center.state, landmark: center.landmark ?? null,
    createdAt: center.createdAt.toISOString(), updatedAt: center.updatedAt.toISOString(),
  });
});

router.put("/ngo/pickup-centers/:id", ...ngoAuth, async (req, res): Promise<void> => {
  const centerId = parseInt(String(req.params.id), 10);
  if (isNaN(centerId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) { res.status(403).json({ error: "Not associated with an NGO" }); return; }

  const [existing] = await db
    .select()
    .from(pickupCentersTable)
    .where(and(eq(pickupCentersTable.id, centerId), eq(pickupCentersTable.ngoId, ngoId)))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Pickup center not found" }); return; }

  const { name, address, city, state, landmark } = req.body as {
    name?: string; address?: string; city?: string; state?: string; landmark?: string;
  };

  if (!name?.trim() || !address?.trim() || !city?.trim() || !state?.trim()) {
    res.status(400).json({ error: "name, address, city, and state are required" });
    return;
  }

  const [updated] = await db
    .update(pickupCentersTable)
    .set({ name: name.trim(), address: address.trim(), city: city.trim(), state: state.trim(), landmark: landmark?.trim() ?? null })
    .where(eq(pickupCentersTable.id, centerId))
    .returning();

  res.json({
    id: updated.id, ngoId: updated.ngoId, name: updated.name, address: updated.address,
    city: updated.city, state: updated.state, landmark: updated.landmark ?? null,
    createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/ngo/pickup-centers/:id", ...ngoAuth, async (req, res): Promise<void> => {
  const centerId = parseInt(String(req.params.id), 10);
  if (isNaN(centerId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const ngoId = await getNgoForUser(req.userId!);
  if (!ngoId) { res.status(403).json({ error: "Not associated with an NGO" }); return; }

  const [existing] = await db
    .select()
    .from(pickupCentersTable)
    .where(and(eq(pickupCentersTable.id, centerId), eq(pickupCentersTable.ngoId, ngoId)))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Pickup center not found" }); return; }

  await db.delete(pickupCentersTable).where(eq(pickupCentersTable.id, centerId));

  req.log.info({ ngoId, centerId }, "Pickup center deleted");
  res.status(204).send();
});

// ── Reject ────────────────────────────────────────────────────────────────────
router.put("/ngo/requests/:id/reject", ...ngoAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid request ID" }); return; }

  const [existing] = await db
    .select()
    .from(padRequestsTable)
    .where(eq(padRequestsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
  if (existing.status !== "pending") {
    res.status(400).json({ error: `Cannot reject a request with status: ${existing.status}` });
    return;
  }

  const [updated] = await db
    .update(padRequestsTable)
    .set({ status: "rejected" })
    .where(eq(padRequestsTable.id, id))
    .returning();

  req.log.info({ id }, "Pad request rejected by NGO");

  const [user] = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, existing.userId))
    .limit(1);

  res.json(serializeRequest(updated, user ?? { name: "Unknown", email: null }));
});

export default router;
