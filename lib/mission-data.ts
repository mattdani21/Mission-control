/**
 * Mission Control dashboard data — the Dance Countdown 2026 + 12-month
 * horizon (Sep 2026 – Aug 2027) as typed dashboard state (goals per time
 * scale, capture windows, campaigns, pipeline, gallery, caption bank).
 * Source of truth: package files 18 (strategy) + 20 (12-month playbook).
 * Calendar axis starts at September 2026 (MONTHS index 8).
 */

export type TimeScale = "year" | "quarter" | "month" | "week" | "day";
export type BrandFilter = "all" | "env" | "brand";
export type GoalTone = "gold" | "up" | "am" | "plain";
export type PipeTag = "ai" | "ugc" | "auto" | "ad";

export interface Goal {
  label: string;
  value: string;
  sub: string;
  tone: GoalTone;
}

export interface WindowRow {
  s: number;
  e: number;
  label: string;
  brand: "env" | "both";
  kind: "build" | "capture";
}

export interface CampRow {
  s: number;
  e: number;
  label: string;
  brand: "env" | "brand" | "both";
  cls: "camp-env" | "camp-brand";
}

export interface PipeCard {
  title: string;
  sub: string;
  tag: PipeTag;
  brand: "env" | "brand" | "both";
}

export interface GalleryItem {
  key: string;
  img: string;
  badge: string;
  badgeTone?: "accent" | "green";
  title: string;
  cap: string;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Calendar horizon starts at September 2026 (index 8 = Sep). */
export const HORIZON_START = 8;

export const TIME_CONTEXT: Record<TimeScale, string> = {
  year: "Planning horizon · Sep 2026–Aug 2027 · Dance Countdown LIVE → Matric 2027 First Pick",
  quarter: "Q4 2026 · Sep–Nov · Dance Countdown — the live season",
  month: "Sep 2026 · Dance Countdown · LIVE NOW",
  week: "This week · Wk 1 · urgency relaunch",
  day: "Today · capture window LIVE",
};

export const CAL_HINT: Record<TimeScale, string> = {
  year: "12-month horizon (Sep → Aug)",
  quarter: "Q4 (Sep–Nov)",
  month: "Sep — Dance Countdown",
  week: "Wk 1",
  day: "today",
};

export const GOALS: Record<TimeScale, Goal[]> = {
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
};

export const WINDOWS: WindowRow[] = [
  { s: 0, e: 2, label: "DANCE COUNTDOWN — matric 2026 · LIVE", brand: "env", kind: "capture" },
  { s: 1, e: 2, label: "Dance nights + proof capture", brand: "env", kind: "capture" },
  { s: 3, e: 4, label: "Summer Glam — NYE · results · Met 30 Jan", brand: "both", kind: "capture" },
  { s: 5, e: 5, label: "Date Night — Valentine's duo", brand: "both", kind: "capture" },
  { s: 6, e: 7, label: "The Build — 2027 assets + cast", brand: "env", kind: "build" },
  { s: 8, e: 10, label: "MATRIC 2027 FIRST PICK — early-bird", brand: "both", kind: "capture" },
  { s: 9, e: 10, label: "JULY GLAM — Durban July · Sat 3 Jul", brand: "both", kind: "capture" },
  { s: 11, e: 11, label: "Gala + winter formal", brand: "both", kind: "capture" },
];

export const CAMPS: CampRow[] = [
  { s: 0, e: 2, label: "Dance Countdown: urgency + bookings", brand: "env", cls: "camp-env" },
  { s: 3, e: 4, label: "Summer Glam: NYE + Met styling", brand: "env", cls: "camp-env" },
  { s: 5, e: 5, label: "Date Night Couture", brand: "env", cls: "camp-env" },
  { s: 6, e: 7, label: "Build: lookbooks + 2027 cast", brand: "env", cls: "camp-env" },
  { s: 8, e: 10, label: "Matric 2027 First Pick", brand: "env", cls: "camp-env" },
  { s: 9, e: 10, label: "July Glam + race week", brand: "both", cls: "camp-env" },
  { s: 11, e: 11, label: "Gala + winter formal", brand: "both", cls: "camp-env" },
  { s: 0, e: 11, label: "Always-on: try-ons + Rail Report", brand: "brand", cls: "camp-brand" },
];

export const STAGES = ["Concept", "Draft", "Editor", "Approval", "Post ready"] as const;

export const PIPE: Record<string, PipeCard[]> = {
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
};

export const CHANNELS = ["IG Feed", "Reels", "TikTok", "Pinterest", "Meta Ads", "Email", "WhatsApp"];

export const CAPTION_BANK: Array<{ name: string; text: string }> = [
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
];

export const GALLERY: GalleryItem[] = [
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
];

export interface QueueEntry {
  tm: string;
  pt: string;
  tx: string;
}

export const INITIAL_QUEUE: QueueEntry[] = [
  { tm: "09:00", pt: "IG", tx: "Try-On Tuesday reel — Ladivine CD811" },
  { tm: "11:00", pt: "WA", tx: "Broadcast #1 — the rail is filling" },
  { tm: "14:00", pt: "IG", tx: "Lookbook — Corseted Column emerald" },
  { tm: "16:00", pt: "MAIL", tx: "Last Pieces on the Rail — A/B blast" },
  { tm: "18:00", pt: "IG", tx: "Story: alterations deadline countdown" },
];

export function brandMatch(brand: "env" | "brand" | "both", filter: BrandFilter): boolean {
  return filter === "all" || brand === "both" || brand === filter;
}

export function tagLabel(tag: PipeTag): string {
  switch (tag) {
    case "ai":
      return "AI";
    case "ugc":
      return "UGC";
    case "auto":
      return "AUTO";
    case "ad":
      return "AD";
  }
}

export function brandLabel(brand: "env" | "brand" | "both"): string {
  switch (brand) {
    case "env":
      return "ENVOGUE";
    case "brand":
      return "PERSONAL";
    case "both":
      return "ENV + PERSONAL";
  }
}

export function scaleWidth(scale: TimeScale): number {
  switch (scale) {
    case "year":
      return 12;
    case "quarter":
      return 3;
    default:
      return 1;
  }
}

export function axisLabels(scale: TimeScale): string[] {
  const w = scaleWidth(scale);
  const labels: string[] = [];
  for (let i = 0; i < w; i++) {
    if (scale === "year") labels.push(MONTHS[(HORIZON_START + i) % 12]!);
    else if (scale === "quarter") labels.push(MONTHS[(HORIZON_START + i) % 12]!);
    else labels.push("SEP");
  }
  return labels;
}
