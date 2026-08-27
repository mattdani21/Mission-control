/**
 * Slot templates — Mission Control as a productized template engine.
 *
 * Each slot is one client tier / engagement archetype. The dashboard toggle
 * (BULK · MEDIAN · DECIDER · HIGH TREND) switches the entire context: brand,
 * goals per time scale, capture calendar, pipeline, queue, caption bank and
 * gallery. New clients = drop a new SlotConfig in here (or copy a slot and
 * swap the data) — no UI changes needed.
 *
 * Seeded from real package data where it exists:
 *   - median:    Envogue × Empyrean Dance Countdown 2026 (live) — the reference
 *   - decider:   Micaelan Jade Empire Flywheel (retained, R4.8M/yr base case)
 *   - bulk:      mini-pilot template (high volume, low touch) — template seed
 *   - high-trend: personal-brand / trend-flag engine — template seed
 * Bulk / high-trend numbers are placeholders to be defined per client.
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

export type SlotId = "bulk" | "median" | "decider" | "high-trend";

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

/* ─────────────────────────── BULK — mini pilots ─────────────────────────── */

const BULK: SlotConfig = {
  id: "bulk",
  label: "BULK",
  brandName: "The Bulk",
  tagline: "Empyrean · mini pilots · high volume, low touch",
  composerDefault:
    "Matric 2026 dance dresses — R500 deposit locks your size. Sizes 34–42. First choice goes to the first to book.",
  defaultPrompt: GENERIC_PROMPT,
  timeContext: {
    year: "Planning horizon · pilot season · single capture window",
    quarter: "Q4 2026 · pilot sprint · Sep–Nov",
    month: "Sep 2026 · pilot live",
    week: "This week · Wk 1 · intake + first drops",
    day: "Today · booking push",
  },
  calHint: {
    year: "12-month horizon",
    quarter: "Q4 (Sep–Nov)",
    month: "Sep — pilot",
    week: "Wk 1",
    day: "today",
  },
  goals: {
    year: [
      { label: "Bookings", value: "60+", sub: "R500 deposits · high volume", tone: "gold" },
      { label: "Revenue", value: "R90k", sub: "pilot stack · 3 clients", tone: "up" },
      { label: "Assets", value: "300+", sub: "UGC 70% · AI 30%", tone: "plain" },
      { label: "Capture windows", value: "1 / 1", sub: "dance season pilot", tone: "up" },
      { label: "Budget", value: "R12k", sub: "per pilot · zero cold", tone: "am" },
      { label: "CPA", value: "R250", sub: "target · kill >R750", tone: "up" },
    ],
    quarter: [
      { label: "Pilot target", value: "R22k", sub: "single window", tone: "gold" },
      { label: "Bookings", value: "15+", sub: "deposits credited", tone: "up" },
      { label: "Capture focus", value: "Dance season", sub: "matric 2026", tone: "am" },
      { label: "Assets", value: "80+", sub: "try-on + lookbook", tone: "plain" },
      { label: "UGC creators", value: "3 nano", sub: "barter + feature", tone: "plain" },
      { label: "Spend", value: "R3k", sub: "warm retarget only", tone: "up" },
    ],
    month: [
      { label: "Sep: pilot live", value: "LIVE", sub: "bookings open", tone: "gold" },
      { label: "Bookings", value: "8+", sub: "first deposits", tone: "up" },
      { label: "Deposit rate", value: "≥1%", sub: "per 100 views", tone: "plain" },
      { label: "Lookbook drops", value: "2", sub: "hero looks", tone: "plain" },
      { label: "Retargeting", value: "R1.5k", sub: "warm only", tone: "am" },
      { label: "Cohort", value: "3 briefed", sub: "try-on format", tone: "plain" },
    ],
    week: [
      { label: "Assets (this wk)", value: "8–10", sub: "phone UGC + AI", tone: "gold" },
      { label: "Bookings", value: "2–3", sub: "first closes", tone: "up" },
      { label: "Casting DMs", value: "5 out", sub: "prospect pool", tone: "plain" },
      { label: "Email blast", value: "1 send", sub: "warm list", tone: "up" },
      { label: "WA flow", value: "≥60%", sub: "pre-filled booking", tone: "plain" },
      { label: "Spend", value: "R750", sub: "warm retarget", tone: "am" },
    ],
    day: [
      { label: "Posts today", value: "1", sub: "try-on reel", tone: "gold" },
      { label: "Reminders", value: "2 auto", sub: "pickup · alteration", tone: "am" },
      { label: "DM triage", value: "→ high-intent", sub: "reply < 2 hr", tone: "up" },
      { label: "Pipeline due", value: "2 approvals", sub: "editor gate", tone: "plain" },
      { label: "Capture status", value: "PILOT LIVE", sub: "dance season", tone: "up" },
      { label: "Runners", value: "3 live", sub: "content · WA · report", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "DANCE PILOT — matric 2026", brand: "env", kind: "capture" },
    { s: 3, e: 4, label: "Summer lite — NYE + results", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "The Build — assets", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "Matric 2027 seed", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Pilot: bookings + proof", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Matric 2027 seed", brand: "env", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: weekly posts", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Concept: [
      { title: "Intake offer DM ×5", sub: "prospect pool", tag: "ugc", brand: "env" },
      { title: "Try-on reel hooks ×3", sub: "hanger → twirl → verdict", tag: "ai", brand: "brand" },
    ],
    Draft: [
      { title: "Booking email", sub: "warm list · single send", tag: "ai", brand: "env" },
      { title: "Lookbook drop — emerald", sub: "AI · #AIlookbook", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "Pilot reel edit", sub: "human edits raw footage", tag: "ugc", brand: "env" },
    ],
    Approval: [
      { title: "Retarget lite — urgency", sub: "R1.5k warm", tag: "ad", brand: "env" },
    ],
    "Post ready": [
      { title: "First pilot post", sub: "scheduled · IG+TikTok", tag: "ai", brand: "env" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "IG", tx: "Try-on reel — first pilot drop" },
    { tm: "11:00", pt: "WA", tx: "Pilot broadcast — rail filling" },
    { tm: "16:00", pt: "MAIL", tx: "Booking email — warm list" },
  ],
  captionBank: [
    { name: "aspiration", text: "The dress you remember walks in first. This one knows her." },
    { name: "urgency", text: "Book before the best sizes disappear. That's not pressure, that's math." },
    { name: "rental", text: "Rented, not owned — but the memory is all yours." },
  ],
  gallery: [
    {
      key: "emerald",
      img: "/assets/look-emerald.png",
      badge: "AI · HERO 1",
      title: "Corseted Column — Emerald",
      cap: "Pilot hero · lookbook post",
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
  ],
};

/* ─────────────────── MEDIAN — Seasonal Catalyst (Envogue) ────────────────── */

const MEDIAN: SlotConfig = {
  id: "median",
  label: "MEDIAN",
  brandName: "Envogue",
  tagline: "Empyrean Consult · plan the year · capture the market · publish everywhere",
  composerDefault:
    "The corseted column is the matric look of 2026. Book before 30 September and alterations are on us. Sizes 34–42. First choice goes to the first to book.",
  defaultPrompt: GENERIC_PROMPT,
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

/* ─────────────── DECIDER — retained flywheel (Micaelan Jade) ─────────────── */

const DECIDER: SlotConfig = {
  id: "decider",
  label: "DECIDER",
  brandName: "Micaelan Jade",
  tagline: "Empyrean · retained flywheel · kicker + equity",
  composerDefault:
    "Portfolio headline: four ventures, one machine — cash, scorecard, and OpenClaw agents running while the founder sleeps.",
  defaultPrompt: GENERIC_PROMPT,
  timeContext: {
    year: "Planning horizon · 2027 · portfolio flywheel · 3 entities",
    quarter: "Q2 2027 · Apr–Jun · matric early-bird + Durban July",
    month: "May 2027 · The Build · zero spend",
    week: "This week · Wk 20 · lookbook + UGC cohort",
    day: "Today · flywheel run",
  },
  calHint: {
    year: "12-month horizon",
    quarter: "Q2 (Apr–Jun)",
    month: "May — The Build",
    week: "Wk 20",
    day: "today",
  },
  goals: {
    year: [
      { label: "Revenue (base case)", value: "R4.8M", sub: "Envogue + dress line + software", tone: "gold" },
      { label: "Run-rate", value: "R400k/mo", sub: "sustained · 3 entities", tone: "up" },
      { label: "Scorecard", value: "6 / 6", sub: "governance metrics on target", tone: "up" },
      { label: "Entities", value: "3 live", sub: "holdco · ops · ventures", tone: "plain" },
      { label: "Agents", value: "14", sub: "OpenClaw automations · ~50 hrs/wk", tone: "plain" },
      { label: "Cash visibility", value: "1 screen", sub: "portfolio dashboard live", tone: "am" },
    ],
    quarter: [
      { label: "Q2 target (Apr–Jun)", value: "R1.3M", sub: "matric early-bird opens May", tone: "gold" },
      { label: "Bookings", value: "150+", sub: "40+ from Winter Catalyst", tone: "up" },
      { label: "Capture focus", value: "Matric + DJ", sub: "decision windows open", tone: "am" },
      { label: "Assets", value: "400+", sub: "lookbook 20 · UGC 60 · remix", tone: "plain" },
      { label: "UGC creators", value: "8 live", sub: "Tier 1 ×3 · Tier 2 ×3 · Tier 3 ×2", tone: "plain" },
      { label: "Personal brand", value: "250k fol", sub: "+40% QoQ", tone: "up" },
    ],
    month: [
      { label: "May: The Build", value: "40+ assets", sub: "zero media spend", tone: "gold" },
      { label: "Bookings target", value: "8–12", sub: "early-bird seed", tone: "up" },
      { label: "UGC cohort 1", value: "3 briefed", sub: "dresses out Wk3", tone: "plain" },
      { label: "Lookbook drop", value: "20+ images", sub: "5 hero looks", tone: "plain" },
      { label: "Retargeting", value: "pixel warming", sub: "no cold spend", tone: "am" },
      { label: "Pinterest pins", value: "10+", sub: "DJ keyword capture", tone: "plain" },
    ],
    week: [
      { label: "Assets (this wk)", value: "10+", sub: "1 shoot → 12 assets", tone: "gold" },
      { label: "Bookings", value: "4+", sub: "attr. via UTM", tone: "up" },
      { label: "UGC due", value: "2 deliverables", sub: "10-day window", tone: "plain" },
      { label: "Retargeting ROAS", value: "4x+", sub: "warm audiences only", tone: "up" },
      { label: "Pipeline progress", value: "12 in flight", sub: "concept → ready", tone: "plain" },
      { label: "Reminders sent", value: "auto", sub: "T-72h pickup · alterations", tone: "am" },
    ],
    day: [
      { label: "Posts today", value: "2", sub: "1 feed · 1 story", tone: "gold" },
      { label: "Reminders", value: "3 auto", sub: "pickup ×2 · alteration ×1", tone: "am" },
      { label: "DM triage", value: "112 → 9", sub: "9 high-intent", tone: "up" },
      { label: "Pipeline due", value: "3 approvals", sub: "editor gate today", tone: "plain" },
      { label: "Capture status", value: "ON WINDOW", sub: "matric decision window", tone: "up" },
      { label: "OpenClaw runs", value: "14 agents", sub: "~4.6 hrs saved today", tone: "plain" },
    ],
  },
  windows: [
    { s: 2, e: 4, label: "Quiet season — build assets", brand: "env", kind: "build" },
    { s: 4, e: 6, label: "MATRIC EARLY-BIRD decision window", brand: "both", kind: "capture" },
    { s: 5, e: 6, label: "Durban July dress decisions", brand: "both", kind: "capture" },
    { s: 6, e: 6, label: "DURBAN JULY — race day (Sat)", brand: "both", kind: "capture" },
    { s: 7, e: 8, label: "Matric late push + alterations", brand: "env", kind: "capture" },
    { s: 8, e: 10, label: "Matric dances (Sep–Nov)", brand: "env", kind: "capture" },
    { s: 9, e: 11, label: "Summer / gala / year-end", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 3, label: "Foundation: brand + inventory", brand: "env", cls: "camp-env" },
    { s: 3, e: 5, label: "Lookbook build (AI)", brand: "env", cls: "camp-env" },
    { s: 4, e: 6, label: "Winter Catalyst: matric + DJ", brand: "env", cls: "camp-env" },
    { s: 5, e: 7, label: "Race-week amplification", brand: "brand", cls: "camp-brand" },
    { s: 7, e: 8, label: "Spring urgency", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Dance-season social proof", brand: "both", cls: "camp-env" },
    { s: 9, e: 11, label: "Summer campaign + Q4", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: weekly content", brand: "brand", cls: "camp-brand" },
    { s: 5, e: 6, label: "DJ teaser: Pinterest-first", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Concept: [
      { title: "Matric hero-look carousel", sub: "AI trend scan → 5 looks", tag: "ai", brand: "env" },
      { title: "'What the Racecourse Wants'", sub: "DJ 2027 teaser · Pinterest-first", tag: "ai", brand: "both" },
      { title: "GRWM reel hooks ×6", sub: "from caption bank", tag: "ai", brand: "brand" },
      { title: "UGC brief: Tier 1 creator", sub: "try-on haul · 10-day window", tag: "ugc", brand: "env" },
    ],
    Draft: [
      { title: "Lookbook drop — emerald", sub: "20+ AI images · hero look 1", tag: "ai", brand: "env" },
      { title: "Cape gown pins ×10", sub: "DJ keyword titles", tag: "ai", brand: "both" },
      { title: "Booking reminder flow", sub: "T-72h pickup · auto", tag: "auto", brand: "env" },
      { title: "Early-bird email", sub: "alterations offer · 30 Jun", tag: "ai", brand: "env" },
    ],
    Editor: [
      { title: "UGC try-on reel — creator A", sub: "human edits raw footage", tag: "ugc", brand: "env" },
      { title: "Alteration slot reminder", sub: "auto + human copy check", tag: "auto", brand: "env" },
      { title: "Dress line launch carousel", sub: "50 units · waitlist 1,000+", tag: "ai", brand: "brand" },
    ],
    Approval: [
      { title: "Retargeting ad 6 — urgency", sub: "A3 checkout · freq ≤3.5", tag: "ad", brand: "env" },
      { title: "Story takeover frames", sub: "race-day · brand-safe", tag: "ugc", brand: "both" },
    ],
    "Post ready": [
      { title: "Liquid metallic hero post", sub: "scheduled · IG+TikTok+Pin", tag: "ai", brand: "env" },
      { title: "GRWM reel — creator B", sub: "published · 2.8x ROAS", tag: "ugc", brand: "both" },
      { title: "Cash-flow briefing", sub: "auto · 07:00 daily", tag: "auto", brand: "both" },
    ],
  },
  queue: [
    { tm: "13:00", pt: "PIN", tx: "Cape gowns for the races: velvet cape moment" },
    { tm: "14:30", pt: "IG", tx: "Corseted column — emerald · carousel (5 frames)" },
    { tm: "16:00", pt: "TIK", tx: "What the Racecourse Wants — 90s breakdown" },
    { tm: "18:00", pt: "IG", tx: "Story: pickup reminder T-72h ×2" },
    { tm: "19:30", pt: "FB", tx: "Retargeting A3 — urgency variant" },
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
      cap: "Matric 2027 hero · lookbook post + pin",
    },
    {
      key: "champagne",
      img: "/assets/look-champagne.png",
      badge: "AI · HERO 4",
      title: "Liquid Metallic — Champagne",
      cap: "Durban July money look · race week",
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
      cap: "Durban July contender · booking open",
    },
    {
      key: "ps25984c",
      img: "/assets/product-portia-scarlett.jpg",
      badge: "YOUR INVENTORY",
      badgeTone: "green",
      title: "Portia & Scarlett PS25984C",
      cap: "Race-week statement · only 1 unit",
    },
  ],
};

/* ──────────────── HIGH TREND — personal-brand trend engine ──────────────── */

const HIGH_TREND: SlotConfig = {
  id: "high-trend",
  label: "HIGH TREND",
  brandName: "The High Trend",
  tagline: "Empyrean · trend engine · personal brand · PR halo",
  composerDefault:
    "Trend authority: the look the feeds will be talking about by spring — editorial-first, PR halo, personal-brand distribution.",
  defaultPrompt: GENERIC_PROMPT,
  timeContext: {
    year: "Planning horizon · trend engine · 8 campaigns · PR halo",
    quarter: "Q2 2027 · trend push · editorial + collabs",
    month: "May 2027 · editorial build",
    week: "This week · Wk 20 · drop + PR",
    day: "Today · trend window",
  },
  calHint: {
    year: "12-month horizon",
    quarter: "Q2 (Apr–Jun)",
    month: "May — editorial",
    week: "Wk 20",
    day: "today",
  },
  goals: {
    year: [
      { label: "Followers", value: "1M", sub: "personal brand · 30% of bookings", tone: "am" },
      { label: "Campaigns", value: "8 / yr", sub: "seasonal + PR moments", tone: "gold" },
      { label: "PR features", value: "12+", sub: "editorial · podcast · radio", tone: "up" },
      { label: "Assets", value: "1,500+", sub: "AI 60% · UGC 40%", tone: "plain" },
      { label: "Capture windows", value: "6 / 6", sub: "trend · summer · date · matric'27 · july · gala", tone: "up" },
      { label: "ROAS (blended)", value: "3.2x", sub: "retargeting only", tone: "up" },
    ],
    quarter: [
      { label: "Q2 trend push", value: "R1.3M", sub: "editorial + collabs", tone: "gold" },
      { label: "Reach", value: "250k", sub: "IG + TikTok + press", tone: "up" },
      { label: "PR features", value: "3", sub: "this quarter", tone: "am" },
      { label: "Assets", value: "400+", sub: "editorial first", tone: "plain" },
      { label: "Creators", value: "12 live", sub: "collab roster", tone: "plain" },
      { label: "Spend", value: "R18k", sub: "warm only", tone: "up" },
    ],
    month: [
      { label: "May: editorial build", value: "40+ assets", sub: "zero media spend", tone: "gold" },
      { label: "Reach target", value: "60k", sub: "organic + PR", tone: "up" },
      { label: "Collabs", value: "4 briefed", sub: "creator drops", tone: "plain" },
      { label: "Pins", value: "20+", sub: "trend keywords", tone: "plain" },
      { label: "Retargeting", value: "pixel warming", sub: "no cold spend", tone: "am" },
      { label: "Trend scan", value: "weekly", sub: "auto research", tone: "plain" },
    ],
    week: [
      { label: "Assets (this wk)", value: "12+", sub: "editorial mix", tone: "gold" },
      { label: "Reach", value: "15k", sub: "3 reels + pins", tone: "up" },
      { label: "Collab drop", value: "1", sub: "creator feature", tone: "plain" },
      { label: "Reels", value: "3", sub: "9:16 · captions on", tone: "up" },
      { label: "Stories", value: "daily", sub: "BTS + polls", tone: "plain" },
      { label: "Trend scan", value: "auto", sub: "Fri digest", tone: "am" },
    ],
    day: [
      { label: "Posts today", value: "3", sub: "1 reel · 1 editorial · 1 story", tone: "gold" },
      { label: "Reels", value: "1", sub: "hook in 2s", tone: "up" },
      { label: "PR pitch", value: "1 out", sub: "editorial list", tone: "am" },
      { label: "Pipeline due", value: "2 approvals", sub: "editor gate", tone: "plain" },
      { label: "Capture status", value: "TREND WINDOW", sub: "spring look", tone: "up" },
      { label: "Agents", value: "8 live", sub: "content · PR · scan", tone: "plain" },
    ],
  },
  windows: [
    { s: 0, e: 2, label: "TREND DROP — spring look", brand: "both", kind: "capture" },
    { s: 3, e: 4, label: "Summer editorial", brand: "both", kind: "capture" },
    { s: 5, e: 5, label: "Valentine's edit", brand: "both", kind: "capture" },
    { s: 6, e: 7, label: "Build — 2027 collection", brand: "env", kind: "build" },
    { s: 8, e: 10, label: "Matric 2027 trend set", brand: "both", kind: "capture" },
    { s: 9, e: 10, label: "Durban July looks-for-less", brand: "both", kind: "capture" },
    { s: 11, e: 11, label: "Year-end gala edit", brand: "both", kind: "capture" },
  ],
  camps: [
    { s: 0, e: 2, label: "Trend drop — spring look", brand: "both", cls: "camp-env" },
    { s: 3, e: 4, label: "Summer editorial", brand: "env", cls: "camp-env" },
    { s: 5, e: 5, label: "Date-night edit", brand: "both", cls: "camp-env" },
    { s: 6, e: 7, label: "Build: 2027 collection", brand: "env", cls: "camp-env" },
    { s: 8, e: 10, label: "Matric 2027 trend set", brand: "env", cls: "camp-env" },
    { s: 9, e: 10, label: "July looks-for-less", brand: "both", cls: "camp-env" },
    { s: 11, e: 11, label: "Gala edit", brand: "both", cls: "camp-env" },
    { s: 0, e: 11, label: "Always-on: personal brand", brand: "brand", cls: "camp-brand" },
  ],
  pipe: {
    Concept: [
      { title: "Trend scan → 5 looks", sub: "AI research · weekly", tag: "ai", brand: "both" },
      { title: "PR pitch list", sub: "12 outlets · editorial", tag: "ai", brand: "brand" },
      { title: "Reel hooks ×6", sub: "editorial tone", tag: "ai", brand: "brand" },
      { title: "Collab brief: Tier 1", sub: "creator drop", tag: "ugc", brand: "env" },
    ],
    Draft: [
      { title: "Editorial drop — emerald", sub: "AI lookbook · #AIlookbook", tag: "ai", brand: "env" },
      { title: "Trend pins ×20", sub: "keyword capture", tag: "ai", brand: "both" },
      { title: "PR kit", sub: "one-pager + assets", tag: "ai", brand: "brand" },
    ],
    Editor: [
      { title: "Reel edit — creator A", sub: "human gate", tag: "ugc", brand: "env" },
      { title: "Trend report", sub: "weekly · auto", tag: "auto", brand: "both" },
    ],
    Approval: [
      { title: "Boost post — hero look", sub: "warm audience", tag: "ad", brand: "env" },
      { title: "Story takeover", sub: "brand-safe", tag: "ugc", brand: "both" },
    ],
    "Post ready": [
      { title: "Hero editorial post", sub: "scheduled · IG+TikTok+Pin", tag: "ai", brand: "env" },
      { title: "GRWM reel — creator B", sub: "published", tag: "ugc", brand: "both" },
      { title: "Trend digest", sub: "auto · Fri", tag: "auto", brand: "both" },
    ],
  },
  queue: [
    { tm: "09:00", pt: "IG", tx: "Hero editorial drop — spring look" },
    { tm: "12:00", pt: "PIN", tx: "Trend pins ×5 — keyword set" },
    { tm: "15:00", pt: "MAIL", tx: "PR follow-up — editorial list" },
    { tm: "18:00", pt: "IG", tx: "Story: trend poll" },
  ],
  captionBank: [
    { name: "aspiration", text: "There is a version of you that walks into the room first. This dress knows her." },
    { name: "editorial", text: "The gown is the event before the event." },
    { name: "trend", text: "Not the dress of the season — the dress that makes the season." },
    { name: "rental", text: "Rented, not owned — but the memory is all yours." },
  ],
  gallery: [
    {
      key: "emerald",
      img: "/assets/look-emerald.png",
      badge: "AI · HERO 1",
      title: "Corseted Column — Emerald",
      cap: "Trend hero · editorial drop",
    },
    {
      key: "champagne",
      img: "/assets/look-champagne.png",
      badge: "AI · HERO 4",
      title: "Liquid Metallic — Champagne",
      cap: "The money look · reel + takeover",
    },
    {
      key: "burgundy",
      img: "/assets/look-burgundy.png",
      badge: "AI · HERO 3",
      title: "Cape Moment — Burgundy",
      cap: "The entrance · editorial",
    },
    {
      key: "chocolate",
      img: "/assets/look-chocolate.png",
      badge: "AI · HERO 5",
      title: "Minimalist Slip — Chocolate",
      cap: "Quiet luxury · carousel",
    },
  ],
};

export const SLOTS: Record<SlotId, SlotConfig> = {
  bulk: BULK,
  median: MEDIAN,
  decider: DECIDER,
  "high-trend": HIGH_TREND,
};

export const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
