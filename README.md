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

