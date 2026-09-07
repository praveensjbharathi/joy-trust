import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type IntakeBody = Record<string, unknown> & {
  kind?: "donation" | "support";
  website?: string;
};

const defaultOrigins = [
  "https://joysocialwelfaretrust.com",
  "https://www.joysocialwelfaretrust.com",
  "https://joy-social-welfare-trust.praveen-red-07.chatgpt.site"
];

const configuredOrigins = Deno.env.get("ALLOWED_ORIGINS")
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins?.length ? configuredOrigins : defaultOrigins);

const readKey = (name: string): string => {
  const raw = Deno.env.get(name);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const publishableKey = readKey("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
const secretKey = readKey("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cleanText = (value: unknown, maxLength: number): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

const isPhone = (value: string): boolean =>
  /^[+()\-\s0-9]{7,40}$/.test(value);

const headersFor = (origin: string): HeadersInit => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
  "Cache-Control": "no-store"
});

const json = (origin: string, status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), { status, headers: headersFor(origin) });

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!allowedOrigins.has(origin)) {
    return new Response("Origin not allowed", { status: 403 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headersFor(origin) });
  }

  if (request.method !== "POST") {
    return json(origin, 405, { error: "Method not allowed" });
  }

  if (!supabaseUrl || !secretKey || !publishableKey) {
    return json(origin, 503, { error: "Form service is not configured" });
  }

  if (request.headers.get("apikey") !== publishableKey) {
    return json(origin, 401, { error: "Invalid public key" });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 16_000) {
    return json(origin, 413, { error: "Request is too large" });
  }

  let body: IntakeBody;
  try {
    body = await request.json();
  } catch {
    return json(origin, 400, { error: "Invalid request" });
  }

  // Quietly accept automated submissions that fill the hidden honeypot.
  if (cleanText(body.website, 120)) {
    return json(origin, 202, { accepted: true });
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    if (body.kind === "donation") {
      const name = cleanText(body.name, 120);
      const email = cleanText(body.email, 254).toLowerCase();
      const phone = cleanText(body.phone, 40);
      const purpose = cleanText(body.purpose, 120);
      const amountText = cleanText(body.amount, 20);
      const amount = amountText ? Number(amountText) : null;
      const message = cleanText(body.message, 1000);

      if (name.length < 2 || !isEmail(email) || purpose.length < 3) {
        return json(origin, 422, { error: "Please check the required donation fields" });
      }
      if (phone && !isPhone(phone)) {
        return json(origin, 422, { error: "Please enter a valid phone number" });
      }
      if (amount !== null && (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)) {
        return json(origin, 422, { error: "Please enter a valid intended amount" });
      }

      const { error } = await admin.from("donation_enquiries").insert({
        name,
        email,
        phone: phone || null,
        purpose,
        amount_inr: amount,
        message: message || null,
        source_page: cleanText(body.source_page, 200) || null
      });
      if (error) throw error;
    } else if (body.kind === "support") {
      const name = cleanText(body.name, 120);
      const phone = cleanText(body.phone, 40);
      const email = cleanText(body.email, 254).toLowerCase();
      const location = cleanText(body.location, 160);
      const supportType = cleanText(body.support_type, 120);
      const urgency = cleanText(body.urgency, 80);
      const requirement = cleanText(body.requirement, 300);
      const situation = cleanText(body.situation, 1500);

      if (
        name.length < 2 ||
        !isPhone(phone) ||
        location.length < 2 ||
        supportType.length < 3 ||
        urgency.length < 3 ||
        situation.length < 40
      ) {
        return json(origin, 422, { error: "Please check the required support-request fields" });
      }
      if (email && !isEmail(email)) {
        return json(origin, 422, { error: "Please enter a valid email address" });
      }

      const { error } = await admin.from("support_requests").insert({
        name,
        phone,
        email: email || null,
        location,
        support_type: supportType,
        urgency,
        estimated_requirement: requirement || null,
        situation,
        source_page: cleanText(body.source_page, 200) || null
      });
      if (error) throw error;
    } else {
      return json(origin, 422, { error: "Unknown request type" });
    }

    return json(origin, 202, { accepted: true });
  } catch (error) {
    console.error("JOY intake write failed", error instanceof Error ? error.message : "unknown error");
    return json(origin, 500, { error: "The request could not be saved" });
  }
});

