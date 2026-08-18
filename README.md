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
connects the site to `blabb.co`; DNS must point the apex domain to GitHub Pages
and `www` to `josephminh.github.io`.

Cloudflare records (set all to **DNS only** while GitHub provisions HTTPS):

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

After DNS resolves and GitHub issues the certificate, enable **Enforce HTTPS** under **Settings → Pages**.
