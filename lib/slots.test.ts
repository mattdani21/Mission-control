import { describe, expect, it } from "vitest";

import { SLOTS, SLOT_IDS } from "./slots";

describe("slot templates", () => {
  it("defines the brand slots", () => {
    expect(SLOT_IDS).toEqual(["envogue", "tessera", "decile", "itrain", "gapos", "empyrean"]);
  });

  it("every slot is fully populated", () => {
    for (const id of SLOT_IDS) {
      const slot = SLOTS[id];
      expect(slot.label.length).toBeGreaterThan(0);
      expect(slot.brandName.length).toBeGreaterThan(0);
      expect(slot.logo.startsWith("/assets/")).toBe(true);
      expect(slot.accent.startsWith("#")).toBe(true);
      expect(slot.composerDefault.length).toBeGreaterThan(10);
      expect(slot.defaultPrompt.length).toBeGreaterThan(20);
      // Strategy grounding — human view, must be seeded for every brand.
      expect(slot.companyStrat.length).toBeGreaterThan(20);
      expect(slot.brandStrategy.length).toBeGreaterThan(20);
      // All five time scales populated for goals, timeContext and calHint.
      for (const scale of ["year", "quarter", "month", "week", "day"] as const) {
        expect(slot.goals[scale].length).toBeGreaterThanOrEqual(4);
        expect(slot.timeContext[scale].length).toBeGreaterThan(5);
        expect(slot.calHint[scale].length).toBeGreaterThan(0);
      }
      expect(slot.windows.length).toBeGreaterThan(0);
      expect(slot.camps.length).toBeGreaterThan(0);
      expect(slot.queue.length).toBeGreaterThan(0);
      expect(slot.captionBank.length).toBeGreaterThan(0);
      expect(slot.gallery.length).toBeGreaterThan(0);
      // Pipeline covers every stage.
      for (const stage of ["Winner", "Test map", "Draft", "Editor", "Post ready"]) {
        expect(slot.pipe[stage]?.length ?? 0).toBeGreaterThan(0);
      }
      // Creative-iteration discipline: every slot seeds a PROVEN winner and
      // a one-variable test map (HOOK / FORMAT / FACE / ARGUMENT).
      expect(slot.pipe.Winner?.some((c) => c.variable === "PROVEN")).toBe(true);
      expect(slot.pipe["Test map"]?.some((c) => c.variable === "HOOK")).toBe(true);
      expect(slot.pipe["Test map"]?.some((c) => c.variable === "FORMAT")).toBe(true);
      expect(slot.pipe["Test map"]?.some((c) => c.variable === "FACE")).toBe(true);
      expect(slot.pipe["Test map"]?.some((c) => c.variable === "ARGUMENT")).toBe(true);
      // Calendar rows stay inside the 12-month axis.
      for (const w of slot.windows) {
        expect(w.s).toBeGreaterThanOrEqual(0);
        expect(w.e).toBeLessThanOrEqual(11);
        expect(w.e).toBeGreaterThanOrEqual(w.s);
      }
    }
  });

  it("envogue slot is the live Dance Countdown reference", () => {
    expect(SLOTS.envogue.brandName).toBe("Envogue");
    expect(SLOTS.envogue.windows[0]?.label).toContain("DANCE COUNTDOWN");
    expect(SLOTS.envogue.goals.year[0]?.value).toBe("150+");
  });

  it("tessera slot carries the AI-employee pilot economics", () => {
    expect(SLOTS.tessera.brandName).toBe("Tessera");
    expect(SLOTS.tessera.goals.year[0]?.value).toBe("R1B");
    expect(SLOTS.tessera.pipe.Winner?.some((c) => c.title.includes("Shinji case study"))).toBe(true);
  });

  it("tessera exposes its three products, each fully populated", () => {
    const products = SLOTS.tessera.products;
    expect(products?.map((p) => p.id)).toEqual(["shinji", "model-gate", "deepkimi"]);
    for (const p of products ?? []) {
      expect(p.goals.year.length).toBeGreaterThanOrEqual(4);
      expect(p.windows.length).toBeGreaterThan(0);
      expect(p.camps.length).toBeGreaterThan(0);
      expect(p.queue.length).toBeGreaterThan(0);
      expect(p.captionBank.length).toBeGreaterThan(0);
      expect(p.gallery.length).toBeGreaterThan(0);
      for (const stage of ["Winner", "Test map", "Draft", "Editor", "Post ready"]) {
        expect(p.pipe[stage]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("decile / itrain / gapos / empyrean slots are repo-grounded", () => {
    expect(SLOTS.decile.brandName).toBe("Decile AI");
    expect(SLOTS.decile.goals.year[1]?.value).toBe("R361k/mo");
    expect(SLOTS.itrain.brandName).toBe("iTrain");
    expect(SLOTS.itrain.goals.year[1]?.value).toBe("<$10/PT/mo");
    expect(SLOTS.gapos.brandName).toBe("GapOS");
    expect(SLOTS.gapos.goals.year[1]?.value).toBe("25");
    expect(SLOTS.empyrean.brandName).toBe("Empyrean");
    expect(SLOTS.empyrean.products?.map((p) => p.id)).toEqual(["catalyst", "flywheel"]);
  });
});
