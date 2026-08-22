import assert from "node:assert/strict";
import { handleRequest } from "../worker/waitlist.js";

function environment(overrides = {}) {
  return {
    EMAILOCTOPUS_API_KEY: "test-secret",
    EMAILOCTOPUS_LIST_ID: "bd0d892a-9d96-11f1-8699-cfcba896278d",
    ALLOWED_ORIGINS: "https://blabb.co,https://www.blabb.co",
    WAITLIST_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ...overrides
  };
}

function signupRequest(body, headers = {}) {
  return new Request("https://blabb.co/api/waitlist", {
    method: "POST",
    headers: {
      origin: "https://blabb.co",
      accept: "application/json",
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

async function check(name, callback) {
  await callback();
  console.log(`Waitlist worker check passed: ${name}`);
}

await check("Android API v2 upsert", async () => {
  let upstream;
  globalThis.fetch = async (url, options) => {
    upstream = { url, options };
    return new Response(JSON.stringify({ id: "contact-id", status: "pending" }), { status: 200 });
  };

  const response = await handleRequest(signupRequest({
    email: " Person@Example.com ",
    platform: "android",
    website: ""
  }), environment());

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(upstream.url, "https://api.emailoctopus.com/lists/bd0d892a-9d96-11f1-8699-cfcba896278d/contacts");
  assert.equal(upstream.options.method, "PUT");
  assert.equal(upstream.options.headers.authorization, "Bearer test-secret");
  assert.deepEqual(JSON.parse(upstream.options.body), {
    email_address: "person@example.com",
    tags: {
      source_blabb_waitlist: true,
      platform_android: true
    }
  });
  assert.equal("status" in JSON.parse(upstream.options.body), false);
});

await check("iPhone tag merge", async () => {
  let body;
  globalThis.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return new Response("{}", { status: 200 });
  };

  const response = await handleRequest(signupRequest({ email: "person@example.com", platform: "ios" }), environment());
  assert.equal(response.status, 200);
  assert.deepEqual(body.tags, { source_blabb_waitlist: true, platform_ios: true });
  assert.equal(body.status, undefined);
});

await check("honeypot", async () => {
  globalThis.fetch = async () => assert.fail("Honeypot submission reached EmailOctopus");
  const response = await handleRequest(signupRequest({
    email: "bot@example.com",
    platform: "android",
    website: "filled"
  }), environment());
  assert.equal(response.status, 200);
});

await check("invalid input", async () => {
  globalThis.fetch = async () => assert.fail("Rejected submission reached EmailOctopus");
  const response = await handleRequest(signupRequest({ email: "not-an-email", platform: "android" }), environment());
  assert.equal(response.status, 400);
});

await check("foreign origin", async () => {
  globalThis.fetch = async () => assert.fail("Rejected submission reached EmailOctopus");
  const response = await handleRequest(signupRequest(
    { email: "person@example.com", platform: "android" },
    { origin: "https://attacker.example" }
  ), environment());
  assert.equal(response.status, 403);
});

await check("rate limit", async () => {
  globalThis.fetch = async () => assert.fail("Rejected submission reached EmailOctopus");
  const response = await handleRequest(signupRequest(
    { email: "person@example.com", platform: "android" },
    { "cf-connecting-ip": "192.0.2.1" }
  ), environment({ WAITLIST_RATE_LIMITER: { limit: async () => ({ success: false }) } }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
});

await check("provider error", async () => {
  globalThis.fetch = async () => new Response("provider detail", { status: 503 });
  const response = await handleRequest(signupRequest({ email: "person@example.com", platform: "android" }), environment());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false, message: "The waitlist provider is temporarily unavailable." });
});

await check("no-script redirect", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  const request = new Request("https://blabb.co/api/waitlist", {
    method: "POST",
    headers: {
      origin: "https://blabb.co",
      accept: "text/html",
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ email: "person@example.com", platform: "android", website: "" })
  });
  const response = await handleRequest(request, environment());
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/waitlist-received/");
});
