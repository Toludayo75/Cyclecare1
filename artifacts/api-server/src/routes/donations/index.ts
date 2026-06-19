import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { authenticate } from "../../middlewares/authenticate";
import { verifyToken } from "../../lib/jwt";
import { db, eventsTable, usersTable } from "@workspace/db";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "../../lib/paystack";

const router: IRouter = Router();

function parseAuthUserId(req: Request): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || Array.isArray(authHeader) || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    return verifyToken(authHeader.slice(7)).userId;
  } catch {
    return null;
  }
}

function getApiBaseUrl(req?: Request): string {
  const configuredUrl = process.env["API_BASE_URL"]?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (req) {
    const forwardedHost = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").trim();
    const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").trim();
    const host = forwardedHost || String(req.headers.host ?? "").trim();

    if (host) {
      const proto = forwardedProto || (req.protocol ? String(req.protocol).trim() : "https");
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }

  const port = process.env["PORT"]?.trim() ?? "5001";
  return `http://localhost:${port}`;
}

router.post("/donations/initialize", async (req, res): Promise<void> => {
  const authenticatedUserId = parseAuthUserId(req);
  const { amount, note, anonymous } = req.body as {
    amount?: number;
    note?: string | null;
    anonymous?: boolean;
  };

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Donation amount must be a positive number" });
    return;
  }

  const formattedNote = note?.trim() || "Cash donation";
  const isAnonymous = anonymous === true;

  if (!authenticatedUserId && !isAnonymous) {
    res.status(401).json({ error: "Sign in to donate without anonymous support" });
    return;
  }

  const [user] = authenticatedUserId
    ? await db
        .select({ email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, authenticatedUserId))
        .limit(1)
    : [undefined];

  const email = user?.email?.trim() || "donor@cyclecare.app";

  try {
    const callbackUrl = `${getApiBaseUrl(req)}/api/donations/verify`;
    const data = await initializePaystackTransaction({
      email,
      amount: Math.round(amount * 100),
      callbackUrl,
      metadata: {
        note: formattedNote,
        anonymous: String(isAnonymous),
        ...(authenticatedUserId && !isAnonymous ? { userId: String(authenticatedUserId) } : {}),
      },
    });
      req.log.info({ authenticatedUserId, isAnonymous, metadata: { note: formattedNote, anonymous: String(isAnonymous), userId: authenticatedUserId && !isAnonymous ? String(authenticatedUserId) : undefined } }, "Initializing donation (to Paystack)");
      // Also print to stdout to ensure visibility in environments where req.log.info may be filtered
      // eslint-disable-next-line no-console
      console.info("[donations] initializing:", { authenticatedUserId, isAnonymous, metadata: { note: formattedNote, anonymous: String(isAnonymous), userId: authenticatedUserId && !isAnonymous ? String(authenticatedUserId) : undefined } });

    res.status(200).json({
      authorizationUrl: data.authorization_url,
      reference: data.reference,
    });
  } catch (error) {
    req.log.warn({ err: error }, "Failed to initialize Paystack donation");
    res.status(500).json({ error: "Could not initialize Paystack donation" });
  }
});

async function createDonationFromPaystackData(data: any) {
  const reference = (data.reference ?? "").toString();
  const metadata = typeof data.metadata === "object" && data.metadata !== null ? data.metadata : {};
  const note = typeof metadata.note === "string" && metadata.note.trim() ? metadata.note.trim() : "Cash donation";
  const isAnonymous = metadata.anonymous === "true";
  const rawUserId = metadata.userId;
  const parsedUserId = rawUserId !== undefined && rawUserId !== null ? Number(String(rawUserId).trim()) : NaN;
  const userId = !isAnonymous && Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;

  const donationNotes = `${note} (Paystack ref: ${reference})`;
  const amount = Math.round(Number(data.amount) / 100);

  // Log metadata-derived values prior to DB insert for debugging attribution
  // eslint-disable-next-line no-console
  console.info("[donations] createDonation metadata:", { reference, metadata, note, isAnonymous, userId, donationNotes, amount });

  const [existing] = await db
    .select({ id: eventsTable.id, userId: eventsTable.userId })
    .from(eventsTable)
    .where(eq(eventsTable.notes, donationNotes))
    .limit(1);

  if (!existing) {
    await db.insert(eventsTable).values({
      type: "cash_donation",
      amount,
      userId,
      notes: donationNotes,
    });
  } else if (existing.userId === null && userId !== null) {
    await db
      .update(eventsTable)
      .set({ userId })
      .where(eq(eventsTable.id, existing.id));
  }

  return { reference, amount, donationNotes };
}

