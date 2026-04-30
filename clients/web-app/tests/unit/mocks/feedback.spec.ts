import { describe, expect, it } from "vitest";
import { mockFeedback } from "@/mocks/feedback";

describe("mockFeedback", () => {
  it("contiene elementos con estructura valida", () => {
    expect(mockFeedback.length).toBeGreaterThan(0);

    mockFeedback.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.userName).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.comment).toBeTruthy();
      expect(item.rating).toBeGreaterThanOrEqual(0);
      expect(item.rating).toBeLessThanOrEqual(5);
    });
  });
});
