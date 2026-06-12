import { Router, type IRouter } from "express";
import { eq, and, gte, lt, ne } from "drizzle-orm";
import { db, padRequestsTable, cycleProfilesTable, ngosTable } from "@workspace/db";
import { authenticate } from "../../middlewares/authenticate";

type CycleProfileWithRollover = {
  id: number;
  userId: number;
  lastPeriodDate: string;
  cycleLength: number;
  periodDuration: number;
  flowType: "light" | "medium" | "heavy";
  notificationsEnabled: boolean;
  rolloverBalance: number;
  rolloverMonth: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const router: IRouter = Router();

const MONTHLY_ALLOCATION = 25;
const CYCLECARE_CHARITY_NGO_NAME = "CycleCare Charity";
const CYCLECARE_CHARITY_EMAIL = "donations@cyclecare.org";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function getOrCreateCyclecareCharityNgo() {
  const [existing] = await db
    .select()
    .from(ngosTable)
    .where(eq(ngosTable.name, CYCLECARE_CHARITY_NGO_NAME))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(ngosTable)
    .values({
      name: CYCLECARE_CHARITY_NGO_NAME,
      region: "all",
      state: "all",
      contactEmail: CYCLECARE_CHARITY_EMAIL,
      monthlyQuota: 0,
      availablePads: 0,
    })
    .returning();

  return created;
}

function getCycleWindow(profile: { lastPeriodDate: string; cycleLength: number; periodDuration: number }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastPeriod = new Date(profile.lastPeriodDate);
  if (Number.isNaN(lastPeriod.getTime())) return null;

  const candidates: Date[] = [];
  let cursor = new Date(lastPeriod);

  while (cursor < nextMonthStart) {
    candidates.push(new Date(cursor));
    cursor = addDays(cursor, profile.cycleLength);
  }

  if (candidates[0] > monthStart) {
    candidates.unshift(addDays(candidates[0], -profile.cycleLength));
  }

  for (const start of candidates) {
    const end = addDays(start, profile.periodDuration - 1);
    if (end >= monthStart && start < nextMonthStart) {
      return { start, end };
    }
  }

  if (candidates.length > 0) {
    const start = candidates[candidates.length - 1];
    return { start, end: addDays(start, profile.periodDuration - 1) };
  }

  return null;
}

function serializeRequest(r: typeof padRequestsTable.$inferSelect) {
  return {
    id: r.id,
    userId: r.userId,
    quantity: r.quantity,
    status: r.status,
    pickupCode: r.pickupCode,
    pickupLocation: r.pickupLocation,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/requests", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentMonthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [profile] = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, userId))
    .limit(1) as unknown as CycleProfileWithRollover[];

  const allRequests = await db
    .select()
    .from(padRequestsTable)
    .where(eq(padRequestsTable.userId, userId))
    .orderBy(padRequestsTable.createdAt);

  const thisMonthRequests = allRequests.filter(
    (r) => r.createdAt >= monthStart && r.createdAt < monthEnd && r.status !== "rejected",
  );

  const carryForward = profile?.rolloverMonth === currentMonthTag ? profile.rolloverBalance : 0;
  const total = MONTHLY_ALLOCATION + (carryForward ?? 0);
  const used = thisMonthRequests.reduce((sum, r) => sum + r.quantity, 0);
  const remaining = Math.max(0, total - used);

  const currentRequest = allRequests
    .filter((r) => r.createdAt >= monthStart && r.createdAt < monthEnd && r.status !== "rejected" && r.status !== "collected")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

  const history = allRequests
    .filter((r) => !currentRequest || r.id !== currentRequest.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({
    allocation: { total, used, remaining },
    currentRequest: currentRequest ? serializeRequest(currentRequest) : null,
    history: history.map(serializeRequest),
  });
});

router.post("/requests", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const { quantity, notes } = req.body as { quantity?: number; notes?: string | null };

  if (!quantity || quantity < 1 || quantity > 25) {
    res.status(400).json({ error: "Quantity must be between 1 and 25" });
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentMonthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [profile] = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, userId))
    .limit(1) as unknown as CycleProfileWithRollover[];

  const requestWindow = profile ? getCycleWindow(profile) : null;
  if (requestWindow && now > requestWindow.end) {
    res.status(403).json({ error: "Your predicted period window has ended. You can only request pads while the current cycle window is active." });
    return;
  }

  const thisMonthRequests = await db
    .select()
    .from(padRequestsTable)
    .where(
      and(
        eq(padRequestsTable.userId, userId),
        gte(padRequestsTable.createdAt, monthStart),
        lt(padRequestsTable.createdAt, monthEnd),
        ne(padRequestsTable.status, "rejected"),
      ),
    );

  const activeRequest = thisMonthRequests.find(
    (r) => r.status !== "collected",
  );
  if (activeRequest) {
    res.status(409).json({ error: "You already have an active request this month. Collect it before making a new one." });
    return;
  }

  const carryForward = profile?.rolloverMonth === currentMonthTag ? profile.rolloverBalance : 0;
  const total = MONTHLY_ALLOCATION + (carryForward ?? 0);
  const used = thisMonthRequests.reduce((sum, r) => sum + r.quantity, 0);
  if (used + quantity > total) {
    res.status(400).json({
      error: `Request exceeds your monthly allocation. You have ${total - used} pads remaining.`,
    });
    return;
  }

  const [created] = await db
    .insert(padRequestsTable)
    .values({
      userId,
      quantity,
      status: "pending",
      pickupCode: null,
      pickupLocation: null,
      notes: notes ?? null,
    })
    .returning();

  req.log.info({ userId, quantity }, "Pad request created (pending NGO review)");
  res.status(201).json(serializeRequest(created));
});

