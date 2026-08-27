import { describe, expect, it } from "vitest";

import { SLOTS, SLOT_IDS } from "./slots";

describe("slot templates", () => {
  it("defines all four slots", () => {
    expect(SLOT_IDS).toEqual(["bulk", "median", "decider", "high-trend"]);
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

  it("median slot is the live Envogue Dance Countdown reference", () => {
    expect(SLOTS.median.brandName).toBe("Envogue");
    expect(SLOTS.median.windows[0]?.label).toContain("DANCE COUNTDOWN");
    expect(SLOTS.median.goals.year[0]?.value).toBe("150+");
  });

  it("decider slot carries the flywheel economics", () => {
    expect(SLOTS.decider.brandName).toBe("Micaelan Jade");
    expect(SLOTS.decider.goals.year[0]?.value).toBe("R4.8M");
  });
});
