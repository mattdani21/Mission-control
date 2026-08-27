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

export type SlotId = "envogue" | "tessera";

export interface CaptionEntry {
  name: string;
  text: string;
}

export interface SlotConfig {
  id: SlotId;
  label: string;
  brandName: string;
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
}

const GENERIC_PROMPT =
  "Editorial fashion photograph, elegant evening gown, South African model, golden hour on Camps Bay beach, Vogue editorial style, full body, natural relaxed hands with five visible fingers";

/* ──────────────────── ENVOGUE — Dance Countdown 2026 ──────────────────── */

const ENVOGUE: SlotConfig = {
  id: "envogue",
  label: "ENVOGUE",
  brandName: "Envogue",
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
    Concept: [
      { title: "Hero Girl 1 — journey ep 1", sub: "fitting → reveal · serial", tag: "ugc", brand: "env" },
      { title: "'Book Your Dance' landing refresh", sub: "2026 · deadline 30 Sep", tag: "ai", brand: "env" },
      { title: "Try-On Tuesday hooks ×6", sub: "hanger → twirl → verdict", tag: "ai", brand: "brand" },
      { title: "UGC brief: Tier 1 creator", sub: "try-on haul · 7-day window", tag: "ugc", brand: "env" },
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
      { title: "Retargeting urgency static", sub: "A3 · warm audiences", tag: "ad", brand: "env" },
    ],
    Approval: [
      { title: "Retargeting ad — urgency", sub: "kill >R1,000 CPA", tag: "ad", brand: "env" },
      { title: "Rail Report #0 frames", sub: "weekly roundup", tag: "ugc", brand: "both" },
    ],
    "Post ready": [
      { title: "'Book Your Dance' hero post", sub: "scheduled · IG+TikTok+Pin", tag: "ai", brand: "env" },
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
  tagline: "Empyrean · AI employees · bounded tasks · pilot → ARR",
  composerDefault:
    "Tessera: an AI employee that owns a bounded task end-to-end. One pilot, one month — if it doesn't earn its payroll, you cut it.",
  defaultPrompt: GENERIC_PROMPT,
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
    Concept: [
      { title: "Demo request → brief", sub: "5/wk · intake", tag: "ugc", brand: "env" },
      { title: "Pilot scoping doc", sub: "bounded task · 1 month", tag: "ai", brand: "env" },
      { title: "Case study — shinji", sub: "$24k pilot → $96k/yr", tag: "ai", brand: "both" },
    ],
    Draft: [
      { title: "Model Gate deck", sub: "trust layer · ledger", tag: "ai", brand: "env" },
      { title: "Pilot SOW v2", sub: "scope + gates", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Demo recording edit", sub: "human gate", tag: "ugc", brand: "env" },
      { title: "Usage report", sub: "weekly · auto", tag: "auto", brand: "both" },
    ],
    Approval: [
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
      key: "emerald",
      img: "/assets/look-emerald.png",
      badge: "ASSET · PLACEHOLDER",
      title: "Case visual",
      cap: "swap for shinji/model-gate product visual",
    },
    {
      key: "cd811",
      img: "/assets/product-ladivine-cd811.jpg",
      badge: "ASSET · PLACEHOLDER",
      badgeTone: "green",
      title: "Proof artifact",
      cap: "swap for ledger / usage screenshot",
    },
  ],
};

export const SLOTS: Record<SlotId, SlotConfig> = {
  envogue: ENVOGUE,
  tessera: TESSERA,
};

export const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
