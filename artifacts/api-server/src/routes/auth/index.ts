import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { signToken } from "../../lib/jwt";
import { authenticate } from "../../middlewares/authenticate";

const router: IRouter = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    age: user.age ?? null,
    address: user.address ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone?.trim() ?? null;

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    res.status(400).json({ error: "A valid email address is required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    [user] = await db
      .insert(usersTable)
      .values({ name: name.trim(), email: normalizedEmail, phone: normalizedPhone, passwordHash })
      .returning();
  } catch (error: any) {
    if (error?.code === "23505" || /duplicate key/i.test(error?.message ?? "")) {
      res.status(409).json({ error: "Email or phone already in use" });
      return;
    }
    throw error;
  }

  const token = signToken({ userId: user.id });

  req.log.info({ userId: user.id }, "User registered");

  res.status(201).json({ token, user: serializeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id });

  req.log.info({ userId: user.id }, "User logged in");

  res.json({ token, user: serializeUser(user) });
});

router.post("/auth/logout", authenticate, async (req, res): Promise<void> => {
  req.log.info({ userId: req.userId }, "User logged out");
  res.sendStatus(204);
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

router.patch("/auth/me", authenticate, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const { name, age, address, city, state } = body as {
    name?: string;
    age?: number | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  };

  if (Object.keys(body).length === 0) {
    res.status(400).json({ error: "Request body is required" });
    return;
  }

  if (name !== undefined && name.trim().length === 0) {
    res.status(400).json({ error: "Name cannot be empty" });
    return;
  }

  if (age !== undefined && age !== null && (age < 10 || age > 100)) {
    res.status(400).json({ error: "Age must be between 10 and 100" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim();
  if (age !== undefined) updates.age = age;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields provided to update" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  req.log.info({ userId: req.userId }, "User profile updated");

  res.json(serializeUser(updated));
});

router.post("/auth/change-password", authenticate, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, req.userId!));

  req.log.info({ userId: req.userId }, "Password changed");
  res.json({ message: "Password changed successfully" });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  req.log.info({ email }, "Password reset requested");
  res.json({ message: "If that email exists, a reset link has been sent." });
});

export default router;
