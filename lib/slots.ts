/**
 * Slot templates — Mission Control as a multi-brand template engine.
 *
 * Each slot is one BRAND / product the operator wants to market (Envogue,
 * Empire, Tessera, …). The dashboard toggle switches the entire context:
 * brand, goals per time scale, capture calendar, pipeline, queue, caption
 * bank and gallery — same underlying structure for every brand.
 *
 * Adding a brand = drop a new SlotConfig in SLOTS (copy an existing slot,
 * swap the data) — no UI changes needed.
 *
 * Seeded from real package data where it exists:
 *   - envogue:  Envogue × Empyrean Dance Countdown 2026 (live) — the reference
 *   - empire:   Micaelan Jade Empire Flywheel (retained, R4.8M/yr base case)
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

export type SlotId = "envogue" | "empire" | "tessera";

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

/* ──────────────────── ENVOGUE — Dance Countdown 2026 ──────────────────── */

const ENVOGUE: SlotConfig = {
  id: "envogue",
  label: "ENVOGUE",
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

/* ──────────────── EMPIRE — Micaelan Jade Empire Flywheel ──────────────── */

const EMPIRE: SlotConfig = {
  id: "empire",
  label: "EMPIRE",
  brandName: "Empire",
  tagline: "Empyrean · Empire Flywheel · Micaelan Jade · kicker + equity",
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

/* ─────────────── TESSERA — AI employees (B2B pilot → ARR) ─────────────── */

const TESSERA: SlotConfig = {
  id: "tessera",
  label: "TESSERA",
  brandName: "Tessera",
  tagline: "Empyrean · AI employees · bounded tasks · pilot → ARR",
  composerDefault:
    "Tessera: an AI employee that owns a bounded task end-to-end. One pilot, one month — if it doesn't earn its payroll, you cut it.",
  defaultPrompt: GENERIC_PROMPT,
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
  empire: EMPIRE,
  tessera: TESSERA,
};

export const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