router.post("/requests/unused-action", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const { action } = req.body as { action?: "donate" | "rollover" };

  if (action !== "donate" && action !== "rollover") {
    res.status(400).json({ error: "Invalid action. Use donate or rollover." });
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentMonthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [profile] = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, userId))
    .limit(1) as unknown as CycleProfileWithRollover[];

  if (!profile) {
    res.status(404).json({ error: "Cycle profile not found" });
    return;
  }

  const requestWindow = getCycleWindow(profile);
  if (!requestWindow || now <= requestWindow.end) {
    res.status(400).json({ error: "Donation or rollover is only available after your predicted period ends." });
    return;
  }

  const thisMonthRequests = await db
    .select()
    .from(padRequestsTable)
    .where(
      and(
        eq(padRequestsTable.userId, userId),
        gte(padRequestsTable.createdAt, monthStart),
        lt(padRequestsTable.createdAt, monthEnd),
        ne(padRequestsTable.status, "rejected"),
      ),
    );

  const carryForward = profile.rolloverMonth === currentMonthTag ? profile.rolloverBalance : 0;
  const total = MONTHLY_ALLOCATION + (carryForward ?? 0);
  const used = thisMonthRequests.reduce((sum, r) => sum + r.quantity, 0);
  const remaining = Math.max(0, total - used);

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthTag = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

  const updateValues: any = action === "donate"
    ? { rolloverBalance: 0, rolloverMonth: null }
    : { rolloverBalance: remaining, rolloverMonth: nextMonthTag };

  const [updated] = await db
    .update(cycleProfilesTable)
    .set(updateValues)
    .where(eq(cycleProfilesTable.userId, userId))
    .returning() as unknown as CycleProfileWithRollover[];

  let donatedAmount = 0;
  let publicStockAvailablePads: number | null = null;
  let remainingAfterAction = remaining;

  if (action === "donate" && remaining > 0) {
    const charityNgo = await getOrCreateCyclecareCharityNgo();
    const [updatedNgo] = await db
      .update(ngosTable)
      .set({ availablePads: charityNgo.availablePads + remaining })
      .where(eq(ngosTable.id, charityNgo.id))
      .returning();

    donatedAmount = remaining;
    publicStockAvailablePads = updatedNgo?.availablePads ?? null;
    remainingAfterAction = 0;

    await db.insert(padRequestsTable).values({
      userId,
      quantity: remaining,
      status: "collected",
      pickupCode: null,
      pickupLocation: null,
      notes: "Donated unused pads to CycleCare public stock",
    });

    // Log donation event
    try {
      await db.insert((await import("@workspace/db")).eventsTable).values({
        type: "donation",
        amount: remaining,
        fromNgoId: null,
        toNgoId: updatedNgo?.id ?? charityNgo.id,
        ngoId: updatedNgo?.id ?? charityNgo.id,
        userId,
        notes: "User donated unused pads to public stock",
      });
    } catch (e) {
      req.log.warn({ err: e }, "Failed to log donation event");
    }
  }

  if (action === "rollover" && remaining > 0) {
    await db.insert(padRequestsTable).values({
      userId,
      quantity: remaining,
      status: "collected",
      pickupCode: null,
      pickupLocation: null,
      notes: "Rolled over unused pads to next month",
    });

    remainingAfterAction = 0;
  }

  req.log.info({ userId, action, remaining, remainingAfterAction, donatedAmount, publicStockAvailablePads }, "unused-action completed");

  res.json({
    rolloverBalance: updated.rolloverBalance,
    rolloverMonth: updated.rolloverMonth ?? null,
    remaining: remainingAfterAction,
    donatedAmount,
    publicStockAvailablePads,
  });
});

router.patch("/requests/:id/collect", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(String(req.params.id), 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid request ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(padRequestsTable)
    .where(and(eq(padRequestsTable.id, id), eq(padRequestsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (existing.status === "pending") {
    res.status(400).json({ error: "Request is still under review by an NGO partner." });
    return;
  }

  if (existing.status === "collected") {
    res.status(400).json({ error: "Request already collected" });
    return;
  }

  if (existing.status === "rejected") {
    res.status(400).json({ error: "Request was rejected and cannot be collected." });
    return;
  }

  const [updated] = await db
    .update(padRequestsTable)
    .set({ status: "collected" })
    .where(eq(padRequestsTable.id, id))
    .returning();

  req.log.info({ userId, id }, "Pad request marked collected");
  res.json(serializeRequest(updated));
});

export default router;
