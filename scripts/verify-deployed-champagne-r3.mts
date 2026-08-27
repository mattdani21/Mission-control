/**
 * Round-3 verification against DEPLOYED champagne bytes (fetched over HTTPS),
 * using the app's own visionQaImage (exact production QA prompt). Prints
 * per-run verdicts. Usage:
 *   npx tsx scripts/verify-deployed-champagne-r3.mts <runs> [minPass] [label]
 * Exit 1 if passes < minPass (default: all must pass).
 * IMAGE_QA_MODEL env selects the vision model (default: gemini-3.5-flash).
 */
import { visionQaImage } from "../lib/imagegen";

const BASE = "https://mission-control-web-production-3bf6.up.railway.app";
const [runsArg, minPassArg, label = ""] = process.argv.slice(2);
const runs = Number(runsArg ?? "1");
const minPass = minPassArg ? Number(minPassArg) : runs;

const googleKey = process.env.GOOGLE_API_KEY;
if (!googleKey) {
  console.error("GOOGLE_API_KEY required");
  process.exit(2);
}

const res = await fetch(`${BASE}/assets/look-champagne.png`);
if (!res.ok) {
  console.error(`deployed asset: HTTP ${res.status}`);
  process.exit(2);
}
const buf = Buffer.from(await res.arrayBuffer());
const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
const model = process.env.IMAGE_QA_MODEL ?? "gemini-3.5-flash";
console.log(`verifying DEPLOYED champagne (${buf.length} B) with ${model} ${label ? `[${label}]` : ""} (need >=${minPass}/${runs} PASS)`);

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
console.log(`ACCEPTED: ${passed}/${runs} runs PASS (${model}) on deployed bytes`);
