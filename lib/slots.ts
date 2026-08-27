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
  GalleryItem,
  Goal,
  PipeCard,
  QueueEntry,
  TimeScale,
  WindowRow,
} from "./mission-data";

export type SlotId = "envogue" | "tessera" | "decile" | "itrain" | "gapos";

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
      { title: "Face: Hero Girl 1 — same message", sub: "fight ad fatigue on the proven line", tag: "ugc", brand: "env", variable: "FACE" },
      { title: "Argument: alterations on us", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Last Pieces email — A/B", sub: "subject test · warm list", tag: "ai", brand: "env" },
      { title: "Lookbook drop — emerald", sub: "AI · hero look 1 · #AIlookbook", tag: "ai", brand: "env" },
      { title: "WhatsApp broadcast #1", sub: "rail filling · booking CTA", tag: "auto", brand: "env" },
      { title: "Casting DMs ×3", sub: "Hero Girl pool · consent flow", tag: "ugc", brand: "env" },
    ],
    Editor: [
      { title: "Hero Girl reveal edit", sub: "human edits raw footage", tag: "ugc", brand: "env" },
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
    "Pilots → ARR: 12 pilots live this year, 80% renewal, R1.2M ARR. Shinji email-indexer proves the model at $24k pilot → $96k/yr. Model Gate (trust layer) + deepkimi (SLM) are the assets behind every agent. Founder gates every external commitment.",
  brandStrategy:
    "AI employees for bounded tasks: one bounded task, one month pilot; if it doesn't earn its payroll you cut it. Sell on trust — an agent that can't show its work shouldn't do the work (ledger + gates). B2B motion: demo → scoped SOW → build → renewal. Case studies are the sales engine ($24k → $96k/yr).",
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
      { label: "ARR target", value: "R1.2M", sub: "12 pilots → renewals", tone: "gold" },
      { label: "Pilots live", value: "12", sub: "shinji · model gate · deepkimi", tone: "up" },
      { label: "Agents deployed", value: "40+", sub: "across client workflows", tone: "plain" },
      { label: "MRR", value: "R100k", sub: "retained AI employees", tone: "up" },
      { label: "Renewal rate", value: "80%", sub: "pilot → payroll", tone: "up" },
      { label: "Pipeline", value: "R600k", sub: "demo → proposal", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "R180k", sub: "3 pilots closing", tone: "gold" },
      { label: "Pilots", value: "3 live", sub: "shinji · model gate · new", tone: "up" },
      { label: "Focus", value: "Pilot push", sub: "demo → signed SOW", tone: "am" },
      { label: "Agents", value: "12", sub: "in build + live", tone: "plain" },
      { label: "Demos", value: "25", sub: "intake → brief", tone: "plain" },
      { label: "Spend", value: "R0", sub: "build phase · founder time", tone: "up" },
    ],
    month: [
      { label: "Sep: pilot cycle", value: "LIVE", sub: "shinji pilot running", tone: "gold" },
      { label: "Pilots closing", value: "2", sub: "SOWs this month", tone: "up" },
      { label: "Demo rate", value: "5/wk", sub: "inbound + outreach", tone: "plain" },
      { label: "Agents in build", value: "6", sub: "3 tasks each", tone: "plain" },
      { label: "Renewals due", value: "1", sub: "$24k → $96k/yr path", tone: "up" },
      { label: "Usage watch", value: "daily", sub: "quality gates on", tone: "am" },
    ],
    week: [
      { label: "Case assets", value: "3", sub: "proof docs", tone: "gold" },
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
      { label: "Status", value: "PILOT WINDOW", sub: "Q4 closes", tone: "up" },
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
      tagline: "email-indexer · $24k pilot → $96k/yr",
      composerDefault:
        "Shinji: the AI employee that indexes your inbox end-to-end. One pilot, one month — if it doesn't earn its payroll, you cut it.",
      defaultPrompt:
        "Dark-mode email indexing product UI, inbox processing pipeline, organized folder tree, modern SaaS design, crisp screenshot style",
      goals: {
        year: [
          { label: "Revenue", value: "$96k/yr", sub: "$24k pilot → annual", tone: "gold" },
          { label: "Pilots", value: "4 live", sub: "email-indexing SOWs", tone: "up" },
          { label: "Index rate", value: "98%", sub: "of inbox processed", tone: "up" },
          { label: "Hours saved", value: "40/wk", sub: "per client team", tone: "plain" },
          { label: "Renewal", value: "100%", sub: "pilot → payroll", tone: "up" },
          { label: "Pipeline", value: "$120k", sub: "demo → proposal", tone: "am" },
        ],
        quarter: [
          { label: "Q4 target", value: "$24k", sub: "2 pilots closing", tone: "gold" },
          { label: "Pilots", value: "2", sub: "closing this quarter", tone: "up" },
          { label: "Focus", value: "Renewal proof", sub: "$24k → $96k case", tone: "am" },
          { label: "Indexed docs", value: "50k", sub: "cumulative", tone: "plain" },
          { label: "Demos", value: "10", sub: "intake → brief", tone: "plain" },
          { label: "Usage watch", value: "daily", sub: "quality gates on", tone: "up" },
        ],
        month: [
          { label: "Sep: pilot live", value: "LIVE", sub: "shinji running", tone: "gold" },
          { label: "Closing", value: "1 SOW", sub: "this month", tone: "up" },
          { label: "Indexed", value: "15k docs", sub: "monthly volume", tone: "plain" },
          { label: "Emails/day", value: "1,200", sub: "processed", tone: "plain" },
          { label: "Renewal due", value: "1", sub: "$24k → $96k path", tone: "up" },
          { label: "Gates", value: "on", sub: "human checkpoints", tone: "am" },
        ],
        week: [
          { label: "Proof docs", value: "2", sub: "index-rate evidence", tone: "gold" },
          { label: "Demos", value: "3", sub: "bounded-task pitch", tone: "up" },
          { label: "Builds", value: "1", sub: "inbox rules", tone: "plain" },
          { label: "Indexed", value: "3.5k", sub: "this week", tone: "up" },
          { label: "Support", value: "0", sub: "escalate to founder", tone: "plain" },
          { label: "Blockers", value: "0", sub: "none", tone: "am" },
        ],
        day: [
          { label: "Demos today", value: "1", sub: "inbox fit", tone: "gold" },
          { label: "Indexed", value: "500", sub: "documents", tone: "up" },
          { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
          { label: "Approvals", value: "1", sub: "founder gate", tone: "plain" },
          { label: "Status", value: "PILOT", sub: "Q4 closes", tone: "up" },
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
      tagline: "trust layer · ledger + approval gates",
      composerDefault:
        "Model Gate: the trust layer every agent reports to — verification ledger, audit log, deploy gates. If it can't show its work, it doesn't ship.",
      defaultPrompt:
        "Dark-mode trust ledger interface, agent verification checkmarks, audit log rows, approval panel, enterprise design, crisp screenshot style",
      goals: {
        year: [
          { label: "Trust checks", value: "1M+", sub: "verifications run", tone: "gold" },
          { label: "Gate pass", value: "99.9%", sub: "of verified outputs", tone: "up" },
          { label: "Audits", value: "100%", sub: "of deploys logged", tone: "up" },
          { label: "Deploys gated", value: "12", sub: "production ships", tone: "plain" },
          { label: "Clients", value: "4", sub: "on the ledger", tone: "plain" },
          { label: "Uptime", value: "99.9%", sub: "ledger service", tone: "am" },
        ],
        quarter: [
          { label: "Q4 target", value: "250k checks", sub: "ledger volume", tone: "gold" },
          { label: "Gate pass", value: "99.9%", sub: "rolling", tone: "up" },
          { label: "Audits", value: "12", sub: "full trail", tone: "plain" },
          { label: "Focus", value: "Deploy gate rollout", sub: "client #3 + #4", tone: "am" },
          { label: "Clients", value: "2 new", sub: "this quarter", tone: "up" },
          { label: "Uptime", value: "99.9%", sub: "SLA", tone: "plain" },
        ],
        month: [
          { label: "Sep: ledger live", value: "80k checks", sub: "monthly", tone: "gold" },
          { label: "Gate pass", value: "99.9%", sub: "verified", tone: "up" },
          { label: "Audits", value: "4", sub: "this month", tone: "plain" },
          { label: "Deploys", value: "3", sub: "through the gate", tone: "up" },
          { label: "Clients", value: "1 new", sub: "onboarding", tone: "plain" },
          { label: "SLA", value: "<4h", sub: "support", tone: "am" },
        ],
        week: [
          { label: "Checks", value: "20k", sub: "this week", tone: "gold" },
          { label: "Audits", value: "1", sub: "weekly review", tone: "plain" },
          { label: "Deploys", value: "1", sub: "gated ship", tone: "up" },
          { label: "Alerts", value: "0", sub: "ledger healthy", tone: "up" },
          { label: "Support", value: "2 tickets", sub: "SLA met", tone: "plain" },
          { label: "Status", value: "STABLE", sub: "all gates green", tone: "am" },
        ],
        day: [
          { label: "Checks today", value: "3k", sub: "verifications", tone: "gold" },
          { label: "Alerts", value: "0", sub: "gate health", tone: "up" },
          { label: "Approvals", value: "1", sub: "deploy gate", tone: "plain" },
          { label: "Status", value: "GATE ON", sub: "enforcing", tone: "up" },
          { label: "Uptime", value: "99.9%", sub: "30-day", tone: "plain" },
          { label: "Agents", value: "3", sub: "verify · audit · alert", tone: "plain" },
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
};

/* ─────────────── DECILE — AI for regulated finance ─────────────── */

const DECILE: SlotConfig = {
  id: "decile",
  label: "DECILE",
  brandName: "Decile AI",
  logo: "/assets/decile-logo.png",
  accent: "#A78BFA",
  tagline: "Empyrean · AI for regulated finance · validation-first",
  composerDefault:
    "Decile AI: agentic-AI validation for regulated finance. The trust layer is the product — every output carries an audit trail.",
  defaultPrompt:
    "Dark-mode SaaS dashboard for an AI actuarial validation platform, model risk scorecards, validation checklists, audit trail panel, fintech design, crisp screenshot style",
  companyStrat:
    "B2B AI for regulated finance: sell on validation, not magic. Pilot in actuarial/risk workflows; every output carries an audit trail; founder gates all external commitments. Targets: 8 pilots → 85% renewal → R1.8M ARR.",
  brandStrategy:
    "Decile AI: agentic-AI validation for regulated finance — the trust layer is the product. Motion: evidence-engine demo → scoped pilot (bounded validation task) → audit-trail SOW → renewal. Case studies are the sales engine; no cold ad spend.",
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
      { label: "ARR target", value: "R1.8M", sub: "8 pilots → renewals", tone: "gold" },
      { label: "Pilots", value: "8 live", sub: "actuarial / risk workflows", tone: "up" },
      { label: "Renewal rate", value: "85%", sub: "pilot → payroll", tone: "up" },
      { label: "Audit trails", value: "100%", sub: "of outputs logged", tone: "plain" },
      { label: "MRR", value: "R150k", sub: "retained engagements", tone: "up" },
      { label: "Pipeline", value: "R900k", sub: "demo → proposal", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "R240k", sub: "3 pilots closing", tone: "gold" },
      { label: "Pilots", value: "3", sub: "closing this quarter", tone: "up" },
      { label: "Focus", value: "Evidence demos", sub: "validation-first pitch", tone: "am" },
      { label: "Audits", value: "100%", sub: "quality gates on", tone: "plain" },
      { label: "Demos", value: "20", sub: "intake → brief", tone: "plain" },
      { label: "Spend", value: "R0", sub: "build phase · founder time", tone: "up" },
    ],
    month: [
      { label: "Sep: pilot cycle", value: "LIVE", sub: "evidence engine running", tone: "gold" },
      { label: "Closing", value: "2 SOWs", sub: "this month", tone: "up" },
      { label: "Demos", value: "6", sub: "regulated-finance fit", tone: "plain" },
      { label: "Evidence packs", value: "4", sub: "hand-calc proof sets", tone: "plain" },
      { label: "Renewals due", value: "1", sub: "audit trail proof", tone: "up" },
      { label: "Gates", value: "on", sub: "founder approvals", tone: "am" },
    ],
    week: [
      { label: "Evidence docs", value: "2", sub: "validation proof", tone: "gold" },
      { label: "Demos booked", value: "5", sub: "bounded validation tasks", tone: "up" },
      { label: "Pilot builds", value: "1", sub: "scoping → build", tone: "plain" },
      { label: "Audits", value: "100%", sub: "logged + reviewable", tone: "up" },
      { label: "Support", value: "0", sub: "escalate to founder", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
    ],
    day: [
      { label: "Demos today", value: "1", sub: "validation task fit", tone: "gold" },
      { label: "Builds", value: "2", sub: "agent tasks", tone: "up" },
      { label: "Approvals", value: "2", sub: "founder gate", tone: "plain" },
      { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
      { label: "Status", value: "PILOT WINDOW", sub: "Q4 closes", tone: "up" },
      { label: "Agents", value: "3", sub: "evidence · audit · report", tone: "plain" },
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
};

/* ─────────────── ITRAIN — AI training + compliance ─────────────── */

const ITRAIN: SlotConfig = {
  id: "itrain",
  label: "ITRAIN",
  brandName: "iTrain",
  logo: "/assets/itrain-logo.png",
  accent: "#F97316",
  tagline: "Empyrean · AI training + compliance · SA B2B",
  composerDefault:
    "iTrain: AI-built training that closes compliance gaps — course player, learner rosters, certificate status. One department, one bundle, one compliance season.",
  defaultPrompt:
    "Dark-mode training platform dashboard, course completion progress rings, learner roster table, compliance certificate badges, education-tech design, crisp screenshot style",
  companyStrat:
    "B2B training/compliance platform for SA employers: course completion + compliance certificates. Pilot motion: one department, one compliance bundle; renewals on certificate cycles; founder gates external commitments.",
  brandStrategy:
    "iTrain: AI-built training that closes compliance gaps — course player, learner rosters, certificate status. Motion: compliance-audit demo → department pilot → annual certificate renewal. Schools/employers via WhatsApp-first distribution.",
  timeContext: {
    year: "Planning horizon · 2026–27 · compliance seasons",
    quarter: "Q4 2026 · Sep–Nov · compliance season",
    month: "Sep 2026 · course season · LIVE",
    week: "This week · Wk 1 · enrolment push",
    day: "Today · learners",
  },
  calHint: { year: "12-month horizon", quarter: "Q4 (Sep–Nov)", month: "Sep — courses", week: "Wk 1", day: "today" },
  goals: {
    year: [
      { label: "Learners", value: "5,000", sub: "trained annually", tone: "gold" },
      { label: "Certificates", value: "12k", sub: "issued", tone: "up" },
      { label: "ARR", value: "R1.5M", sub: "compliance bundles", tone: "up" },
      { label: "Completion", value: "85%", sub: "course completion", tone: "plain" },
      { label: "Clients", value: "40", sub: "SA employers", tone: "plain" },
      { label: "Renewal", value: "90%", sub: "certificate cycles", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "1,200 learners", sub: "compliance season", tone: "gold" },
      { label: "Certificates", value: "3k", sub: "issued", tone: "up" },
      { label: "Focus", value: "Compliance season", sub: "Q4 closes", tone: "am" },
      { label: "Completion", value: "85%", sub: "rolling", tone: "plain" },
      { label: "Clients", value: "10 new", sub: "this quarter", tone: "up" },
      { label: "Renewal", value: "90%", sub: "on cycle", tone: "plain" },
    ],
    month: [
      { label: "Sep: course season", value: "LIVE", sub: "bundles open", tone: "gold" },
      { label: "Learners", value: "400", sub: "enrolled", tone: "up" },
      { label: "Certificates", value: "1k", sub: "issued", tone: "plain" },
      { label: "Completion", value: "85%", sub: "target", tone: "plain" },
      { label: "Courses", value: "6 live", sub: "AI-built", tone: "up" },
      { label: "Clients", value: "3 new", sub: "onboarded", tone: "am" },
    ],
    week: [
      { label: "Learners", value: "100", sub: "this week", tone: "gold" },
      { label: "Certificates", value: "250", sub: "issued", tone: "up" },
      { label: "Completion", value: "85%", sub: "target", tone: "plain" },
      { label: "Courses", value: "1 build", sub: "AI draft → review", tone: "plain" },
      { label: "Support", value: "2 tickets", sub: "SLA met", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
    ],
    day: [
      { label: "Learners today", value: "15", sub: "enrolled", tone: "gold" },
      { label: "Certificates", value: "40", sub: "issued", tone: "up" },
      { label: "Completion", value: "85%", sub: "target", tone: "plain" },
      { label: "Approvals", value: "2", sub: "course review", tone: "plain" },
      { label: "Status", value: "COMPLIANCE WINDOW", sub: "Q4 season", tone: "up" },
      { label: "Agents", value: "2", sub: "course build · reminders", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "COMPLIANCE SEASON — Q4 closes", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Certificate renewal cycle", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — 2027 courses", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "Enrolment sprint", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Compliance bundles", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Certificate renewals", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Course build (AI)", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Enrolment sprint", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: learner support", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Compliance bundle drop — Q4 season",
        sub: "hook: 'your certificates expire' · argument: close the gap before December · buyer: HR / ops managers · format: course drop",
        tag: "ai",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: 'the December scare'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: learner demo", sub: "60s course walkthrough", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: HR voice", sub: "same story · their department", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: 85% completion", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Compliance audit → bundle", sub: "gap → course list", tag: "ugc", brand: "env" },
      { title: "Course brief", sub: "AI draft from docs", tag: "ai", brand: "env" },
      { title: "Course v1 — AI build", sub: "6 modules", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Course review — human", sub: "expert gate", tag: "ugc", brand: "env" },
      { title: "Learner reminders", sub: "auto · WA-first", tag: "auto", brand: "both" },
      { title: "Bundle SOW — founder", sub: "sign before launch", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "Course launch post", sub: "LinkedIn + WA broadcast", tag: "ai", brand: "both" },
      { title: "Expiry nudge flow", sub: "certificate renewal", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Certificate expiry nudge — batch" },
    { tm: "11:00", pt: "WA", tx: "Learner reminder — module 3" },
    { tm: "14:00", pt: "IG", tx: "Course drop — compliance bundle" },
    { tm: "17:00", pt: "MAIL", tx: "Client renewal — Q4 season" },
  ],
  captionBank: [
    { name: "compliance", text: "Your certificates expire. Your training shouldn't be the risk." },
    { name: "learner", text: "Five minutes a day beats a compliance scare in December." },
    { name: "cert", text: "The certificate is the deliverable. The learning is the point." },
  ],
  gallery: [
    {
      key: "itrain-dashboard",
      img: "/assets/itrain-dashboard.png",
      badge: "AI · PRODUCT",
      title: "Learner Dashboard",
      cap: "completion · rosters · certificates",
    },
    {
      key: "itrain-course",
      img: "/assets/itrain-course.png",
      badge: "AI · PRODUCT",
      title: "Course Player",
      cap: "lessons · checklists · quizzes",
    },
  ],
};

/* ─────────────── GAPOS — goals operating system ─────────────── */

const GAPOS: SlotConfig = {
  id: "gapos",
  label: "GAPOS",
  brandName: "GapOS",
  logo: "/assets/gapos-logo.png",
  accent: "#34D399",
  tagline: "Empyrean · goals operating system · gap-to-target",
  composerDefault:
    "GapOS: the operating system for goals — target vs actual, gap severity, action plans with owners. The gap chart is the product.",
  defaultPrompt:
    "Dark-mode goals operating system dashboard, OKR progress bars, gap analysis chart target vs actual, team goals list with status chips, modern design, crisp screenshot style",
  companyStrat:
    "Goals OS for leadership teams: targets, gap analysis, action plans in one screen. Pilot: one team, one quarter of goals; renewal on quarter cadence; founder gates external commitments.",
  brandStrategy:
    "GapOS: the operating system for goals — target vs actual, gap severity, action plans with owners. Motion: leadership demo → team pilot (one quarter) → quarterly renewal. The gap chart is the product; WhatsApp weekly check-ins keep it alive.",
  timeContext: {
    year: "Planning horizon · 2026–27 · quarterly cadence",
    quarter: "Q4 2026 · Oct–Dec · goals set + tracked",
    month: "Sep 2026 · Q4 planning",
    week: "This week · Wk 1 · planning sprint",
    day: "Today · check-ins",
  },
  calHint: { year: "12-month horizon", quarter: "Q4 (Oct–Dec)", month: "Sep — planning", week: "Wk 1", day: "today" },
  goals: {
    year: [
      { label: "Teams", value: "30", sub: "on the OS", tone: "gold" },
      { label: "Goals tracked", value: "2,400", sub: "target vs actual", tone: "up" },
      { label: "ARR", value: "R1.2M", sub: "quarterly renewals", tone: "up" },
      { label: "Gap closure", value: "80%", sub: "of gaps actioned", tone: "plain" },
      { label: "Renewal", value: "85%", sub: "quarter over quarter", tone: "plain" },
      { label: "Pipeline", value: "R600k", sub: "demo → pilot", tone: "am" },
    ],
    quarter: [
      { label: "Q4 target", value: "8 teams", sub: "new on OS", tone: "gold" },
      { label: "Goals", value: "600", sub: "tracked", tone: "up" },
      { label: "Focus", value: "Q4 planning", sub: "goals set by Oct 1", tone: "am" },
      { label: "Gap closure", value: "80%", sub: "action plans live", tone: "plain" },
      { label: "Renewals", value: "5 due", sub: "this quarter", tone: "up" },
      { label: "Action plans", value: "120", sub: "with owners", tone: "plain" },
    ],
    month: [
      { label: "Sep: Q4 planning", value: "LIVE", sub: "goals setting", tone: "gold" },
      { label: "Teams", value: "3 new", sub: "onboarded", tone: "up" },
      { label: "Goals", value: "200", sub: "entered", tone: "plain" },
      { label: "Gap closure", value: "80%", sub: "target", tone: "plain" },
      { label: "Plans", value: "40", sub: "actioned", tone: "up" },
      { label: "Renewals", value: "2", sub: "closing", tone: "am" },
    ],
    week: [
      { label: "Goals updated", value: "50", sub: "this week", tone: "gold" },
      { label: "Plans", value: "10", sub: "actioned", tone: "up" },
      { label: "Gap closure", value: "80%", sub: "target", tone: "plain" },
      { label: "Support", value: "1 ticket", sub: "SLA met", tone: "plain" },
      { label: "Blockers", value: "0", sub: "none", tone: "am" },
      { label: "Status", value: "PLANNING", sub: "Q4 window", tone: "plain" },
    ],
    day: [
      { label: "Updates today", value: "10", sub: "goal entries", tone: "gold" },
      { label: "Plans", value: "2", sub: "actioned", tone: "up" },
      { label: "Approvals", value: "1", sub: "goal review", tone: "plain" },
      { label: "Support", value: "0", sub: "SLA < 4h", tone: "plain" },
      { label: "Status", value: "ON TRACK", sub: "gap monitor", tone: "up" },
      { label: "Agents", value: "2", sub: "check-ins · reports", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "Q4 PLANNING — goals set", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Q4 review + renewals", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — 2027 templates", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "Q1 2027 planning", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Q4 planning sprint", brand: "env", cls: "camp-env" },
    { s: 3, e: 4, label: "Reviews + renewals", brand: "env", cls: "camp-env" },
    { s: 6, e: 7, label: "Template build (AI)", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Q1 2027 planning", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: weekly check-ins", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Winner: [
      {
        title: "Gap chart — Q4 goals launch",
        sub: "hook: 'the gap is the map' · argument: targets + owners + dates · buyer: leadership teams · format: gap chart",
        tag: "ai",
        brand: "both",
        variable: "PROVEN",
      },
    ],
    "Test map": [
      { title: "Hook: 'a goal without a date'", sub: "same proof · new opening", tag: "ai", brand: "env", variable: "HOOK" },
      { title: "Format: live check-in", sub: "60s weekly review", tag: "ugc", brand: "env", variable: "FORMAT" },
      { title: "Face: leader voice", sub: "same story · their team", tag: "ugc", brand: "both", variable: "FACE" },
      { title: "Argument: 80% gap closure", sub: "new reason · same buyer", tag: "ai", brand: "env", variable: "ARGUMENT" },
    ],
    Draft: [
      { title: "Leadership demo → brief", sub: "one quarter pilot", tag: "ugc", brand: "env" },
      { title: "Goal template pack", sub: "AI-drafted per team", tag: "ai", brand: "env" },
      { title: "Team goals v1", sub: "targets + owners", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Goal review — human", sub: "leader gate", tag: "ugc", brand: "env" },
      { title: "Check-in reminders", sub: "auto · WA", tag: "auto", brand: "both" },
      { title: "Pilot SOW — founder", sub: "sign before build", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "Q4 goals launch", sub: "client comms", tag: "ai", brand: "both" },
      { title: "Weekly gap digest", sub: "auto · Fri", tag: "auto", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "MAIL", tx: "Gap digest — weekly auto" },
    { tm: "11:00", pt: "WA", tx: "Check-in reminder — team A" },
    { tm: "14:00", pt: "IG", tx: "Goal-setting drop — Q4 planning" },
    { tm: "17:00", pt: "MAIL", tx: "Renewal — quarter review" },
  ],
  captionBank: [
    { name: "gap", text: "The gap isn't failure — it's the map." },
    { name: "target", text: "A goal without a date is a wish with a deadline." },
    { name: "plan", text: "Every gap needs an owner. Every owner needs a date." },
  ],
  gallery: [
    {
      key: "gapos-dashboard",
      img: "/assets/gapos-dashboard.png",
      badge: "AI · PRODUCT",
      title: "Goals OS Dashboard",
      cap: "OKRs · progress · status chips",
    },
    {
      key: "gapos-gap",
      img: "/assets/gapos-gap.png",
      badge: "AI · PRODUCT",
      title: "Gap Analysis",
      cap: "target vs actual · action plans",
    },
  ],
};

export const SLOTS: Record<SlotId, SlotConfig> = {
  envogue: ENVOGUE,
  tessera: TESSERA,
  decile: DECILE,
  itrain: ITRAIN,
  gapos: GAPOS,
};

export const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
