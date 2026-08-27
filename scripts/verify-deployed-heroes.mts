/**
 * Gate verification against the DEPLOYED assets (fetched over HTTPS),
 * using the app's own visionQaImage (exact production QA prompt +
 * gate model). Prints the actual verdict per deployed asset.
 */
import { visionQaImage } from "../lib/imagegen";

const BASE = "https://mission-control-web-production-3bf6.up.railway.app";
const targets = ["look-emerald.png", "look-champagne.png", "look-chocolate.png", "look-burgundy.png"];

const googleKey = process.env.GOOGLE_API_KEY;
if (!googleKey) {
  console.error("GOOGLE_API_KEY required");
  process.exit(2);
}

let failed = 0;
for (const name of targets) {
  const res = await fetch(`${BASE}/assets/${name}`);
  if (!res.ok) {
    console.error(`${name}: HTTP ${res.status} — cannot verify`);
    failed++;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  const verdict = await visionQaImage(dataUrl, googleKey);
  const mark = verdict.passed ? "PASS" : "FAIL";
  console.log(`${name} (deployed, ${buf.length} bytes): ${mark} — ${verdict.reason}`);
  if (!verdict.passed) failed++;
}
if (failed > 0) {
  console.error(`${failed} deployed asset(s) FAILED the gate`);
  process.exit(1);
}
console.log("all deployed assets PASS the production QA gate");
