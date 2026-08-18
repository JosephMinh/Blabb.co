# Blabb.co

The official landing page for [Blabb](https://github.com/JosephMinh/Blabb), private offline voice typing for Android.

## Local preview

The site is dependency-free. Serve the repository root with any static server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deployment

GitHub Pages publishes the `main` branch. The `CNAME` file connects the site to `blabb.co`; DNS must point the apex domain to GitHub Pages and `www` to `josephminh.github.io`.

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
