import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { db, pushTokensTable } from "@workspace/db";

const router = Router();

router.post("/notifications/register-token", authenticate, async (req, res) => {
  const userId = req.userId ?? null;
  const { token, platform } = req.body as { token?: string; platform?: string };

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  try {
    // Upsert: delete existing with same token then insert with possible userId
    await db.delete(pushTokensTable).where(pushTokensTable.token.equals(token));
    const created = await db.insert(pushTokensTable).values({ token: token.trim(), platform: (platform ?? "").trim(), userId }).returning();
    res.status(201).json({ id: created[0].id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to register push token", err);
    res.status(500).json({ error: "Could not register token" });
  }
});

export default router;
