/**
 * Slot templates — Mission Control as a multi-brand template engine.
 *
 * Each slot is one BRAND / product the operator wants to market (Envogue,
 * Tessera, …). The dashboard toggle switches the entire context:
 * brand, goals per time scale, capture calendar, pipeline, queue, caption
 * bank and gallery — same underlying structure for every brand.
 *
 * Adding a brand = drop a new SlotConfig in SLOTS (copy an existing slot,
 * swap the data) — no UI changes needed.
 *
 * Seeded from real package data where it exists:
 *   - envogue:  Envogue × Empyrean Dance Countdown 2026 (live) — the reference
 *   - tessera:  Tessera AI employees (shinji $24k pilot → $96k/yr; Model Gate;
 *               deepkimi) — B2B pilot → ARR engine
 * Tessera goals/pipeline are seeded from known facts; refine per quarter.
 */

import type {
  CampRow,
  DecisionEntry,
  GalleryItem,
  Goal,
  PipeCard,
  QueueEntry,
  ReportEntry,
  TimeScale,
  WindowRow,
} from "./mission-data";

export type SlotId = "envogue" | "tessera" | "decile" | "itrain" | "gapos" | "empyrean";

export interface CaptionEntry {
  name: string;
  text: string;
}

/** A brand/product inside a multi-product company (e.g. Tessera: shinji,
 *  Model Gate, deepkimi). Shares the company's strategy + logo; owns its
 *  goals, calendar, pipeline, queue and gallery. */
export interface ProductSlot {
  id: string;
  label: string;
  name: string;
  tagline: string;
  composerDefault: string;
  defaultPrompt: string;
  goals: Record<TimeScale, Goal[]>;
  windows: WindowRow[];
  camps: CampRow[];
  pipe: Record<string, PipeCard[]>;
  queue: QueueEntry[];
  captionBank: CaptionEntry[];
  gallery: GalleryItem[];
}

export interface SlotConfig {
  id: SlotId;
  label: string;
  brandName: string;
  /** Header logo asset (per-brand). */
  logo: string;
  /** Brand accent color (hex) — drives seg active, KPI bar, chips, buttons. */
  accent: string;
  tagline: string;
  composerDefault: string;
  defaultPrompt: string;
  /** Company Strat — goals for the company. Human view, editable; grounds AI agents. */
  companyStrat: string;
  /** Brand Strategy — researched strategy tied to company goals. Human view, editable; grounds AI agents. */
  brandStrategy: string;
  timeContext: Record<TimeScale, string>;
  calHint: Record<TimeScale, string>;
  goals: Record<TimeScale, Goal[]>;
  windows: WindowRow[];
  camps: CampRow[];
  pipe: Record<string, PipeCard[]>;
  queue: QueueEntry[];
  captionBank: CaptionEntry[];
  gallery: GalleryItem[];
  /** Multi-product companies expose a product toggle instead of ALL/CLIENT/PERSONAL. */
  products?: ProductSlot[];
  /** Campaign brain memory — recorded decisions + dated channel reports. */
  decisions?: DecisionEntry[];
  reports?: ReportEntry[];
}

const GENERIC_PROMPT =
  "Editorial fashion photograph, elegant evening gown, South African model, golden hour on Camps Bay beach, Vogue editorial style, full body, natural relaxed hands with five visible fingers";

/* ──────────────────── ENVOGUE — Dance Countdown 2026 ──────────────────── */

