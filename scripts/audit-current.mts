// Validate the strict audit against the CURRENT assets (must FAIL them).
import { audit } from "./strict-audit-lib.mts";

const zones = {
  emerald: [200, 500, 928, 1152],
  champagne: [0, 450, 928, 1152],
  chocolate: [0, 400, 928, 1152],
};
for (const key of ["emerald", "champagne", "chocolate"]) {
  const res = await audit(`public/assets/look-${key}.png`, zones[key]);
  console.log(`${key}: ${res.ok ? "PASS" : "FAIL"} -> ${res.results.map((r) => `${r.name}:${r.passed ? "P" : "F"}`).join(" ")}`);
  for (const r of res.results) if (!r.passed) console.log(`   ${r.name}: ${r.reason.slice(0, 140)}`);
}
