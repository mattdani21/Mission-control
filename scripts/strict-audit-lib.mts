// Shared strict-audit library: full-image gate + 2x band gates + hands-zone gate.
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

import sharp from "sharp";
import { visionQaImage } from "../lib/imagegen";

const TMP = "/tmp/strict-regen";
const { mkdirSync } = await import("node:fs");
mkdirSync(TMP, { recursive: true });

export async function gateOnFile(path: string): Promise<{ passed: boolean; reason: string }> {
  const buf = readFileSync(path);
  const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  return visionQaImage(dataUrl, process.env.GOOGLE_API_KEY!);
}

export async function audit(
  path: string,
  zone: [number, number, number, number],
): Promise<{
  ok: boolean;
  results: Array<{ name: string; passed: boolean; reason: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; reason: string }> = [];
  const full = await gateOnFile(path);
  results.push({ name: "full", ...full });
  const meta = await sharp(path).metadata();
  const w = meta.width!, h = meta.height!;

  const bands: Array<[string, number, number]> = [
    ["top", 0, Math.floor(h / 3)],
    ["mid", Math.floor(h / 3), Math.floor((2 * h) / 3)],
    ["bot", Math.floor((2 * h) / 3), h],
  ];
  for (const [name, y1, y2] of bands) {
    const crop = await sharp(path)
      .extract({ left: 0, top: y1, width: w, height: y2 - y1 })
      .resize(w * 2, (y2 - y1) * 2, { kernel: "lanczos3" })
      .png()
      .toBuffer();
    const tmp = `${TMP}/band-${name}.png`;
    await writeFile(tmp, crop);
    const v = await gateOnFile(tmp);
    results.push({ name: `band-${name}`, ...v });
  }
  const [zx1, zy1, zx2, zy2] = zone;
  const zcrop = await sharp(path)
    .extract({ left: zx1, top: zy1, width: zx2 - zx1, height: zy2 - zy1 })
    .resize((zx2 - zx1) * 2, (zy2 - zy1) * 2, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  const ztmp = `${TMP}/zone.png`;
  await writeFile(ztmp, zcrop);
  const zv = await gateOnFile(ztmp);
  results.push({ name: "zone", ...zv });

  return { ok: results.every((r) => r.passed), results };
}
