/**
 * Regenerate hero/lookbook gallery images through the QA-gated hero tier.
 *
 * Reads prompts from the Envogue lookbook prompt library, generates each
 * hero through lib/imagegen.ts generateHeroImage (gemini-3-pro-image +
 * hand-safe suffix + vision-QA gate, up to 3 attempts), and writes the
 * QA-passed result to public/assets/look-<key>.png. Throws on QA failure —
 * the asset is not touched.
 *
 * Usage:
 *   LOOKBOOK_LIBRARY=~/Empyrean/envogue/05_LOOKBOOK_PROMPT_LIBRARY.md \
 *     npx tsx scripts/regenerate-heroes.mts emerald=1 champagne=13 chocolate=17
 *
 * Env: GOOGLE_API_KEY (required — hero tier + QA gate), LOG_LEVEL.
 */
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { generateHeroImage } from "../lib/imagegen";

const LIBRARY_DEFAULT = join(homedir(), "Empyrean/envogue/05_LOOKBOOK_PROMPT_LIBRARY.md");
const ASSETS_DIR = resolve(import.meta.dirname, "../public/assets");

function extractPrompts(libraryPath: string): Map<string, string> {
  const text = readFileSync(libraryPath, "utf8");
  const prompts = new Map<string, string>();
  const re = /^(\d+)\.\s+`([^`]+)`/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    prompts.set(m[1], m[2]);
  }
  return prompts;
}

async function main(): Promise<void> {
  const spec = process.argv.slice(2);
  if (spec.length === 0) {
    console.error("usage: npx tsx scripts/regenerate-heroes.mts <key>=<promptNumber> …");
    process.exit(2);
  }
  const libraryPath = process.env.LOOKBOOK_LIBRARY ?? LIBRARY_DEFAULT;
  const prompts = extractPrompts(libraryPath);
  if (prompts.size === 0) {
    console.error(`no prompts found in ${libraryPath}`);
    process.exit(2);
  }

  for (const pair of spec) {
    const eq = pair.indexOf("=");
    if (eq <= 0) {
      console.error(`bad spec: ${pair} (want key=promptNumber)`);
      process.exit(2);
    }
    const key = pair.slice(0, eq);
    const num = pair.slice(eq + 1);
    const prompt = prompts.get(num);
    if (!prompt) {
      console.error(`prompt #${num} not found in library`);
      process.exit(2);
    }

    process.stdout.write(`[${key}] generating prompt #${num} via hero tier…\n`);
    const result = await generateHeroImage(prompt);
    if (!result.qa?.passed) {
      console.error(`[${key}] QA gate did not pass — asset NOT written`);
      process.exit(1);
    }

    // Data URL → bytes. Gallery assets are referenced as look-<key>.png, so
    // JPEG output is converted to PNG via macOS sips (keeps URLs stable).
    const match = result.image.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
      console.error(`[${key}] unexpected result shape`);
      process.exit(1);
    }
    const mime = match[1] as string;
    const bytes = Buffer.from(match[2] as string, "base64");
    const out = join(ASSETS_DIR, `look-${key}.png`);
    if (mime === "image/jpeg") {
      const tmp = join(ASSETS_DIR, `.look-${key}.jpg`);
      await writeFile(tmp, bytes);
      const { execFileSync } = await import("node:child_process");
      execFileSync("/usr/bin/sips", ["-s", "format", "png", tmp, "--out", out], {
        stdio: "pipe",
      });
      const { rm } = await import("node:fs/promises");
      await rm(tmp, { force: true });
    } else {
      await writeFile(out, bytes);
    }
    console.log(
      `[${key}] wrote ${out} (${bytes.length} bytes raw ${mime}, QA attempts: ${result.qa.attempts})`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
