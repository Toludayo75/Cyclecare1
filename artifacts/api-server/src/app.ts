import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

function normalizeOrigin(origin: string | undefined) {
  return origin?.trim().replace(/\/+$/, "").toLowerCase() ?? "";
}

const defaultAllowedOrigins = [
  "http://localhost:4173",
  "http://localhost:4174",
  "http://localhost:4176",
  "http://localhost:19006",
  "https://cyclecareadmin.netlify.app",
  "https://cyclecarengo.netlify.app",
  "https://cyclecarepublic.netlify.app",
  "https://cyclecare-api.onrender.com",
];

const envOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...envOrigins, ...defaultAllowedOrigins].map(normalizeOrigin)),
);

const corsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS origin denied"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res) => {
    res.status(429).json({ error: "Too many requests, please try again later." });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res) => {
    res.status(429).json({ error: "Too many auth attempts, please try again later." });
  },
});

app.disable("x-powered-by");
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use("/api/auth", authLimiter);

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/api", router);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.message === "CORS origin denied") {
    res.status(403).json({ error: "CORS origin denied" });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

export default app;
