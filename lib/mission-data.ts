/**
 * Mission Control shared types, helpers and constants for the dashboard.
 *
 * Per-slot DATA lives in lib/slots.ts (one config per client tier:
 * BULK · MEDIAN · DECIDER · HIGH TREND). This module holds the types,
 * the calendar axis math, brand/tag label helpers and channel constants
 * that every slot shares.
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
  /** Creative-iteration variable this variant changes (Ac Hampton test-map
   *  discipline): HOOK / FORMAT / FACE / ARGUMENT, or PROVEN for the winner. */
  variable?: "HOOK" | "FORMAT" | "FACE" | "ARGUMENT" | "PROVEN";
  /** Blocked reason — card waits (founder gate, consent, dependency) instead
   *  of advancing; tapping a blocked card unblocks it and logs the decision. */
  blocked?: string;
}

/** A recorded decision in the campaign brain (source + reasoning + rollback). */
export interface DecisionEntry {
  ts: string;
  action: string;
  state: string;
  source: string;
  rollback: string;
  decision: "approve" | "edit" | "reject";
}

/** Dated channel report feeding the final campaign report. */
export interface ReportEntry {
  date: string;
  channel: string;
  summary: string;
}

export interface GalleryItem {
  key: string;
  img: string;
  badge: string;
  badgeTone?: "accent" | "green";
  title: string;
  cap: string;
}

export interface QueueEntry {
  tm: string;
  pt: string;
  tx: string;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Calendar horizon starts at September 2026 (index 8 = Sep). */
export const HORIZON_START = 8;

export const CHANNELS = ["IG Feed", "Reels", "TikTok", "Pinterest", "Meta Ads", "Email", "WhatsApp"];

/**
 * Pipeline stages — creative-iteration loop (winner → one-variable test map →
 * AI draft → human editor gate → post ready → winner promotes back).
 */
export const STAGES = ["Winner", "Test map", "Draft", "Editor", "Post ready"] as const;

export function variableLabel(v: NonNullable<PipeCard["variable"]>): string {
  return v;
}

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
      return "CLIENT";
    case "brand":
      return "PERSONAL";
    case "both":
      return "CLIENT + PERSONAL";
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