const ENVOGUE: SlotConfig = {
  id: "envogue",
  label: "ENVOGUE",
  brandName: "Envogue",
  logo: "/assets/envogue-logo.jpg",
  accent: "#D4A44C",
  tagline: "Empyrean Consult · plan the year · capture the market · publish everywhere",
  composerDefault:
    "The corseted column is the matric look of 2026. Book before 30 September and alterations are on us. Sizes 34–42. First choice goes to the first to book.",
  defaultPrompt: GENERIC_PROMPT,
  companyStrat:
    "R100k gross revenue per peak season (dance countdown Q4). Zero cold ad spend — warm retargeting only. R25k budget cap per campaign. Founder approves all spend, outreach and publishing. Every campaign must build the case study that prices the next engagement.",
  brandStrategy:
    "Book Your Dance — first choice goes to the first to book. Audience: matric girls + moms (free distribution: school WhatsApp + TikTok). Format spine: 15s Try-On Tuesday reels (hanger → twirl → verdict). First action: R500 deposit via pre-filled WhatsApp, 30 Sep alterations deadline. Stars: 2 Hero Girls (real customers) amplified weekly. AI lookbooks sell the dream, UGC proves the truth — never mixed in one frame.",
  timeContext: {
    year: "Planning horizon · Sep 2026–Aug 2027 · Dance Countdown LIVE → Matric 2027 First Pick",
    quarter: "Q4 2026 · Sep–Nov · Dance Countdown — the live season",
    month: "Sep 2026 · Dance Countdown · LIVE NOW",
    week: "This week · Wk 1 · urgency relaunch",
    day: "Today · capture window LIVE",
  },
  calHint: {
    year: "12-month horizon (Sep → Aug)",
    quarter: "Q4 (Sep–Nov)",
    month: "Sep — Dance Countdown",
    week: "Wk 1",
    day: "today",
  },
  goals: {
    year: [
      { label: "Bookings (2026–27)", value: "150+", sub: "dance 40 · matric'27 50 · july 20 · rest 40", tone: "gold" },
      { label: "Revenue", value: "R250k+", sub: "6 campaigns · R25k cap each", tone: "up" },
      { label: "Content assets", value: "800+", sub: "UGC 60% · AI 25% · pro 15%", tone: "plain" },
      { label: "Followers", value: "10k", sub: "IG + TikTok · girls + moms", tone: "am" },
      { label: "Capture windows", value: "6 / 6", sub: "dance · summer · date · matric'27 · july · gala", tone: "up" },
      { label: "ROAS (blended)", value: "3.2x", sub: "target · warm retargeting only", tone: "up" },
    ],
    quarter: [
      { label: "Q4 target (Sep–Nov)", value: "R100k", sub: "Dance Countdown · matric 2026", tone: "gold" },
      { label: "Bookings", value: "40+", sub: "R500 deposits · sizes 34–42", tone: "up" },
      { label: "Capture focus", value: "Dance Countdown", sub: "late bookings + alterations NOW", tone: "am" },
      { label: "Assets", value: "200+", sub: "15–20/wk · try-on + lookbook", tone: "plain" },
      { label: "UGC creators", value: "8 live", sub: "6–8 nano · 1–2 micro", tone: "plain" },
      { label: "Retargeting", value: "R12k", sub: "warm only · kill >R1,000 CPA", tone: "up" },
    ],
    month: [
      { label: "Sep: Dance Countdown", value: "LIVE", sub: "dances start late Sep", tone: "gold" },
      { label: "Bookings target", value: "15+", sub: "deposits credited to rental", tone: "up" },
      { label: "Deposit rate", value: "≥1–2%", sub: "per 100 views", tone: "plain" },
      { label: "Lookbook drops", value: "3 hero looks", sub: "emerald · champagne · burgundy", tone: "plain" },
      { label: "Retargeting", value: "R4k", sub: "warm audiences only", tone: "am" },
      { label: "UGC cohort", value: "6–8 briefed", sub: "try-on format · 7-day window", tone: "plain" },
    ],
    week: [
      { label: "Assets (this wk)", value: "15–20", sub: "60/25/15 UGC/AI/pro", tone: "gold" },
      { label: "Bookings", value: "3–5", sub: "first closes this week", tone: "up" },
      { label: "Casting DMs", value: "3 out", sub: "Hero Girl 1 pool", tone: "plain" },
      { label: "Email blast", value: "A/B Thu", sub: "Last Pieces on the Rail", tone: "up" },
      { label: "WA flow", value: "≥70%", sub: "pre-filled booking", tone: "plain" },
      { label: "Retargeting", value: "R2k", sub: "pixel warming · warm only", tone: "am" },
    ],
    day: [
      { label: "Posts today", value: "2", sub: "1 reel · 1 lookbook", tone: "gold" },
      { label: "Reminders", value: "3 auto", sub: "pickup ×2 · alteration ×1", tone: "am" },
      { label: "DM triage", value: "→ high-intent", sub: "reply < 1 hr", tone: "up" },
      { label: "Pipeline due", value: "3 approvals", sub: "editor gate today", tone: "plain" },
      { label: "Capture status", value: "ON WINDOW", sub: "dance season · LIVE", tone: "up" },
      { label: "Runners", value: "6 live", sub: "content · retarget · UGC · WA · hero · report", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "DANCE COUNTDOWN — matric 2026 · LIVE", brand: "env", kind: "capture" },
    { s: 1, e: 2, label: "Dance nights + proof capture", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Summer Glam — NYE · results · Met 30 Jan", brand: "both", kind: "capture" },
    { s: 5, e: 5, label: "Date Night — Valentine's duo", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "The Build — 2027 assets + cast", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "MATRIC 2027 FIRST PICK — early-bird", brand: "both", kind: "capture" },
    { s: 9, e: 10, label: "JULY GLAM — Durban July · Sat 3 Jul", brand: "both", kind: "capture" },
    { s: 11, e: 11, label: "Gala + winter formal", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Dance Countdown: urgency + bookings", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Summer Glam: NYE + Met styling", brand: "env", cls: "camp-env" },
    { s: 5, e: 5, label: "Date Night Couture", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Build: lookbooks + 2027 cast", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Matric 2027 First Pick", brand: "env", cls: "camp-env" },
    { s: 9, e: 10, label: "July Glam + race week", brand: "both", cls: "camp-env" },
    { s: 11, e: 11, label: "Gala + winter formal", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: try-ons + Rail Report", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Try-On Tuesday reel — CD811",
        sub: "hook: 30 Sep deadline · argument: first-to-book · buyer: matric girls + moms · format: 15s try-on",
        tag: "ugc",
        brand: "env",
        variable: "PROVEN",
      },
      { title: "'Book Your Dance' hero post", sub: "scheduled · IG+TikTok+Pin", tag: "ai", brand: "env", variable: "PROVEN" },
    ],
    "Test map": [
      { title: "Hook: 'last size in your dress'", sub: "same argument · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Hook: mom's 1986 dance story", sub: "pattern interrupt · same message", tag: "ai", brand: "brand", variable: "HOOK" },
      { title: "Format: founder-to-camera", sub: "15s · same script", tag: "ai", brand: "env", variable: "FORMAT" },
      { title: "Face: Hero Girl 1 — same message", sub: "fight ad fatigue on the proven line", tag: "ugc", brand: "env", variable: "FACE", blocked: "awaiting founder approval of cast" },
      { title: "Argument: alterations on us", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Last Pieces email — A/B", sub: "subject test · warm list", tag: "ai", brand: "env" },
      { title: "Lookbook drop — emerald", sub: "AI · hero look 1 · #AIlookbook", tag: "ai", brand: "env" },
      { title: "WhatsApp broadcast #1", sub: "rail filling · booking CTA", tag: "auto", brand: "env" },
      { title: "Casting DMs ×3", sub: "Hero Girl pool · consent flow", tag: "ugc", brand: "env" },
    ],
    Editor: [
      { title: "Hero Girl reveal edit", sub: "human edits raw footage", tag: "ugc", brand: "env", blocked: "awaiting POPIA + guardian consent" },
      { title: "Alteration slot reminders", sub: "auto + human copy check", tag: "auto", brand: "env" },
      { title: "Retargeting ad — urgency", sub: "kill >R1,000 CPA", tag: "ad", brand: "env" },
      { title: "Rail Report #0 frames", sub: "weekly roundup", tag: "ugc", brand: "both" },
    ],
    "Post ready": [
      { title: "Try-on reel — CD811", sub: "published · saving well", tag: "ugc", brand: "env" },
      { title: "Email blast — A/B live", sub: "warm list · single send", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "IG", tx: "Try-On Tuesday reel — Ladivine CD811" },
    { tm: "11:00", pt: "WA", tx: "Broadcast #1 — the rail is filling" },
    { tm: "14:00", pt: "IG", tx: "Lookbook — Corseted Column emerald" },
    { tm: "16:00", pt: "MAIL", tx: "Last Pieces on the Rail — A/B blast" },
    { tm: "18:00", pt: "IG", tx: "Story: alterations deadline countdown" },
  ],
  captionBank: [
    {
      name: "aspiration",
      text: "There is a version of you that walks into the room first. This dress knows her.",
    },
    {
      name: "urgency",
      text: "Book your dance dress before the best sizes disappear. That's not pressure, that's math.",
    },
    { name: "editorial", text: "The gown is the event before the event." },
    { name: "rental", text: "Rented, not owned — but the memory is all yours." },
  ],
  gallery: [
    {
      key: "emerald",
      img: "/assets/look-emerald.png",
      badge: "AI · HERO 1",
      title: "Corseted Column — Emerald",
      cap: "Dance-season hero · lookbook post + pin",
    },
    {
      key: "champagne",
      img: "/assets/look-champagne.png",
      badge: "AI · HERO 4",
      title: "Liquid Metallic — Champagne",
      cap: "The money look · reel + story takeover",
    },
    {
      key: "burgundy",
      img: "/assets/look-burgundy.png",
      badge: "AI · HERO 3",
      title: "Cape Moment — Burgundy",
      cap: "The entrance · reel + story takeover",
    },
    {
      key: "chocolate",
      img: "/assets/look-chocolate.png",
      badge: "AI · HERO 5",
      title: "Minimalist Slip — Chocolate",
      cap: "Quiet luxury · editorial carousel",
    },
    {
      key: "cd811",
      img: "/assets/product-ladivine-cd811.jpg",
      badge: "YOUR INVENTORY",
      badgeTone: "green",
      title: "Ladivine CD811 — Black",
      cap: "On the rail now · rental R2,400",
    },
    {
      key: "a1382",
      img: "/assets/product-andrea-leo-a1382.jpg",
      badge: "YOUR INVENTORY",
      badgeTone: "green",
      title: "Andrea & Leo A1382 — Blush",
      cap: "Matric favourite · 2 sizes left",
    },
    {
      key: "cb167",
      img: "/assets/product-ladivine-cb167.jpg",
      badge: "YOUR INVENTORY",
      badgeTone: "green",
      title: "Ladivine CB167 — Mauve",
      cap: "Dance-season contender · booking open",
    },
    {
      key: "ps25984c",
      img: "/assets/product-portia-scarlett.jpg",
      badge: "YOUR INVENTORY",
      badgeTone: "green",
      title: "Portia & Scarlett PS25984C",
      cap: "Statement piece · only 1 unit",
    },
  ],
  decisions: [
    { ts: "26 Aug", action: "Hero Girl casting — DM outreach", state: "Approved", source: "Casting DMs (file 22) + enquiry list", rollback: "Hold fittings; no media until consent", decision: "approve" },
    { ts: "26 Aug", action: "R25k season budget", state: "Approved", source: "Meeting outcomes (file 19)", rollback: "Freeze retargeting; kill >R1,000 CPA", decision: "approve" },
    { ts: "27 Aug", action: "Image provider swap → Gemini only", state: "Approved", source: "Owner direction + QA fails", rollback: "Re-enable fallback provider", decision: "approve" },
  ],
  reports: [
    { date: "24 Aug", channel: "All", summary: "Pre-season baseline: rail stocked, enquiry list warm, dance window opens Sep 1. Zero media spend until approval." },
    { date: "27 Aug", channel: "IG + WA", summary: "Launch assets shipped: 4 Gemini heroes, Book Your Dance composer copy, casting DMs drafted. Wk1 send plan queued." },
  ],
};

/* ─────────────── TESSERA — AI employees (B2B pilot → ARR) ─────────────── */

const TESSERA: SlotConfig = {
  id: "tessera",
  label: "TESSERA",
  brandName: "Tessera",
  logo: "/assets/tessera-logo.png",
  accent: "#22D3EE",
  tagline: "Empyrean · AI employees · bounded tasks · pilot → ARR",
  composerDefault:
    "Tessera: an AI employee that owns a bounded task end-to-end. One pilot, one month — if it doesn't earn its payroll, you cut it.",
  defaultPrompt:
    "Dark-mode SaaS analytics dashboard for an AI agent operations platform, task completion metrics, usage charts, agent status list, modern fintech design, clean typography, crisp screenshot style",
  companyStrat:
    "AI employees for bounded tasks, sold on provable numbers. Shinji: deployable document/email indexing agent for large investors (billion-rand installs) — classify & route with confidence gates, append-only audit ledger, eval-first (accuracy report is the sales document). Model Gate: governance layer for production model routing (benchmarks + deterministic graders + approval evidence ledger). deepkimi: the SLM asset from io-ai research. Founder gates every external commitment.",
  brandStrategy:
    "Sell AI employees like you'd sell an employee: one bounded task, one month pilot; if it doesn't earn its payroll you cut it. Confidence gates: ≥0.95 auto · 0.70–0.95 human review · <0.70 escalate; every decision on an append-only ledger with doc hash, model version, reason. Beat the human baseline in the golden-set eval (200 docs) and the accuracy report IS the pitch. Motion: demo → scoped SOW → build → renewal; case studies are the sales engine.",
  timeContext: {
    year: "Planning horizon · 2026–27 · pilots → ARR engine",
    quarter: "Q4 2026 · Sep–Nov · pilot push",
    month: "Sep 2026 · pilot cycle · shinji + Model Gate",
    week: "This week · Wk 1 · demos + builds",
    day: "Today · pipeline",
  },
  calHint: {
    year: "12-month horizon",
    quarter: "Q4 (Sep–Nov)",
    month: "Sep — pilot cycle",
    week: "Wk 1",
    day: "today",
  },
  goals: {
    year: [
      { label: "Install value", value: "R1B", sub: "shinji large-investor installs", tone: "gold" },
      { label: "Docs routed", value: "1M+", sub: "with confidence gates", tone: "up" },
      { label: "Auto-route rate", value: "≥95%", sub: "conf ≥0.95 · no human touch", tone: "up" },
      { label: "Eval vs human", value: "beat", sub: "golden-set baseline (200 docs)", tone: "plain" },
      { label: "Ledger", value: "100%", sub: "append-only audit trail", tone: "plain" },
      { label: "Agents live", value: "3 products", sub: "shinji · model gate · deepkimi", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "2 installs", sub: "shinji enterprise pilots", tone: "gold" },
      { label: "Pilots", value: "3 live", sub: "shinji · gate · new", tone: "up" },
      { label: "Focus", value: "Golden-set proof", sub: "accuracy report = sales doc", tone: "am" },
      { label: "Agents", value: "12", sub: "in build + live", tone: "plain" },
      { label: "Demos", value: "25", sub: "intake → brief", tone: "plain" },
      { label: "Spend", value: "R0", sub: "build phase · founder time", tone: "up" },
    ],
    month: [
      { label: "Sep: golden set", value: "LIVE", sub: "200-doc human baseline", tone: "gold" },
      { label: "Pilots closing", value: "2", sub: "SOWs this month", tone: "up" },
      { label: "Demo rate", value: "5/wk", sub: "inbound + outreach", tone: "plain" },
      { label: "Agents in build", value: "6", sub: "3 tasks each", tone: "plain" },
      { label: "Eval report", value: "M0.3", sub: "confusion · calibration · throughput", tone: "up" },
      { label: "Usage watch", value: "daily", sub: "quality gates on", tone: "am" },
    ],
    week: [
      { label: "Proof docs", value: "3", sub: "ledger exports", tone: "gold" },
      { label: "Demos booked", value: "5", sub: "bounded-task pitch", tone: "up" },
      { label: "Pilot builds", value: "1", sub: "scoping → build", tone: "plain" },
      { label: "Agents live", value: "2", sub: "running unattended", tone: "up" },
      { label: "Usage check", value: "daily", sub: "ledger + gates", tone: "plain" },
      { label: "Blockers", value: "0", sub: "escalate to founder", tone: "am" },
    ],
    day: [
      { label: "Demos today", value: "1", sub: "bounded task fit", tone: "gold" },
      { label: "Builds", value: "2", sub: "agent tasks", tone: "up" },
      { label: "Support", value: "1 ticket", sub: "SLA < 4h", tone: "plain" },
      { label: "Approvals", value: "2", sub: "founder gate", tone: "plain" },
      { label: "Status", value: "GOLDEN-SET", sub: "eval vs human baseline", tone: "up" },
      { label: "Agents", value: "3 active", sub: "shinji · gate · report", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "PILOT PUSH — Q4 closes", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Renewal cycle — $24k → $96k", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — 2027 offers", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "ARR sprint", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Pilots: shinji + Model Gate", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Renewals + case studies", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Build: packaging + pricing", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "ARR sprint", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: usage + support", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Shinji case study — $24k → $96k",
        sub: "hook: 'your inbox indexes itself' · argument: pilot becomes payroll · buyer: ops leads · format: case study + demo",
        tag: "ai",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: 'the $24k experiment'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: demo walkthrough", sub: "60s screen recording", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: client ops lead", sub: "same story · their voice", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: 40 hrs/wk saved", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Demo request → brief", sub: "5/wk · intake", tag: "ugc", brand: "env" },
      { title: "Pilot scoping doc", sub: "bounded task · 1 month", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Demo recording edit", sub: "human gate", tag: "ugc", brand: "env" },
      { title: "Usage report", sub: "weekly · auto", tag: "auto", brand: "both" },
      { title: "Pilot SOW — founder", sub: "sign before build", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "Pilot kickoff post", sub: "LinkedIn + X", tag: "ai", brand: "both" },
      { title: "Renewal email", sub: "warm list · results first", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Demo follow-up ×2 — bounded task fit" },
    { tm: "11:00", pt: "WA", tx: "Pilot check-in — shinji indexer" },
    { tm: "14:00", pt: "X", tx: "Case study: $24k pilot → $96k/yr" },
    { tm: "17:00", pt: "MAIL", tx: "Renewal nudge — usage proof attached" },
  ],
  captionBank: [
    {
      name: "trust",
      text: "An agent that can't show its work shouldn't be allowed to do the work.",
    },
    {
      name: "pilot",
      text: "One bounded task. One month. If it doesn't earn its payroll, you cut it.",
    },
    {
      name: "renewal",
      text: "The pilot becomes payroll — because it earns it.",
    },
  ],
  gallery: [
    {
      key: "tessera-dashboard",
      img: "/assets/tessera-dashboard.png",
      badge: "AI · PRODUCT",
      title: "Agent Ops Dashboard",
      cap: "Task completion · usage · revenue",
    },
    {
      key: "tessera-indexer",
      img: "/assets/tessera-indexer.png",
      badge: "AI · PRODUCT",
      title: "Shinji — Email Indexer",
      cap: "inbox → AI → indexed pipeline",
    },
    {
      key: "tessera-gate",
      img: "/assets/tessera-gate.png",
      badge: "AI · PRODUCT",
      title: "Model Gate — Trust Ledger",
      cap: "verification · audit log · approvals",
    },
    {
      key: "tessera-workflow",
      img: "/assets/tessera-workflow.png",
      badge: "AI · PRODUCT",
      title: "Agent Workflow",
      cap: "memory · decision · execution nodes",
    },
  ],
  products: [
    {
      id: "shinji",
      label: "SHINJI",
      name: "Shinji",
      tagline: "insurance doc-indexer · confidence gates + ledger",
      composerDefault:
        "Shinji: the AI employee that indexes insurance documents end-to-end — classify, route, and prove every decision on an append-only ledger.",
      defaultPrompt:
        "Dark-mode document indexing product UI, inbox processing pipeline, organized folder tree, modern SaaS design, crisp screenshot style",
      goals: {
        year: [
          { label: "Install value", value: "R1B", sub: "large-investor installs", tone: "gold" },
          { label: "Docs routed", value: "1M+", sub: "with confidence gates", tone: "up" },
          { label: "Auto-route", value: "≥95%", sub: "conf ≥0.95 · no human touch", tone: "up" },
          { label: "Eval vs human", value: "beat", sub: "golden set (200 docs)", tone: "plain" },
          { label: "Ledger", value: "100%", sub: "append-only audit trail", tone: "plain" },
          { label: "Throughput", value: "10k corpus", sub: "XLM-RoBERTa ONNX routing", tone: "am" },
        ],
        quarter: [
          { label: "Q4 target", value: "2 installs", sub: "enterprise pilots", tone: "gold" },
          { label: "Golden set", value: "M0.1", sub: "200-doc human baseline", tone: "up" },
          { label: "Focus", value: "Eval report", sub: "accuracy = sales doc", tone: "am" },
          { label: "Auto-route", value: "≥95%", sub: "target", tone: "plain" },
          { label: "Demos", value: "10", sub: "intake → brief", tone: "plain" },
          { label: "Ledger", value: "append-only", sub: "doc hash · model · reason", tone: "up" },
        ],
        month: [
          { label: "Sep: golden set", value: "LIVE", sub: "baseline + harness", tone: "gold" },
          { label: "Closing", value: "1 SOW", sub: "this month", tone: "up" },
          { label: "Routed", value: "15k docs", sub: "monthly volume", tone: "plain" },
          { label: "Eval", value: "M0.3", sub: "confusion · calibration", tone: "plain" },
          { label: "Launch", value: "M0.4", sub: "demo · landing · Post #1", tone: "up" },
          { label: "Gates", value: "on", sub: "0.95 auto · 0.70 review", tone: "am" },
        ],
        week: [
          { label: "Proof docs", value: "2", sub: "ledger exports", tone: "gold" },
          { label: "Demos", value: "3", sub: "bounded-task pitch", tone: "up" },
          { label: "Builds", value: "1", sub: "taxonomy config", tone: "plain" },
          { label: "Routed", value: "3.5k", sub: "this week", tone: "up" },
          { label: "Support", value: "0", sub: "escalate to founder", tone: "plain" },
          { label: "Blockers", value: "0", sub: "none", tone: "am" },
        ],
        day: [
          { label: "Demos today", value: "1", sub: "inbox fit", tone: "gold" },
          { label: "Routed", value: "500", sub: "documents", tone: "up" },
          { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
          { label: "Approvals", value: "1", sub: "founder gate", tone: "plain" },
          { label: "Status", value: "GOLDEN-SET", sub: "eval vs human", tone: "up" },
          { label: "Agents", value: "2", sub: "indexer + report", tone: "plain" },
        ],
      },
      windows: [
        { s: 0, e: 2, label: "PILOT PUSH — email indexing", brand: "env", kind: "capture" },
        { s: 3, e: 4, label: "Renewal cycle — $24k → $96k", brand: "both", kind: "capture" },
      ],
      camps: [
        { s: 0, e: 2, label: "Shinji pilot + case study", brand: "env", cls: "camp-env" },
        { s: 3, e: 4, label: "Renewals + proof", brand: "env", cls: "camp-env" },
        { s: 0, e: 11, label: "Always-on: index health", brand: "brand", cls: "camp-brand" },
      ],
      pipe: {
        Winner: [
          {
            title: "Index-health case — $24k → $96k",
            sub: "hook: 'inbox never waits' · argument: earns its payroll · buyer: ops leads · format: case study",
            tag: "ai",
            brand: "both",
            variable: "PROVEN",
          },
        ],
        "Test map": [
          { title: "Hook: '1,200 emails a day'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
          { title: "Format: live index demo", sub: "60s screen recording", tag: "ugc", brand: "env", variable: "FORMAT" },
          { title: "Face: pilot client ops lead", sub: "same story · their voice", tag: "ugc", brand: "both", variable: "FACE" },
          { title: "Argument: 40 hrs/wk saved", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
        ],
        Draft: [
          { title: "Demo request → brief", sub: "inbox task fit", tag: "ugc", brand: "env" },
          { title: "Scoping: inbox rules", sub: "bounded task · 1 month", tag: "ai", brand: "env" },
        ],
        Editor: [
          { title: "Demo recording edit", sub: "human gate", tag: "ugc", brand: "env" },
          { title: "Index health report", sub: "weekly · auto", tag: "auto", brand: "both" },
          { title: "Pilot SOW — founder", sub: "sign before build", tag: "ad", brand: "env" },
        ],
        "Post ready": [
          { title: "Case study post", sub: "LinkedIn + X", tag: "ai", brand: "both" },
          { title: "Renewal email", sub: "results first", tag: "auto", brand: "env" },
        ],
      },
      queue: [
        { tm: "09:00", pt: "MAIL", tx: "Demo follow-up — inbox fit" },
        { tm: "11:00", pt: "WA", tx: "Pilot check-in — shinji indexer" },
        { tm: "14:00", pt: "X", tx: "Case study: $24k → $96k/yr" },
      ],
      captionBank: [
        { name: "trust", text: "An agent that can't show its work shouldn't be allowed to do the work." },
        { name: "pilot", text: "One bounded task. One month. If it doesn't earn its payroll, you cut it." },
        { name: "renewal", text: "The pilot becomes payroll — because it earns it." },
      ],
      gallery: [
        {
          key: "tessera-indexer",
          img: "/assets/tessera-indexer.png",
          badge: "AI · PRODUCT",
          title: "Shinji — Email Indexer",
          cap: "inbox → AI → indexed pipeline",
        },
      ],
    },
    {
      id: "model-gate",
      label: "MODEL GATE",
      name: "Model Gate",
      tagline: "governance layer · graders + evidence ledger",
      composerDefault:
        "Model Gate: the governance layer for production model routing — benchmarks, deterministic graders, and an approval evidence ledger. If it can't show its work, it doesn't ship.",
      defaultPrompt:
        "Dark-mode model governance interface, benchmark graders, approval evidence ledger rows, routing policy panel, enterprise design, crisp screenshot style",
      goals: {
        year: [
          { label: "Approvals", value: "R1B routed", sub: "production model decisions", tone: "gold" },
          { label: "Graders", value: "deterministic", sub: "benchmarks + graders", tone: "up" },
          { label: "Ledger", value: "100%", sub: "approval evidence trail", tone: "up" },
          { label: "Policy", value: "approved", sub: "governance layer for routing", tone: "plain" },
          { label: "Clients", value: "4", sub: "on the gate", tone: "plain" },
          { label: "Uptime", value: "99.9%", sub: "gate service", tone: "am" },
        ],
        quarter: [
          { label: "Q4 target", value: "approval", sub: "as routing governance layer", tone: "gold" },
          { label: "Graders", value: "3 suites", sub: "deterministic", tone: "up" },
          { label: "Ledger", value: "100%", sub: "of approvals evidenced", tone: "plain" },
          { label: "Focus", value: "Approval push", sub: "governance sign-off", tone: "am" },
          { label: "Clients", value: "2 new", sub: "this quarter", tone: "up" },
          { label: "Uptime", value: "99.9%", sub: "SLA", tone: "plain" },
        ],
        month: [
          { label: "Sep: gate live", value: "80k checks", sub: "monthly", tone: "gold" },
          { label: "Graders", value: "green", sub: "all suites", tone: "up" },
          { label: "Ledger", value: "100%", sub: "this month", tone: "plain" },
          { label: "Approvals", value: "3", sub: "through the gate", tone: "up" },
          { label: "Clients", value: "1 new", sub: "onboarding", tone: "plain" },
          { label: "SLA", value: "<4h", sub: "support", tone: "am" },
        ],
        week: [
          { label: "Checks", value: "20k", sub: "this week", tone: "gold" },
          { label: "Graders", value: "1 run", sub: "weekly review", tone: "plain" },
          { label: "Approvals", value: "1", sub: "gated ship", tone: "up" },
          { label: "Alerts", value: "0", sub: "gate healthy", tone: "up" },
          { label: "Support", value: "2 tickets", sub: "SLA met", tone: "plain" },
          { label: "Status", value: "STABLE", sub: "all gates green", tone: "am" },
        ],
        day: [
          { label: "Checks today", value: "3k", sub: "routing decisions", tone: "gold" },
          { label: "Alerts", value: "0", sub: "gate health", tone: "up" },
          { label: "Approvals", value: "1", sub: "evidence logged", tone: "plain" },
          { label: "Status", value: "GATE ON", sub: "enforcing", tone: "up" },
          { label: "Uptime", value: "99.9%", sub: "30-day", tone: "plain" },
          { label: "Agents", value: "3", sub: "benchmark · grade · ledger", tone: "plain" },
        ],
      },
      windows: [
        { s: 0, e: 2, label: "GATE ROLLOUT — clients 3+4", brand: "env", kind: "capture" },
        { s: 3, e: 4, label: "Client trust reports", brand: "both", kind: "capture" },
      ],
      camps: [
        { s: 0, e: 2, label: "Deploy gate rollout", brand: "env", cls: "camp-env" },
        { s: 0, e: 11, label: "Always-on: ledger + alerts", brand: "brand", cls: "camp-brand" },
      ],
      pipe: {
        Winner: [
          {
            title: "Ledger health post — 1M checks",
            sub: "hook: 'the gate that never sleeps' · argument: 99.9% uptime, full audit · buyer: trust officers · format: stat post",
            tag: "ai",
            brand: "both",
            variable: "PROVEN",
          },
        ],
        "Test map": [
          { title: "Hook: 'audit for free'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
          { title: "Format: ledger walkthrough", sub: "60s UI recording", tag: "ugc", brand: "env", variable: "FORMAT" },
          { title: "Face: client ops lead", sub: "same story · their voice", tag: "ugc", brand: "both", variable: "FACE" },
          { title: "Argument: deploys gated", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
        ],
        Draft: [
          { title: "Gate demo → brief", sub: "trust-layer fit", tag: "ugc", brand: "env" },
          { title: "Trust report — client", sub: "monthly ledger", tag: "ai", brand: "both" },
        ],
        Editor: [
          { title: "Audit log review", sub: "human gate", tag: "auto", brand: "env" },
          { title: "Deploy gate — founder", sub: "sign before ship", tag: "ad", brand: "env" },
        ],
        "Post ready": [
          { title: "Ledger health post", sub: "LinkedIn", tag: "ai", brand: "both" },
        ],
      },
      queue: [
        { tm: "09:30", pt: "MAIL", tx: "Trust report — client A" },
        { tm: "12:00", pt: "WA", tx: "Gate check-in — client C" },
        { tm: "16:00", pt: "X", tx: "Ledger: 99.9% uptime, 1M checks" },
      ],
      captionBank: [
        { name: "trust", text: "An agent that can't show its work shouldn't be allowed to do the work." },
        { name: "gate", text: "The gate isn't bureaucracy — it's what makes the agent worth paying for." },
        { name: "audit", text: "Every deploy leaves a trail. That's the product." },
      ],
      gallery: [
        {
          key: "tessera-gate",
          img: "/assets/tessera-gate.png",
          badge: "AI · PRODUCT",
          title: "Model Gate — Trust Ledger",
          cap: "verification · audit log · approvals",
        },
      ],
    },
    {
      id: "deepkimi",
      label: "DEEPKIMI",
      name: "deepkimi",
      tagline: "SLM asset · cheap local reasoning",
      composerDefault:
        "deepkimi: the small language model behind the agents — cheap, local, auditable. Tuned from teacher runs, shipped as the SLM asset.",
      defaultPrompt:
        "Dark-mode model serving dashboard, inference metrics, latency charts, model version panel, ML-ops design, crisp screenshot style",
      goals: {
        year: [
          { label: "Inferences", value: "10M", sub: "served annually", tone: "gold" },
          { label: "Latency", value: "<200ms", sub: "p50 served", tone: "up" },
          { label: "Cost", value: "$0.003/sample", sub: "SLM economics", tone: "up" },
          { label: "Models", value: "3 tuned", sub: "from teacher runs", tone: "plain" },
          { label: "Uptime", value: "99.9%", sub: "serving", tone: "am" },
          { label: "Clients", value: "6", sub: "on the runtime", tone: "plain" },
        ],
        quarter: [
          { label: "Q4 target", value: "2.5M", sub: "inferences", tone: "gold" },
          { label: "Focus", value: "SLM tuning", sub: "teacher trajectories", tone: "am" },
          { label: "Cost", value: "−30%", sub: "vs Q3", tone: "up" },
          { label: "Models", value: "1 new", sub: "distilled", tone: "plain" },
          { label: "Clients", value: "2 new", sub: "runtime access", tone: "up" },
          { label: "Evals", value: "green", sub: "all suites", tone: "plain" },
        ],
        month: [
          { label: "Sep: runtime live", value: "800k", sub: "inferences", tone: "gold" },
          { label: "Latency", value: "190ms", sub: "p50", tone: "up" },
          { label: "Cost", value: "−10%", sub: "vs Aug", tone: "up" },
          { label: "Evals", value: "4 suites", sub: "green", tone: "plain" },
          { label: "Models", value: "1 in train", sub: "distill cycle", tone: "plain" },
          { label: "Uptime", value: "99.9%", sub: "30-day", tone: "am" },
        ],
        week: [
          { label: "Inferences", value: "200k", sub: "this week", tone: "gold" },
          { label: "Evals", value: "1 suite", sub: "green", tone: "plain" },
          { label: "Models", value: "0 ships", sub: "training", tone: "plain" },
          { label: "Cost", value: "steady", sub: "per-sample", tone: "up" },
          { label: "Support", value: "1 ticket", sub: "SLA met", tone: "plain" },
          { label: "Status", value: "GREEN", sub: "all services", tone: "am" },
        ],
        day: [
          { label: "Inferences today", value: "28k", sub: "served", tone: "gold" },
          { label: "Latency", value: "190ms", sub: "p50", tone: "up" },
          { label: "Evals", value: "0", sub: "none due", tone: "plain" },
          { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
          { label: "Status", value: "GREEN", sub: "serving", tone: "up" },
          { label: "Agents", value: "2", sub: "serving + monitor", tone: "plain" },
        ],
      },
      windows: [
        { s: 0, e: 2, label: "SLM TUNING — teacher runs", brand: "env", kind: "capture" },
        { s: 3, e: 4, label: "Distill + eval cycle", brand: "both", kind: "capture" },
      ],
      camps: [
        { s: 0, e: 2, label: "Tuning + evals", brand: "env", cls: "camp-env" },
        { s: 0, e: 11, label: "Always-on: serving", brand: "brand", cls: "camp-brand" },
      ],
      pipe: {
        Winner: [
          {
            title: "Runtime brief — $0.003/sample",
            sub: "hook: 'small model, small bill' · argument: SLM economics + local data · buyer: ML leads · format: metrics brief",
            tag: "ai",
            brand: "both",
            variable: "PROVEN",
          },
        ],
        "Test map": [
          { title: "Hook: 'your data never leaves'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
          { title: "Format: eval viz", sub: "latency + cost charts", tag: "ugc", brand: "env", variable: "FORMAT" },
          { title: "Face: ML lead voice", sub: "same story · their role", tag: "ugc", brand: "both", variable: "FACE" },
          { title: "Argument: 190ms p50", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
        ],
        Draft: [
          { title: "Teacher run capture", sub: "trajectory data", tag: "ai", brand: "env" },
          { title: "Distill run v3", sub: "SLM candidate", tag: "ai", brand: "env" },
        ],
        Editor: [
          { title: "Eval suite — 4 tasks", sub: "green gate", tag: "auto", brand: "both" },
          { title: "Model ship — founder", sub: "eval gate", tag: "ad", brand: "env" },
        ],
        "Post ready": [
          { title: "Runtime brief", sub: "clients + metrics", tag: "ai", brand: "both" },
        ],
      },
      queue: [
        { tm: "10:00", pt: "MAIL", tx: "Runtime metrics — monthly" },
        { tm: "13:00", pt: "WA", tx: "Eval status — distill v3" },
        { tm: "15:30", pt: "X", tx: "SLM: $0.003/sample, 190ms" },
      ],
      captionBank: [
        { name: "cheap", text: "Small model, small bill, serious reasoning." },
        { name: "local", text: "Your data never leaves your runtime." },
        { name: "audit", text: "Every answer traces to a teacher run." },
      ],
      gallery: [
        {
          key: "tessera-dashboard",
          img: "/assets/tessera-dashboard.png",
          badge: "AI · PRODUCT",
          title: "deepkimi — SLM Runtime",
          cap: "inferences · latency · cost",
        },
      ],
    },
  ],
  decisions: [
    { ts: "26 Aug", action: "Golden-set eval scope (200 docs)", state: "Approved", source: "shinji ROADMAP M0.1", rollback: "Reduce to 100 docs", decision: "approve" },
    { ts: "27 Aug", action: "Public launch gated on eval vs human", state: "Approved", source: "eval-first doctrine (shinji README)", rollback: "Launch without baseline", decision: "approve" },
  ],
  reports: [
    { date: "24 Aug", channel: "Engineering", summary: "M0.2 skeleton complete: ingest → classify → route with confidence gates; append-only ledger; CLI + harness green." },
  ],
};

/* ─────────────── DECILE — AI for regulated finance ─────────────── */

const DECILE: SlotConfig = {
  id: "decile",
  label: "DECILE",
  brandName: "Decile AI",
  logo: "/assets/decile-logo.png",
  accent: "#A78BFA",
  tagline: "Empyrean · custom SLMs for SA business · Stop Renting. Start owning.",
  composerDefault:
    "Decile AI: we design, build and hand over custom small language models — one model per use case. Clients own the weights and run them on their own hardware.",
  defaultPrompt:
    "Dark-mode SaaS dashboard for a custom SLM delivery platform, model handover status, eval scores, rental crossover calculator, fintech design, crisp screenshot style",
  companyStrat:
    "Launch Decile AI: design, build and hand over custom small language models for businesses — one model per use case, clients OWN the weights and run them on their own hardware. Campaign: Stop Renting. Start owning. Market: SA BFSI — 5 named target insurers with entry-point use cases. Demo proven: Kaggle P100, 1,000 ex / 3 ep, eval 0.90 / 0.855. Pricing: R250k pilot + R25k/mo retainer (mid); honest crossover — below ~2M calls/mo renting wins and we say so in the room; ~5M calls/mo breakeven month 9. 18-month base: retainers compound 0 → 4.8 clients, R361k month-18 run-rate.",
  brandStrategy:
    "One model per use case, weights owned, hardware theirs. Pipeline: ingest → curation (PII/POPIA) → training → eval → serving + license-check + handover certificate. Our costs are expertise not compute (R192k of R207k is senior-engineer time — margin problem is scoping, so scope tightly). Motion: rental-crossover demo (honest breakeven) → diagnostic audit sizes the use case → scoped build → handover with weights + license. Sales: one-pager + deck, 3 email sequences, 10 LinkedIn posts, discovery-call rubric; every claim actuary-proof.",
  timeContext: {
    year: "Planning horizon · 2026–27 · pilots → ARR engine",
    quarter: "Q4 2026 · Sep–Nov · pilot push",
    month: "Sep 2026 · pilot cycle · evidence demos",
    week: "This week · Wk 1 · demos + builds",
    day: "Today · pipeline",
  },
  calHint: { year: "12-month horizon", quarter: "Q4 (Sep–Nov)", month: "Sep — pilots", week: "Wk 1", day: "today" },
  goals: {
    year: [
      { label: "Models shipped", value: "6", sub: "handovers with weights + license", tone: "gold" },
      { label: "Run-rate (m18)", value: "R361k/mo", sub: "base case · 4.8 retained clients", tone: "up" },
      { label: "Eval bar", value: "0.90", sub: "demo proven · actuary-proof claims", tone: "up" },
      { label: "Retainers", value: "R25k/mo", sub: "compounding engine · floor R15k", tone: "plain" },
      { label: "Crossover", value: "~5M calls/mo", sub: "breakeven month 9 · we say renting wins below", tone: "plain" },
      { label: "Pipeline", value: "R1.2M", sub: "diagnostic audits → builds", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "2 builds", sub: "pilots closing", tone: "gold" },
      { label: "Pilots", value: "3 live", sub: "one model per use case", tone: "up" },
      { label: "Focus", value: "Diagnostic audits", sub: "size the use case on real numbers", tone: "am" },
      { label: "Demo eval", value: "0.90 / 0.855", sub: "P100 · 1,000 ex · 3 ep", tone: "plain" },
      { label: "Demos", value: "20", sub: "rental-crossover first", tone: "plain" },
      { label: "Spend", value: "R0", sub: "build phase · founder time", tone: "up" },
    ],
    month: [
      { label: "Sep: pipeline live", value: "LIVE", sub: "ingest → eval → serving", tone: "gold" },
      { label: "Closing", value: "2 SOWs", sub: "R250k pilots", tone: "up" },
      { label: "Demos", value: "6", sub: "BFSI entry-point use cases", tone: "plain" },
      { label: "Audits", value: "4", sub: "diagnostic sizing", tone: "plain" },
      { label: "Retainers", value: "1 live", sub: "R25k/mo compounding", tone: "up" },
      { label: "Gates", value: "on", sub: "founder approvals", tone: "am" },
    ],
    week: [
      { label: "Audit docs", value: "2", sub: "crossover workings", tone: "gold" },
      { label: "Demos booked", value: "5", sub: "bounded use case", tone: "up" },
      { label: "Builds", value: "1", sub: "training run in flight", tone: "plain" },
      { label: "Eval", value: "green", sub: "harness passes", tone: "up" },
      { label: "Support", value: "0", sub: "escalate to founder", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
    ],
    day: [
      { label: "Demos today", value: "1", sub: "use-case fit", tone: "gold" },
      { label: "Builds", value: "2", sub: "training tasks", tone: "up" },
      { label: "Approvals", value: "2", sub: "founder gate", tone: "plain" },
      { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
      { label: "Status", value: "BUILD WINDOW", sub: "pipelines running", tone: "up" },
      { label: "Agents", value: "3", sub: "ingest · train · eval", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "PILOT PUSH — Q4 closes", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Renewal cycle — audit proof", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — 2027 offers", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "ARR sprint", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Pilots: evidence engine", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Renewals + case studies", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Build: packaging + pricing", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "ARR sprint", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: audit + support", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Evidence case — audit trail wins",
        sub: "hook: 'regulated finance buys receipts' · argument: 100% audit trails · buyer: actuarial / risk leads · format: case study",
        tag: "ai",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: 'magic isn't a control'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: audit trail walkthrough", sub: "60s UI recording", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: actuary voice", sub: "same story · their register", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: evidence-engine demos", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Demo request → brief", sub: "validation task fit", tag: "ugc", brand: "env" },
      { title: "Validation scoping", sub: "bounded task · 1 month", tag: "ai", brand: "env" },
      { title: "Evidence pack v1", sub: "hand-calc proof set", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Demo recording edit", sub: "human gate", tag: "ugc", brand: "env" },
      { title: "Audit report", sub: "weekly · auto", tag: "auto", brand: "both" },
      { title: "Pilot SOW — founder", sub: "sign before build", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "Evidence case post", sub: "LinkedIn + X", tag: "ai", brand: "both" },
      { title: "Renewal email", sub: "audit trail first", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Demo follow-up — validation fit" },
    { tm: "11:00", pt: "WA", tx: "Pilot check-in — evidence engine" },
    { tm: "14:00", pt: "X", tx: "Evidence case: audit trail wins" },
    { tm: "17:00", pt: "MAIL", tx: "Renewal nudge — proof attached" },
  ],
  captionBank: [
    { name: "trust", text: "An agent that can't show its work shouldn't be allowed to do the work." },
    { name: "validation", text: "Regulated finance doesn't buy magic — it buys receipts." },
    { name: "pilot", text: "One bounded validation task. One month. Receipts on every answer." },
  ],
  gallery: [
    {
      key: "decile-dashboard",
      img: "/assets/decile-dashboard.png",
      badge: "AI · PRODUCT",
      title: "Model Risk Dashboard",
      cap: "scorecards · validation states",
    },
    {
      key: "decile-audit",
      img: "/assets/decile-audit.png",
      badge: "AI · PRODUCT",
      title: "Audit Trail",
      cap: "every output logged + reviewable",
    },
  ],
  decisions: [
    { ts: "27 Aug", action: "Pricing honesty rule — say renting wins below crossover", state: "Approved", source: "pricing_model.md", rollback: "Remove crossover disclosure", decision: "approve" },
  ],
  reports: [
    { date: "24 Aug", channel: "Demo", summary: "Kaggle P100 run: 1,000 ex / 3 ep, eval 0.90 / 0.855 — real numbers recorded before GTM assets." },
  ],
};

/* ─────────────── ITRAIN — AI training + compliance ─────────────── */

const ITRAIN: SlotConfig = {
  id: "itrain",
  label: "ITRAIN",
  brandName: "iTrain",
  logo: "/assets/itrain-logo.png",
  accent: "#F97316",
  tagline: "Empyrean · AI ops platform for personal trainers",
  composerDefault:
    "iTrain: one app that runs a PT's whole business — leads → discovery calls → programs → retention → content → nutrition → admin, with an agent fleet doing the heavy lifting.",
  defaultPrompt:
    "Dark-mode training ops platform dashboard, client program progress, session cards, revenue card, retention scores, agent module cards, modern design, crisp screenshot style",
  companyStrat:
    "AI-assisted operations platform for personal trainers — one app runs a PT's whole business: leads → discovery calls → training programs → retention → content → nutrition → admin, agent fleet + model router keeping LLM spend under $10/PT/month. Demoable after Phase 5 (Program + Retention agents) for a real PT to start using; friend test is the milestone.",
  brandStrategy:
    "The PT's back office in one dark-mode app, one number + one action per card. Phase order: monorepo + auth ✓ → data layer ✓ → model router ✓ (local / DeepSeek / Kimi, $10/PT/mo cap) → Morning Brief ✓ → Program Agent (4-week programs, PT approval) → Retention Agent (daily churn scoring + intervention drafts) → LeadGen (Reddit, value-first, ≤3 touches) → Content (captions + 9:16 video) → Nutrition (macros not meal plans — legal) → Admin (Stripe, invoicing, reminders) → Gym multi-tenant. Every phase ships demoable: endpoints live + verified, screens render.",
  timeContext: {
    year: "Planning horizon · 2026–27 · phases 4–10",
    quarter: "Q4 2026 · Sep–Nov · Program + Retention agents",
    month: "Sep 2026 · Phase 4 — Program Agent",
    week: "This week · Wk 1 · program generation",
    day: "Today · builds",
  },
  calHint: { year: "12-month horizon", quarter: "Q4 (Sep–Nov)", month: "Sep — Phase 4", week: "Wk 1", day: "today" },
  goals: {
    year: [
      { label: "PTs onboarded", value: "100", sub: "running their business on iTrain", tone: "gold" },
      { label: "Router cost", value: "<$10/PT/mo", sub: "hard cap · local/DeepSeek/Kimi", tone: "up" },
      { label: "Agents live", value: "10 / 10", sub: "phases 0–10 shipped", tone: "up" },
      { label: "Churn saved", value: "30%", sub: "retention agent interventions", tone: "plain" },
      { label: "MRR", value: "R60k", sub: "PT subscriptions", tone: "up" },
      { label: "Friend test", value: "PASSED", sub: "real PT using it after Phase 5", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "Phases 4–6", sub: "Program · Retention · LeadGen", tone: "gold" },
      { label: "Program agent", value: "shipped", sub: "4-week programs · PT approval", tone: "up" },
      { label: "Retention agent", value: "shipped", sub: "churn score + interventions", tone: "up" },
      { label: "Router", value: "$10/PT cap", sub: "500ms batching · circuit breaker", tone: "plain" },
      { label: "Coverage", value: "≥80%", sub: "auth + CRUD tests", tone: "plain" },
      { label: "Friend test", value: "green", sub: "demoable platform", tone: "am" },
    ],
    month: [
      { label: "Sep: Phase 4", value: "LIVE", sub: "program generation", tone: "gold" },
      { label: "Exercises", value: "200", sub: "SQLite DB · auto-progression", tone: "up" },
      { label: "Approval flow", value: "PT gate", sub: "programs need PT sign-off", tone: "plain" },
      { label: "Router", value: "on", sub: "local first · DeepSeek · Kimi", tone: "plain" },
      { label: "Brief", value: "7am push", sub: "revenue + sessions cards", tone: "up" },
      { label: "Tests", value: "green", sub: "pytest + alembic", tone: "am" },
    ],
    week: [
      { label: "Program builds", value: "2", sub: "4-week templates", tone: "gold" },
      { label: "Churn scores", value: "daily", sub: "weighted signals", tone: "up" },
      { label: "Interventions", value: "3 drafts", sub: "nudge · pivot · call", tone: "plain" },
      { label: "Router spend", value: "$/PT", sub: "under cap", tone: "up" },
      { label: "Support", value: "1 ticket", sub: "SLA met", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
    ],
    day: [
      { label: "Builds today", value: "2", sub: "agent tasks", tone: "gold" },
      { label: "Brief", value: "sent", sub: "7am · 5-min cache", tone: "up" },
      { label: "Approvals", value: "1", sub: "PT program gate", tone: "plain" },
      { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
      { label: "Status", value: "PHASE 4", sub: "Program Agent", tone: "up" },
      { label: "Agents", value: "5", sub: "router · brief · program · retention · leadgen", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "PHASES 4–6 — Program · Retention · LeadGen", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Phase 7–8 — Content + Nutrition", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — Phase 9–10 · Admin + Gym multi-tenant", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "LAUNCH — PTs onboard", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Program + Retention agents", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Content + Nutrition agents", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Admin + multi-tenant build", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Launch + onboarding", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: router + brief", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Morning Brief — 7am push",
        sub: "hook: 'your day, pre-loaded' · argument: revenue + sessions + adherence · buyer: independent PTs · format: push card",
        tag: "auto",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: '3 clients need a nudge'", sub: "same brief · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: program demo", sub: "60s 4-week generation", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: real PT voice", sub: "same story · their roster", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: $10/PT/mo cap", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Program template pack", sub: "AI-drafted 4-week plans", tag: "ai", brand: "env" },
      { title: "LeadGen outreach drafts", sub: "value-first · ≤3 touches", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Program review — PT gate", sub: "human approval flow", tag: "ugc", brand: "env" },
      { title: "Retention intervention drafts", sub: "auto · nudge/pivot/call", tag: "auto", brand: "both" },
      { title: "Phase SOW — founder", sub: "sign before build", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "Phase launch post", sub: "IG + WA broadcast", tag: "ai", brand: "both" },
      { title: "Router cost digest", sub: "auto · weekly", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Program approval — PT A" },
    { tm: "11:00", pt: "WA", tx: "Retention nudge draft — client B" },
    { tm: "14:00", pt: "IG", tx: "iTrain drop — one app, agent fleet" },
    { tm: "17:00", pt: "MAIL", tx: "Router cost report — weekly" },
  ],
  captionBank: [
    { name: "backoffice", text: "Your business runs on your phone. The agents do the heavy lifting." },
    { name: "program", text: "Four weeks of programming, one approval tap." },
    { name: "retention", text: "The churn score is the early warning. The nudge is the save." },
  ],
  gallery: [
    {
      key: "itrain-dashboard",
      img: "/assets/itrain-dashboard.png",
      badge: "AI · PRODUCT",
      title: "PT Ops Dashboard",
      cap: "programs · sessions · revenue · retention",
    },
    {
      key: "itrain-course",
      img: "/assets/itrain-course.png",
      badge: "AI · PRODUCT",
      title: "Program Builder",
      cap: "4-week plans · auto-progression · PT approval",
    },
  ],
  decisions: [
    { ts: "24 Aug", action: "Model router cap — $10/PT/mo", state: "Approved", source: "ops-pt-platform GOAL Phase 2", rollback: "Raise cap after pilot", decision: "approve" },
  ],
  reports: [
    { date: "24 Aug", channel: "Engineering", summary: "Phases 0–3 shipped: monorepo + auth, data layer, model router, Morning Brief; ≥80% test coverage." },
  ],
};

/* ─────────────── GAPOS — goals operating system ─────────────── */

const GAPOS: SlotConfig = {
  id: "gapos",
  label: "GAPOS",
  brandName: "GapOS",
  logo: "/assets/gapos-logo.png",
  accent: "#34D399",
  tagline: "Empyrean · gap → 7-day audio course · verified practice",
  composerDefault:
    "GapOS: noticed a knowledge gap? Seven days of source-grounded audio, verified practice, done. Every claim cited, every practice verified.",
  defaultPrompt:
    "Dark-mode audio course player, episode progress ring, source citations panel, 7-day schedule track, practice task card, modern learning-app design, crisp screenshot style",
  companyStrat:
    "Launch GapOS publicly and get real learners completing verified audio courses. GapOS: noticed knowledge gap → source-grounded 7-day audio course with verified practice. pnpm monorepo, Postgres + MinIO, durable worker, live-eval gate. Every course is source-grounded (claims cited), completion is verified by practice, not just listening.",
  brandStrategy:
    "From noticed gap to verified completion in 7 days of audio: source-grounded courses (every claim cited to a document), verified practice tasks, completion + eval as the product. Motion: public launch → real learners completing verified courses → paid cohorts. Live-eval gate in progress; durable workers keep courses generating unattended.",
  timeContext: {
    year: "Planning horizon · 2026–27 · launch → cohorts",
    quarter: "Q4 2026 · Sep–Nov · launch + first completions",
    month: "Sep 2026 · live-eval gate",
    week: "This week · Wk 1 · learner cohort",
    day: "Today · completions",
  },
  calHint: { year: "12-month horizon", quarter: "Q4 (Sep–Nov)", month: "Sep — eval gate", week: "Wk 1", day: "today" },
  goals: {
    year: [
      { label: "Learners", value: "1,000", sub: "completing verified courses", tone: "gold" },
      { label: "Courses", value: "25", sub: "source-grounded · 7-day audio", tone: "up" },
      { label: "Completion", value: "70%", sub: "of started courses finished", tone: "up" },
      { label: "Verified practice", value: "85%", sub: "practice tasks verified", tone: "plain" },
      { label: "Sources cited", value: "100%", sub: "every claim grounded", tone: "plain" },
      { label: "MRR", value: "R40k", sub: "paid cohorts", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "300 learners", sub: "public launch", tone: "gold" },
      { label: "Courses", value: "8", sub: "7-day audio · cited", tone: "up" },
      { label: "Focus", value: "Live-eval gate", sub: "completion = verified practice", tone: "am" },
      { label: "Completion", value: "70%", sub: "target", tone: "plain" },
      { label: "Workers", value: "durable", sub: "course gen unattended", tone: "plain" },
      { label: "Cohorts", value: "1 paid", sub: "first revenue", tone: "up" },
    ],
    month: [
      { label: "Sep: eval gate", value: "LIVE", sub: "source grounding verified", tone: "gold" },
      { label: "Courses", value: "3 live", sub: "7-day audio", tone: "up" },
      { label: "Learners", value: "100", sub: "enrolled", tone: "plain" },
      { label: "Completion", value: "70%", sub: "target", tone: "plain" },
      { label: "Citations", value: "100%", sub: "per course", tone: "up" },
      { label: "Infra", value: "green", sub: "Postgres + MinIO + workers", tone: "am" },
    ],
    week: [
      { label: "Completions", value: "18", sub: "this week", tone: "gold" },
      { label: "Practice verified", value: "85%", sub: "of tasks", tone: "up" },
      { label: "Courses", value: "1 build", sub: "gap → course pipeline", tone: "plain" },
      { label: "Citations", value: "100%", sub: "source-grounded", tone: "up" },
      { label: "Support", value: "1 ticket", sub: "SLA met", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
    ],
    day: [
      { label: "Learners today", value: "15", sub: "started", tone: "gold" },
      { label: "Completions", value: "3", sub: "verified practice", tone: "up" },
      { label: "Practice", value: "85%", sub: "verified", tone: "plain" },
      { label: "Approvals", value: "1", sub: "course gate", tone: "plain" },
      { label: "Status", value: "LAUNCH WINDOW", sub: "live-eval green", tone: "up" },
      { label: "Agents", value: "3", sub: "course gen · eval · reminders", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "PUBLIC LAUNCH — first learners", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Verified course pilots", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — course library", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "PAID COHORTS", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Launch + first completions", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Verified pilots", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Course library build", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Paid cohorts", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: learners + eval", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "7-day course drop — first cohort",
        sub: "hook: 'the gap you noticed, closed in 7 days' · argument: source-grounded + verified practice · buyer: self-learners · format: audio course",
        tag: "ai",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: 'stop saving tabs'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: day-1 preview", sub: "60s audio sample + sources", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: first learner voice", sub: "same story · their gap", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: verified practice", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Gap → course pipeline", sub: "source-grounded generation", tag: "ai", brand: "env" },
      { title: "Course script v1", sub: "7-day audio · citations", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Course review — human", sub: "citation gate", tag: "ugc", brand: "env" },
      { title: "Completion reminders", sub: "auto · day-based", tag: "auto", brand: "both" },
      { title: "Course gate — founder", sub: "sign before publish", tag: "ad", brand: "env", blocked: "awaiting founder sign-off" },
    ],
    "Post ready": [
      { title: "Course launch post", sub: "X + LinkedIn", tag: "ai", brand: "both" },
      { title: "Week-1 cohort digest", sub: "auto · completions + practice", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Day-3 nudge — cohort A" },
    { tm: "11:00", pt: "WA", tx: "Practice reminder — lesson 5" },
    { tm: "14:00", pt: "X", tx: "Course drop — gap of the week" },
    { tm: "17:00", pt: "MAIL", tx: "Completion + eval digest" },
  ],
  captionBank: [
    { name: "gap", text: "The gap you noticed, closed in seven days of audio." },
    { name: "source", text: "Every claim cited. Every practice verified. No vibes." },
    { name: "done", text: "Not just listened — completed, verified, done." },
  ],
  gallery: [
    {
      key: "gapos-course",
      img: "/assets/gapos-course.png",
      badge: "AI · PRODUCT",
      title: "7-Day Audio Course",
      cap: "episodes · sources · practice tasks",
    },
    {
      key: "gapos-completion",
      img: "/assets/gapos-completion.png",
      badge: "AI · PRODUCT",
      title: "Verified Completion",
      cap: "practice checkmarks · streaks · citations",
    },
  ],
  decisions: [
    { ts: "24 Aug", action: "Live-eval gate as launch gate", state: "Approved", source: "orchestrator registry notes", rollback: "Ship without gate", decision: "approve" },
  ],
  reports: [
    { date: "24 Aug", channel: "Engineering", summary: "pnpm monorepo + Postgres/MinIO + durable workers; first courses generating; live-eval gate in progress." },
  ],
};

/* ─────────────── EMPYREAN — consulting brand ─────────────── */

const EMPYREAN: SlotConfig = {
  id: "empyrean",
  label: "EMPYREAN",
  brandName: "Empyrean",
  logo: "/assets/empyrean-logo.png",
  accent: "#E5C07B",
  tagline: "Empyrean Consult · inbound leads · proposals · packages",
  composerDefault:
    "Empyrean: prospects become paying clients through working mini-versions of the product — lead → AI diagnosis → proposal → package.",
  defaultPrompt:
    "Dark-mode consulting proposal dashboard, client diagnosis summary card, numbered proposal sections, lead source badge, clean enterprise design, crisp screenshot style",
  companyStrat:
    "Generate inbound Empyrean consulting leads from the website. Lead capture (3/day rate limit, failure-safe), AI proposal generator (chat → diagnosis → proposal sections), Resend notifications. Client packages: Envogue (Winter Catalyst) + Micaelan Jade (R18k/30d mini pilot). Offers: Seasonal Catalyst (R38–55k/90 days) for boutiques; Empire Flywheel (R38–55k/mo + kicker + equity) for portfolio founders. Every inbound lead recorded with source and visible in one place.",
  brandStrategy:
    "Convert prospects into paying clients with working mini-versions of the product Empyrean sells. Motion: lead form → AI diagnosis (proposal sections generated) → discovery call → package signed → mini-version delivered as proof. Site growth (M4): case studies, services, methodology pages, SEO + OG + sitemap, measure visit→lead conversion. Every claim actuary-proof; no hype words.",
  timeContext: {
    year: "Planning horizon · 2026–27 · lead engine + packages",
    quarter: "Q4 2026 · Sep–Nov · catalyst season + proposals",
    month: "Sep 2026 · lead engine live",
    week: "This week · Wk 1 · proposals out",
    day: "Today · pipeline",
  },
  calHint: { year: "12-month horizon", quarter: "Q4 (Sep–Nov)", month: "Sep — leads", week: "Wk 1", day: "today" },
  goals: {
    year: [
      { label: "Inbound leads", value: "120", sub: "recorded with source", tone: "gold" },
      { label: "Proposals", value: "60", sub: "AI diagnosis → sections", tone: "up" },
      { label: "Conversion", value: "15%", sub: "proposal → signed", tone: "up" },
      { label: "Packages", value: "2 live", sub: "catalyst + flywheel", tone: "plain" },
      { label: "MRR", value: "R150k", sub: "retainers + catalysts", tone: "up" },
      { label: "Case studies", value: "4", sub: "from delivered packages", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "30 leads", sub: "catalyst season", tone: "gold" },
      { label: "Proposals", value: "15", sub: "this quarter", tone: "up" },
      { label: "Focus", value: "Lead engine", sub: "3/day rate limit · failure-safe", tone: "am" },
      { label: "Conversion", value: "15%", sub: "target", tone: "plain" },
      { label: "Packages", value: "2 closing", sub: "catalyst + mini pilot", tone: "up" },
      { label: "Site", value: "M4 growth", sub: "SEO · OG · sitemap", tone: "plain" },
    ],
    month: [
      { label: "Sep: lead engine", value: "LIVE", sub: "form → diagnosis → proposal", tone: "gold" },
      { label: "Leads", value: "10", sub: "this month", tone: "up" },
      { label: "Proposals", value: "5", sub: "sent", tone: "plain" },
      { label: "Follow-ups", value: "auto", sub: "Resend notification on every lead", tone: "up" },
      { label: "Packages", value: "1 in delivery", sub: "mini-version as proof", tone: "plain" },
      { label: "Tests", value: "green", sub: "pytest in CI · mocked Gemini/Resend", tone: "am" },
    ],
    week: [
      { label: "Leads", value: "3", sub: "this week", tone: "gold" },
      { label: "Proposals", value: "1", sub: "AI diagnosis + sections", tone: "up" },
      { label: "Follow-ups", value: "auto", sub: "email + call", tone: "plain" },
      { label: "Delivery", value: "1", sub: "package milestone", tone: "up" },
      { label: "Support", value: "0", sub: "escalate to founder", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
    ],
    day: [
      { label: "Leads today", value: "1", sub: "source tagged", tone: "gold" },
      { label: "Proposals", value: "1", sub: "drafted", tone: "up" },
      { label: "Follow-up", value: "sent", sub: "Resend fired", tone: "plain" },
      { label: "Approvals", value: "1", sub: "proposal gate", tone: "plain" },
      { label: "Status", value: "LEAD WINDOW", sub: "engine live", tone: "up" },
      { label: "Agents", value: "3", sub: "lead · diagnosis · proposal", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "CATALYST SEASON — Q4 proposals", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Package delivery + case studies", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — site M4 + methodology", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "Flywheel renewals", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Lead engine + catalysts", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Deliveries + case studies", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Site growth (M4)", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Flywheel renewals", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: lead capture + follow-up", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Lead form → AI diagnosis",
        sub: "hook: 'get the diagnosis' · argument: working mini-version before the contract · buyer: boutique + portfolio founders · format: proposal",
        tag: "ai",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: 'what your marketing is missing'", sub: "same offer · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: mini-version demo", sub: "60s package walkthrough", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: past client voice", sub: "same story · their numbers", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: 3/day cap = focus", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Proposal sections v1", sub: "AI diagnosis → draft", tag: "ai", brand: "env" },
      { title: "Case study template", sub: "from delivered package", tag: "ai", brand: "both" },
    ],
    Editor: [
      { title: "Proposal review — founder", sub: "actuary-proof gate", tag: "ugc", brand: "env" },
      { title: "Lead follow-up", sub: "auto · Resend", tag: "auto", brand: "both" },
      { title: "Package SOW", sub: "sign before delivery", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "Proposal sent", sub: "diagnosis + sections", tag: "ai", brand: "env" },
      { title: "Case study published", sub: "X + LinkedIn", tag: "auto", brand: "both" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Lead follow-up — diagnosis attached" },
    { tm: "11:00", pt: "WA", tx: "Discovery call — catalyst fit" },
    { tm: "14:00", pt: "IG", tx: "Case study drop — delivered package" },
    { tm: "17:00", pt: "MAIL", tx: "Proposal sent — sections ready" },
  ],
  captionBank: [
    { name: "diagnosis", text: "Get the diagnosis before you buy the medicine." },
    { name: "proof", text: "A working mini-version beats a hundred slide decks." },
    { name: "leads", text: "Three good conversations a day beat a thousand impressions." },
  ],
  gallery: [
    {
      key: "empyrean-proposal",
      img: "/assets/empyrean-proposal.png",
      badge: "AI · PRODUCT",
      title: "AI Proposal Engine",
      cap: "diagnosis → numbered sections → send",
    },
    {
      key: "empyrean-packages",
      img: "/assets/empyrean-packages.png",
      badge: "AI · PRODUCT",
      title: "Client Packages",
      cap: "catalyst · flywheel · mini pilot",
    },
  ],
  products: [
    {
      id: "catalyst",
      label: "CATALYST",
      name: "Seasonal Catalyst",
      tagline: "R38–55k / 90 days · boutique season",
      composerDefault:
        "Seasonal Catalyst: one season, one boutique, one proof — bookings up, case study out, priced to renew.",
      defaultPrompt:
        "Dark-mode seasonal campaign dashboard, booking pipeline, capture calendar, deposit rate card, boutique retail design, crisp screenshot style",
      goals: {
        year: [
          { label: "Catalysts", value: "6 / yr", sub: "R38–55k each", tone: "gold" },
          { label: "Client revenue", value: "R100k+", sub: "per season lifted", tone: "up" },
          { label: "Bookings", value: "40+", sub: "per season", tone: "up" },
          { label: "Renewal", value: "60%", sub: "catalyst → flywheel", tone: "plain" },
          { label: "Case studies", value: "4", sub: "from deliveries", tone: "plain" },
          { label: "Budget cap", value: "R25k", sub: "per season spend", tone: "am" },
        ],
        quarter: [
          { label: "Q4 target", value: "2 catalysts", sub: "dance + summer seasons", tone: "gold" },
          { label: "Bookings", value: "40+", sub: "combined", tone: "up" },
          { label: "Focus", value: "Dance Countdown", sub: "late-booking window", tone: "am" },
          { label: "Assets", value: "200+", sub: "per season", tone: "plain" },
          { label: "UGC", value: "8 creators", sub: "per season", tone: "plain" },
          { label: "Spend", value: "R12k", sub: "warm retargeting", tone: "up" },
        ],
        month: [
          { label: "Sep: catalyst live", value: "Wk 1", sub: "urgency relaunch", tone: "gold" },
          { label: "Bookings", value: "15+", sub: "deposits credited", tone: "up" },
          { label: "Deposit rate", value: "≥1–2%", sub: "per 100 views", tone: "plain" },
          { label: "Hero drops", value: "3", sub: "lookbooks", tone: "plain" },
          { label: "Retargeting", value: "R4k", sub: "warm only", tone: "am" },
          { label: "Cohort", value: "6–8 briefed", sub: "try-on format", tone: "plain" },
        ],
        week: [
          { label: "Assets", value: "15–20", sub: "60/25/15 mix", tone: "gold" },
          { label: "Bookings", value: "3–5", sub: "first closes", tone: "up" },
          { label: "Casting DMs", value: "3 out", sub: "hero pool", tone: "plain" },
          { label: "Email blast", value: "A/B Thu", sub: "warm list", tone: "up" },
          { label: "WA flow", value: "≥70%", sub: "pre-filled booking", tone: "plain" },
          { label: "Spend", value: "R2k", sub: "warm retarget", tone: "am" },
        ],
        day: [
          { label: "Posts today", value: "2", sub: "1 reel · 1 lookbook", tone: "gold" },
          { label: "Reminders", value: "3 auto", sub: "pickup ×2 · alteration", tone: "am" },
          { label: "DM triage", value: "→ high-intent", sub: "reply < 1 hr", tone: "up" },
          { label: "Pipeline due", value: "3 approvals", sub: "editor gate", tone: "plain" },
          { label: "Status", value: "ON WINDOW", sub: "season live", tone: "up" },
          { label: "Runners", value: "6 live", sub: "full machine", tone: "plain" },
        ],
      },
      windows: [
        { s: 0, e: 2, label: "DANCE CATALYST — matric 2026", brand: "env", kind: "capture" },
        { s: 3, e: 4, label: "Summer catalyst — NYE + Met", brand: "both", kind: "capture" },
      ],
      camps: [
        { s: 0, e: 2, label: "Catalyst: bookings + proof", brand: "env", cls: "camp-env" },
        { s: 3, e: 4, label: "Summer catalyst", brand: "env", cls: "camp-env" },
        { s: 0, e: 11, label: "Always-on: weekly drops", brand: "brand", cls: "camp-brand" },
      ],
      pipe: {
        Winner: [
          {
            title: "Book Your Dance — 90-day proof",
            sub: "hook: 'first choice goes to the first to book' · argument: availability + alterations · buyer: matric girls + moms · format: 15s reels",
            tag: "ugc",
            brand: "env",
            variable: "PROVEN",
          },
        ],
        "Test map": [
          { title: "Hook: 'last size in your dress'", sub: "same argument · new opening", tag: "ai", brand: "env", variable: "HOOK" },
          { title: "Format: founder-to-camera", sub: "15s · same script", tag: "ai", brand: "env", variable: "FORMAT" },
          { title: "Face: Hero Girl — same message", sub: "fight ad fatigue", tag: "ugc", brand: "env", variable: "FACE" },
          { title: "Argument: alterations on us", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
        ],
        Draft: [
          { title: "Try-On hooks ×6", sub: "hanger → twirl → verdict", tag: "ai", brand: "brand" },
          { title: "Lookbook drop — emerald", sub: "AI · #AIlookbook", tag: "ai", brand: "env" },
        ],
        Editor: [
          { title: "Hero reel edit", sub: "human gate", tag: "ugc", brand: "env", blocked: "awaiting POPIA + guardian consent" },
          { title: "Retarget ad — urgency", sub: "kill >R1,000 CPA", tag: "ad", brand: "env" },
        ],
        "Post ready": [
          { title: "Hero post — Book Your Dance", sub: "scheduled", tag: "ai", brand: "env" },
          { title: "Case study frames", sub: "proof for renewal", tag: "ugc", brand: "both" },
        ],
      },
      queue: [
        { tm: "09:00", pt: "IG", tx: "Try-On Tuesday reel" },
        { tm: "11:00", pt: "WA", tx: "Broadcast — rail filling" },
        { tm: "16:00", pt: "MAIL", tx: "Last Pieces A/B blast" },
      ],
      captionBank: [
        { name: "urgency", text: "Book before the best sizes disappear. That's not pressure, that's math." },
        { name: "first", text: "First choice goes to the first to book." },
      ],
      gallery: [
        {
          key: "look-emerald",
          img: "/assets/look-emerald.png",
          badge: "AI · HERO 1",
          title: "Corseted Column — Emerald",
          cap: "season hero · lookbook post",
        },
        {
          key: "cd811",
          img: "/assets/product-ladivine-cd811.jpg",
          badge: "YOUR INVENTORY",
          badgeTone: "green",
          title: "Ladivine CD811 — Black",
          cap: "On the rail · rental R2,400",
        },
      ],
    },
    {
      id: "flywheel",
      label: "FLYWHEEL",
      name: "Empire Flywheel",
      tagline: "R38–55k/mo · kicker + equity · portfolio",
      composerDefault:
        "Empire Flywheel: one machine over the ventures — cash, scorecard, and agents running while the founder sleeps.",
      defaultPrompt:
        "Dark-mode portfolio dashboard, entity cards, cash flow panel, scorecard metrics, agent run log, executive design, crisp screenshot style",
      goals: {
        year: [
          { label: "Revenue", value: "R4.8M/yr", sub: "base case · 3 entities", tone: "gold" },
          { label: "Run-rate", value: "R400k/mo", sub: "sustained", tone: "up" },
          { label: "Scorecard", value: "6 / 6", sub: "metrics on target", tone: "up" },
          { label: "Entities", value: "3 live", sub: "holdco · ops · ventures", tone: "plain" },
          { label: "Agents", value: "14", sub: "~50 hrs/wk saved", tone: "plain" },
          { label: "Cash visibility", value: "1 screen", sub: "portfolio dashboard", tone: "am" },
        ],
        quarter: [
          { label: "Q2 target", value: "R1.3M", sub: "matric early-bird + DJ", tone: "gold" },
          { label: "Bookings", value: "150+", sub: "across ventures", tone: "up" },
          { label: "Focus", value: "Scorecard", sub: "kicker triggers", tone: "am" },
          { label: "Assets", value: "400+", sub: "shared library", tone: "plain" },
          { label: "Creators", value: "8 live", sub: "tiered roster", tone: "plain" },
          { label: "Personal brand", value: "250k fol", sub: "+40% QoQ", tone: "up" },
        ],
        month: [
          { label: "May: The Build", value: "40+ assets", sub: "zero media spend", tone: "gold" },
          { label: "Bookings", value: "8–12", sub: "early-bird seed", tone: "up" },
          { label: "Cohort", value: "3 briefed", sub: "UGC", tone: "plain" },
          { label: "Lookbook", value: "20+ images", sub: "5 hero looks", tone: "plain" },
          { label: "Retarget", value: "pixel warming", sub: "no cold spend", tone: "am" },
          { label: "Pins", value: "10+", sub: "DJ keyword capture", tone: "plain" },
        ],
        week: [
          { label: "Assets", value: "10+", sub: "1 shoot → 12", tone: "gold" },
          { label: "Bookings", value: "4+", sub: "attributed", tone: "up" },
          { label: "UGC due", value: "2", sub: "10-day window", tone: "plain" },
          { label: "ROAS", value: "4x+", sub: "warm only", tone: "up" },
          { label: "Pipeline", value: "12 in flight", sub: "concept → ready", tone: "plain" },
          { label: "Reminders", value: "auto", sub: "T-72h pickup", tone: "am" },
        ],
        day: [
          { label: "Posts today", value: "2", sub: "1 feed · 1 story", tone: "gold" },
          { label: "Reminders", value: "3 auto", sub: "pickup ×2 · alteration", tone: "am" },
          { label: "DM triage", value: "112 → 9", sub: "high-intent", tone: "up" },
          { label: "Pipeline due", value: "3 approvals", sub: "editor gate", tone: "plain" },
          { label: "Status", value: "ON WINDOW", sub: "matric decision", tone: "up" },
          { label: "OpenClaw", value: "14 agents", sub: "~4.6 hrs saved", tone: "plain" },
        ],
      },
      windows: [
        { s: 2, e: 4, label: "Quiet season — build", brand: "env", kind: "build" },
        { s: 4, e: 6, label: "MATRIC EARLY-BIRD + DJ", brand: "both", kind: "capture" },
        { s: 6, e: 6, label: "DURBAN JULY — race day", brand: "both", kind: "capture" },
        { s: 8, e: 10, label: "Matric dances — proof", brand: "env", kind: "capture" },
      ],
      camps: [
        { s: 0, e: 3, label: "Foundation: entities + cash", brand: "env", cls: "camp-env" },
        { s: 4, e: 6, label: "Winter Catalyst: matric + DJ", brand: "env", cls: "camp-env" },
        { s: 8, e: 10, label: "Dance-season proof", brand: "both", cls: "camp-env" },
        { s: 0, e: 11, label: "Always-on: weekly + OpenClaw", brand: "brand", cls: "camp-brand" },
      ],
      pipe: {
        Winner: [
          {
            title: "Cash-flow briefing — 07:00 daily",
            sub: "hook: 'one screen, every rand' · argument: scorecard + agents running · buyer: portfolio founder · format: briefing",
            tag: "auto",
            brand: "both",
            variable: "PROVEN",
          },
        ],
        "Test map": [
          { title: "Hook: 'the flywheel's spin rate'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
          { title: "Format: dashboard walkthrough", sub: "60s entity + cash view", tag: "ugc", brand: "env", variable: "FORMAT" },
          { title: "Face: founder voice", sub: "same story · their ventures", tag: "ugc", brand: "both", variable: "FACE" },
          { title: "Argument: 50 hrs/wk saved", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
        ],
        Draft: [
          { title: "Scorecard pack", sub: "6 metrics · kicker view", tag: "ai", brand: "env" },
          { title: "Entity cash summary", sub: "holdco · ops · ventures", tag: "ai", brand: "both" },
        ],
        Editor: [
          { title: "Briefing review", sub: "human gate", tag: "ugc", brand: "env" },
          { title: "OpenClaw run log", sub: "auto · daily", tag: "auto", brand: "both" },
        ],
        "Post ready": [
          { title: "Cash-flow briefing", sub: "07:00 · daily", tag: "auto", brand: "both" },
          { title: "Scorecard month-end", sub: "kicker triggers", tag: "ai", brand: "env" },
        ],
      },
      queue: [
        { tm: "07:00", pt: "MAIL", tx: "Cash-flow briefing — daily" },
        { tm: "13:00", pt: "PIN", tx: "Cape gowns for the races" },
        { tm: "19:30", pt: "FB", tx: "Retarget A3 — urgency" },
      ],
      captionBank: [
        { name: "machine", text: "Four ventures, one machine, zero dropped balls." },
        { name: "score", text: "Six numbers, every month, no surprises." },
      ],
      gallery: [
        {
          key: "tessera-workflow",
          img: "/assets/tessera-workflow.png",
          badge: "AI · PRODUCT",
          title: "Portfolio Machine",
          cap: "entities · cash · agents",
        },
        {
          key: "tessera-dashboard",
          img: "/assets/tessera-dashboard.png",
          badge: "AI · PRODUCT",
          title: "Scorecard Dashboard",
          cap: "6 metrics · kicker view",
        },
      ],
    },
  ],
  decisions: [
    { ts: "26 Aug", action: "Lead engine rate limit — 3/day", state: "Approved", source: "empyrean-consult GOAL M2", rollback: "Raise behind auth", decision: "approve" },
  ],
  reports: [
    { date: "24 Aug", channel: "Site", summary: "Lead form live; AI diagnosis → proposal sections drafted; pytest suite green in CI (Gemini/Resend mocked)." },
  ],
};

export const SLOTS: Record<SlotId, SlotConfig> = {
  envogue: ENVOGUE,
  tessera: TESSERA,
  decile: DECILE,
  itrain: ITRAIN,
  gapos: GAPOS,
  empyrean: EMPYREAN,
};

export const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
