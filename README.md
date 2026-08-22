# Blabb.co

The official landing page for Blabb, private offline voice typing for Android.

## Local preview

Install the pinned dependencies and run the Vite development server:

```bash
npm install
npm run dev
```

Then open `http://localhost:4174`. The production bundle is generated with
`npm run build`; `npm run check` runs the static checks and `npm run test:e2e`
runs the Playwright browser suite.

## Deployment

The Pages workflow builds `dist/` from the `main` branch. The `CNAME` file
connects the site to `blabb.co`; DNS points the apex domain to GitHub Pages and
`www` to `josephminh.github.io`. Cloudflare proxies those records so the
waitlist Worker can own only `/api/waitlist` while GitHub Pages continues to
serve the rest of the site.

Cloudflare records:

| Type | Name | Content |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `josephminh.github.io` |

After DNS resolves and GitHub issues the certificate, enable **Enforce HTTPS**
under **Settings → Pages**, then proxy the records through Cloudflare.

## Waitlist endpoint

The public form posts to a small Cloudflare Worker at `/api/waitlist`. The
Worker uses EmailOctopus API v2 to upsert the contact into list
`bd0d892a-9d96-11f1-8699-cfcba896278d` with these tags:

- every request: `source_blabb_waitlist`
- Android: `platform_android`
- iPhone: `platform_ios`

The upsert intentionally omits contact status. New contacts therefore follow
the list's double opt-in setting, while an existing unsubscribe is preserved.
EmailOctopus credentials never enter the browser or repository.

To deploy the endpoint:

```bash
npx wrangler login
npx wrangler secret put EMAILOCTOPUS_API_KEY
npm run worker:deploy
```

Enter the EmailOctopus API key only at Wrangler's private prompt. Do not put it
in a file, command argument, issue, commit, or chat message. Deploy the Worker
before publishing a form change that depends on it.

The Worker validates the origin and request body, silently catches the form
honeypot, limits each client to six submissions per minute, and does not log
submitted addresses. Review EmailOctopus tracking when creating each future
campaign or automation. If optional tracking is enabled, update the public
privacy policy before sending.
