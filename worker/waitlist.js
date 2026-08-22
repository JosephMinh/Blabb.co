const EMAILOCTOPUS_API = "https://api.emailoctopus.com";
const PLATFORM_TAGS = {
  android: "platform_android",
  ios: "platform_ios"
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function wantsHtml(request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

function successResponse(request) {
  if (wantsHtml(request)) {
    return new Response(null, {
      status: 303,
      headers: {
        location: "/waitlist-received/",
        "cache-control": "no-store"
      }
    });
  }
  return jsonResponse({ ok: true });
}

function errorResponse(request, status, message, extraHeaders = {}) {
  if (!wantsHtml(request)) return jsonResponse({ ok: false, message }, status, extraHeaders);

  const safeMessage = status === 429
    ? "Too many signup attempts. Please wait a minute and try again."
    : "That signup did not go through. Please return to Blabb and try again in a moment.";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Blabb waitlist</title><body style="margin:0;padding:3rem;background:#fffaff;color:#170a1c;font:700 1.1rem/1.6 system-ui"><main style="max-width:38rem;margin:auto"><h1 style="font-size:2.5rem">Try that again.</h1><p>${safeMessage}</p><p><a href="https://blabb.co/#waitlist" style="color:#170a1c">Return to the waitlist</a></p></main></body></html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

function allowedOrigins(env) {
  return new Set(String(env.ALLOWED_ORIGINS || "https://blabb.co,https://www.blabb.co")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean));
}

async function readPayload(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) throw new Error("PAYLOAD_TOO_LARGE");

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return request.json();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  throw new Error("UNSUPPORTED_MEDIA_TYPE");
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function upsertContact(env, email, platform) {
  const response = await fetch(`${EMAILOCTOPUS_API}/lists/${encodeURIComponent(env.EMAILOCTOPUS_LIST_ID)}/contacts`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${env.EMAILOCTOPUS_API_KEY}`,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      email_address: email,
      tags: {
        source_blabb_waitlist: true,
        [PLATFORM_TAGS[platform]]: true
      }
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) throw new Error(`EMAIL_PROVIDER_${response.status}`);
}

export async function handleRequest(request, env) {
  if (request.method !== "POST") {
    return errorResponse(request, 405, "Method not allowed.", { allow: "POST" });
  }

  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins(env).has(origin)) {
    return errorResponse(request, 403, "Request origin not allowed.");
  }

  if (!env.EMAILOCTOPUS_API_KEY || !env.EMAILOCTOPUS_LIST_ID) {
    return errorResponse(request, 503, "Waitlist service is not configured.");
  }

  let payload;
  try {
    payload = await readPayload(request);
  } catch (error) {
    if (error.message === "PAYLOAD_TOO_LARGE") return errorResponse(request, 413, "Request too large.");
    if (error.message === "UNSUPPORTED_MEDIA_TYPE") return errorResponse(request, 415, "Unsupported request format.");
    return errorResponse(request, 400, "Invalid request.");
  }

  // Quietly accept honeypot submissions without contacting EmailOctopus.
  if (String(payload.website || "").trim()) return successResponse(request);

  const email = String(payload.email || "").trim().toLowerCase();
  const platform = String(payload.platform || "").trim().toLowerCase();
  if (!validEmail(email) || !PLATFORM_TAGS[platform]) {
    return errorResponse(request, 400, "Enter a valid email and choose a platform.");
  }

  if (env.WAITLIST_RATE_LIMITER) {
    const clientKey = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.WAITLIST_RATE_LIMITER.limit({ key: `waitlist:${clientKey}` });
    if (!success) return errorResponse(request, 429, "Please wait a minute and try again.", { "retry-after": "60" });
  }

  try {
    // Omitting status preserves an existing unsubscribe and lets the list's
    // double opt-in setting place new contacts in pending status.
    await upsertContact(env, email, platform);
    return successResponse(request);
  } catch {
    return errorResponse(request, 502, "The waitlist provider is temporarily unavailable.");
  }
}

export default {
  fetch: handleRequest
};
