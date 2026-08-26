/**
 * Mission Control dashboard data — the Winter Catalyst strategy as typed
 * dashboard state (goals per time scale, capture windows, campaigns,
 * pipeline, gallery, caption bank). Mirrors the approved mockup
 * (~/Empyrean/micaelan-jade/demos/mission-control.html) so the pilot UI
 * matches the founder-facing demo.
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

export const TIME_CONTEXT: Record<TimeScale, string> = {
  year: "Planning horizon · 2027 · Matric + Durban July + Summer",
  quarter: "Q2 2027 · Apr–Jun · matric early-bird + Durban July",
  month: "May 2027 · The Build · zero spend",
  week: "This week · Wk 20 · lookbook + UGC cohort",
  day: "Today · capture window LIVE",
};

export const CAL_HINT: Record<TimeScale, string> = {
  year: "12-month horizon",
  quarter: "Q2 (Apr–Jun)",
  month: "May — The Build",
  week: "Wk 20",
  day: "today",
};

export const GOALS: Record<TimeScale, Goal[]> = {
  year: [
    { label: "Bookings (2027)", value: "600+", sub: "matric 250 · DJ 120 · gala 230", tone: "gold" },
    { label: "Revenue", value: "R6.2M", sub: "Envogue + dress line + software", tone: "up" },
    { label: "Content assets", value: "1,500+", sub: "AI 60% · UGC 40%", tone: "plain" },
    { label: "Brand followers", value: "1M", sub: "personal · 30% of bookings", tone: "am" },
    { label: "Capture windows", value: "6 / 6", sub: "matric · DJ · dances · summer", tone: "up" },
    { label: "ROAS (blended)", value: "3.2x", sub: "retargeting only", tone: "up" },
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
};

export const WINDOWS: WindowRow[] = [
  { s: 2, e: 4, label: "Quiet season — build assets", brand: "env", kind: "build" },
  { s: 4, e: 6, label: "MATRIC EARLY-BIRD decision window", brand: "both", kind: "capture" },
  { s: 5, e: 6, label: "Durban July dress decisions", brand: "both", kind: "capture" },
  { s: 6, e: 6, label: "DURBAN JULY — race day (Sat)", brand: "both", kind: "capture" },
  { s: 7, e: 8, label: "Matric late push + alterations", brand: "env", kind: "capture" },
  { s: 8, e: 10, label: "Matric dances (Sep–Nov)", brand: "env", kind: "capture" },
  { s: 9, e: 11, label: "Summer / gala / year-end", brand: "both", kind: "capture" },
];

export const CAMPS: CampRow[] = [
  { s: 0, e: 3, label: "Foundation: brand + inventory", brand: "env", cls: "camp-env" },
  { s: 3, e: 5, label: "Lookbook build (AI)", brand: "env", cls: "camp-env" },
  { s: 4, e: 6, label: "Winter Catalyst: matric + DJ", brand: "env", cls: "camp-env" },
  { s: 5, e: 7, label: "Race-week amplification", brand: "brand", cls: "camp-brand" },
  { s: 7, e: 8, label: "Spring urgency", brand: "env", cls: "camp-env" },
  { s: 8, e: 10, label: "Dance-season social proof", brand: "both", cls: "camp-env" },
  { s: 9, e: 11, label: "Summer campaign + Q4", brand: "both", cls: "camp-env" },
  { s: 0, e: 11, label: "Always-on: weekly content", brand: "brand", cls: "camp-brand" },
  { s: 5, e: 6, label: "DJ teaser: Pinterest-first", brand: "brand", cls: "camp-brand" },
];

export const STAGES = ["Concept", "Draft", "Editor", "Approval", "Post ready"] as const;

export const PIPE: Record<string, PipeCard[]> = {
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
];

export interface QueueEntry {
  tm: string;
  pt: string;
  tx: string;
}

export const INITIAL_QUEUE: QueueEntry[] = [
  { tm: "13:00", pt: "PIN", tx: "Cape gowns for the races: velvet cape moment" },
  { tm: "14:30", pt: "IG", tx: "Corseted column — emerald · carousel (5 frames)" },
  { tm: "16:00", pt: "TIK", tx: "What the Racecourse Wants — 90s breakdown" },
  { tm: "18:00", pt: "IG", tx: "Story: pickup reminder T-72h ×2" },
  { tm: "19:30", pt: "FB", tx: "Retargeting A3 — urgency variant" },
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
    if (scale === "year") labels.push(MONTHS[i]!);
    else if (scale === "quarter") labels.push(MONTHS[3 + i]!);
    else labels.push("MAY");
  }
  return labels;
}
