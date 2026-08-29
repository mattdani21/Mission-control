/**
 * Strict regeneration driver: regenerate hero images through the gated
 * pipeline (gemini-3-pro-image + hand-safe suffix + production QA gate),
 * then apply an ADDITIONAL zoom audit before accepting a candidate:
 *
 *   - full image gate (production visionQaImage)
 *   - 2x-upscaled full-width bands: top / mid / bottom
 *   - 2x-upscaled hands zone (waist-down full width for these compositions)
 *
 * Only a candidate passing ALL checks is written to public/assets/look-<key>.png.
 * Exits 1 without touching the asset if no candidate passes after MAX_CANDIDATES.
 *
 * Usage: GOOGLE_API_KEY=... npx tsx scripts/strict-regenerate.mts emerald=1 champagne=13 chocolate=17
 */
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import sharp from "sharp";
import { generateHeroImage } from "../lib/imagegen";
import { audit } from "./strict-audit-lib.mts";

const LIBRARY_DEFAULT = join(homedir(), "Empyrean/envogue/05_LOOKBOOK_PROMPT_LIBRARY.md");
const ASSETS_DIR = resolve(import.meta.dirname, "../public/assets");
const TMP = "/tmp/strict-regen";
const MAX_CANDIDATES = 5;

// Hands zone per hero: generous full-width region where hands sit in these
// compositions (waist down for standing shots, lower two-thirds for seated).
const HANDS_ZONES: Record<string, [number, number, number, number]> = {
  emerald: [200, 500, 928, 1152],
  champagne: [0, 450, 928, 1152],
  chocolate: [0, 400, 928, 1152],
};

function extractPrompts(libraryPath: string): Map<string, string> {
  const text = readFileSync(libraryPath, "utf8");
  const prompts = new Map<string, string>();
  const re = /^(\d+)\.\s+`([^`]+)`/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) prompts.set(m[1], m[2]);
  return prompts;
}

async function main(): Promise<void> {
  const spec = process.argv.slice(2);
  if (spec.length === 0) {
    console.error("usage: npx tsx scripts/strict-regenerate.mts <key>=<promptNumber> …");
    process.exit(2);
  }
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY required");
    process.exit(2);
  }
  const libraryPath = process.env.LOOKBOOK_LIBRARY ?? LIBRARY_DEFAULT;
  const prompts = extractPrompts(libraryPath);

  for (const pair of spec) {
    const eq = pair.indexOf("=");
    const key = pair.slice(0, eq);
    const prompt = prompts.get(pair.slice(eq + 1));
    if (!prompt) {
      console.error(`prompt spec not found: ${pair}`);
      process.exit(2);
    }
    const zone = HANDS_ZONES[key] ?? ([0, 0, 928, 1152] as [number, number, number, number]);
    let accepted = false;
    for (let c = 1; c <= MAX_CANDIDATES && !accepted; c++) {
      process.stdout.write(`[${key}] candidate ${c}/${MAX_CANDIDATES}…\n`);
      let result;
      try {
        result = await generateHeroImage(prompt);
      } catch (err) {
        console.error(`[${key}] candidate ${c}: pipeline threw: ${err instanceof Error ? err.message : err}`);
        continue;
      }
      const mimeMatch = result.image.match(/^data:([^;]+);base64,(.*)$/);
      if (!mimeMatch) throw new Error("unexpected result shape");
      const bytes = Buffer.from(mimeMatch[2], "base64");
      const candPath = `${TMP}/${key}-c${c}.png`;
      await writeFile(candPath, await sharp(bytes).png().toBuffer());
      const auditRes = await audit(candPath, zone);
      const fails = auditRes.results.filter((r) => !r.passed);
      process.stdout.write(
        `[${key}] candidate ${c}: model=${result.model} qaAttempts=${result.qa?.attempts} ` +
          `audit=${auditRes.ok ? "PASS" : "FAIL"} (${fails.map((f) => `${f.name}: ${f.reason.slice(0, 60)}`).join(" | ") || "all pass"})\n`,
      );
      if (auditRes.ok) {
        const out = join(ASSETS_DIR, `look-${key}.png`);
        await writeFile(out, bytes);
        console.log(`[${key}] ACCEPTED -> ${out} (${bytes.length} bytes, candidate ${c}, model ${result.model})`);
        accepted = true;
      }
    }
    if (!accepted) {
      console.error(`[${key}] NO candidate passed the strict audit after ${MAX_CANDIDATES} — asset NOT touched`);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