async function handleVerifyRequest(reference: string) {
  const transaction = await verifyPaystackTransaction(reference);
  // Log transaction metadata for debugging donation attribution
  try {
    // transaction.metadata can be null or object
    // Avoid circular serialization
    // eslint-disable-next-line no-console
    console.info("[donations] verify transaction metadata:", transaction.metadata);
  } catch (err) {
    // ignore
  }

  if (transaction.status !== "success") {
    throw new Error(`Paystack transaction status is ${transaction.status}`);
  }

  return createDonationFromPaystackData(transaction);
}

function normalizeFrontendUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function isCustomAppScheme(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url) && !/^https?:\/\//i.test(url);
}

function isAbsoluteUrl(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url);
}

function resolveFrontendUrls(): { appUrl: string; webUrl: string } {
  const frontendUrl = process.env["FRONTEND_URL"]?.trim();
  const expoDomain = process.env["EXPO_PUBLIC_DOMAIN"]?.trim();
  const apiBaseUrl = process.env["API_BASE_URL"]?.trim();
  const defaultWebUrl = `http://localhost:${process.env["PORT"] ?? "5001"}`;

  const appUrl = frontendUrl && isCustomAppScheme(frontendUrl)
    ? normalizeFrontendUrl(frontendUrl)
    : "cyclecare://";

  let webUrl = "";
  if (frontendUrl && !isCustomAppScheme(frontendUrl)) {
    webUrl = isAbsoluteUrl(frontendUrl)
      ? normalizeFrontendUrl(frontendUrl)
      : `http://${frontendUrl.replace(/\/+$/, "")}`;
  } else if (expoDomain) {
    webUrl = isAbsoluteUrl(expoDomain)
      ? normalizeFrontendUrl(expoDomain)
      : `http://${expoDomain.replace(/\/+$/, "")}`;
  } else if (apiBaseUrl) {
    webUrl = isAbsoluteUrl(apiBaseUrl)
      ? normalizeFrontendUrl(apiBaseUrl)
      : `http://${apiBaseUrl.replace(/\/+$/, "")}`;
  } else {
    webUrl = defaultWebUrl;
  }

  return { appUrl, webUrl };
}

router.post("/donations/verify", async (req, res): Promise<void> => {
  const { reference } = req.body as { reference?: string };

  if (!reference?.trim()) {
    res.status(400).json({ error: "Reference is required" });
    return;
  }

  try {
    const result = await handleVerifyRequest(reference.trim());
    res.status(200).json({
      message: "Donation verified",
      reference: result.reference,
      amount: result.amount,
    });
  } catch (error) {
    res.status(500).json({ error: String(error instanceof Error ? error.message : "Could not verify donation") });
  }
});

