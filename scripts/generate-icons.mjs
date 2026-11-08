import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join(process.cwd(), "public", "icons");
await mkdir(outDir, { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f2e1e"/>
  <text x="256" y="300" font-size="220" text-anchor="middle">🎄</text>
</svg>
`;

for (const size of [192, 512]) {
  const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(join(outDir, `icon-${size}.png`), buffer);
}

console.log("Icons written to public/icons/");
