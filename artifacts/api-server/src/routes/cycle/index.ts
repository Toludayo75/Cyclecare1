import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, cycleProfilesTable, cycleLogsTable, usersTable } from "@workspace/db";
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

router.get("/cycle/profile", authenticate, async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, req.userId!))
    .limit(1) as unknown as CycleProfileWithRollover[];

  if (!profile) {
    res.status(404).json({ error: "Cycle profile not found" });
    return;
  }

  res.json({
    id: profile.id,
    userId: profile.userId,
    lastPeriodDate: profile.lastPeriodDate,
    cycleLength: profile.cycleLength,
    periodDuration: profile.periodDuration,
    flowType: profile.flowType,
    notificationsEnabled: profile.notificationsEnabled,
    rolloverBalance: profile.rolloverBalance,
    rolloverMonth: profile.rolloverMonth ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.post("/cycle/profile", authenticate, async (req, res): Promise<void> => {
  const { lastPeriodDate, cycleLength, periodDuration, flowType, notificationsEnabled } = req.body as {
    lastPeriodDate?: string;
    cycleLength?: number;
    periodDuration?: number;
    flowType?: "light" | "medium" | "heavy";
    notificationsEnabled?: boolean;
  };

  if (!lastPeriodDate || !cycleLength || !periodDuration || !flowType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, req.userId!))
    .limit(1) as unknown as CycleProfileWithRollover[];

  let profile: CycleProfileWithRollover;
  if (existing.length > 0) {
    [profile] = await db
      .update(cycleProfilesTable)
      .set({ lastPeriodDate, cycleLength, periodDuration, flowType, notificationsEnabled: notificationsEnabled ?? true })
      .where(eq(cycleProfilesTable.userId, req.userId!))
      .returning() as unknown as CycleProfileWithRollover[];
  } else {
    const newProfile: any = {
      userId: req.userId!,
      lastPeriodDate,
      cycleLength,
      periodDuration,
      flowType,
      notificationsEnabled: notificationsEnabled ?? true,
      rolloverBalance: 0,
      rolloverMonth: null,
    };

    [profile] = await db
      .insert(cycleProfilesTable)
      .values(newProfile)
      .returning() as unknown as CycleProfileWithRollover[];

    await db
      .update(usersTable)
      .set({ hasCompletedOnboarding: true })
      .where(eq(usersTable.id, req.userId!));
  }

  req.log.info({ userId: req.userId }, "Cycle profile saved");

  res.json({
    id: profile.id,
    userId: profile.userId,
    lastPeriodDate: profile.lastPeriodDate,
    cycleLength: profile.cycleLength,
    periodDuration: profile.periodDuration,
    flowType: profile.flowType,
    notificationsEnabled: profile.notificationsEnabled,
    rolloverBalance: profile.rolloverBalance,
    rolloverMonth: profile.rolloverMonth ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.get("/cycle/logs", authenticate, async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(cycleLogsTable)
    .where(eq(cycleLogsTable.userId, req.userId!))
    .orderBy(desc(cycleLogsTable.startDate));

  res.json(logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    startDate: l.startDate,
    endDate: l.endDate ?? null,
    flowIntensity: l.flowIntensity,
    symptoms: l.symptoms ?? [],
    notes: l.notes ?? null,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.post("/cycle/logs", authenticate, async (req, res): Promise<void> => {
  const { startDate, endDate, flowIntensity, symptoms, notes } = req.body as {
    startDate?: string;
    endDate?: string | null;
    flowIntensity?: "light" | "medium" | "heavy";
    symptoms?: string[];
    notes?: string | null;
  };

  if (!startDate || !flowIntensity) {
    res.status(400).json({ error: "startDate and flowIntensity are required" });
    return;
  }

  const [log] = await db
    .insert(cycleLogsTable)
    .values({
      userId: req.userId!,
      startDate,
      endDate: endDate ?? null,
      flowIntensity,
      symptoms: symptoms ?? [],
      notes: notes ?? null,
    })
    .returning();

  const [profile] = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, req.userId!))
    .limit(1) as unknown as CycleProfileWithRollover[];

  if (profile) {
    // Always update the profile's `lastPeriodDate` to match the newly-logged start date.
    // The UI expects the latest logged period to replace the stored date immediately.
    await db
      .update(cycleProfilesTable)
      .set({ lastPeriodDate: startDate })
      .where(eq(cycleProfilesTable.userId, req.userId!));
  } else {
    const newProfile: any = {
      userId: req.userId!,
      lastPeriodDate: startDate,
      cycleLength: 28,
      periodDuration: 5,
      flowType: "medium",
      notificationsEnabled: true,
      rolloverBalance: 0,
      rolloverMonth: null,
    };

    await db.insert(cycleProfilesTable).values(newProfile);
  }

  res.status(201).json({
    id: log.id,
    userId: log.userId,
    startDate: log.startDate,
    endDate: log.endDate ?? null,
    flowIntensity: log.flowIntensity,
    symptoms: log.symptoms ?? [],
    notes: log.notes ?? null,
    createdAt: log.createdAt.toISOString(),
  });
});

router.get("/cycle/dashboard", authenticate, async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.userId, req.userId!))
    .limit(1) as unknown as CycleProfileWithRollover[];

  if (!profile) {
    res.json({ currentPhase: "unknown" });
    return;
  }

  const today = new Date();
  const lastPeriod = new Date(profile.lastPeriodDate);
  const daysSinceLast = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSinceLast % profile.cycleLength) + 1;

  let currentPhase: "menstrual" | "follicular" | "ovulation" | "luteal" = "follicular";
  if (cycleDay <= profile.periodDuration) currentPhase = "menstrual";
  else if (cycleDay <= 13) currentPhase = "follicular";
  else if (cycleDay <= 16) currentPhase = "ovulation";
  else currentPhase = "luteal";

  const daysUntilNext = profile.cycleLength - (daysSinceLast % profile.cycleLength);
  const nextPeriodDate = new Date(today);
  nextPeriodDate.setDate(today.getDate() + daysUntilNext);

  const ovulationDay = profile.cycleLength - 14;
  const fertileStart = new Date(lastPeriod);
  fertileStart.setDate(lastPeriod.getDate() + daysSinceLast - cycleDay + ovulationDay - 5);
  const fertileEnd = new Date(lastPeriod);
  fertileEnd.setDate(lastPeriod.getDate() + daysSinceLast - cycleDay + ovulationDay + 1);

  res.json({
    currentPhase,
    nextPeriodDate: nextPeriodDate.toISOString().split("T")[0],
    daysUntilNextPeriod: daysUntilNext,
    fertileWindowStart: fertileStart.toISOString().split("T")[0],
    fertileWindowEnd: fertileEnd.toISOString().split("T")[0],
    cycleDay,
    lastPeriodDate: profile.lastPeriodDate,
    periodDuration: profile.periodDuration,
  });
});

export default router;