router.get("/donations/verify", async (req, res): Promise<void> => {
  const reference = typeof req.query.reference === "string" ? req.query.reference.trim() : "";

  if (!reference) {
    res.status(400).send("<h1>Missing reference</h1>");
    return;
  }

  try {
    const result = await handleVerifyRequest(reference);
    const { appUrl, webUrl } = resolveFrontendUrls();

    // Prefer webUrl when the request appears to come from a browser (has an http referer
    // or a common browser user-agent). This ensures web users are returned to the
    // frontend instead of being handed a native deep link.
    const referer = String(req.headers.referer ?? "");
    const ua = String(req.headers["user-agent"] ?? "");
    const looksLikeBrowser = /^https?:\/\//i.test(referer) || /mozilla|chrome|safari|firefox/i.test(ua);

    req.log.info({
      appUrl,
      webUrl,
      referer,
      ua,
      looksLikeBrowser,
      FRONTEND_URL: process.env.FRONTEND_URL,
      EXPO_PUBLIC_DOMAIN: process.env.EXPO_PUBLIC_DOMAIN,
    }, "Donation verify request routing");

    res.setHeader("Content-Type", "text/html");
    const successHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation confirmed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #E96C8A 0%, #d946a0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 48px 32px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.6s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .checkmark {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #E96C8A;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0); }
      to { opacity: 1; transform: scale(1); }
    }
    .checkmark::after {
      content: '✓';
      color: white;
      font-size: 48px;
      font-weight: bold;
      line-height: 1;
    }
    h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .amount {
      font-size: 32px;
      color: #E96C8A;
      font-weight: 700;
      margin: 16px 0;
    }
    .message {
      font-size: 15px;
      color: #6b7280;
      margin: 20px 0;
      line-height: 1.5;
    }
    .redirect-info {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 24px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .countdown {
      font-weight: 600;
      color: #E96C8A;
      margin-top: 12px;
    }
    .fallback-link {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 32px;
      background: #E96C8A;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .fallback-link:hover {
      background: #d946a0;
    }
    .alt-options {
      margin-top: 24px;
      font-size: 12px;
      color: #9ca3af;
    }
    .alt-options a {
      color: #E96C8A;
      text-decoration: none;
      margin: 0 8px;
      font-weight: 500;
    }
    .alt-options a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark"></div>
    <h1>Thank you for donating!</h1>
    <div class="amount">₦${result.amount}</div>
    <p class="message">Your donation helps provide menstrual health resources to those who need them most.</p>
    <div class="redirect-info">
      <div>Returning to CycleCare in <span class="countdown"><span id="countdown">5</span>s</span></div>
    </div>
    <a href="${appUrl}" class="fallback-link">Return Now</a>
    <div class="alt-options">
      If the app does not open automatically:<br>
      <a href="${appUrl}">Open App</a> · <a href="${webUrl}">Web Version</a>
    </div>
  </div>
  <script>
    let seconds = 5;
    const countdownEl = document.getElementById('countdown');
    
    function updateCountdown() {
      countdownEl.textContent = seconds;
      if (seconds <= 0) {
        window.location.href = '${appUrl}';
      } else {
        seconds--;
        setTimeout(updateCountdown, 1000);
      }
    }
    
    updateCountdown();
  </script>
</body>
</html>`;
    res.send(successHtml);
  } catch (error) {
    res.status(500).setHeader("Content-Type", "text/html");
    const errorMsg = String(error instanceof Error ? error.message : "Unable to verify transaction.");
    const errorHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 48px 32px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.6s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0); }
      to { opacity: 1; transform: scale(1); }
    }
    .icon::after {
      content: '✕';
      color: white;
      font-size: 48px;
      font-weight: bold;
      line-height: 1;
    }
    h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .message {
      font-size: 15px;
      color: #6b7280;
      margin: 20px 0;
      line-height: 1.5;
    }
    .error-detail {
      font-size: 13px;
      color: #9ca3af;
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #ef4444;
    }
    .retry-link {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 32px;
      background: #ef4444;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .retry-link:hover {
      background: #dc2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon"></div>
    <h1>Donation failed</h1>
    <p class="message">We couldn't verify your donation at this time.</p>
    <div class="error-detail">${errorMsg}</div>
    <p class="message" style="font-size: 13px;">Please try again or contact support if the problem continues.</p>
    <a href="cyclecare://" class="retry-link">Return to CycleCare</a>
  </div>
</body>
</html>`;
    res.send(errorHtml);
  }
});

router.post("/donations", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const { amount, note, anonymous } = req.body as {
    amount?: number;
    note?: string | null;
    anonymous?: boolean;
  };

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Donation amount must be a positive number" });
    return;
  }

  const formattedNote = note?.trim() || "Cash donation";
  const isAnonymous = anonymous === true;

  try {
    await db.insert(eventsTable).values({
      type: "cash_donation",
      amount: Math.round(amount),
      userId: isAnonymous ? null : userId,
      notes: formattedNote,
    });
  } catch (error) {
    req.log.warn({ err: error }, "Failed to create cash donation event");
    res.status(500).json({ error: "Could not record donation" });
    return;
  }

  req.log.info({ userId: isAnonymous ? null : userId, amount, anonymous: isAnonymous }, "Cash donation recorded");
  res.status(201).json({ message: "Donation received" });
});

export default router;
