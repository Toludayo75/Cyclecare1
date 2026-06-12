import jwt from "jsonwebtoken";

const SECRET = process.env["SESSION_SECRET"] ?? "cyclecare-secret-dev";
const EXPIRES_IN = "30d";

export interface JwtPayload {
  userId: number;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, SECRET);
  if (typeof decoded === "string" || !("userId" in decoded)) {
    throw new Error("Invalid token payload");
  }
  return { userId: (decoded as JwtPayload).userId };
}
