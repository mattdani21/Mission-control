/**
 * Round-3 verification: run the app's own QA gate (visionQaImage, exact
 * production prompt) N times against a local PNG and print per-run verdicts.
 * Usage: npx tsx scripts/verify-champagne-r3.mts <asset> <runs> [label] [minPass]
 * Exit 1 if passes < minPass (default: all runs must pass).
 * IMAGE_QA_MODEL env selects the vision model (default: gemini-3.5-flash).
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { visionQaImage } from "../lib/imagegen";

const ASSETS_DIR = resolve(import.meta.dirname, "../public/assets");
const [asset, runsArg, label = "", minPassArg] = process.argv.slice(2);
const runs = Number(runsArg ?? "1");
const minPass = minPassArg ? Number(minPassArg) : runs;

const googleKey = process.env.GOOGLE_API_KEY;
if (!googleKey) {
  console.error("GOOGLE_API_KEY required");
  process.exit(2);
}

const buf = await readFile(join(ASSETS_DIR, asset));
const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
const model = process.env.IMAGE_QA_MODEL ?? "gemini-3.5-flash";
console.log(`verifying ${asset} (${buf.length} B) with ${model} ${label ? `[${label}]` : ""} (need >=${minPass}/${runs} PASS)`);

let passed = 0;
for (let i = 1; i <= runs; i++) {
  const verdict = await visionQaImage(dataUrl, googleKey);
  const mark = verdict.passed ? "PASS" : "FAIL";
  console.log(`run ${i}/${runs}: ${mark} — ${verdict.reason}`);
  if (verdict.passed) passed++;
}
if (passed < minPass) {
  console.error(`only ${passed}/${runs} runs PASSED (need ${minPass})`);
  process.exit(1);
}
console.log(`ACCEPTED: ${passed}/${runs} runs PASS (${model})`);
