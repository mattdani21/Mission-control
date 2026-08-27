/**
 * Independent gate re-verification of the regenerated hero assets.
 * Uses the app's OWN visionQaImage (exact production QA prompt + gate
 * model gemini-3.5-flash) against the PNGs on disk. Prints the actual
 * verdict per asset. Exit 1 if any asset FAILs.
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { visionQaImage } from "../lib/imagegen";

const ASSETS_DIR = resolve(import.meta.dirname, "../public/assets");
const targets = ["look-emerald.png", "look-champagne.png", "look-chocolate.png"];

const googleKey = process.env.GOOGLE_API_KEY;
if (!googleKey) {
  console.error("GOOGLE_API_KEY required");
  process.exit(2);
}

let failed = 0;
for (const name of targets) {
  const path = join(ASSETS_DIR, name);
  const buf = await readFile(path);
  const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  const verdict = await visionQaImage(dataUrl, googleKey);
  const mark = verdict.passed ? "PASS" : "FAIL";
  console.log(`${name} (${buf.length} bytes): ${mark} — ${verdict.reason}`);
  if (!verdict.passed) failed++;
}
if (failed > 0) {
  console.error(`${failed} asset(s) FAILED the gate`);
  process.exit(1);
}
console.log("all assets PASS the production QA gate");
