import { describe, expect, it } from "vitest";

import { SLOTS, SLOT_IDS } from "./slots";

describe("slot templates", () => {
  it("defines the brand slots", () => {
    expect(SLOT_IDS).toEqual(["envogue", "empire", "tessera"]);
  });

  it("every slot is fully populated", () => {
    for (const id of SLOT_IDS) {
      const slot = SLOTS[id];
      expect(slot.label.length).toBeGreaterThan(0);
      expect(slot.brandName.length).toBeGreaterThan(0);
      expect(slot.composerDefault.length).toBeGreaterThan(10);
      expect(slot.defaultPrompt.length).toBeGreaterThan(20);
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
      for (const stage of ["Concept", "Draft", "Editor", "Approval", "Post ready"]) {
        expect(slot.pipe[stage]?.length ?? 0).toBeGreaterThan(0);
      }
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

  it("empire slot carries the flywheel economics", () => {
    expect(SLOTS.empire.brandName).toBe("Empire");
    expect(SLOTS.empire.goals.year[0]?.value).toBe("R4.8M");
  });

  it("tessera slot carries the AI-employee pilot economics", () => {
    expect(SLOTS.tessera.brandName).toBe("Tessera");
    expect(SLOTS.tessera.goals.year[0]?.value).toBe("R1.2M");
    expect(SLOTS.tessera.pipe.Draft?.some((c) => c.title.includes("Model Gate"))).toBe(true);
  });
});
