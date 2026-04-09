import { describe, it, expect, vi } from "vitest";
import type { TFunction } from "i18next";
import { formatPrice, getRatingLabel } from "@/utils/accommodation";

const t = ((key: string) => key) as TFunction;

describe("accommodation utils", () => {
  describe("getRatingLabel", () => {
    it.each([
      [5, "accommodationCard.rating.excellent"],
      [4.5, "accommodationCard.rating.excellent"],
      [4.49, "accommodationCard.rating.veryGood"],
      [4, "accommodationCard.rating.veryGood"],
      [3.5, "accommodationCard.rating.good"],
      [3, "accommodationCard.rating.fair"],
      [2.9, "accommodationCard.rating.acceptable"],
      [0, "accommodationCard.rating.acceptable"],
    ] as const)("score %s maps to %s", (score, expected) => {
      expect(getRatingLabel(score, t)).toBe(expected);
    });

    it("calls t with the resolved key", () => {
      const spy = vi.fn((k: string) => `lbl:${k}`);
      getRatingLabel(4.8, spy as unknown as TFunction);
      expect(spy).toHaveBeenCalledWith("accommodationCard.rating.excellent");
    });
  });

  describe("formatPrice", () => {
    it("formats with es-CO grouping", () => {
      expect(formatPrice(199900)).toBe("199.900");
      expect(formatPrice(1000000)).toBe("1.000.000");
    });

    it("formats zero", () => {
      expect(formatPrice(0)).toBe("0");
    });
  });
});
