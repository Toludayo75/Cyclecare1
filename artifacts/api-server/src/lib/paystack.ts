/// <reference lib="dom" />

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env["PAYSTACK_SECRET_KEY"]?.trim() ?? "";

function getPaystackSecretKey(): string {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured. Set PAYSTACK_SECRET_KEY in your environment.");
  }
  return PAYSTACK_SECRET_KEY;
}

export interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  domain: string;
  metadata: Record<string, string> | null;
}

export async function initializePaystackTransaction(options: {
  email: string;
  amount: number;
  callbackUrl: string;
  metadata?: Record<string, string>;
}): Promise<PaystackInitializeResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: options.email,
      amount: options.amount,
      currency: "NGN",
      callback_url: options.callbackUrl,
      metadata: options.metadata,
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || "Failed to initialize Paystack transaction");
  }

  return payload.data as PaystackInitializeResponse;
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || "Failed to verify Paystack transaction");
  }

  return payload.data as PaystackVerifyResponse;
}
