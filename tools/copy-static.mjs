import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
for (const file of ["CNAME", "robots.txt", "sitemap.xml", ".nojekyll"]) {
  await copyFile(file, `dist/${file}`);
}

await mkdir("dist/assets", { recursive: true });
await copyFile("assets/og.png", "dist/assets/og.png");
